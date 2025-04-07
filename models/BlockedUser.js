const { pool } = require('../config/database');

class BlockedUser {
  // Block a user
  static async blockUser(blockerId, blockedId) {
    try {
      await pool.query(
        'INSERT INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
        [blockerId, blockedId]
      );
      return true;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        // User already blocked
        return true;
      }
      console.error('Error blocking user:', error);
      throw error;
    }
  }

  // Unblock a user
  static async unblockUser(blockerId, blockedId) {
    try {
      await pool.query(
        'DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
        [blockerId, blockedId]
      );
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  }

  // Check if a user is blocked
  static async isBlocked(blockerId, blockedId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?',
        [blockerId, blockedId]
      );
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      throw error;
    }
  }

  // Get all users blocked by a user
  static async getBlockedUsers(blockerId) {
    try {
      const [rows] = await pool.query(
        `SELECT bu.*, u.username, u.email, u.avatar, u.is_online
        FROM blocked_users bu
        JOIN users u ON bu.blocked_id = u.id
        WHERE bu.blocker_id = ?`,
        [blockerId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting blocked users:', error);
      throw error;
    }
  }
}

module.exports = BlockedUser; 