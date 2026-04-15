const { geminiCategorize } = require('../lib/gemini');
const { runPythonScript } = require('../utils/pythonBridge');

/**
 * Intelligent Voice Processor
 * Extracts structured data from a raw voice transcript
 */
const extractComplaintFromVoice = async (transcript) => {
  if (!transcript) return null;

  try {
    // Phase 1: Pre-process voice transcript (Clean noise, normalize)
    let processedTranscript = transcript;
    try {
      const preprocessResult = await runPythonScript('preprocessor.py', { text: transcript });
      processedTranscript = preprocessResult.cleaned_text || transcript;
      console.log(`[Voice Pipeline] Preprocessed transcript. Cleaned length: ${processedTranscript.length}`);
    } catch (pyError) {
      console.warn("[Voice Pipeline] Python preprocessor failed:", pyError.message);
    }

    // Phase 2: Intelligence Extraction
    const extraction = await geminiCategorize(processedTranscript);

    return {
      category: extraction.category || 'OTHER',
      description: transcript,
      location_text: extraction.extended_location || extraction.extracted_location || '',
      severity: extraction.severity || 'MEDIUM',
      summary: extraction.summary || ''
    };
  } catch (error) {
    console.error("Voice extraction failed:", error);
    return {
      category: 'OTHER',
      description: transcript,
      location_text: '',
      severity: 'MEDIUM'
    };
  }
};

module.exports = { extractComplaintFromVoice };
