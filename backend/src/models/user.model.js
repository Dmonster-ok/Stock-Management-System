const { pool } = require('../config/db.config');
const bcrypt = require('bcrypt');

class User {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.password = user.password;
    this.role = user.role;
    this.created_at = user.created_at;
    this.updated_at = user.updated_at;
  }

  static async create(newUser) {
    try {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newUser.password, salt);

      const [result] = await pool.execute(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [newUser.username, hashedPassword, newUser.role || 'Staff']
      );

      const id = result.insertId;
      return { id, ...newUser, password: undefined };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      if (rows.length) {
        const user = rows[0];
        user.password = undefined; // Don't return password
        return user;
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    // Since email field doesn't exist, this method should be removed or redirect to findByUsername
    return null;
  }

  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.execute('SELECT id, username, role, created_at FROM users');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, user) {
    try {
      let query = 'UPDATE users SET ';
      const values = [];
      const updateFields = [];

      if (user.username) {
        updateFields.push('username = ?');
        values.push(user.username);
      }

      if (user.email) {
        updateFields.push('email = ?');
        values.push(user.email);
      }

      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        updateFields.push('password = ?');
        values.push(hashedPassword);
      }

      if (user.role) {
        updateFields.push('role = ?');
        values.push(user.role);
      }

      updateFields.push('updated_at = NOW()');

      query += updateFields.join(', ');
      query += ' WHERE id = ?';
      values.push(id);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;