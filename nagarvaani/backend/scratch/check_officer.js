const { supabase } = require('../src/lib/supabase');
async function check() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'officer')
    .eq('department', 'DRAINAGE')
    .eq('is_available', true)
    .limit(1);
  console.log('Officer:', data);
  if (error) console.error('Error Details:', error);
}
check();
