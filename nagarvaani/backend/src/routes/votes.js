const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const auditService = require('../services/auditService');

// POST /api/tickets/:id/vote
router.post('/:id/vote', authenticate, async (req, res) => {
  const { id } = req.params;
  const { vote } = req.body; // 'confirm' or 'dismiss'
  
  try {
    // Determine Weight based on Reputation (Gap 5)
    const { data: profile } = await supabase.from('profiles').select('reputation_score').eq('id', req.user.profile_id).single();
    const reputation = profile.reputation_score || 50;
    const weight = reputation > 70 ? 2 : 1;

    // Record Vote
    const { error: voteError } = await supabase.from('complaint_votes').upsert({
      master_ticket_id: id,
      user_id: req.user.profile_id,
      vote,
      weight
    });

    if (voteError) throw voteError;

    // 2. TACTICAL IMPACT: Update Priority Score (Gap 5)
    const { data: ticket } = await supabase.from('master_tickets').select('priority_score, affected_count').eq('id', id).single();
    let newPriority = ticket.priority_score || 1;
    
    if (vote === 'confirm') {
      newPriority = Math.min(5, newPriority + (0.1 * weight));
    } else if (vote === 'dismiss') {
      newPriority = Math.max(1, newPriority - (0.1 * weight));
    }

    await supabase.from('master_tickets').update({
      priority_score: parseFloat(newPriority.toFixed(2)),
      affected_count: vote === 'confirm' ? (ticket.affected_count || 1) + 1 : ticket.affected_count
    }).eq('id', id);

    await auditService.log({ 
      ticket_id: id, 
      actor_id: req.user.profile_id, 
      action: 'TRUST_WEIGHTED_VOTE_CAST', 
      new_value: `Vote: ${vote} | Weight: ${weight} | New Priority: ${newPriority.toFixed(2)}` 
    });
    res.json({ message: 'Vote recorded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

module.exports = router;
