const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../lib/supabase');
const { geminiEmbed, geminiUrgencyScore, geminiSentimentScore } = require('../lib/gemini');
const { filterSpam } = require('../services/spamFilter');
const { categorizeComplaint } = require('../services/categorizer');
const { deduplicateComplaint } = require('../services/deduplicator');
const { computePriorityScore } = require('../services/urgencyScorer');
const { computeSlaDeadline } = require('../services/slaService');
const { autoAssignOfficer } = require('../services/autoAssignService');
const { encryptComplaint, generateToken } = require('../services/whistleblowerService');
const { sendEmail, sendPushNotification } = require('../services/notificationService');
const auditService = require('../services/auditService');
const { authenticate } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const { cleanComplaintText } = require('../utils/cleaner');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/complaints
router.post('/', upload.single('photo'), complaintLimiter, async (req, res) => {
  console.log('📡 Signal Received at Command HQ:', req.body);
  
  const { 
    description, raw_text, lat, lng, is_anonymous, location_text, user_id,
    complaint_type, complaint_subtype, ward, city, email
  } = req.body;
  
  const finalDescription = description || raw_text || req.body.raw_text;
  const ip_address = req.ip;

  try {
    // 1. VALIDATE & MAP JURISDICTION
    const cleanedText = cleanComplaintText(finalDescription || '');
    if (!cleanedText || cleanedText.split(/\s+/).length < 10) {
      return res.status(400).json({ error: 'Text must be at least 10 words after cleaning' });
    }

    const category = (req.body.category || req.body.complaint_type || 'OTHER').toUpperCase();
    const departmentMap = {
      'DRAINAGE': 'DRAINAGE',
      'WATER': 'WATER',
      'ROADS': 'ROADS',
      'GARBAGE': 'GARBAGE',
      'ELECTRICITY': 'ELECTRICITY',
      'HEALTH': 'HEALTH',
      'PARKS': 'PARKS',
      'BUILDINGS': 'BUILDINGS',
      'PEST': 'PEST',
      'ENCROACHMENT': 'ENCROACHMENT',
      'OTHER': 'OTHER'
    };
    const department = departmentMap[category] || 'OTHER';

    // 2. SPAM FILTER
    const spamResult = await filterSpam(cleanedText);
    if (spamResult.status === 'rejected') {
      await auditService.log({ action: 'SPAM_REJECTED', ip_address, new_value: { text: raw_text || finalDescription } });
      return res.status(403).json({ error: 'Spam detected' });
    }

    // 2. AI COGNITIVE SYNTHESIS
    console.log('🧠 Triggering AI Synthesis for description:', finalDescription.substring(0, 30));
    const embedding = await geminiEmbed(finalDescription);
    const dedupResult = await deduplicateComplaint({ lat, lng }, embedding);
    console.log('🔍 Deduplication complete:', dedupResult.merged ? 'MERGED' : 'NEW SIGNAL');

    let masterTicketId = dedupResult.master_ticket_id;

    if (!dedupResult.merged) {
      // 3. MASTER TICKET INGESTION
      console.log('🏛️ Inserting NEW Master Ticket...');
      const slaDeadline = computeSlaDeadline(new Date(), category);
      
      const { data: ticket, error: ticketError } = await supabase.from('master_tickets').insert({
        category,
        department,
        description: finalDescription,
        title: finalDescription.substring(0, 50) + '...',
        lat: parseFloat(lat) || null,
        lng: parseFloat(lng) || null,
        city: city || 'Mumbai',
        ward: ward,
        status: 'filed',
        sla_deadline: slaDeadline.toISOString(),
        embedding: embedding,
        creator_id: user_id || null
      }).select().single();

      if (ticketError) {
        console.error('❌ Master Ticket Insertion Failure:', ticketError);
        throw ticketError;
      }
      masterTicketId = ticket.id;
    }

    // 4. COMPLAINT RECORD INGESTION
    console.log('📡 Logging Forensic Complaint trace for Master Ticket:', masterTicketId);
    const { error: complaintError } = await supabase.from('complaints').insert({
      master_ticket_id: masterTicketId,
      description: finalDescription,
      raw_text: finalDescription,
      category,
      department,
      email,
      lat: parseFloat(lat) || null,
      lng: parseFloat(lng) || null,
      city: city || 'Mumbai',
      status: 'open',
      source: 'WEB',
      is_anonymous: is_anonymous === 'true',
      user_id: user_id || null
    });

    if (complaintError) {
      console.error('❌ Complaint Insertion Failure:', complaintError);
      throw complaintError;
    }

    // 5. AUDIT & DISPATCH
    await auditService.log({ 
      ticket_id: masterTicketId, 
      action: 'AI_CATEGORIZED', 
      new_value: category,
      ip_address 
    });
    
    await auditService.log({ 
      ticket_id: masterTicketId, 
      action: 'COMPLAINT_INGESTED', 
      ip_address 
    });

    if (masterTicketId && !dedupResult.merged) {
      console.log('🏎️ Triggering Specialist Dispatch Engine...');
      await supabase.from('master_tickets').update({ status: 'assigned' }).eq('id', masterTicketId);
      autoAssignOfficer(masterTicketId, category, lat, lng, city || 'Mumbai', ward);

      // JURISDICTIONAL PULSE: Notify nearby citizens (Gap 5)
      console.log('📡 Broadcasting Neural Pulse to nearby citizens...');
      const { data: nearbyUsers } = await supabase.rpc('find_nearby_citizens', {
        comp_lat: parseFloat(lat),
        comp_lng: parseFloat(lng),
        radius_meters: 500
      });

      if (nearbyUsers && nearbyUsers.length > 0) {
        for (const user of nearbyUsers) {
          await sendPushNotification(user.user_id, {
            title: `Civic Signal Detected Near You: ${category}`,
            body: `A municipal issue was reported within 500m. Tap to Confirm or Dismiss.`,
            data: { ticket_id: masterTicketId, type: 'CROWD_VALIDATION' }
          });
        }
      }
    }
    
    return res.status(201).json({
      message: 'Signal ingest successful',
      ticket_id: masterTicketId
    });

  } catch (error) {
    console.error("Cognitive Ingestion Fatal:", error);
    res.status(500).json({ error: 'Ingestion Backend Failure', details: error.message });
  }
});

// GET /api/complaints/:id (Tracking)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*, master_tickets(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Fetch assignment info if available
    const { data: assignment } = await supabase
      .from('officer_assignments')
      .select('*, profiles(full_name, department, city)')
      .eq('ticket_id', complaint.master_ticket_id)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    res.json({ ...complaint, assignment_info: assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/complaints/officer/queue (Step 5)
// Decodes JWT to isolate departmental signals
router.get('/officer/queue', authenticate, async (req, res) => {
  try {
    const { department, role } = req.user;

    if (role !== 'officer' && role !== 'admin') {
      return res.status(403).json({ error: 'Access Denied: Jurisdictional Node unauthorized' });
    }

    let query = supabase.from('master_tickets').select('*');

    // Admin sees everything (Step 10), Officers see their department (Step 5)
    if (role === 'officer') {
      query = query.eq('category', department);
    }

    const { data: tickets, error } = await query.order('priority_score', { ascending: false });

    if (error) throw error;
    res.json(tickets);

  } catch (error) {
    console.error("Jurisdictional Fetch Error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
