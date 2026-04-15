const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testAudit() {
  console.log("🧪 Initiating Atomic Database Drill...");
  
  const payload = {
    ticket_id: 'fd8da730-ae7a-44e8-9375-4330fd8da730', // Sample UUID format
    action: 'TEST_PROBE',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('audit_log').insert(payload).select();

  if (error) {
    console.error("❌ PROBE FAILURE:", error.message);
    console.error("Details:", error.details);
    console.error("Hint:", error.hint);
  } else {
    console.log("✅ PROBE SUCCESS: Signal ingested into ledger.", data[0].id);
  }
}

testAudit();
