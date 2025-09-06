const { pool } = require('../config/db.config');

class Supplier {
  constructor(supplier) {
    this.id = supplier.id;
    this.name = supplier.name;
    this.contact_person = supplier.contact_person;
    this.email = supplier.email;
    this.phone = supplier.phone;
  }

  static async create(newSupplier) {
    try {
      const [result] = await pool.execute(
        'INSERT INTO suppliers (name, contact_person, email, phone) VALUES (?, ?, ?, ?)',
        [
          newSupplier.name,
          newSupplier.contact_person || null,
          newSupplier.email || null,
          newSupplier.phone || null
        ]
      );

      const id = result.insertId;
      return { id, ...newSupplier };
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM suppliers WHERE id = ?', [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByName(name) {
    try {
      const [rows] = await pool.execute('SELECT * FROM suppliers WHERE name = ?', [name]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM suppliers WHERE email = ?', [email]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(options = {}) {
    try {
      let query = 'SELECT * FROM suppliers';
      const values = [];

      // Add search functionality
      if (options.search) {
        query += ' WHERE (name LIKE ? OR contact_person LIKE ? OR email LIKE ?)';
        values.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
      }

      // Add ordering
      query += ' ORDER BY name';

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

  static async update(id, supplier) {
    try {
      let query = 'UPDATE suppliers SET ';
      const values = [];
      const updateFields = [];

      if (supplier.name) {
        updateFields.push('name = ?');
        values.push(supplier.name);
      }

      if (supplier.contact_person !== undefined) {
        updateFields.push('contact_person = ?');
        values.push(supplier.contact_person);
      }

      if (supplier.email !== undefined) {
        updateFields.push('email = ?');
        values.push(supplier.email);
      }

      if (supplier.phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(supplier.phone);
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
      // Check if supplier has products
      const [productRows] = await pool.execute(
        'SELECT COUNT(*) as count FROM product_suppliers WHERE supplier_id = ?', 
        [id]
      );
      
      if (productRows[0].count > 0) {
        throw new Error('Cannot delete supplier with linked products');
      }

      const [result] = await pool.execute('DELETE FROM suppliers WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getSupplierProducts(supplierId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          p.*,
          c.name as category_name
        FROM products p
        JOIN product_suppliers ps ON p.id = ps.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ps.supplier_id = ?
        ORDER BY p.name
      `, [supplierId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async linkProductToSupplier(productId, supplierId) {
    try {
      const [result] = await pool.execute(
        'INSERT IGNORE INTO product_suppliers (product_id, supplier_id) VALUES (?, ?)',
        [productId, supplierId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async unlinkProductFromSupplier(productId, supplierId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM product_suppliers WHERE product_id = ? AND supplier_id = ?',
        [productId, supplierId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getProductSuppliers(productId) {
    try {
      const [rows] = await pool.execute(`
        SELECT s.*
        FROM suppliers s
        JOIN product_suppliers ps ON s.id = ps.supplier_id
        WHERE ps.product_id = ?
        ORDER BY s.name
      `, [productId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getSupplierStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          COUNT(*) as total_suppliers,
          COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as suppliers_with_email,
          COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as suppliers_with_phone
        FROM suppliers
      `);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Supplier;