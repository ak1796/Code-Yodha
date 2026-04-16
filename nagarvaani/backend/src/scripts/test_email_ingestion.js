const { processIncomingEmails } = require('../services/emailIngestionService');
require('dotenv').config();

async function runTest() {
  console.log("🧪 STARTING EMAIL INGESTION DIAGNOSTIC...");
  try {
     console.log("📡 Attempting to connect to Gmail IMAP...");
     await processIncomingEmails();
     console.log("✅ Diagnostic complete. Check console logs above for individual signal processing.");
  } catch (err) {
     console.error("❌ DIAGNOSTIC FATAL ERROR:", err.message);
     if (err.message.includes('AUTHENTICATIONFAILED')) {
        console.error("👉 TIP: Check your GMAIL_APP_PASSWORD. It must be a 16-character App Password, not your regular password.");
     }
  }
}

runTest();
