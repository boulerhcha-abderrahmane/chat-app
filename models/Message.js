const { pool } = require('../config/database');

class Message {
  // Create a new message
  static async create(messageData) {
    try {
      const { sender_id, receiver_id, content, message_type, file_url } = messageData;
      
      const [result] = await pool.query(
        'INSERT INTO messages (sender_id, receiver_id, content, message_type, file_url) VALUES (?, ?, ?, ?, ?)',
        [sender_id, receiver_id, content, message_type || 'text', file_url || null]
      );
      
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  // Find message by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM messages WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding message by ID:', error);
      throw error;
    }
  }

  // Get conversation between two users
  static async getConversation(user1Id, user2Id, limit = 50) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, 
        u1.username as sender_username, u1.avatar as sender_avatar,
        u2.username as receiver_username, u2.avatar as receiver_avatar
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.id
        JOIN users u2 ON m.receiver_id = u2.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
        LIMIT ?`,
        [user1Id, user2Id, user2Id, user1Id, limit]
      );
      return rows;
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Mark messages as read
  static async markAsRead(senderId, receiverId) {
    try {
      await pool.query(
        'UPDATE messages SET is_read = true WHERE sender_id = ? AND receiver_id = ? AND is_read = false',
        [senderId, receiverId]
      );
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Count unread messages
  static async countUnread(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT sender_id, COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = false GROUP BY sender_id',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error counting unread messages:', error);
      throw error;
    }
  }

  // Get latest messages for user (one message per conversation)
  static async getLatestMessages(userId) {
    try {
      const [rows] = await pool.query(
        `SELECT m.*, u.username, u.avatar, u.is_online
        FROM messages m
        JOIN users u ON (m.sender_id = u.id OR m.receiver_id = u.id) AND u.id != ?
        WHERE m.id IN (
          SELECT MAX(id) FROM messages
          WHERE sender_id = ? OR receiver_id = ?
          GROUP BY 
            CASE 
              WHEN sender_id = ? THEN receiver_id
              ELSE sender_id
            END
        )
        ORDER BY m.created_at DESC`,
        [userId, userId, userId, userId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting latest messages:', error);
      throw error;
    }
  }
}

module.exports = Message; 