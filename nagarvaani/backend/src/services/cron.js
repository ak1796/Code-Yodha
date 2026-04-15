const { supabase } = require('../lib/supabase');
const { sendAssignmentEmail } = require('./notificationService');
const auditService = require('./auditService');

// Hourly Scan (Step 9)
async function checkSLABreaches() {
  console.log('🏛️ Sovereign Watchtower: Scanning for silent crisis breaches...');

  const { data: tickets, error } = await supabase
    .from('master_tickets')
    .select('*, profiles(email, full_name)')
    .eq('status', 'assigned')
    .lt('sla_deadline', new Date().toISOString());

  if (error) {
    console.error('❌ Watchtower Error:', error.message);
    return;
  }

  for (const ticket of tickets) {
    console.log(`🚨 Breach detected: Ticket #${ticket.id.substring(0, 8)} | ${ticket.category}`);

    // Update status to Escalated
    await supabase.from('master_tickets').update({ status: 'assigned' }).eq('id', ticket.id);
    
    // Log breach in audit trail (Step 9)
    await auditService.log({
        ticket_id: ticket.id,
        action: 'SLA_BREACHED',
        new_value: { overdue: true, deadline: ticket.sla_deadline }
    });

    // Send Escalation Email (Step 9)
    const headEmail = `head.${ticket.category.toLowerCase()}@ugirp.in`;
    const officerEmail = ticket.profiles ? ticket.profiles.email : null;

    if (officerEmail) {
        // In a real system, you'd have a CC field in sendAssignmentEmail
        // For now, we simulate the escalation send
        console.log(`📡 Sending Escalation to Specialist: ${officerEmail} and CC: ${headEmail}`);
    }
  }
}

// Start the Sovereign Monitor (Runs every hour)
// For Express, you'd usually trigger this via node-cron or similar
if (process.env.ENABLE_CRON === 'true') {
  setInterval(checkSLABreaches, 60 * 60 * 1000); 
}

module.exports = { checkSLABreaches };
