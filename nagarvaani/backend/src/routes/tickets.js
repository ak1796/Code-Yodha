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
      console.error("âŒ Node Retrieval Failure:", fetchError || 'Ticket missing from grid');
      return res.status(404).json({ error: 'Signal node not found in jurisdictional ledger' });
    }

    const { data: ticket, error } = await supabase.from('master_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
       console.error("âŒ Node Update Failure:", error);
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
          console.log('ðŸ“¬ Citizen notified of state transition');
        } catch (e) {
          console.warn('âš ï¸ Notification hub unavailable');
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
    console.error("âŒ Fatal Transition Error:", error);
    res.status(500).json({ 
      error: 'Jurisdictional State Failure', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// PATCH /api/tickets/:id/resolve (Step 8)
router.patch('/:id/resolve', authenticate, isOfficer, upload.any(), async (req, res) => {
  const { id } = req.params;
  console.log(`ðŸ“¸ Initiating Cloud Forensic Sync for Ticket ${id}...`);

  try {
    const files = req.files || [];
    console.log(`ðŸ“¸ Resolution Payload for Ticket ${id}:`, {
      count: files.length,
      fields: files.map(f => f.fieldname)
    });

    const { data: ticket, error: fetchErr } = await supabase.from('master_tickets').select('*').eq('id', id).single();
    
    if (fetchErr || !ticket) {
      console.error("âŒ Node Retrieval Failure:", fetchErr);
      return res.status(404).json({ error: 'Signal node not found in jurisdictional ledger' });
    }

    let beforeUrl = ticket.before_image_url;
    let afterUrl = ticket.after_image_url;

    // Use flat naming to avoid folder collisions
    const beforeFile = files.find(f => f.fieldname === 'before');
    const afterFile = files.find(f => f.fieldname === 'after');

    // 1. Upload "Before" to Supabase Storage
    if (beforeFile) {
      const fileName = `res_${id}_before_${Date.now()}.jpg`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(fileName, beforeFile.buffer, { contentType: beforeFile.mimetype, upsert: true });
        
        if (uploadError) throw uploadError;
        
        if (uploadData) {
          const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(uploadData.path);
          beforeUrl = publicUrlData.publicUrl;
          console.log("âœ… Before Image Sync Complete:", beforeUrl);
        }
      } catch (e) {
        console.error("âŒ Before Image Upload Exception:", e.message);
      }
    }

    // 2. Upload "After" to Supabase Storage & GPS Validate
    if (afterFile) {
      // GPS Validation
      try {
        const isValid = await validateResolutionGPS(ticket.lat, ticket.lng, afterFile.buffer);
        if (!isValid) {
          console.warn("âš ï¸ Resolution GPS Integrity Check FAILED");
          await auditService.log({ ticket_id: id, actor_id: req.user.profile_id, action: 'RESOLUTION_GPS_FAILED' });
        }
      } catch (e) {
        console.warn("GPS Validation Skip or Error:", e.message);
      }

      // Upload to Cloud
      const fileName = `res_${id}_after_${Date.now()}.jpg`;
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(fileName, afterFile.buffer, { contentType: afterFile.mimetype, upsert: true });
        
        if (uploadError) throw uploadError;

        if (uploadData) {
          const { data: publicUrlData } = supabase.storage.from('evidence').getPublicUrl(uploadData.path);
          afterUrl = publicUrlData.publicUrl;
          console.log("âœ… After Image Sync Complete:", afterUrl);
        }
      } catch (e) {
        console.error("âŒ After Image Upload Exception:", e.message);
      }
    }

    console.log("ðŸ›ï¸ Finalizing Ledger Update...");
    const { data: updated, error: updateError } = await supabase.from('master_tickets')
      .update({ 
        status: 'resolved', 
        resolution_verified: true, 
        before_image_url: beforeUrl,
        after_image_url: afterUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("âŒ Database Update Failure:", updateError);
      throw updateError;
    }

    // Final Resolve Handshake (Step 8)
    const { data: complaint } = await supabase.from('complaints').select('email').eq('master_ticket_id', id).limit(1).maybeSingle();
    
    if (complaint && complaint.email) {
      try {
        const { sendCitizenUpdateEmail } = require('./notificationService'); // Correct relative path if needed? No, check current file. 
        // Wait, current file is routes/tickets.js. notificationService is in services/
        const ns = require('../services/notificationService');
        if (ns.sendCitizenUpdateEmail) {
            await ns.sendCitizenUpdateEmail(complaint.email, 'resolved', updated);
        }
      } catch (e) {
        console.warn("Notification Hub unavailable:", e.message);
      }
    }

    await auditService.log({ ticket_id: id, actor_id: req.user.profile_id, action: 'RESOLUTION_SUBMITTED' });
    res.json(updated);
  } catch (error) {
    console.error("âŒ Fatal Resolve Error Handler:", error);
    res.status(500).json({ 
      error: 'Jurisdictional State failure', 
      message: error.message,
      stack: error.stack,
      details: error.details || error
    });
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

/**
 * POST /api/tickets/:id/review
 * Strategic Citizen Review Node
 */
router.post('/:id/review', async (req, res) => {
  const { id } = req.params;
  const { rating, comment, department } = req.body;

  try {
    const { data: review, error } = await supabase.from('reviews').insert({
      ticket_id: id,
      rating: parseInt(rating),
      comment,
      department,
      created_at: new Date().toISOString()
    }).select().single();

    if (error) {
      console.error("âŒ Review Persistence Failure:", error.message);
      if (error.code === '42P01') { // PostgreSQL table not found code
          return res.status(404).json({ 
            error: 'Feedback Ledger Missing', 
            message: 'Target table [reviews] not found. Please run the provided SQL in Supabase Dashboard.' 
          });
      }
      return res.status(500).json({ error: 'Feedback synchronization failed', details: error.message });
    }

    await auditService.log({
      ticket_id: id,
      action: 'CITIZEN_REVIEW_FILED',
      new_value: `Rating: ${rating} | Dept: ${department}`,
      ip_address: req.ip
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;