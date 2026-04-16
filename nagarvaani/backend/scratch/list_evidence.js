const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listEvidence() {
  console.log("Listing evidence files...");
  const { data: files, error } = await supabase.storage.from('evidence').list('', { limit: 100 });
  
  if (error) {
    console.error("Error listing files:", error);
    return;
  }

  console.log(`Found ${files.length} files/folders:`);
  for (const f of files) {
    console.log(` - ${f.name} (isDir: ${f.id === undefined})`);
    if (f.id === undefined) {
        // It's a folder (ticket ID)
        const { data: subFiles } = await supabase.storage.from('evidence').list(f.name);
        for (const sf of subFiles || []) {
            console.log(`    - ${sf.name}`);
        }
    }
  }
}

listEvidence();
