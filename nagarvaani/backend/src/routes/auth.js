const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../lib/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'nagarvaani_secret_fallback';
const TOKEN_EXPIRY = '7d';

// Register
router.post('/register', async (req, res) => {
  const { email, password, fullName, role, department, city } = req.body;

  try {
    // 1. Check if user already exists in profiles
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'User already registered' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Create profile
    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        { 
          email, 
          password_hash: passwordHash, 
          full_name: fullName, 
          role: role || 'citizen',
          department: department || null,
          city: city || null
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    const token = jwt.sign(
      { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role,
        department: profile.department,
        city: profile.city,
        full_name: profile.full_name
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.status(201).json({ token, profile });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Find user in profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, profile.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: profile.id, 
        email: profile.email, 
        role: profile.role,
        department: profile.department,
        city: profile.city,
        full_name: profile.full_name
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    res.json({ token, profile });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
