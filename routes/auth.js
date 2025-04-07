const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { guest, protect } = require('../middlewares/auth');

// Login route
router.get('/login', guest, (req, res) => {
  res.render('login', { errors: [], values: {} });
});

router.post('/login', guest, [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').notEmpty().withMessage('Password is required')
], authController.login);

// Register route
router.get('/register', guest, (req, res) => {
  res.render('register', { errors: [], values: {} });
});

router.post('/register', guest, [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], authController.register);

// Logout route
router.get('/logout', protect, authController.logout);

// Forgot password route
router.get('/forgot-password', guest, (req, res) => {
  res.render('forgot-password', { errors: [], values: {} });
});

router.post('/forgot-password', guest, [
  body('email').isEmail().withMessage('Please enter a valid email address')
], authController.forgotPassword);

// Verify token route
router.get('/verify-token', guest, (req, res) => {
  res.render('verify-token', { errors: [], email: req.query.email || '' });
});

router.post('/verify-token', guest, [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('token').notEmpty().withMessage('Token is required')
], authController.verifyToken);

// Reset password route
router.get('/reset-password', guest, (req, res) => {
  res.render('reset-password', { 
    errors: [], 
    email: req.query.email || '', 
    token: req.query.token || '' 
  });
});

router.post('/reset-password', guest, [
  body('email').isEmail().withMessage('Please enter a valid email address'),
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], authController.resetPassword);

module.exports = router; 