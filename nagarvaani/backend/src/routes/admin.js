const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');
const { decryptComplaint } = require('../services/whistleblowerService');
const auditService = require('../services/auditService');

// Admin Analytics
router.get('/analytics', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: tickets } = await supabase.from('master_tickets').select('*');
    const { data: deptScores } = await supabase.from('department_scores').select('*').order('computed_at', { ascending: false }).limit(6);
    res.json({ tickets, dept_scores: deptScores });
  } catch (error) {
    console.error("Admin Analytics Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/admin/heatmap
router.get('/heatmap', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: complaints } = await supabase.from('complaints').select('lat, lng, status');
    res.json(complaints);
  } catch (error) {
    console.error("Heatmap Fetch Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Decrypt whistleblower complaint
router.post('/decrypt/:complaint_id', authenticate, isAdmin, async (req, res) => {
  const { complaint_id } = req.params;
  const { iv } = req.body; // In a real scenario, this would be retrieved from DB
  try {
    const { data: comp } = await supabase.from('complaints').select('encrypted_text').eq('id', complaint_id).single();
    const decrypted = decryptComplaint(comp.encrypted_text, iv);
    
    await auditService.log({ actor_id: req.user.profile_id, action: 'ANONYMOUS_COMPLAINT_DECRYPTED', ticket_id: comp.master_ticket_id });
    res.json({ decrypted });
  } catch (error) {
    console.error("Decryption Route Error:", error);
    res.status(500).json({ error: error.message || 'Decryption failed' });
  }
});

// GET /api/admin/audit-log
router.get('/audit-log', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: auditLogs } = await supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(100);
    res.json(auditLogs);
  } catch (error) {
    console.error("Audit Log Fetch Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// NEW: GET /api/admin/officers
router.get('/officers', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: officers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'officer')
      .order('full_name');
    
    if (error) throw error;
    res.json(officers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// NEW: GET /api/admin/assignments
router.get('/assignments', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('officer_assignments')
      .select('*, master_tickets(title), profiles(full_name, department)')
      .order('assigned_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
