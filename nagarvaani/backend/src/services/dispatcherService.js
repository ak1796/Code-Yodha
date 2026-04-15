const { supabase } = require('../lib/supabase');

/**
 * Agentic Dispatcher: Automatically routes reports to the correct department specialists.
 */
exports.autoAssignOfficer = async (ticketId, category, city) => {
  try {
    console.log(`🤖 Agentic Dispatcher: Finding specialist for [${category}] in [${city}]...`);

    // 1. Find an officer in the matching department AND city
    const { data: officers, error: findError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'officer')
      .eq('department', category)
      .eq('city', city)
      .limit(1);

    if (findError || !officers || officers.length === 0) {
      console.warn(`⚠️ No specialist found for ${category}. Staying unassigned for Admin manual dispatch.`);
      return null;
    }

    const specialist = officers[0];

    // 2. Assign the ticket
    const { error: updateError } = await supabase
      .from('master_tickets')
      .update({ 
        assigned_officer_id: specialist.id,
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) throw updateError;

    console.log(`✅ Successfully dispatched Ticket ${ticketId} to Officer ${specialist.full_name}.`);
    return specialist.id;

  } catch (err) {
    console.error("❌ Dispatcher Failure:", err.message);
    return null;
  }
};
