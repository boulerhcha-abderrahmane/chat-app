const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Find user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, email, avatar, is_online, last_seen FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      return rows[0];
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  }

  // Create a new user
  static async create(userData) {
    try {
      const { username, email, password } = userData;
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const [result] = await pool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );
      
      const newUser = await this.findById(result.insertId);
      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user's online status
  static async updateOnlineStatus(userId, isOnline) {
    try {
      await pool.query(
        'UPDATE users SET is_online = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
        [isOnline, userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating user online status:', error);
      throw error;
    }
  }

  // Get all users except the current user
  static async getAllExcept(userId) {
    try {
      const [rows] = await pool.query(
        'SELECT id, username, email, avatar, is_online, last_seen FROM users WHERE id != ?',
        [userId]
      );
      return rows;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user profile
  static async updateProfile(userId, updates) {
    try {
      const { username, email, avatar } = updates;
      const query = 'UPDATE users SET username = ?, email = ?, avatar = ? WHERE id = ?';
      await pool.query(query, [username, email, avatar, userId]);
      return await this.findById(userId);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
}

module.exports = User; 