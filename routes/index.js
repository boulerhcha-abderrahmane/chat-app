const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

// Home route
router.get('/', (req, res) => {
  res.redirect('/chat');
});

// Route to handle default avatar PNG requests
router.get('/uploads/default-avatar.png', (req, res) => {
  res.redirect('/img/default-avatar.svg');
});

// Export all routes
module.exports = router; 