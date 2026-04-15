const { supabase } = require('../src/lib/supabase');
async function check() {
  const { data: sample, error: selectError } = await supabase.from('master_tickets').select('*').limit(1);
  if (selectError) console.error('Select Error:', selectError);
  else console.log('Columns:', Object.keys(sample[0] || {}));
}
check();
