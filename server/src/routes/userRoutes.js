const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// GET /api/users/me - get current user profile + points
router.get('/me', protect, async (req, res) => {
  res.json(req.user);
});

// POST /api/users/login - Local login for users and sample accounts
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Check password
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Role check if requested role is specified
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `Account is registered as "${user.role}", not "${role}". Please select the ${user.role.toUpperCase()} tab.`
      });
    }
    
    // Generate authenticated token containing the user's uid
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

// POST /api/users/signup - Citizen self-registration only
// Staff and Administrator accounts must be added directly into the database
router.post('/signup', async (req, res) => {
  const { name, email, password, role, zone } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  // Security Gate: Reject any attempt to self-register as admin or staff
  if (role && role !== 'citizen') {
    return res.status(403).json({
      message: 'Self-registration is restricted to Citizens only. Staff and Administrator accounts must be created directly in the database.'
    });
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
      role: 'citizen', // Enforce citizen role
      zone: zone || 'Zone-A',
      points: 0,
      badgesEarned: [],
      reportCount: 0
    });
    
    const token = `local-${uid}`;
    
    res.status(201).json({
      message: 'Citizen account registered successfully',
      token,
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
