const env = require('dotenv').config({ path: '/Users/tanaypatil/Desktop/Hackthons/Nirman26/nagarvaani/backend/.env' });
const { geminiCategorize } = require('./src/lib/gemini');

async function testAI() {
  console.log("🔍 Starting Intelligence Pulse Check...");
  try {
    const testText = "There is a massive water pipe burst near the main gate of IIT Bombay. Water is flooding the street and creating a traffic hazard.";
    console.log("📝 Sending test complaint to Gemini...");
    
    const result = await geminiCategorize(testText);
    
    console.log("✅ AI RESPONSE RECEIVED:");
    console.log(JSON.stringify(result, null, 2));
    
    if (result.category && result.summary) {
      console.log("\n🚀 STATUS: AI IS FULLY OPERATIONAL!");
    } else {
      console.log("\n⚠️ STATUS: AI is in Mock/Fallback mode.");
    }
  } catch (err) {
    console.error("❌ PULSE CHECK FAILED:", err.message);
  }
}

testAI();
