const { pool } = require('../config/db.config');

class Category {
  constructor(category) {
    this.id = category.id;
    this.name = category.name;
    this.description = category.description;
  }

  static async create(newCategory) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO categories (name, description) VALUES (?, ?)',
        [newCategory.name, newCategory.description || null]
      );

      const id = result.insertId;
      return { id, ...newCategory };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM categories WHERE id = ?', [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByName(name) {
    try {
      const [rows] = await pool.execute('SELECT * FROM categories WHERE name = ?', [name]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM categories ORDER BY name');
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, category) {
    try {
      let query = 'UPDATE categories SET ';
      const values = [];
      const updateFields = [];

      if (category.name) {
        updateFields.push('name = ?');
        values.push(category.name);
      }

      if (category.description !== undefined) {
        updateFields.push('description = ?');
        values.push(category.description);
      }

      if (updateFields.length === 0) {
        return false;
      }

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
      // Check if category has products
      const [productRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?', 
        [id]
      );
      
      if (productRows[0].count > 0) {
        throw new Error('Cannot delete category with existing products');
      }

      const [result] = await pool.execute('DELETE FROM categories WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getWithProductCount() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          c.id, 
          c.name, 
          c.description,
          COUNT(p.id) as product_count
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id 
        GROUP BY c.id, c.name, c.description 
        ORDER BY c.name
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Category;