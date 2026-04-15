const cron = require('node-cron');
const { supabase } = require('../lib/supabase');
const auditService = require('../services/auditService');
const { sendEmail } = require('../services/notificationService');

const { reassignOfficer } = require('../services/autoAssignService');
const { scrapeApifySignals } = require('../services/socialScraper');

// Every hour: detect SLA breaches and escalations (Gap 1)
cron.schedule('0 * * * *', async () => {
  const now = new Date();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  // 1. Critical Escalation: 6 hours after breach
  const { data: critical } = await supabase
    .from('master_tickets')
    .select('*')
    .lt('sla_deadline', sixHoursAgo)
    .neq('status', 'resolved')
    .neq('status', 'escalated');

  if (critical) {
    const { escalateToDeptHead } = require('../services/autoAssignService');
    for (const ticket of critical) {
      console.log(`📡 CRITICAL SLA ESCALATION: Ticket ${ticket.id} passed 6h threshold.`);
      await escalateToDeptHead(ticket.id);
      await auditService.log({ ticket_id: ticket.id, action: 'SLA_CRITICAL_ESCALATION', new_value: 'DEPARTMENT_HEAD' });
    }
  }

  // 2. Soft Breach Alert: Just passed deadline
  const { data: soft } = await supabase
    .from('master_tickets')
    .select('*')
    .lt('sla_deadline', now.toISOString())
    .gt('sla_deadline', sixHoursAgo)
    .neq('status', 'resolved')
    .neq('status', 'assigned_alerted'); // prevent spam

  if (soft) {
    for (const ticket of soft) {
      console.log(`🔔 SLA SOFT BREACH: Alerting officer for Ticket ${ticket.id}`);
      // Notify logic (Email already sent on assignment, this is a follow-up)
      await supabase.from('master_tickets').update({ status: 'assigned_alerted' }).eq('id', ticket.id);
      await auditService.log({ ticket_id: ticket.id, action: 'SLA_SOFT_BREACH_ALERT' });
    }
  }
});

// Real-world social ingestion via Apify every 30 minutes
cron.schedule('*/30 * * * *', async () => {
   await scrapeApifySignals();
});

// AATS daily recompute at 7 AM
const { computeAatsForDepartment } = require('../services/aatsService');
cron.schedule('0 7 * * *', async () => {
  const categories = ['WATER','ELECTRICITY','ROADS','GARBAGE','PARKS','PUBLIC_SAFETY','OTHER'];
  for (const cat of categories) {
    await computeAatsForDepartment(cat);
  }
});

// Daily insights at 6 AM
const { fetchAndGenerateInsights } = require('../services/insightsService');
cron.schedule('0 6 * * *', async () => {
  await fetchAndGenerateInsights();
});

// Silence ratio at 8 AM
const { recomputeSilenceRatios } = require('../services/silenceCrisisService');
cron.schedule('0 8 * * *', async () => {
  await recomputeSilenceRatios();
});
