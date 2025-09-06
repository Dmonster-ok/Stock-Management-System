const { pool } = require('../config/db.config');

class Product {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.category_id = product.category_id;
    this.cost_price = product.cost_price;
    this.selling_price = product.selling_price;
    this.current_stock = product.current_stock;
    this.minimum_stock = product.minimum_stock;
    this.created_at = product.created_at;
  }

  static async create(newProduct) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO products (name, description, category_id, cost_price, selling_price, 
         current_stock, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          newProduct.name,
          newProduct.description || null,
          newProduct.category_id,
          newProduct.cost_price,
          newProduct.selling_price,
          newProduct.current_stock || 0,
          newProduct.minimum_stock || 0
        ]
      );

      const id = result.insertId;
      return { id, ...newProduct };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
      `, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByName(name) {
    try {
      const [rows] = await pool.execute('SELECT * FROM products WHERE name = ?', [name]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(options = {}) {
    try {
      let query = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
      `;
      const values = [];

      // Add WHERE conditions
      const conditions = [];
      
      if (options.category_id) {
        conditions.push('p.category_id = ?');
        values.push(options.category_id);
      }

      if (options.low_stock === 'true') {
        conditions.push('p.current_stock <= p.minimum_stock');
      }

      if (options.search) {
        conditions.push('(p.name LIKE ? OR p.description LIKE ?)');
        values.push(`%${options.search}%`, `%${options.search}%`);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ORDER BY
      query += ' ORDER BY p.name';

      // Add LIMIT if specified
      if (options.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(options.limit));
      }

      const [rows] = await pool.execute(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, product) {
    try {
      let query = 'UPDATE products SET ';
      const values = [];
      const updateFields = [];

      if (product.name) {
        updateFields.push('name = ?');
        values.push(product.name);
      }

      if (product.description !== undefined) {
        updateFields.push('description = ?');
        values.push(product.description);
      }

      if (product.category_id) {
        updateFields.push('category_id = ?');
        values.push(product.category_id);
      }

      if (product.cost_price !== undefined) {
        updateFields.push('cost_price = ?');
        values.push(product.cost_price);
      }

      if (product.selling_price !== undefined) {
        updateFields.push('selling_price = ?');
        values.push(product.selling_price);
      }

      if (product.current_stock !== undefined) {
        updateFields.push('current_stock = ?');
        values.push(product.current_stock);
      }

      if (product.minimum_stock !== undefined) {
        updateFields.push('minimum_stock = ?');
        values.push(product.minimum_stock);
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
      // Check if product has transactions
      const [transactionRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM stock_transactions WHERE product_id = ?', 
        [id]
      );
      
      if (transactionRows[0].count > 0) {
        throw new Error('Cannot delete product with existing stock transactions');
      }

      // Check if product has invoice items
      const [invoiceRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM invoice_items WHERE product_id = ?', 
        [id]
      );
      
      if (invoiceRows[0].count > 0) {
        throw new Error('Cannot delete product with existing sales records');
      }

      const [result] = await pool.execute('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateStock(id, quantity, operation = 'set') {
    try {
      let query;
      let values;

      switch (operation) {
        case 'add':
          query = 'UPDATE products SET current_stock = current_stock + ? WHERE id = ?';
          values = [quantity, id];
          break;
        case 'subtract':
          query = 'UPDATE products SET current_stock = current_stock - ? WHERE id = ? AND current_stock >= ?';
          values = [quantity, id, quantity];
          break;
        case 'set':
        default:
          query = 'UPDATE products SET current_stock = ? WHERE id = ?';
          values = [quantity, id];
          break;
      }

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getLowStockProducts() {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.current_stock <= p.minimum_stock 
        ORDER BY p.current_stock ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getProductsByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.category_id = ? 
        ORDER BY p.name
      `, [categoryId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getStockSummary() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_products,
          SUM(current_stock) as total_stock_units,
          SUM(current_stock * cost_price) as total_stock_value,
          COUNT(CASE WHEN current_stock <= minimum_stock THEN 1 END) as low_stock_count
        FROM products
      `);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;