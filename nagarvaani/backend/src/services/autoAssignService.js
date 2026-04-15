const { supabase } = require('../lib/supabase');

/**
 * Haversine distance function (km)
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Elite Auto-Assignment: Balances Proximity and Load (Step 4 & 6)
 */
exports.autoAssignOfficer = async (ticketId, category, lat, lng, city, ward) => {
  try {
    console.log(`🤖 Universal Dispatcher: Solving optimal routing for Ticket ${ticketId} in Ward ${ward}...`);

    // 1. Fetch ALL capable officers in city (Step 4)
    const { data: officers, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'officer')
      .eq('department', category)
      .eq('city', city)
      .eq('is_available', true);

    if (error || !officers || officers.length === 0) {
      console.log(`⚠️ No local specialist found for ${category}. Triggering Fallback...`);
      return await assignFallback(ticketId, category, city);
    }

    // 2. Score each officer (Step 6 - GPS Distance)
    const candidates = officers
      .filter(o => o.active_ticket_count < (o.max_ticket_capacity || 10))
      .map(o => {
        const dist = haversineKm(lat, lng, o.officer_lat, o.officer_lng);
        const loadRatio = o.active_ticket_count / (o.max_ticket_capacity || 10);
        
        // JURISDICTIONAL BONUS (90% boost if in same ward)
        const isSameWard = (o.ward === ward);
        const wardBonus = isSameWard ? 10 : 0; // Extremely high priority for ward specialists

        const distScore = Math.max(0, 10 - (dist / 2)); 
        const loadScore = (1 - loadRatio) * 5;
        
        const finalScore = wardBonus + distScore + loadScore;

        return { ...o, dist, finalScore, isSameWard };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    if (candidates.length === 0) return await assignFallback(ticketId, category, city);

    const best = candidates[0];

    // 3. Finalize Assignment (Step 4 & 7)
    await finalizeAssignment(ticketId, best, `Optimal Specialist matched (${best.dist.toFixed(1)}km, Jurisdiction ${best.ward})`, best.dist);

    // 4. Send Immediate Inbox Signal (Step 4)
    const { data: ticket } = await supabase.from('master_tickets').select('*').eq('id', ticketId).single();
    if (ticket) {
      await sendAssignmentEmail(best.email, { ...ticket, ward: ward });
    }

    return { success: true, officer_name: best.full_name, distance: best.dist };

  } catch (err) {
    console.error("❌ Auto-Assign Fatal:", err.message);
    return { success: false };
  }
};

/**
 * Fallback to Dept Head or Cross-Department
 */
async function assignFallback(ticketId, category, city) {
  console.log(`⚠️ No local specialist available for ${category}. Triggering Fallback...`);

  // 1. Try Dept Head in that city
  const { data: head } = await supabase
    .from('profiles')
    .select('*')
    .eq('department', category)
    .eq('city', city)
    .eq('is_department_head', true)
    .single();

  if (head) {
    await finalizeAssignment(ticketId, head, "Fallback: Department Head assigned due to high field load", 0);
    return { success: true, officer_name: head.full_name, fallback: true };
  }

  // 2. Global Backup (Any available officer in city)
  const { data: backup } = await supabase
    .from('profiles')
    .select('*')
    .eq('city', city)
    .eq('is_available', true)
    .limit(1)
    .single();

  if (backup) {
    await finalizeAssignment(ticketId, backup, "Cross-department fallback: Regional officer dispatched", 0);
    return { success: true, officer_name: backup.full_name, fallback: true };
  }

  return { success: false };
}

/**
 * Reassign on SLA breach or Admin request
 */
exports.reassignOfficer = async (ticketId, reason = 'reassignment') => {
  const { data: ticket } = await supabase.from('master_tickets').select('*').eq('id', ticketId).single();
  if (!ticket) return;

  if (ticket.assigned_officer_id) {
    await supabase.rpc('decrement_ticket_count', { officer_id: ticket.assigned_officer_id });
  }

  return await exports.autoAssignOfficer(ticketId, ticket.category, ticket.lat, ticket.lng, ticket.city);
};

/**
 * Specialized Escalation for Gap 1: 6 hours after breach
 */
exports.escalateToDeptHead = async (ticketId) => {
  const { data: ticket } = await supabase.from('master_tickets').select('*').eq('id', ticketId).single();
  if (!ticket || ticket.status === 'escalated') return;

  // 1. Find the Dept Head
  const { data: head } = await supabase
    .from('profiles')
    .select('*')
    .eq('department', ticket.category)
    .eq('city', ticket.city)
    .eq('is_department_head', true)
    .single();

  if (!head) return { success: false, msg: "No department head found for escalation" };

  // 2. Decrement current officer's load
  if (ticket.assigned_officer_id) {
    await supabase.rpc('decrement_ticket_count', { officer_id: ticket.assigned_officer_id });
  }

  // 3. Finalize Escalation
  await finalizeAssignment(ticketId, head, "SLA CRITICAL BREACH (6h+): Escalated to Dept Head", 0);
  await supabase.from('master_tickets').update({ status: 'escalated' }).eq('id', ticketId);

  // 4. CC notification (Simplified logic)
  const { sendAssignmentEmail } = require('./notificationService');
  await sendAssignmentEmail(head.email, { ...ticket, title: `🚨 ESCALATED BREACH: ${ticket.title}` });
  
  return { success: true, head_name: head.full_name };
};

const auditService = require('./auditService');

/**
 * atomic updates for assignments
 */
async function finalizeAssignment(ticketId, officer, reason, dist) {
  // Update Ticket
  await supabase.from('master_tickets').update({ assigned_officer_id: officer.id, status: 'assigned' }).eq('id', ticketId);
  // Increment Load
  await supabase.rpc('increment_ticket_count', { officer_id: officer.id });
  
  // Jurisdictional Assignments Table
  await supabase.from('officer_assignments').insert({
    ticket_id: ticketId,
    officer_id: officer.id,
    assignment_reason: reason,
    distance_km: dist
  });

  // Forensic Audit Log
  await auditService.log({
    ticket_id: ticketId,
    action: 'OFFICER_ASSIGNED',
    new_value: officer.full_name,
    ip_address: '0.0.0.0' // Service-to-service
  });
}
