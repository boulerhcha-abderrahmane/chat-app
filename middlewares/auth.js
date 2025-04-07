const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect('/login');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      const user = await User.findById(decoded.id);

      if (!user) {
        res.clearCookie('token');
        return res.redirect('/login');
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Middleware for already authenticated users
const guest = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/chat');
    } catch (error) {
      res.clearCookie('token');
    }
  }

  next();
};

module.exports = { protect, guest }; 