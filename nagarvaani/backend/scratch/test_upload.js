const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUpload() {
  const dummyBuffer = Buffer.from('this is a test image');
  const ticketId = 'test-' + Date.now();
  
  console.log(`Testing upload for ${ticketId}...`);
  
  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(`${ticketId}/test.jpg`, dummyBuffer, { 
      contentType: 'image/jpeg', 
      upsert: true 
    });

  if (error) {
    console.error("Upload Error:", error);
  } else {
    console.log("Upload Success:", data);
    const { data: publicUrl } = supabase.storage.from('evidence').getPublicUrl(data.path);
    console.log("Public URL:", publicUrl.publicUrl);
  }
}

testUpload();
