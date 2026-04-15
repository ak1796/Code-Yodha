const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleGuard');

// GET /api/admin/officers
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { data: officers, error } = await supabase.from('profiles').select('*').eq('role', 'officer');
    if (error) throw error;
    res.json(officers);
  } catch (error) {
    console.error("Fetch Officers Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// POST /api/admin/officers/:id/assign
router.post('/:id/assign', authenticate, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { ward_id } = req.body;
  try {
    const { data: profile, error } = await supabase.from('profiles').update({ ward_id }).eq('id', id).select().single();
    if (error) throw error;
    res.json(profile);
  } catch (error) {
    console.error("Assign Officer Error:", error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

module.exports = router;
