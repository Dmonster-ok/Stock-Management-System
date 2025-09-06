const { pool } = require('../config/db.config');

class ProductBatch {
  constructor(batch) {
    this.id = batch.id;
    this.product_id = batch.product_id;
    this.batch_number = batch.batch_number;
    this.quantity = batch.quantity;
    this.available_quantity = batch.available_quantity;
    this.cost_price = batch.cost_price;
    this.manufacture_date = batch.manufacture_date;
    this.expiry_date = batch.expiry_date;
    this.supplier_id = batch.supplier_id;
    this.notes = batch.notes;
    this.is_active = batch.is_active;
    this.created_at = batch.created_at;
    this.updated_at = batch.updated_at;
  }

  static async create(newBatch) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO product_batches 
         (product_id, batch_number, quantity, available_quantity, cost_price, 
          manufacture_date, expiry_date, supplier_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newBatch.product_id,
          newBatch.batch_number,
          newBatch.quantity,
          newBatch.available_quantity || newBatch.quantity,
          newBatch.cost_price,
          newBatch.manufacture_date,
          newBatch.expiry_date,
          newBatch.supplier_id,
          newBatch.notes
        ]
      );

      const id = result.insertId;
      return { id, ...newBatch };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT pb.*, p.name as product_name, s.name as supplier_name 
         FROM product_batches pb
         LEFT JOIN products p ON pb.product_id = p.id
         LEFT JOIN suppliers s ON pb.supplier_id = s.id
         WHERE pb.id = ?`, 
        [id]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getByProductId(productId) {
    try {
      const [rows] = await pool.execute(
        `SELECT pb.*, s.name as supplier_name 
         FROM product_batches pb
         LEFT JOIN suppliers s ON pb.supplier_id = s.id
         WHERE pb.product_id = ? AND pb.is_active = true
         ORDER BY pb.expiry_date ASC`, 
        [productId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getExpiringSoon(days = 30) {
    try {
      const [rows] = await pool.execute(
        `SELECT pb.*, p.name as product_name, p.sku as product_sku
         FROM product_batches pb
         JOIN products p ON pb.product_id = p.id
         WHERE pb.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY) 
         AND pb.available_quantity > 0 
         AND pb.is_active = true
         ORDER BY pb.expiry_date ASC`, 
        [days]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    try {
      const [rows] = await pool.execute(
        `SELECT pb.*, p.name as product_name, p.sku as product_sku, s.name as supplier_name
         FROM product_batches pb
         JOIN products p ON pb.product_id = p.id
         LEFT JOIN suppliers s ON pb.supplier_id = s.id
         WHERE pb.is_active = true
         ORDER BY pb.created_at DESC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, batch) {
    try {
      let query = 'UPDATE product_batches SET ';
      const values = [];
      const updateFields = [];

      if (batch.batch_number) {
        updateFields.push('batch_number = ?');
        values.push(batch.batch_number);
      }

      if (batch.quantity !== undefined) {
        updateFields.push('quantity = ?');
        values.push(batch.quantity);
      }

      if (batch.available_quantity !== undefined) {
        updateFields.push('available_quantity = ?');
        values.push(batch.available_quantity);
      }

      if (batch.cost_price !== undefined) {
        updateFields.push('cost_price = ?');
        values.push(batch.cost_price);
      }

      if (batch.manufacture_date) {
        updateFields.push('manufacture_date = ?');
        values.push(batch.manufacture_date);
      }

      if (batch.expiry_date) {
        updateFields.push('expiry_date = ?');
        values.push(batch.expiry_date);
      }

      if (batch.supplier_id !== undefined) {
        updateFields.push('supplier_id = ?');
        values.push(batch.supplier_id);
      }

      if (batch.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(batch.notes);
      }

      if (batch.is_active !== undefined) {
        updateFields.push('is_active = ?');
        values.push(batch.is_active);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
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
      const [result] = await pool.execute('DELETE FROM product_batches WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async updateQuantity(id, newQuantity) {
    try {
      const [result] = await pool.execute(
        'UPDATE product_batches SET available_quantity = ?, updated_at = NOW() WHERE id = ?',
        [newQuantity, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async findByBatchNumber(productId, batchNumber) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM product_batches WHERE product_id = ? AND batch_number = ?',
        [productId, batchNumber]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductBatch;