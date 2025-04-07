const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

// Home route
router.get('/', (req, res) => {
  res.redirect('/chat');
});

// Export all routes
module.exports = router; 