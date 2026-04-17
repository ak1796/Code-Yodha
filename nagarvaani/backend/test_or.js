const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const userId = '4eae8111-76f2-4996-9de2-661678c078b8';
  const userEmail = 'tanay@gmail.com';
  const { data, error } = await supabase.from('master_tickets').select('*').or(`creator_id.eq.${userId},email.eq.${userEmail}`);
  console.log('Error:', error);
}
run();
