const { pool } = require('../config/db.config');

class PurchaseOrder {
  constructor(purchaseOrder) {
    this.id = purchaseOrder.id;
    this.po_number = purchaseOrder.po_number;
    this.supplier_id = purchaseOrder.supplier_id;
    this.order_date = purchaseOrder.order_date;
    this.expected_delivery_date = purchaseOrder.expected_delivery_date;
    this.status = purchaseOrder.status;
    this.total_amount = purchaseOrder.total_amount;
    this.notes = purchaseOrder.notes;
    this.created_by = purchaseOrder.created_by;
    this.created_at = purchaseOrder.created_at;
    this.updated_at = purchaseOrder.updated_at;
  }

  // Generate PO number
  static async generatePONumber() {
    try {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      // Get the count of POs for today
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM purchase_orders WHERE DATE(created_at) = CURDATE()'
      );
      
      const dailyCount = rows[0].count + 1;
      const poNumber = `PO-${year}${month}${day}-${String(dailyCount).padStart(3, '0')}`;
      
      return poNumber;
    } catch (error) {
      throw error;
    }
  }

  // Create new purchase order with items
  static async create(newPO, items) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate PO number
      const poNumber = await this.generatePONumber();
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.unit_cost;
      }

      // Create purchase order
      const [result] = await connection.execute(
        `INSERT INTO purchase_orders (po_number, supplier_id, order_date, expected_delivery_date, 
         status, total_amount, notes, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          poNumber,
          newPO.supplier_id,
          newPO.order_date,
          newPO.expected_delivery_date || null,
          newPO.status || 'Draft',
          totalAmount,
          newPO.notes || null,
          newPO.created_by
        ]
      );

      const poId = result.insertId;

      // Create purchase order items
      for (const item of items) {
        const totalCost = item.quantity * item.unit_cost;
        await connection.execute(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, 
           unit_cost, total_cost, notes) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [poId, item.product_id, item.quantity, item.unit_cost, totalCost, item.notes || null]
        );
      }

      await connection.commit();
      return { 
        id: poId, 
        po_number: poNumber,
        total_amount: totalAmount,
        ...newPO 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Find purchase order by ID with full details
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          po.*,
          s.name as supplier_name,
          s.contact_person,
          s.email as supplier_email,
          s.phone as supplier_phone,
          u.username as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
        WHERE po.id = ?
      `, [id]);
      
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Find purchase order by PO number
  static async findByPONumber(poNumber) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM purchase_orders WHERE po_number = ?', 
        [poNumber]
      );
      return rows.length ? rows[0] : null;
    } catch (error) {
      throw error;
    }
  }

  // Get all purchase orders with filtering
  static async getAll(options = {}) {
    try {
      let query = `
        SELECT 
          po.*,
          s.name as supplier_name,
          u.username as created_by_name
        FROM purchase_orders po
        LEFT JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN users u ON po.created_by = u.id
      `;
      const values = [];
      const conditions = [];

      // Add WHERE conditions
      if (options.supplier_id) {
        conditions.push('po.supplier_id = ?');
        values.push(options.supplier_id);
      }

      if (options.status) {
        conditions.push('po.status = ?');
        values.push(options.status);
      }

      if (options.search) {
        conditions.push('(po.po_number LIKE ? OR s.name LIKE ? OR po.notes LIKE ?)');
        values.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
      }

      if (options.date_from) {
        conditions.push('po.order_date >= ?');
        values.push(options.date_from);
      }

      if (options.date_to) {
        conditions.push('po.order_date <= ?');
        values.push(options.date_to);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Add ORDER BY
      query += ' ORDER BY po.created_at DESC';

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

  // Get purchase order with items
  static async getPOWithItems(poId) {
    try {
      // Get PO details
      const po = await this.findById(poId);
      if (!po) return null;

      // Get PO items
      const [items] = await pool.execute(`
        SELECT 
          poi.*,
          p.name as product_name,
          p.sku,
          p.unit_type_id,
          ut.name as unit_name,
          ut.abbreviation as unit_abbr
        FROM purchase_order_items poi
        LEFT JOIN products p ON poi.product_id = p.id
        LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
        WHERE poi.purchase_order_id = ?
        ORDER BY poi.id
      `, [poId]);

      return {
        ...po,
        items: items
      };
    } catch (error) {
      throw error;
    }
  }

  // Update purchase order status
  static async updateStatus(id, status, userId) {
    try {
      const [result] = await pool.execute(
        'UPDATE purchase_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Update purchase order
  static async update(id, updateData) {
    try {
      let query = 'UPDATE purchase_orders SET ';
      const values = [];
      const updateFields = [];

      if (updateData.supplier_id) {
        updateFields.push('supplier_id = ?');
        values.push(updateData.supplier_id);
      }

      if (updateData.order_date) {
        updateFields.push('order_date = ?');
        values.push(updateData.order_date);
      }

      if (updateData.expected_delivery_date !== undefined) {
        updateFields.push('expected_delivery_date = ?');
        values.push(updateData.expected_delivery_date);
      }

      if (updateData.status) {
        updateFields.push('status = ?');
        values.push(updateData.status);
      }

      if (updateData.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updateData.notes);
      }

      if (updateFields.length === 0) {
        return false;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      query += updateFields.join(', ');
      query += ' WHERE id = ?';
      values.push(id);

      const [result] = await pool.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete purchase order (only if Draft status)
  static async delete(id) {
    try {
      // Check if PO can be deleted (only Draft status)
      const po = await this.findById(id);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== 'Draft') {
        throw new Error('Only draft purchase orders can be deleted');
      }

      const [result] = await pool.execute('DELETE FROM purchase_orders WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Get PO statistics
  static async getStats() {
    try {
      const [totalRows] = await pool.execute(
        'SELECT COUNT(*) as total FROM purchase_orders'
      );

      const [statusRows] = await pool.execute(`
        SELECT 
          status,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM purchase_orders 
        GROUP BY status
      `);

      const [pendingRows] = await pool.execute(`
        SELECT COUNT(*) as count 
        FROM purchase_orders 
        WHERE status IN ('Sent', 'Confirmed', 'Partially_Received')
      `);

      const [monthlyRows] = await pool.execute(`
        SELECT 
          YEAR(order_date) as year,
          MONTH(order_date) as month,
          COUNT(*) as count,
          SUM(total_amount) as total_amount
        FROM purchase_orders 
        WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY YEAR(order_date), MONTH(order_date)
        ORDER BY year DESC, month DESC
      `);

      return {
        total: totalRows[0].total,
        pending: pendingRows[0].count,
        byStatus: statusRows,
        monthly: monthlyRows
      };
    } catch (error) {
      throw error;
    }
  }

  // Record goods receipt
  static async recordGoodsReceipt(poId, receiptData, receiptItems, userId) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Generate receipt number
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      
      const [countRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM goods_receipts WHERE DATE(created_at) = CURDATE()'
      );
      
      const dailyCount = countRows[0].count + 1;
      const receiptNumber = `GR-${year}${month}${day}-${String(dailyCount).padStart(3, '0')}`;

      // Create goods receipt
      const [receiptResult] = await connection.execute(
        `INSERT INTO goods_receipts (receipt_number, purchase_order_id, received_date, notes, created_by) 
         VALUES (?, ?, ?, ?, ?)`,
        [receiptNumber, poId, receiptData.received_date, receiptData.notes || null, userId]
      );

      const receiptId = receiptResult.insertId;

      // Process receipt items and update stock
      for (const item of receiptItems) {
        // Create receipt item
        await connection.execute(
          `INSERT INTO goods_receipt_items (goods_receipt_id, purchase_order_item_id, product_id, 
           received_quantity, unit_cost, batch_number, expiry_date, notes) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            receiptId, 
            item.purchase_order_item_id, 
            item.product_id, 
            item.received_quantity, 
            item.unit_cost,
            item.batch_number || null,
            item.expiry_date || null,
            item.notes || null
          ]
        );

        // Update PO item received quantity
        await connection.execute(
          'UPDATE purchase_order_items SET received_quantity = received_quantity + ? WHERE id = ?',
          [item.received_quantity, item.purchase_order_item_id]
        );

        // Update product stock
        await connection.execute(
          'UPDATE products SET current_stock = current_stock + ? WHERE id = ?',
          [item.received_quantity, item.product_id]
        );

        // Create stock transaction
        await connection.execute(
          `INSERT INTO stock_transactions (product_id, transaction_type, quantity, unit_cost, 
           reference_id, reference_type, notes, created_by) 
           VALUES (?, 'In', ?, ?, ?, 'Purchase', ?, ?)`,
          [
            item.product_id, 
            item.received_quantity, 
            item.unit_cost,
            receiptNumber, 
            `Goods receipt from PO ${receiptData.po_number}`,
            userId
          ]
        );

        // Create product batch if applicable
        if (item.batch_number) {
          const [productRows] = await connection.execute(
            'SELECT has_batches, has_expiry FROM products WHERE id = ?',
            [item.product_id]
          );
          
          if (productRows.length > 0 && productRows[0].has_batches) {
            await connection.execute(
              `INSERT INTO product_batches (product_id, batch_number, quantity, available_quantity, 
               cost_price, manufacture_date, expiry_date, supplier_id) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                item.product_id,
                item.batch_number,
                item.received_quantity,
                item.received_quantity,
                item.unit_cost,
                receiptData.received_date,
                item.expiry_date,
                receiptData.supplier_id
              ]
            );
          }
        }
      }

      // Update PO status based on received quantities
      const [poItems] = await connection.execute(
        'SELECT quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = ?',
        [poId]
      );

      let fullyReceived = true;
      let partiallyReceived = false;

      for (const poItem of poItems) {
        if (poItem.received_quantity < poItem.quantity) {
          fullyReceived = false;
        }
        if (poItem.received_quantity > 0) {
          partiallyReceived = true;
        }
      }

      let newStatus = 'Confirmed';
      if (fullyReceived) {
        newStatus = 'Received';
      } else if (partiallyReceived) {
        newStatus = 'Partially_Received';
      }

      await connection.execute(
        'UPDATE purchase_orders SET status = ? WHERE id = ?',
        [newStatus, poId]
      );

      await connection.commit();
      return { 
        receipt_id: receiptId, 
        receipt_number: receiptNumber,
        status: newStatus
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = PurchaseOrder;