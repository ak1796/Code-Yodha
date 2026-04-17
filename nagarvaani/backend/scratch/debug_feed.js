const { createClient } = require('@supabase/supabase-client');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkData() {
  const { data: tickets, error: tErr } = await supabase
    .from('master_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (tErr) console.error(tErr);
  else console.log('Top 5 Tickets:', JSON.stringify(tickets, null, 2));

  const { data: officer, error: oErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', 'patiltanay569@gmail.com')
    .single();

  if (oErr) console.error(oErr);
  else console.log('Officer Profile:', JSON.stringify(officer, null, 2));
}

checkData();
