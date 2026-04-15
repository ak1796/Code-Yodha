const { geminiCategorize } = require('../lib/gemini');
const { runPythonScript } = require('../utils/pythonBridge');

exports.categorizeComplaint = async function(text) {
  try {
    // Phase 1: Pre-process text (Clean HTML, lowercase, remove stop words)
    let processedText = text;
    try {
      const preprocessResult = await runPythonScript('preprocessor.py', { text });
      processedText = preprocessResult.cleaned_text || text;
      console.log(`[AI Pipeline] Preprocessed text. Original length: ${text.length}, Cleaned length: ${processedText.length}`);
    } catch (pyError) {
      console.warn("[AI Pipeline] Python preprocessor failed, falling back to raw text:", pyError.message);
    }

    // Phase 2: AI Categorization
    const result = await geminiCategorize(processedText);
    return result;
  } catch (error) {
    console.error("Categorization API failed:", error);
    return {
      category: 'OTHER',
      severity: 'MEDIUM',
      extracted_location: 'Unknown',
      summary: text.substring(0, 100) + '...'
    };
  }
};
