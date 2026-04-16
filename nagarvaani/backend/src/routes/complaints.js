const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabase } = require('../lib/supabase');
const { geminiEmbed, geminiUrgencyScore, geminiSentimentScore, geminiTranslateToEnglish } = require('../lib/gemini');
const { filterSpam } = require('../services/spamFilter');
const { categorizeComplaint } = require('../services/categorizer');
const { deduplicateComplaint } = require('../services/deduplicator');
const { computePriorityScore } = require('../services/urgencyScorer');
const { computeSlaDeadline } = require('../services/slaService');
const { autoAssignOfficer } = require('../services/autoAssignService');
const { getWeeklyTrustMatrix } = require('../services/analyticsService');
const { encryptComplaint, generateToken } = require('../services/whistleblowerService');
const { sendEmail, sendPushNotification } = require('../services/notificationService');
const auditService = require('../services/auditService');
const { sendCitizenConfirmation } = require('../services/emailService');
const { authenticate } = require('../middleware/auth');
const { complaintLimiter } = require('../middleware/rateLimiter');
const { cleanComplaintText } = require('../utils/cleaner');
const { resolveJurisdiction } = require('../utils/geoResolver');

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/complaints
router.post('/', upload.single('photo'), complaintLimiter, async (req, res) => {
  console.log('ðŸ“¡ Signal Received at Command HQ:', req.body);
  
  const { 
    description, raw_text, lat, lng, is_anonymous, location_text, user_id,
    complaint_type, complaint_subtype, ward, city, email
  } = req.body;
  
  const finalDescription = description || raw_text || req.body.raw_text;
  const ip_address = req.ip;

  try {
    // 1. VALIDATE & MAP JURISDICTION
    const cleanedText = cleanComplaintText(finalDescription || '');
    if (!cleanedText || cleanedText.trim().length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // Resolve Jurisdiction based on Telemetry
    const jurisdiction = resolveJurisdiction(lat, lng, city, ward);
    console.log(`ðŸ—ºï¸ Jurisdiction Resolved: ${jurisdiction.city} | ${jurisdiction.ward}`);

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
    if (spamResult.status === 'rejected' || spamResult.status === 'flagged') {
      await auditService.log({ action: 'SPAM_REJECTED', ip_address, new_value: { text: raw_text || finalDescription, reason: spamResult.reason } });
      return res.status(403).json({ error: 'Signal rejected: does not meet civic complaint criteria.', reason: spamResult.reason });
    }

    // 2. AI COGNITIVE SYNTHESIS
    console.log('ðŸ§  Triggering AI Synthesis for description:', cleanedText.substring(0, 30));
    
    // Translation Pipeline
    let englishText = cleanedText;
    try {
       englishText = await geminiTranslateToEnglish(cleanedText);
       console.log('ðŸŒ Translated to English:', englishText.substring(0, 30) + '...');
    } catch(e) {
       console.error("Translation error:", e);
    }

    const embedding = await geminiEmbed(englishText);
    const dedupResult = await deduplicateComplaint({ lat, lng }, embedding);
    console.log('ðŸ” Deduplication complete:', dedupResult.merged ? 'MERGED' : 'NEW SIGNAL');

    let masterTicketId = dedupResult.master_ticket_id;

    if (!dedupResult.merged) {
      // 3. MASTER TICKET INGESTION
      console.log('ðŸ›ï¸ Inserting NEW Master Ticket...');
      const slaDeadline = computeSlaDeadline(new Date(), category);
      
      // Calculate Priority Score for New Signal
      const [keywordResult, sentimentResult] = await Promise.all([
        geminiUrgencyScore(englishText),
        geminiSentimentScore(englishText)
      ]);
      const kScore = keywordResult?.keyword_score || 0.1;
      const sScore = sentimentResult?.sentiment_score || 0.1;
      
      const priority = await computePriorityScore({
        keywordScore: kScore,
        sentimentScore: sScore,
        clusterSize: 1,
        lat: parseFloat(lat) || null,
        lng: parseFloat(lng) || null
      });

      const { data: ticket, error: ticketError } = await supabase.from('master_tickets').insert({
        category,
        department,
        description: englishText,
        title: englishText.substring(0, 50) + '...',
        lat: parseFloat(lat) || null,
        lng: parseFloat(lng) || null,
        city: jurisdiction.city,
        ward: jurisdiction.ward,
        status: 'filed',
        priority_score: priority,
        sla_deadline: slaDeadline.toISOString(),
        embedding: embedding,
        creator_id: user_id || null,
        email: email
      }).select().single();

      if (ticketError) {
        console.error('âŒ Master Ticket Insertion Failure:', ticketError);
        throw ticketError;
      }
      masterTicketId = ticket.id;
    }

    // 4. COMPLAINT RECORD INGESTION
    console.log('ðŸ“¡ Logging Forensic Complaint trace for Master Ticket:', masterTicketId);
    const { error: complaintError } = await supabase.from('complaints').insert({
      master_ticket_id: masterTicketId,
      description: englishText,
      raw_text: finalDescription,
      category,
      department,
      lat: parseFloat(lat) || null,
      lng: parseFloat(lng) || null,
      city: city || 'Mumbai',
      status: 'open',
      source: 'WEB',
      is_anonymous: is_anonymous === 'true',
      user_id: user_id || null
    });

    if (complaintError) {
      console.error('âŒ Complaint Insertion Failure:', complaintError);
      throw complaintError;
    }

    // 4.5 SEND CONFIRMATION EMAIL TO CITIZEN
    if (email) {
      console.log('ðŸ“§ Dispatching Confirmation Pulse to Citizen:', email);
      sendCitizenConfirmation(email, masterTicketId, category).catch(e => console.error('Email error:', e.message));
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
      console.log('ðŸŽï¸ Triggering Specialist Dispatch Engine...');
      await supabase.from('master_tickets').update({ status: 'assigned' }).eq('id', masterTicketId);
      autoAssignOfficer(masterTicketId, category, lat, lng, city || 'Mumbai', ward);

      // JURISDICTIONAL PULSE: Notify nearby citizens (Gap 5)
      console.log('ðŸ“¡ Broadcasting Neural Pulse to nearby citizens...');
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

// GET /api/complaints/analytics/weekly-matrix
router.get('/analytics/weekly-matrix', async (req, res) => {
  try {
    const matrix = await getWeeklyTrustMatrix();
    res.json(matrix);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;