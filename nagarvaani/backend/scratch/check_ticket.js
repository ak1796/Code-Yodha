const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTicket(id) {
  console.log(`Checking ticket ${id}...`);
  const { data, error } = await supabase
    .from('master_tickets')
    .select('id, status, before_image_url, after_image_url')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Ticket Data:", data);
}

const ticketId = 'd12e31f2-993d-4cbf-b157-e39982c128cb'; // From screenshot/list
checkTicket(ticketId);