const rateLimit = require('express-rate-limit');

exports.complaintLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Relaxed for development testing
  message: { error: 'Too many complaints from this IP, please try again later' },
  standardHeaders: true, 
  legacyHeaders: false,
});
