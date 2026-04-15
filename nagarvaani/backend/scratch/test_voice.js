require('dotenv').config({ path: '../.env' });
const { geminiCategorize, geminiUrgencyScore, geminiSentimentScore, geminiClassifySpam } = require('../src/lib/gemini');

async function testVoice() {
    const testText = "There is a massive pothole causing accidents near the school in Andheri West. It needs to be fixed immediately!";
    console.log("Analyzing text:", testText);
    
    console.log("\n--- SPAM CHECK ---");
    const spam = await geminiClassifySpam(testText);
    console.log(spam);
    
    console.log("\n--- CATEGORIZE ---");
    const cat = await geminiCategorize(testText);
    console.log(cat);
    
    console.log("\n--- URGENCY ---");
    const urgency = await geminiUrgencyScore(testText);
    console.log(urgency);
    
    console.log("\n--- SENTIMENT ---");
    const sentiment = await geminiSentimentScore(testText);
    console.log(sentiment);
    
    console.log("\n--- PYTHON PREPROCESSOR ---");
    const { cleanComplaintText } = require('../src/utils/cleaner');
    const cleaned = cleanComplaintText(testText);
    console.log("Cleaned Text:", cleaned);
}

testVoice().catch(console.error);
