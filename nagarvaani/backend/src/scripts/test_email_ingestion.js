const { processIncomingEmails } = require('../services/emailIngestionService');
require('dotenv').config();

async function runTest() {
  console.log("­ƒº¬ STARTING EMAIL INGESTION DIAGNOSTIC...");
  try {
     console.log("­ƒôí Attempting to connect to Gmail IMAP...");
     await processIncomingEmails();
     console.log("Ô£à Diagnostic complete. Check console logs above for individual signal processing.");
  } catch (err) {
     console.error("ÔØî DIAGNOSTIC FATAL ERROR:", err.message);
     if (err.message.includes('AUTHENTICATIONFAILED')) {
        console.error("­ƒæë TIP: Check your GMAIL_APP_PASSWORD. It must be a 16-character App Password, not your regular password.");
     }
  }
}

runTest();