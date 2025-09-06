const { pool } = require('../config/db.config');

class StockTransaction {
  constructor(transaction) {
    this.id = transaction.id;
    this.product_id = transaction.product_id;
    this.transaction_type = transaction.transaction_type;
    this.quantity = transaction.quantity;
    this.reference_id = transaction.reference_id;
    this.created_by = transaction.created_by;
    this.created_at = transaction.created_at;
  }

  static async create(newTransaction) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO stock_transactions (product_id, transaction_type, quantity, reference_id, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          newTransaction.product_id,
          newTransaction.transaction_type,
          newTransaction.quantity,
          newTransaction.reference_id || null,
          newTransaction.created_by
        ]
      );

      const id = result.insertId;
      return { id, ...newTransaction };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          st.*,
          p.name as product_name,
          u.username as created_by_name
        FROM stock_transactions st
        LEFT JOIN products p ON st.product_id = p.id
        LEFT JOIN users u ON st.created_by = u.id
        WHERE st.id = ?
      `, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(options = {}) {
    try {
      let query = `
        SELECT 
          st.*,
          p.name as product_name,
          u.username as created_by_name
        FROM stock_transactions st
        LEFT JOIN products p ON st.product_id = p.id
        LEFT JOIN users u ON st.created_by = u.id
      `;
      const values = [];
      const conditions = [];

      // Filter by product
      if (options.product_id) {
        conditions.push('st.product_id = ?');
        values.push(options.product_id);
      }

      // Filter by transaction type
      if (options.transaction_type) {
        conditions.push('st.transaction_type = ?');
        values.push(options.transaction_type);
      }

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(st.created_at) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(st.created_at) <= ?');
        values.push(options.date_to);
      }

      // Filter by user
      if (options.created_by) {
        conditions.push('st.created_by = ?');
        values.push(options.created_by);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ordering
      query += ' ORDER BY st.created_at DESC';

      // Add limit if specified
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

  static async getByProduct(productId, options = {}) {
    try {
      let query = `
        SELECT 
          st.*,
          p.name as product_name,
          u.username as created_by_name
        FROM stock_transactions st
        LEFT JOIN products p ON st.product_id = p.id
        LEFT JOIN users u ON st.created_by = u.id
        WHERE st.product_id = ?
      `;
      const values = [productId];

      // Filter by transaction type
      if (options.transaction_type) {
        query += ' AND st.transaction_type = ?';
        values.push(options.transaction_type);
      }

      // Add ordering
      query += ' ORDER BY st.created_at DESC';

      // Add limit if specified
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

  static async recordStockIn(productId, quantity, userId, referenceId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Create transaction record
      const [result] = await connection.execute(
        `INSERT INTO stock_transactions (product_id, transaction_type, quantity, reference_id, created_by) 
         VALUES (?, 'In', ?, ?, ?)`,
        [productId, quantity, referenceId, userId]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
        [quantity, productId]
      );

      await connection.commit();
      return { id: result.insertId, product_id: productId, transaction_type: 'In', quantity, reference_id: referenceId, created_by: userId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async recordStockOut(productId, quantity, userId, referenceId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if sufficient stock exists
      const [productRows] = await connection.execute(
        'SELECT current_stock FROM products WHERE id = ?',
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error('Product not found');
      }

      const currentStock = productRows[0].current_stock;
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }

      // Create transaction record
      const [result] = await connection.execute(
        `INSERT INTO stock_transactions (product_id, transaction_type, quantity, reference_id, created_by) 
         VALUES (?, 'Out', ?, ?, ?)`,
        [productId, quantity, referenceId, userId]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
        [quantity, productId]
      );

      await connection.commit();
      return { id: result.insertId, product_id: productId, transaction_type: 'Out', quantity, reference_id: referenceId, created_by: userId };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async recordStockAdjustment(productId, newQuantity, userId, referenceId = null) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get current stock
      const [productRows] = await connection.execute(
        'SELECT current_stock FROM products WHERE id = ?',
        [productId]
      );

      if (productRows.length === 0) {
        throw new Error('Product not found');
      }

      const currentStock = productRows[0].current_stock;
      const adjustmentQuantity = newQuantity - currentStock;

      // Create transaction record
      const [result] = await connection.execute(
        `INSERT INTO stock_transactions (product_id, transaction_type, quantity, reference_id, created_by) 
         VALUES (?, 'Adjustment', ?, ?, ?)`,
        [productId, adjustmentQuantity, referenceId, userId]
      );

      // Update product stock
      await connection.execute(
        'UPDATE products SET current_stock = ? WHERE id = ?',
        [newQuantity, productId]
      );

      await connection.commit();
      return { 
        id: result.insertId, 
        product_id: productId, 
        transaction_type: 'Adjustment', 
        quantity: adjustmentQuantity,
        previous_stock: currentStock,
        new_stock: newQuantity,
        reference_id: referenceId, 
        created_by: userId 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async getStockMovementSummary(options = {}) {
    try {
      let query = `
        SELECT 
          transaction_type,
          COUNT(*) as transaction_count,
          SUM(quantity) as total_quantity,
          DATE(created_at) as date
        FROM stock_transactions
      `;
      const values = [];
      const conditions = [];

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(created_at) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(created_at) <= ?');
        values.push(options.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY transaction_type, DATE(created_at) ORDER BY date DESC, transaction_type';

      const [rows] = await pool.execute(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getTransactionStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN transaction_type = 'In' THEN 1 END) as stock_in_count,
          COUNT(CASE WHEN transaction_type = 'Out' THEN 1 END) as stock_out_count,
          COUNT(CASE WHEN transaction_type = 'Adjustment' THEN 1 END) as adjustment_count,
          SUM(CASE WHEN transaction_type = 'In' THEN quantity ELSE 0 END) as total_stock_in,
          SUM(CASE WHEN transaction_type = 'Out' THEN quantity ELSE 0 END) as total_stock_out
        FROM stock_transactions
      `);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = StockTransaction;