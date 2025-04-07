const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const User = require('../models/User');
const Message = require('../models/Message');
const BlockedUser = require('../models/BlockedUser');
require('dotenv').config();

// Setup Socket.IO
const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      credentials: true
    }
  });

  // Store online users
  const onlineUsers = {};

  // Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      // Get token from cookies
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Connection event
  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    
    // Store socket ID for this user
    onlineUsers[userId] = socket.id;
    
    // Update user status to online
    await User.updateOnlineStatus(userId, true);
    
    // Broadcast user online status to all clients
    io.emit('user_status', { userId, isOnline: true });
    
    console.log(`User connected: ${socket.user.username} (${userId})`);

    // Send message event
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content, messageType = 'text', fileUrl = null } = data;
        
        // Check if sender has blocked receiver
        const isBlocked = await BlockedUser.isBlocked(userId, receiverId);
        if (isBlocked) {
          return socket.emit('error', { message: 'You have blocked this user' });
        }
        
        // Check if receiver has blocked sender
        const isBlockedByReceiver = await BlockedUser.isBlocked(receiverId, userId);
        if (isBlockedByReceiver) {
          return socket.emit('error', { message: 'You have been blocked by this user' });
        }
        
        // Create message
        const message = await Message.create({
          sender_id: userId,
          receiver_id: receiverId,
          content,
          message_type: messageType,
          file_url: fileUrl
        });
        
        // Get complete message with user info
        const fullMessage = {
          ...message,
          sender_username: socket.user.username,
          sender_avatar: socket.user.avatar
        };
        
        // Send to sender
        socket.emit('receive_message', fullMessage);
        
        // Send to receiver if online
        const receiverSocketId = onlineUsers[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', fullMessage);
        }
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read event
    socket.on('mark_read', async (data) => {
      try {
        const { senderId } = data;
        
        // Mark messages as read
        await Message.markAsRead(senderId, userId);
        
        // Notify sender if online
        const senderSocketId = onlineUsers[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read', { receiverId: userId });
        }
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Block user event
    socket.on('block_user', async (data) => {
      try {
        const { blockedId } = data;
        
        // Block user
        await BlockedUser.blockUser(userId, blockedId);
        
        // Notify client
        socket.emit('user_blocked', { blockedId });
      } catch (error) {
        console.error('Block user error:', error);
        socket.emit('error', { message: 'Failed to block user' });
      }
    });

    // Unblock user event
    socket.on('unblock_user', async (data) => {
      try {
        const { blockedId } = data;
        
        // Unblock user
        await BlockedUser.unblockUser(userId, blockedId);
        
        // Notify client
        socket.emit('user_unblocked', { blockedId });
      } catch (error) {
        console.error('Unblock user error:', error);
        socket.emit('error', { message: 'Failed to unblock user' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers[receiverId];
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId });
      }
    });

    socket.on('stop_typing', (data) => {
      const { receiverId } = data;
      const receiverSocketId = onlineUsers[receiverId];
      
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_stop_typing', { userId });
      }
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${userId})`);
      
      // Remove socket ID
      delete onlineUsers[userId];
      
      // Update user status to offline
      await User.updateOnlineStatus(userId, false);
      
      // Broadcast user offline status to all clients
      io.emit('user_status', { userId, isOnline: false });
    });
  });

  return io;
};

module.exports = setupSocket; 