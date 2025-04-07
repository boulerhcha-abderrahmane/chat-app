const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
require('dotenv').config();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

// Register user
const register = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('register', {
        errors: errors.array(),
        values: req.body
      });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.render('register', {
        errors: [{ msg: 'Email already registered' }],
        values: req.body
      });
    }

    // Check if username is already taken
    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.render('register', {
        errors: [{ msg: 'Username already taken' }],
        values: req.body
      });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password
    });

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect('/chat');
  } catch (error) {
    console.error('Register error:', error);
    res.render('register', {
      errors: [{ msg: 'Server error, please try again' }],
      values: req.body
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('login', {
        errors: errors.array(),
        values: req.body
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('login', {
        errors: [{ msg: 'Invalid credentials' }],
        values: { email }
      });
    }

    // Check password
    const isMatch = await User.verifyPassword(password, user.password);
    if (!isMatch) {
      return res.render('login', {
        errors: [{ msg: 'Invalid credentials' }],
        values: { email }
      });
    }

    // Generate token
    const token = generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Update online status
    await User.updateOnlineStatus(user.id, true);

    res.redirect('/chat');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', {
      errors: [{ msg: 'Server error, please try again' }],
      values: req.body
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    // Update online status if user is logged in
    if (req.user) {
      await User.updateOnlineStatus(req.user.id, false);
    }
    
    // Clear cookie
    res.clearCookie('token');
    res.redirect('/login');
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('forgot-password', {
        errors: errors.array(),
        values: req.body
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('forgot-password', {
        errors: [{ msg: 'No account found with that email' }],
        values: { email }
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // In a real application, you would:
    // 1. Store the reset token in the database with expiration
    // 2. Send an email to the user with the reset link

    // For demonstration, redirect to the reset page with the token
    res.render('verify-token', { email });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.render('forgot-password', {
      errors: [{ msg: 'Server error, please try again' }],
      values: req.body
    });
  }
};

// Verify reset token
const verifyToken = async (req, res) => {
  try {
    const { email, token } = req.body;
    
    // In a real app, you would verify the token against the database
    // For demonstration, accept any token
    
    res.render('reset-password', { email, token });
  } catch (error) {
    console.error('Verify token error:', error);
    res.render('verify-token', {
      errors: [{ msg: 'Invalid or expired token' }],
      email: req.body.email
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render('reset-password', {
        errors: errors.array(),
        email: req.body.email,
        token: req.body.token
      });
    }

    const { email, password, token } = req.body;

    // In a real app, find the user with the valid reset token
    const user = await User.findByEmail(email);
    if (!user) {
      return res.render('reset-password', {
        errors: [{ msg: 'Invalid reset request' }],
        email,
        token
      });
    }

    // Update user's password
    // For this demonstration:
    // 1. Hash the new password
    const salt = await require('bcrypt').genSalt(10);
    const hashedPassword = await require('bcrypt').hash(password, salt);
    
    // 2. Update in database
    await require('../config/database').pool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    res.render('login', {
      success: 'Password reset successful! You can now log in with your new password.',
      values: { email }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.render('reset-password', {
      errors: [{ msg: 'Server error, please try again' }],
      email: req.body.email,
      token: req.body.token
    });
  }
};

module.exports = {
  register,
  login,
  logout,
  forgotPassword,
  verifyToken,
  resetPassword
}; 