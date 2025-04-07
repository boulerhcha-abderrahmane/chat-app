const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Main chat page
router.get('/', protect, chatController.getChatPage);

// Get conversation with specific contact
router.get('/:contactId', protect, chatController.getConversation);

// Send message (HTTP fallback)
router.post('/:contactId/message', protect, chatController.sendMessage);

// Upload file
router.post('/:contactId/upload', protect, upload.single('file'), chatController.uploadFile);

// Block user
router.post('/:contactId/block', protect, chatController.blockUser);

// Unblock user
router.post('/:contactId/unblock', protect, chatController.unblockUser);

module.exports = router; 