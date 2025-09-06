const { pool } = require('../config/db.config');

class Product {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.sku = product.sku;
    this.barcode = product.barcode;
    this.description = product.description;
    this.category_id = product.category_id;
    this.unit_type_id = product.unit_type_id;
    this.cost_price = product.cost_price;
    this.selling_price = product.selling_price;
    this.current_stock = product.current_stock;
    this.minimum_stock = product.minimum_stock;
    this.maximum_stock = product.maximum_stock;
    this.reorder_point = product.reorder_point;
    this.has_batches = product.has_batches;
    this.has_expiry = product.has_expiry;
    this.shelf_life_days = product.shelf_life_days;
    this.is_active = product.is_active;
    this.created_at = product.created_at;
    this.updated_at = product.updated_at;
  }

  static async create(newProduct) {
    try {
      const [result] = await pool.execute(
        `INSERT INTO products (name, sku, barcode, description, category_id, unit_type_id, 
         cost_price, selling_price, current_stock, minimum_stock, maximum_stock, 
         reorder_point, has_batches, has_expiry, shelf_life_days, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newProduct.name,
          newProduct.sku,
          newProduct.barcode || null,
          newProduct.description || null,
          newProduct.category_id,
          newProduct.unit_type_id || null,
          newProduct.cost_price,
          newProduct.selling_price,
          newProduct.current_stock || 0,
          newProduct.minimum_stock || 0,
          newProduct.maximum_stock || null,
          newProduct.reorder_point || null,
          newProduct.has_batches || false,
          newProduct.has_expiry || false,
          newProduct.shelf_life_days || null,
          newProduct.is_active !== undefined ? newProduct.is_active : true
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
        SELECT p.*, c.name as category_name, ut.name as unit_name, ut.abbreviation as unit_abbr
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
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
        SELECT p.*, c.name as category_name, ut.name as unit_name, ut.abbreviation as unit_abbr
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
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
        conditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)');
        values.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
      }

      if (options.is_active !== undefined) {
        conditions.push('p.is_active = ?');
        values.push(options.is_active);
      } else {
        // Default to active products only
        conditions.push('p.is_active = true');
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
        WHERE is_active = true
      `);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async findBySku(sku) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, c.name as category_name, ut.name as unit_name, ut.abbreviation as unit_abbr
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
        WHERE p.sku = ?
      `, [sku]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByBarcode(barcode) {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, c.name as category_name, ut.name as unit_name, ut.abbreviation as unit_abbr
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
        WHERE p.barcode = ?
      `, [barcode]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getExpiredBatches() {
    try {
      const [rows] = await pool.execute(`
        SELECT p.*, pb.*, c.name as category_name
        FROM products p
        JOIN product_batches pb ON p.id = pb.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE pb.expiry_date < CURDATE() AND pb.available_quantity > 0
        ORDER BY pb.expiry_date ASC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getProductsWithSuppliers(productId = null) {
    try {
      let query = `
        SELECT p.*, c.name as category_name, ut.name as unit_name, ut.abbreviation as unit_abbr,
               ps.supplier_id, s.name as supplier_name, ps.supplier_price, ps.is_preferred
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
        LEFT JOIN product_suppliers ps ON p.id = ps.product_id AND ps.is_active = true
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        WHERE p.is_active = true
      `;
      
      const values = [];
      if (productId) {
        query += ' AND p.id = ?';
        values.push(productId);
      }
      
      query += ' ORDER BY p.name, ps.is_preferred DESC';
      
      const [rows] = await pool.execute(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;