require('dotenv').config();
// Use native fetch for Gemini REST API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'mock';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(systemPrompt, userText) {
  if (GEMINI_API_KEY === 'mock') {
    // Return mock responses if no key
    console.warn("Using mock Gemini response");
    return mockGeminiResponse(systemPrompt);
  }

  const payload = {
    contents: [{ parts: [{ text: `SYSTEM INSTRUCTION: ${systemPrompt}. ALWAYS RETURN ONLY VALID JSON. NO MARKDOWN. NO EXPLANATION.\n\nUSER INPUT: ${userText}` }] }],
    generationConfig: { 
      temperature: 0.1 
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
    ]
  };

  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.candidates || data.candidates.length === 0) {
      console.error("Gemini Rejection Data:", JSON.stringify(data, null, 2));
      throw new Error("No candidates returned from Gemini. Check 'Gemini Rejection Data' log above.");
    }
    return JSON.parse(data.candidates[0].content.parts[0].text);
  } catch (err) {
    console.error("Gemini Failure Trace:", err.message);
    return mockGeminiResponse(systemPrompt);
  }
}

function mockGeminiResponse(prompt) {
  if (prompt.includes('spam detection')) return { classification: 'COMPLAINT', confidence: 0.95 };
  if (prompt.includes('categories')) return { category: 'WATER', severity: 'HIGH', extracted_location: 'Mumbai', summary: 'Mock summary' };
  if (prompt.includes('keywords')) return { keywords_found: ['mock_keyword'], keyword_score: 0.7 };
  if (prompt.includes('sentiment')) return { sentiment_score: 0.5, detected_language: 'en' };
  if (prompt.includes('insights') || prompt.includes('memory')) return { insights: ['Chronic leak in Ward A detected.', 'Seasonal flooding predicted for July.', 'Contractor X audit recommended.'] };
  if (prompt.includes('verified')) return { verified: true, confidence: 0.85, reason: "Mock verified" };
  return {};
}

// Prompt functions below
exports.geminiClassifySpam = async (text) => {
  const prompt = `You are a spam detection system for a civic complaint portal.
Classify the following text as COMPLAINT or NOT_COMPLAINT.
Return ONLY valid JSON, no markdown, no explanation.
Format: {"classification": "COMPLAINT", "confidence": 0.95, "reason": "brief reason"}`;
  return callGemini(prompt, text);
};

exports.geminiCategorize = async (text) => {
  const prompt = `You are a civic complaint classifier for Indian cities.
Classify this complaint and extract structured information.
Identify the specific city mentioned or implied (e.g., Mumbai, Nashik, Thane).
Return ONLY valid JSON, no markdown, no explanation.
Categories: WATER, ELECTRICITY, ROADS, GARBAGE, PARKS, PUBLIC_SAFETY, OTHER
Severity: LOW, MEDIUM, HIGH
Format: {"category": "WATER", "severity": "HIGH", "extracted_location": "Location", "extracted_city": "Mumbai", "summary": "One sentence summary"}`;
  return callGemini(prompt, text);
};

exports.geminiUrgencyScore = async (text) => {
  const prompt = `You are analyzing a civic complaint for emergency signals.
Extract emergency keywords and compute a keyword score.
Return ONLY valid JSON, no markdown.
Score: 1.0 if contains critical emergency words, 0.7 for urgent, 0.4 for significant, 0.0 for none.
Format: {"keywords_found": ["flood"], "keyword_score": 1.0}`;
  return callGemini(prompt, text);
};

exports.geminiSentimentScore = async (text) => {
  const prompt = `You are analyzing the sentiment of a citizen complaint.
Return ONLY valid JSON, no markdown.
Score sentiment from 0.0 (very calm/neutral) to 1.0 (extremely distressed/angry).
Format: {"sentiment_score": 0.85, "detected_language": "hi"}`;
  return callGemini(prompt, text);
};

exports.geminiEmbed = async (text) => {
  if (GEMINI_API_KEY === 'mock') return Array(768).fill(0.1);
  try {
    const embedUrl = `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
    const payload = { model: "models/text-embedding-004", content: { parts: [{ text }] } };
    const res = await fetch(embedUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    
    if (!data.embedding || !data.embedding.values) throw new Error("Embedding extraction failed");
    return data.embedding.values;
  } catch (err) {
    console.warn("Embedding API failed, using 768-dim mock vector:", err.message);
    return Array(768).fill(0.01); // Safe fallback vector
  }
};

exports.generateInsights = async (dataSummary) => {
  const prompt = `You are a city operations analyst for an Indian municipal corporation.
Given this complaint data summary from the past 7 days, generate exactly 3 actionable recommendations.
Return ONLY valid JSON, no markdown.
Format: {"insights": ["Insight 1.", "Insight 2.", "Insight 3."]}`;
  return callGemini(prompt, JSON.stringify(dataSummary));
};

exports.generateCivicMemory = async (historicalData) => {
  const prompt = `You are analyzing 2 years of civic complaint history for an Indian city.
Identify chronic problem locations, seasonal patterns, and repeat contractors.
Generate exactly 3 civic memory insights for city planners.
Return ONLY valid JSON, no markdown.
Format: {"insights": ["Chronic insight 1.", "Seasonal insight 2.", "Contractor insight 3."]}`;
  return callGemini(prompt, JSON.stringify(historicalData));
};

exports.geminiVerifyResolution = async (category, beforeDesc, afterDesc) => {
  const prompt = `An officer has submitted before and after descriptions for a resolved complaint.
Does the after-state represent a meaningful improvement for this civic category?
Return ONLY valid JSON.
Format: {"verified": true, "confidence": 0.92, "reason": "Brief reason"}
Category: "${category}"
Before description: "${beforeDesc}"
After description: "${afterDesc}"`;
  return callGemini(prompt, "");
};
