const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// GET /api/users/me - get current user profile + points
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// POST /api/users/login - Local login for sample accounts
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password (simple plain text check for local mock accounts compatibility)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Generate mock/local token containing the user's uid
    const token = `local-${user.uid}`;
    
    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/users/signup - Local signup for creating new accounts
router.post('/signup', async (req, res) => {
  const { name, email, password, role, zone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  try {
    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }
    
    const uid = `uid-user-${Date.now()}`;
    const newUser = await User.create({
      uid,
      name,
      email: email.toLowerCase().trim(),
      password,
      role: role || 'citizen',
      zone: zone || 'Zone-A',
      points: 0,
      badgesEarned: [],
      reportCount: 0
    });
    
    const token = `local-${uid}`;
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
