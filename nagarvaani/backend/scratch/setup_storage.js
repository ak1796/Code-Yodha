const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupBucket() {
  console.log("Checking storage buckets...");
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }

  const evidenceBucket = buckets.find(b => b.name === 'evidence');
  
  if (!evidenceBucket) {
    console.log("Creating 'evidence' bucket...");
    const { data: createData, error: createError } = await supabase.storage.createBucket('evidence', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png'],
      fileSizeLimit: 5242880 // 5MB
    });
    
    if (createError) {
      console.error("Error creating bucket:", createError);
    } else {
      console.log("Bucket 'evidence' created successfully.");
    }
  } else {
    console.log("'evidence' bucket already exists.");
    if (!evidenceBucket.public) {
        console.log("Updating bucket to be public...");
        await supabase.storage.updateBucket('evidence', { public: true });
    }
  }
}

setupBucket();
