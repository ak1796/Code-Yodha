const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { isOfficer, isAdmin } = require('../middleware/roleGuard');
const { validateResolutionGPS } = require('../services/resolutionValidator');
const auditService = require('../services/auditService');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/tickets?officer_id=
// Officer's assigned queue
router.get('/', authenticate, isOfficer, async (req, res) => {
  const { officer_id } = req.query;
  try {
    let query = supabase
      .from('master_tickets')
      .select('*')
      .order('priority_score', { ascending: false });

    if (officer_id) {
       query = query.eq('assigned_officer_id', officer_id);
    } else if (req.user.role === 'officer') {
       query = query.eq('assigned_officer_id', req.user.profile_id);
    }

    const { data: tickets, error } = await query;
    if (error) throw error;
    res.json(tickets);
  } catch (error) {
    console.error("Fetch Tickets Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

const { sendCitizenUpdateEmail } = require('../services/notificationService');

// PATCH /api/tickets/:id/status (Step 7)
router.patch('/:id/status', authenticate, isOfficer, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(`[STATE_TRANSITION] Attempting ${id} -> ${status.toUpperCase()}`);

  try {
    const { data: oldTicket, error: fetchError } = await supabase.from('master_tickets').select('status').eq('id', id).maybeSingle();
    
    if (fetchError || !oldTicket) {
      console.error("❌ Node Retrieval Failure:", fetchError || 'Ticket missing from grid');
      return res.status(404).json({ error: 'Signal node not found in jurisdictional ledger' });
    }

    const { data: ticket, error } = await supabase.from('master_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
       console.error("❌ Node Update Failure:", error);
       throw error;
    }

    // Fetch citizen email (Step 7) - Using maybeSingle to allow tickets without reporters
    const { data: complaint } = await supabase
      .from('complaints')
      .select('email')
      .eq('master_ticket_id', id)
      .limit(1)
      .maybeSingle();

    const { sendCitizenUpdateEmail, sendTelegramUpdate } = require('../services/notificationService');

    if (complaint && complaint.email) {
      if (complaint.email.startsWith('tg_')) {
          const chatId = complaint.email.split('_')[1].split('@')[0];
          await sendTelegramUpdate(chatId, status, ticket);
      } else {
        try {
          await sendCitizenUpdateEmail(complaint.email, status, ticket);
          console.log('📬 Citizen notified of state transition');
        } catch (e) {
          console.warn('⚠️ Notification hub unavailable');
        }
      }
    }

    await auditService.log({ 
      ticket_id: id, 
      actor_id: req.user.profile_id, 
      action: 'STATUS_CHANGED', 
      old_value: oldTicket.status, 
      new_value: status 
    });

    res.json(ticket);
  } catch (error) {
    console.error("❌ Fatal Transition Error:", error);
    res.status(500).json({ 
      error: 'Jurisdictional State Failure', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// PATCH /api/tickets/:id/resolve (Step 8)
router.patch('/:id/resolve', authenticate, isOfficer, upload.fields([{ name: 'before' }, { name: 'after' }]), async (req, res) => {
  const { id } = req.params;
  console.log(`📸 Initiating Cloud Forensic Sync for Ticket ${id}...`);

  try {
    const { data: ticket } = await supabase.from('master_tickets').select('*').eq('id', id).single();

    let beforeUrl = ticket.before_image_url;
    let afterUrl = ticket.after_image_url;

    // 1. Upload "Before" to Supabase Storage
    if (req.files['before']) {
      const file = req.files['before'][0];
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(`${id}/before_${Date.now()}.jpg`, file.buffer, { contentType: file.mimetype, upsert: true });
      if (!error) {
        const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(data.path);
        beforeUrl = publicUrl.publicUrl;
      }
    }

    // 2. Upload "After" to Supabase Storage & GPS Validate
    if (req.files['after']) {
      const file = req.files['after'][0];
      
      // GPS Validation
      const isValid = await validateResolutionGPS(ticket.lat, ticket.lng, file.buffer);
      if (!isValid) {
        console.warn("⚠️ Resolution GPS Integrity Check FAILED");
        await auditService.log({ ticket_id: id, actor_id: req.user.profile_id, action: 'RESOLUTION_GPS_FAILED' });
      }

      // Upload to Cloud
      const { data, error } = await supabase.storage
        .from('evidence')
        .upload(`${id}/after_${Date.now()}.jpg`, file.buffer, { contentType: file.mimetype, upsert: true });
      if (!error) {
        const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(data.path);
        afterUrl = publicUrl.publicUrl;
      }
    }

    const { data: updated, error } = await supabase.from('master_tickets')
      .update({ 
        status: 'resolved', 
        resolution_verified: true, 
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Final Resolve Handshake (Step 8) - Using limit(1) to avoid 500
    const { data: complaint } = await supabase.from('complaints').select('email').eq('master_ticket_id', id).limit(1).maybeSingle();
    if (complaint && complaint.email) {
      try {
        await sendCitizenUpdateEmail(complaint.email, 'resolved', updated);
      } catch (e) {
        console.warn("Notification Hub unavailable");
      }
    }

    await auditService.log({ ticket_id: id, actor_id: req.user.profile_id, action: 'RESOLUTION_SUBMITTED' });
    res.json(updated);
  } catch (error) {
    console.error("❌ Fatal Resolve Error:", error);
    res.status(500).json({ error: 'Jurisdictional State failure', message: error.message });
  }
});

// PATCH /api/tickets/:id/reassign (Gap 7)
// Strictly Admin only - Every manual override is logged
router.patch('/:id/reassign', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { officer_id, reason } = req.body;
  
  try {
    const { data: oldTicket } = await supabase.from('master_tickets').select('*').eq('id', id).single();
    
    // 1. Transactional Update
    const { data: updated, error } = await supabase.from('master_tickets')
      .update({ 
        assigned_officer_id: officer_id, 
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // 2. Load Balancing (decrement old, increment new)
    if (oldTicket.assigned_officer_id) {
       await supabase.rpc('decrement_ticket_count', { officer_id: oldTicket.assigned_officer_id });
    }
    await supabase.rpc('increment_ticket_count', { officer_id: officer_id });

    // 3. Mandatory Forensic Trace (Gap 7 - No silent overrides)
    await auditService.log({
      ticket_id: id,
      actor_id: req.user.profile_id,
      action: 'ADMIN_MANUAL_REASSIGN',
      new_value: `Assigned to Officer ID: ${officer_id} | Reason: ${reason || 'Manual Override'}`
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
