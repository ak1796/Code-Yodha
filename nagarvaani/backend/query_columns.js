const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.from('master_tickets').select('*').limit(1);
  if (data && data.length > 0) {
     console.log(Object.keys(data[0]));
  } else {
     console.log("Empty or error:", error);
  }
}
run();
