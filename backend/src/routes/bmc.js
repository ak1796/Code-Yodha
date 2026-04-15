const express = require('express');
const router = express.Router();
const { getBmcStatistics } = require('../services/bmcDataService');

/**
 * GET /api/data/bmc/stats
 * Responds with historical statistics parsed from Mumbai_BMC_Complaints.csv
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getBmcStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Failed to fetch BMC statistics:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
