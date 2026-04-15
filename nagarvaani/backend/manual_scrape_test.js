const { scrapeApifySignals } = require('./src/services/socialScraper');
require('dotenv').config();

console.log("🛠️ Starting Manual Apify Signal Check...");
scrapeApifySignals()
  .then(() => {
    console.log("✅ Scrape Complete. Check Supabase for new master_tickets.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Scrape Failed:", err.message);
    process.exit(1);
  });
