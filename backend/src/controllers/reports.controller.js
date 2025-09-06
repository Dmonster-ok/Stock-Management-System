const { pool } = require('../config/db.config');
const Product = require('../models/product.model');

// Get inventory report
exports.getInventoryReport = async (req, res) => {
  try {
    const { category_id, low_stock_only, format } = req.query;
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.current_stock,
        p.minimum_stock,
        p.maximum_stock,
        p.cost_price,
        p.selling_price,
        (p.current_stock * p.cost_price) as stock_value,
        c.name as category_name,
        ut.name as unit_name,
        ut.abbreviation as unit_abbr,
        CASE 
          WHEN p.current_stock <= p.minimum_stock THEN 'Low Stock'
          WHEN p.current_stock >= p.maximum_stock THEN 'Overstock'
          ELSE 'Normal'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
      WHERE p.is_active = true
    `;
    
    const values = [];
    
    if (category_id) {
      query += ' AND p.category_id = ?';
      values.push(category_id);
    }
    
    if (low_stock_only === 'true') {
      query += ' AND p.current_stock <= p.minimum_stock';
    }
    
    query += ' ORDER BY p.name';
    
    const [rows] = await pool.execute(query, values);
    
    // Calculate summary statistics
    const totalProducts = rows.length;
    const totalStockValue = rows.reduce((sum, item) => sum + parseFloat(item.stock_value || 0), 0);
    const lowStockItems = rows.filter(item => item.stock_status === 'Low Stock').length;
    const overstockItems = rows.filter(item => item.stock_status === 'Overstock').length;
    
    const summary = {
      totalProducts,
      totalStockValue,
      lowStockItems,
      overstockItems,
      normalStockItems: totalProducts - lowStockItems - overstockItems
    };
    
    res.status(200).json({
      message: 'Inventory report generated successfully',
      data: {
        summary,
        items: rows,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get inventory report error:', error);
    res.status(500).json({ message: 'Error generating inventory report' });
  }
};

// Get sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, product_id, category_id, payment_status } = req.query;
    
    let query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.customer_name,
        i.invoice_date,
        i.subtotal,
        i.discount_amount,
        i.tax_amount,
        i.total_amount,
        i.payment_status,
        i.payment_method,
        u.username as created_by_name,
        COUNT(ii.id) as item_count,
        SUM(ii.quantity) as total_items_sold
      FROM invoices i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE 1=1
    `;
    
    const values = [];
    
    if (start_date) {
      query += ' AND i.invoice_date >= ?';
      values.push(start_date);
    }
    
    if (end_date) {
      query += ' AND i.invoice_date <= ?';
      values.push(end_date);
    }
    
    if (payment_status) {
      query += ' AND i.payment_status = ?';
      values.push(payment_status);
    }
    
    query += ' GROUP BY i.id ORDER BY i.invoice_date DESC';
    
    const [invoices] = await pool.execute(query, values);
    
    // Get detailed sales items if product or category filter is applied
    let salesItems = [];
    if (product_id || category_id) {
      let itemQuery = `
        SELECT 
          ii.*,
          p.name as product_name,
          p.sku,
          c.name as category_name,
          i.invoice_number,
          i.invoice_date,
          i.customer_name
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        JOIN products p ON ii.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;
      
      const itemValues = [];
      
      if (start_date) {
        itemQuery += ' AND i.invoice_date >= ?';
        itemValues.push(start_date);
      }
      
      if (end_date) {
        itemQuery += ' AND i.invoice_date <= ?';
        itemValues.push(end_date);
      }
      
      if (product_id) {
        itemQuery += ' AND ii.product_id = ?';
        itemValues.push(product_id);
      }
      
      if (category_id) {
        itemQuery += ' AND p.category_id = ?';
        itemValues.push(category_id);
      }
      
      itemQuery += ' ORDER BY i.invoice_date DESC';
      
      const [items] = await pool.execute(itemQuery, itemValues);
      salesItems = items;
    }
    
    // Calculate summary statistics
    const totalSales = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);
    const totalDiscount = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.discount_amount || 0), 0);
    const totalTax = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.tax_amount || 0), 0);
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter(inv => inv.payment_status === 'Paid').length;
    const unpaidAmount = invoices
      .filter(inv => inv.payment_status !== 'Paid')
      .reduce((sum, invoice) => sum + parseFloat(invoice.total_amount), 0);
    
    const summary = {
      totalSales,
      totalDiscount,
      totalTax,
      totalInvoices,
      paidInvoices,
      unpaidInvoices: totalInvoices - paidInvoices,
      unpaidAmount,
      averageOrderValue: totalInvoices > 0 ? totalSales / totalInvoices : 0
    };
    
    res.status(200).json({
      message: 'Sales report generated successfully',
      data: {
        summary,
        invoices,
        salesItems,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ message: 'Error generating sales report' });
  }
};

// Get purchase report
exports.getPurchaseReport = async (req, res) => {
  try {
    const { start_date, end_date, supplier_id, status } = req.query;
    
    let query = `
      SELECT 
        po.id,
        po.po_number,
        po.order_date,
        po.expected_delivery_date,
        po.status,
        po.total_amount,
        po.notes,
        s.name as supplier_name,
        u.username as created_by_name,
        COUNT(poi.id) as item_count,
        SUM(poi.quantity) as total_items_ordered,
        SUM(poi.received_quantity) as total_items_received
      FROM purchase_orders po
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN users u ON po.created_by = u.id
      WHERE 1=1
    `;
    
    const values = [];
    
    if (start_date) {
      query += ' AND po.order_date >= ?';
      values.push(start_date);
    }
    
    if (end_date) {
      query += ' AND po.order_date <= ?';
      values.push(end_date);
    }
    
    if (supplier_id) {
      query += ' AND po.supplier_id = ?';
      values.push(supplier_id);
    }
    
    if (status) {
      query += ' AND po.status = ?';
      values.push(status);
    }
    
    query += ' GROUP BY po.id ORDER BY po.order_date DESC';
    
    const [purchaseOrders] = await pool.execute(query, values);
    
    // Calculate summary statistics
    const totalPurchaseValue = purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount), 0);
    const totalOrders = purchaseOrders.length;
    const receivedOrders = purchaseOrders.filter(po => po.status === 'Received').length;
    const pendingOrders = purchaseOrders.filter(po => ['Sent', 'Confirmed', 'Partially_Received'].includes(po.status)).length;
    
    const summary = {
      totalPurchaseValue,
      totalOrders,
      receivedOrders,
      pendingOrders,
      cancelledOrders: purchaseOrders.filter(po => po.status === 'Cancelled').length,
      averageOrderValue: totalOrders > 0 ? totalPurchaseValue / totalOrders : 0
    };
    
    res.status(200).json({
      message: 'Purchase report generated successfully',
      data: {
        summary,
        purchaseOrders,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get purchase report error:', error);
    res.status(500).json({ message: 'Error generating purchase report' });
  }
};

// Get profit & loss report
exports.getProfitLossReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Get sales data
    let salesQuery = `
      SELECT 
        SUM(i.total_amount) as total_revenue,
        SUM(i.discount_amount) as total_discounts,
        SUM(i.tax_amount) as total_taxes,
        COUNT(*) as total_sales_count
      FROM invoices i
      WHERE i.payment_status = 'Paid'
    `;
    
    const salesValues = [];
    
    if (start_date) {
      salesQuery += ' AND i.invoice_date >= ?';
      salesValues.push(start_date);
    }
    
    if (end_date) {
      salesQuery += ' AND i.invoice_date <= ?';
      salesValues.push(end_date);
    }
    
    const [salesResult] = await pool.execute(salesQuery, salesValues);
    
    // Get cost of goods sold
    let cogsQuery = `
      SELECT 
        SUM(ii.quantity * p.cost_price) as total_cogs
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.product_id = p.id
      WHERE i.payment_status = 'Paid'
    `;
    
    const cogsValues = [];
    
    if (start_date) {
      cogsQuery += ' AND i.invoice_date >= ?';
      cogsValues.push(start_date);
    }
    
    if (end_date) {
      cogsQuery += ' AND i.invoice_date <= ?';
      cogsValues.push(end_date);
    }
    
    const [cogsResult] = await pool.execute(cogsQuery, cogsValues);
    
    // Get purchase data
    let purchaseQuery = `
      SELECT 
        SUM(po.total_amount) as total_purchases
      FROM purchase_orders po
      WHERE po.status = 'Received'
    `;
    
    const purchaseValues = [];
    
    if (start_date) {
      purchaseQuery += ' AND po.order_date >= ?';
      purchaseValues.push(start_date);
    }
    
    if (end_date) {
      purchaseQuery += ' AND po.order_date <= ?';
      purchaseValues.push(end_date);
    }
    
    const [purchaseResult] = await pool.execute(purchaseQuery, purchaseValues);
    
    // Calculate profit & loss
    const revenue = parseFloat(salesResult[0].total_revenue || 0);
    const discounts = parseFloat(salesResult[0].total_discounts || 0);
    const taxes = parseFloat(salesResult[0].total_taxes || 0);
    const cogs = parseFloat(cogsResult[0].total_cogs || 0);
    const purchases = parseFloat(purchaseResult[0].total_purchases || 0);
    
    const netRevenue = revenue - discounts;
    const grossProfit = netRevenue - cogs;
    const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    
    const summary = {
      revenue: {
        gross: revenue,
        discounts: discounts,
        net: netRevenue,
        taxes: taxes
      },
      costs: {
        cogs: cogs,
        purchases: purchases
      },
      profit: {
        gross: grossProfit,
        grossMargin: grossProfitMargin
      },
      transactions: {
        salesCount: parseInt(salesResult[0].total_sales_count || 0)
      }
    };
    
    res.status(200).json({
      message: 'Profit & loss report generated successfully',
      data: {
        summary,
        period: {
          start_date: start_date || 'All time',
          end_date: end_date || 'All time'
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get profit & loss report error:', error);
    res.status(500).json({ message: 'Error generating profit & loss report' });
  }
};

// Get stock movement report
exports.getStockMovementReport = async (req, res) => {
  try {
    const { start_date, end_date, product_id, transaction_type } = req.query;
    
    let query = `
      SELECT 
        st.*,
        p.name as product_name,
        p.sku,
        u.username as created_by_name
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      LEFT JOIN users u ON st.created_by = u.id
      WHERE 1=1
    `;
    
    const values = [];
    
    if (start_date) {
      query += ' AND DATE(st.created_at) >= ?';
      values.push(start_date);
    }
    
    if (end_date) {
      query += ' AND DATE(st.created_at) <= ?';
      values.push(end_date);
    }
    
    if (product_id) {
      query += ' AND st.product_id = ?';
      values.push(product_id);
    }
    
    if (transaction_type) {
      query += ' AND st.transaction_type = ?';
      values.push(transaction_type);
    }
    
    query += ' ORDER BY st.created_at DESC';
    
    const [transactions] = await pool.execute(query, values);
    
    // Calculate summary statistics
    const totalTransactions = transactions.length;
    const stockIn = transactions.filter(t => t.transaction_type === 'In').reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    const stockOut = transactions.filter(t => t.transaction_type === 'Out').reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    const adjustments = transactions.filter(t => t.transaction_type === 'Adjustment').reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    
    const summary = {
      totalTransactions,
      stockIn,
      stockOut,
      adjustments,
      netMovement: stockIn - stockOut + adjustments
    };
    
    res.status(200).json({
      message: 'Stock movement report generated successfully',
      data: {
        summary,
        transactions,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get stock movement report error:', error);
    res.status(500).json({ message: 'Error generating stock movement report' });
  }
};

// Get dashboard summary data
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get key metrics
    const [totalProducts] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE is_active = true');
    const [lowStockProducts] = await pool.execute('SELECT COUNT(*) as count FROM products WHERE current_stock <= minimum_stock AND is_active = true');
    const [totalSuppliers] = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
    const [totalStockValue] = await pool.execute('SELECT SUM(current_stock * cost_price) as value FROM products WHERE is_active = true');
    
    // Get today's sales
    const [todaySales] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM invoices 
      WHERE DATE(invoice_date) = ?
    `, [today]);
    
    // Get pending purchase orders
    const [pendingPOs] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM purchase_orders 
      WHERE status IN ('Sent', 'Confirmed', 'Partially_Received')
    `);
    
    // Get unpaid invoices
    const [unpaidInvoices] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM invoices 
      WHERE payment_status != 'Paid'
    `);
    
    // Get recent activities (last 10)
    const [recentActivities] = await pool.execute(`
      (SELECT 'sale' as type, invoice_number as reference, total_amount as amount, created_at 
       FROM invoices ORDER BY created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'purchase' as type, po_number as reference, total_amount as amount, created_at 
       FROM purchase_orders ORDER BY created_at DESC LIMIT 5)
      ORDER BY created_at DESC LIMIT 10
    `);
    
    const summary = {
      inventory: {
        totalProducts: totalProducts[0].count,
        lowStockProducts: lowStockProducts[0].count,
        totalStockValue: parseFloat(totalStockValue[0].value || 0)
      },
      suppliers: {
        total: totalSuppliers[0].count
      },
      sales: {
        todayCount: todaySales[0].count,
        todayTotal: parseFloat(todaySales[0].total || 0),
        unpaidCount: unpaidInvoices[0].count,
        unpaidTotal: parseFloat(unpaidInvoices[0].total || 0)
      },
      purchases: {
        pendingOrders: pendingPOs[0].count
      },
      recentActivities
    };
    
    res.status(200).json({
      message: 'Dashboard summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ message: 'Error retrieving dashboard summary' });
  }
};

module.exports = exports;