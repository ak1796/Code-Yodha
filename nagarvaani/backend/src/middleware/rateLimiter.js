const rateLimit = require('express-rate-limit');

exports.complaintLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 5, // Limit to 5 complaints per windowMs
  message: { error: 'Too many complaints from this IP, please try again after an hour' },
  standardHeaders: true, 
  legacyHeaders: false,
});
