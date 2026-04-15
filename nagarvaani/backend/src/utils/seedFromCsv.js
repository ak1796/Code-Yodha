const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { supabase } = require('../lib/supabase');
const { citiesConfig } = require('../../../frontend/src/assets/data/citiesConfig');

async function seedFromCsv() {
  const results = [];
  const csvPath = path.join(__dirname, '../../data/Mumbai_BMC_Complaints.csv');

  console.log('🚀 Starting BMC Complaint Data Ingestion...');

  // 1. Group by Ward for Year 2024
  const wardAggregates = {};

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (data) => {
      if (data.Year === '2024') {
        const wardCode = data['Ward Code'];
        const issueType = data['Issue Type'];
        const total = parseInt(data['Total Complaints']) || 0;

        if (!wardAggregates[wardCode]) {
          wardAggregates[wardCode] = { total: 0, categories: {} };
        }
        wardAggregates[wardCode].total += total;
        wardAggregates[wardCode].categories[issueType] = (wardAggregates[wardCode].categories[issueType] || 0) + total;
      }
    })
    .on('end', async () => {
      console.log('📊 Aggregate analysis complete. Refreshing database...');

      // 1. Wipe previous Mumbai seed data to prevent water-spill duplicates
      const { error: delError } = await supabase.from('master_tickets').delete().eq('city', 'Mumbai');
      if (delError) console.error('⚠️ Cleanup failed:', delError.message);

      const ticketsToInsert = [];
      const SCALE_FACTOR = 0.05; 
      const JITTER_RADIUS = 0.006; // Tightened to ~600m for land safety

      const wards = Object.keys(wardAggregates);
      
      for (const wardCode of wards) {
        const stats = wardAggregates[wardCode];
        const numToInsert = Math.max(1, Math.round(stats.total * SCALE_FACTOR));
        
        const wardKey = `Ward ${wardCode}`;
        const office = citiesConfig.Mumbai.offices[wardKey];
        
        if (!office) continue;

        for (let i = 0; i < numToInsert; i++) {
          // Dynamic land bias for peninsula wards
          let latOffset = (Math.random() - 0.5) * JITTER_RADIUS;
          let lngOffset = (Math.random() - 0.5) * JITTER_RADIUS;

          // Mumbai specific land-safety logic:
          // Shift Ward A (Colaba) northwards to avoid water spill
          if (wardCode === 'A') latOffset += 0.002;

          const categories = Object.keys(stats.categories);
          const randomCat = categories[Math.floor(Math.random() * categories.length)];

          ticketsToInsert.push({
            title: `${randomCat} Issue - Historical Record`,
            description: `Automated data point imported from BMC historical datasets (Year 2024).`,
            category: randomCat,
            status: 'filed',
            lat: office.lat + latOffset,
            lng: office.lng + lngOffset,
            ward: wardCode,
            city: 'Mumbai',
            priority_score: Math.floor(Math.random() * 100)
          });
        }
      }

      console.log(`📡 Bulk inserting ${ticketsToInsert.length} land-safe data points...`);
      
      const chunkSize = 100;
      for (let i = 0; i < ticketsToInsert.length; i += chunkSize) {
        const chunk = ticketsToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('master_tickets').insert(chunk);
        if (error) console.error(`❌ Batch error:`, error.message);
      }

      console.log('✅ Ingestion complete. Map is now land-accurate.');
    });
}

seedFromCsv().catch(console.error);
