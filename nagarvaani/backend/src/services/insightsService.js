const { supabase } = require('../lib/supabase');
const { generateInsights } = require('../lib/gemini');

exports.fetchAndGenerateInsights = async function() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Fetch data for the summary
    const { data: tickets, error: ticketError } = await supabase
      .from('master_tickets')
      .select('*')
      .gt('created_at', sevenDaysAgo);

    if (ticketError) throw ticketError;

    const dataSummary = {
      total_tickets: tickets.length,
      by_category: tickets.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {}),
      resolved_count: tickets.filter(t => t.status === 'resolved').length,
      sla_breached: tickets.filter(t => t.status !== 'resolved' && new Date() > new Date(t.sla_deadline)).length
    };

    const result = await generateInsights(dataSummary);
    
    await supabase.from('daily_insights').insert({
      insight_text: JSON.stringify(result.insights),
      insight_type: 'daily_summary',
      generated_at: new Date().toISOString()
    });

    return result.insights;
  } catch (error) {
    console.error("Insights Service Error:", error);
    return [];
  }
};
