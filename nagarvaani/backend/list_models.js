const env = require('dotenv').config({ path: '/Users/tanaypatil/Desktop/Hackthons/Nirman26/nagarvaani/backend/.env' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("FULL API RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("List Models Failed:", err.message);
  }
}

listModels();
