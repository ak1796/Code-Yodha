const { supabase } = require('../lib/supabase');

exports.computeAatsForDepartment = async function(category) {
  try {
    const { data: tickets, error } = await supabase
      .from('master_tickets')
      .select('*')
      .eq('category', category)
      .limit(100); // Compute based on last 100 tickets

    if (error || !tickets || tickets.length === 0) return 0;

    const total = tickets.length;
    const resolved = tickets.filter(t => t.status === 'resolved').length;
    const slaCompliant = tickets.filter(t => t.status === 'resolved' && new Date(t.updated_at) < new Date(t.sla_deadline)).length;
    
    // avg citizen rating (if available)
    const rated = tickets.filter(t => t.avg_citizen_rating > 0);
    const avgRating = rated.length > 0 ? rated.reduce((acc, t) => acc + t.avg_citizen_rating, 0) / rated.length : 3;

    const resolutionRate = resolved / total;
    const slaCompliance = slaCompliant / (resolved || 1);

    const aats = Math.round(
      (resolutionRate * 0.4 * 100) +
      (slaCompliance * 0.3 * 100) +
      (avgRating / 5 * 0.3 * 100)
    );

    // Save stats
    await supabase.from('department_scores').insert({
      department: category,
      resolution_rate: resolutionRate,
      sla_compliance: slaCompliance,
      avg_citizen_rating: avgRating,
      aats: aats,
      computed_at: new Date().toISOString()
    });

    return aats;
  } catch (error) {
    console.error("AATS Error:", error);
    return 0;
  }
};
