require('dotenv').config({ path: '../.env' });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
    const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;
    try {
        const response = await fetch(URL);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

listModels();
