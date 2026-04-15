const { supabase } = require('../src/lib/supabase');
async function check() {
  const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'complaints' });
  // If RPC not available, try a simple select
  if (error) {
    const { data: sample, error: selectError } = await supabase.from('complaints').select('*').limit(1);
    if (selectError) console.error('Select Error:', selectError);
    else console.log('Columns:', Object.keys(sample[0] || {}));
  } else {
    console.log('Columns:', data);
  }
}
check();
