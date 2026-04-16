const { supabase } = require('../lib/supabase');

/**
 * Aggregates historical ticket data for the last 7 days
 * Matches the format expected by TrustPanel's BarChart
 */
exports.getWeeklyTrustMatrix = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data, error } = await supabase
    .from('master_tickets')
    .select('created_at, category')
    .gt('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error("❌ Analytics Data Fetch Failure:", error);
    return [];
  }

  // Days of the week for display
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Matrix Object
  const matrix = {};
  
  // Initialize last 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = days[d.getDay()];
    matrix[dayLabel] = {
      day: dayLabel,
      drainage: 0,
      water: 0,
      roads: 0,
      garbage: 0,
      storm: 0,
      health: 0,
      garden: 0,
      buildings: 0,
      pest: 0,
      encroach: 0,
      elec: 0,
      licence: 0,
      factories: 0,
      school: 0
    };
  }

  // Map category to chart key
  const categoryMap = {
    'DRAINAGE': 'drainage',
    'WATER': 'water',
    'ROADS': 'roads',
    'GARBAGE': 'garbage',
    'ELECTRICAL': 'elec',
    'HEALTH': 'health',
    'PARKS': 'garden'
    // ... add more as needed
  };

  // Populate Matrix
  data.forEach(ticket => {
    const dayLabel = days[new Date(ticket.created_at).getDay()];
    const key = categoryMap[ticket.category] || 'other';
    if (matrix[dayLabel] && matrix[dayLabel][key] !== undefined) {
      matrix[dayLabel][key]++;
    }
  });

  // Return as sorted array (from oldest to newest)
  return Object.values(matrix).reverse();
};
