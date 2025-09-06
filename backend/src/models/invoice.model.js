const { pool } = require('../config/db.config');

class Invoice {
  constructor(invoice) {
    this.id = invoice.id;
    this.invoice_number = invoice.invoice_number;
    this.customer_name = invoice.customer_name;
    this.invoice_date = invoice.invoice_date;
    this.total_amount = invoice.total_amount;
    this.payment_status = invoice.payment_status;
    this.created_by = invoice.created_by;
    this.created_at = invoice.created_at;
  }

  static async create(newInvoice, items) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Generate invoice number if not provided
      let invoiceNumber = newInvoice.invoice_number;
      if (!invoiceNumber) {
        const [result] = await connection.execute(
          'SELECT COUNT(*) as count FROM invoices WHERE DATE(created_at) = CURDATE()'
        );
        const todayCount = result[0].count + 1;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        invoiceNumber = `INV-${today}-${todayCount.toString().padStart(3, '0')}`;
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }

      // Create invoice
      const [invoiceResult] = await connection.execute(
        `INSERT INTO invoices (invoice_number, customer_name, invoice_date, total_amount, payment_status, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          invoiceNumber,
          newInvoice.customer_name,
          newInvoice.invoice_date || new Date().toISOString().slice(0, 10),
          totalAmount,
          newInvoice.payment_status || 'Unpaid',
          newInvoice.created_by
        ]
      );

      const invoiceId = invoiceResult.insertId;

      // Create invoice items and update stock
      for (const item of items) {
        // Check if product exists and has sufficient stock
        const [productRows] = await connection.execute(
          'SELECT current_stock FROM products WHERE id = ?',
          [item.product_id]
        );

        if (productRows.length === 0) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const currentStock = productRows[0].current_stock;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ID ${item.product_id}. Available: ${currentStock}, Requested: ${item.quantity}`);
        }

        // Create invoice item
        const totalPrice = item.quantity * item.unit_price;
        await connection.execute(
          `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [invoiceId, item.product_id, item.quantity, item.unit_price, totalPrice]
        );

        // Update product stock
        await connection.execute(
          'UPDATE products SET current_stock = current_stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );

        // Record stock transaction
        await connection.execute(
          `INSERT INTO stock_transactions (product_id, transaction_type, quantity, reference_id, created_by) 
           VALUES (?, 'Out', ?, ?, ?)`,
          [item.product_id, item.quantity, invoiceNumber, newInvoice.created_by]
        );
      }

      await connection.commit();
      return { 
        id: invoiceId, 
        invoice_number: invoiceNumber,
        total_amount: totalAmount,
        ...newInvoice 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          i.*,
          u.username as created_by_name
        FROM invoices i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.id = ?
      `, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async findByInvoiceNumber(invoiceNumber) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          i.*,
          u.username as created_by_name
        FROM invoices i
        LEFT JOIN users u ON i.created_by = u.id
        WHERE i.invoice_number = ?
      `, [invoiceNumber]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  static async getAll(options = {}) {
    try {
      let query = `
        SELECT 
          i.*,
          u.username as created_by_name
        FROM invoices i
        LEFT JOIN users u ON i.created_by = u.id
      `;
      const values = [];
      const conditions = [];

      // Filter by payment status
      if (options.payment_status) {
        conditions.push('i.payment_status = ?');
        values.push(options.payment_status);
      }

      // Filter by customer name
      if (options.customer_name) {
        conditions.push('i.customer_name LIKE ?');
        values.push(`%${options.customer_name}%`);
      }

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(i.invoice_date) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(i.invoice_date) <= ?');
        values.push(options.date_to);
      }

      // Filter by user
      if (options.created_by) {
        conditions.push('i.created_by = ?');
        values.push(options.created_by);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ordering
      query += ' ORDER BY i.created_at DESC';

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

  static async getInvoiceItems(invoiceId) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          ii.*,
          p.name as product_name,
          p.category_id,
          c.name as category_name
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE ii.invoice_id = ?
        ORDER BY ii.id
      `, [invoiceId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getInvoiceWithItems(invoiceId) {
    try {
      const invoice = await this.findById(invoiceId);
      if (!invoice) {
        return null;
      }

      const items = await this.getInvoiceItems(invoiceId);
      return {
        ...invoice,
        items
      };
    } catch (error) {
      throw error;
    }
  }

  static async updatePaymentStatus(id, paymentStatus, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE invoices SET payment_status = ? WHERE id = ?',
        [paymentStatus, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  static async getSalesStats(options = {}) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_invoices,
          SUM(total_amount) as total_sales,
          SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN payment_status = 'Unpaid' THEN total_amount ELSE 0 END) as unpaid_amount,
          COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) as paid_invoices,
          COUNT(CASE WHEN payment_status = 'Unpaid' THEN 1 END) as unpaid_invoices,
          AVG(total_amount) as average_invoice_amount
        FROM invoices
      `;
      const values = [];
      const conditions = [];

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(invoice_date) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(invoice_date) <= ?');
        values.push(options.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const [rows] = await pool.execute(query, values);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getDailySales(options = {}) {
    try {
      let query = `
        SELECT 
          DATE(invoice_date) as date,
          COUNT(*) as invoice_count,
          SUM(total_amount) as daily_sales,
          SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END) as paid_sales
        FROM invoices
      `;
      const values = [];
      const conditions = [];

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(invoice_date) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(invoice_date) <= ?');
        values.push(options.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' GROUP BY DATE(invoice_date) ORDER BY date DESC';

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

  static async getTopSellingProducts(options = {}) {
    try {
      let query = `
        SELECT 
          p.id,
          p.name as product_name,
          c.name as category_name,
          SUM(ii.quantity) as total_quantity_sold,
          SUM(ii.total_price) as total_revenue,
          COUNT(DISTINCT ii.invoice_id) as times_sold,
          AVG(ii.unit_price) as average_selling_price
        FROM invoice_items ii
        JOIN products p ON ii.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        JOIN invoices i ON ii.invoice_id = i.id
      `;
      const values = [];
      const conditions = [];

      // Filter by date range
      if (options.date_from) {
        conditions.push('DATE(i.invoice_date) >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('DATE(i.invoice_date) <= ?');
        values.push(options.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` 
        GROUP BY p.id, p.name, c.name 
        ORDER BY total_quantity_sold DESC
      `;

      // Add limit if specified
      if (options.limit) {
        query += ' LIMIT ?';
        values.push(parseInt(options.limit || 10));
      }

      const [rows] = await pool.execute(query, values);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Invoice;