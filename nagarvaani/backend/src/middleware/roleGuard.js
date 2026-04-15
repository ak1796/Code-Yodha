exports.isOfficer = (req, res, next) => {
  if (req.user && (req.user.role === 'officer' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Officers only' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied: Admins only' });
  }
};
