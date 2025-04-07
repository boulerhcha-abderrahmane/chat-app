const User = require('../models/User');
const Message = require('../models/Message');
const BlockedUser = require('../models/BlockedUser');

// Get chat page
const getChatPage = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all users except current user
    const users = await User.getAllExcept(userId);
    
    // Get blocked users
    const blockedUsers = await BlockedUser.getBlockedUsers(userId);
    const blockedIds = blockedUsers.map(user => user.blocked_id);
    
    // Get unread messages count for each contact
    const unreadCounts = await Message.countUnread(userId);
    const unreadByUser = {};
    unreadCounts.forEach(count => {
      unreadByUser[count.sender_id] = count.count;
    });
    
    // Add unread count and blocked status to each user
    const contacts = users.map(user => ({
      ...user,
      unreadCount: unreadByUser[user.id] || 0,
      isBlocked: blockedIds.includes(user.id)
    }));

    res.render('chat', {
      user: req.user,
      contacts,
      selectedContact: null,
      messages: []
    });
  } catch (error) {
    console.error('Get chat page error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Get conversation
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const contactId = parseInt(req.params.contactId);
    
    // Get all users except current user
    const users = await User.getAllExcept(userId);
    
    // Get blocked users
    const blockedUsers = await BlockedUser.getBlockedUsers(userId);
    const blockedIds = blockedUsers.map(user => user.blocked_id);
    
    // Get unread messages count for each contact
    const unreadCounts = await Message.countUnread(userId);
    const unreadByUser = {};
    unreadCounts.forEach(count => {
      unreadByUser[count.sender_id] = count.count;
    });
    
    // Add unread count and blocked status to each user
    const contacts = users.map(user => ({
      ...user,
      unreadCount: unreadByUser[user.id] || 0,
      isBlocked: blockedIds.includes(user.id)
    }));
    
    // Get selected contact
    const selectedContact = users.find(user => user.id === contactId);
    
    if (!selectedContact) {
      return res.redirect('/chat');
    }
    
    // Get conversation
    const messages = await Message.getConversation(userId, contactId);
    
    // Mark messages as read
    await Message.markAsRead(contactId, userId);
    
    // Check if contact is blocked
    const isBlocked = await BlockedUser.isBlocked(userId, contactId);
    selectedContact.isBlocked = isBlocked;
    
    res.render('chat', {
      user: req.user,
      contacts,
      selectedContact,
      messages
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Send message via HTTP (fallback for Socket.IO)
const sendMessage = async (req, res) => {
  try {
    const { contactId, content } = req.body;
    const senderId = req.user.id;
    
    // Check if sender has blocked receiver
    const isBlocked = await BlockedUser.isBlocked(senderId, contactId);
    if (isBlocked) {
      return res.status(403).json({ error: 'You have blocked this user' });
    }
    
    // Check if receiver has blocked sender
    const isBlockedByReceiver = await BlockedUser.isBlocked(contactId, senderId);
    if (isBlockedByReceiver) {
      return res.status(403).json({ error: 'You have been blocked by this user' });
    }
    
    // Create message
    const message = await Message.create({
      sender_id: senderId,
      receiver_id: contactId,
      content
    });
    
    // In a real app, you would emit this via Socket.IO
    // For HTTP fallback, redirect back to conversation
    res.redirect(`/chat/${contactId}`);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload file
const uploadFile = async (req, res) => {
  try {
    const contactId = req.params.contactId;
    const senderId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Get file path relative to public folder
    const filePath = `/uploads/${req.file.filename}`;
    
    // Create message with file
    const message = await Message.create({
      sender_id: senderId,
      receiver_id: contactId,
      content: req.file.originalname,
      message_type: 'file',
      file_url: filePath
    });
    
    // In a real app, you would emit this via Socket.IO
    // For HTTP fallback, redirect back to conversation
    res.redirect(`/chat/${contactId}`);
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Block user
const blockUser = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;
    
    await BlockedUser.blockUser(userId, contactId);
    
    res.redirect(`/chat/${contactId}`);
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

// Unblock user
const unblockUser = async (req, res) => {
  try {
    const { contactId } = req.params;
    const userId = req.user.id;
    
    await BlockedUser.unblockUser(userId, contactId);
    
    res.redirect(`/chat/${contactId}`);
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).render('error', { 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
};

module.exports = {
  getChatPage,
  getConversation,
  sendMessage,
  uploadFile,
  blockUser,
  unblockUser
}; 