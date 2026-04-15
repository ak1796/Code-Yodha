const express = require('express');
const router = express.Router();
const { extractComplaintFromVoice } = require('../services/voiceProcessor');
const { cleanComplaintText } = require('../utils/cleaner');

// POST /api/voice/process
router.post('/process', async (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  try {
    const cleanedTranscript = cleanComplaintText(transcript);
    const extractedData = await extractComplaintFromVoice(cleanedTranscript);

    return res.json(extractedData);
  } catch (error) {
    console.error("Voice processing route error:", error);
    res.status(500).json({ error: 'Internal server error processing voice' });
  }
});

module.exports = router;
