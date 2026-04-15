const jwt = require('jsonwebtoken');
const { supabase } = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'nagarvaani_secret_fallback';

exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

    // 1. Verify custom JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) return res.status(401).json({ error: 'Unauthorized: Invalid token' });

    // 2. Attach user info to request
    // We already have id, email, role in the decoded token
    // But we fetch the latest profile for ward_id or status checks
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ error: 'Unauthorized: Profile synchronization failed' });
    }

    req.user = { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role, 
        ward_id: profile.ward_id, 
        profile_id: profile.id 
    };
    
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Session expired or invalid' });
  }
};
