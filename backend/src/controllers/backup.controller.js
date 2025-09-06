const { pool } = require('../config/db.config');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Supplier = require('../models/supplier.model');

// Export all data
exports.exportData = async (req, res) => {
  try {
    const { tables } = req.query;
    const tablesToExport = tables ? tables.split(',') : ['products', 'categories', 'suppliers', 'invoices', 'purchase_orders'];
    
    const exportData = {};
    
    for (const table of tablesToExport) {
      switch (table) {
        case 'products':
          const [products] = await pool.execute(`
            SELECT p.*, c.name as category_name, ut.name as unit_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN unit_types ut ON p.unit_type_id = ut.id
          `);
          exportData.products = products;
          break;
          
        case 'categories':
          const [categories] = await pool.execute('SELECT * FROM categories');
          exportData.categories = categories;
          break;
          
        case 'suppliers':
          const [suppliers] = await pool.execute('SELECT * FROM suppliers');
          exportData.suppliers = suppliers;
          break;
          
        case 'invoices':
          const [invoices] = await pool.execute(`
            SELECT i.*, u.username as created_by_name
            FROM invoices i
            LEFT JOIN users u ON i.created_by = u.id
          `);
          const [invoiceItems] = await pool.execute(`
            SELECT ii.*, p.name as product_name
            FROM invoice_items ii
            LEFT JOIN products p ON ii.product_id = p.id
          `);
          exportData.invoices = invoices;
          exportData.invoice_items = invoiceItems;
          break;
          
        case 'purchase_orders':
          const [purchaseOrders] = await pool.execute(`
            SELECT po.*, s.name as supplier_name, u.username as created_by_name
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.id
            LEFT JOIN users u ON po.created_by = u.id
          `);
          const [poItems] = await pool.execute(`
            SELECT poi.*, p.name as product_name
            FROM purchase_order_items poi
            LEFT JOIN products p ON poi.product_id = p.id
          `);
          exportData.purchase_orders = purchaseOrders;
          exportData.purchase_order_items = poItems;
          break;
          
        case 'stock_transactions':
          const [stockTransactions] = await pool.execute(`
            SELECT st.*, p.name as product_name, u.username as created_by_name
            FROM stock_transactions st
            LEFT JOIN products p ON st.product_id = p.id
            LEFT JOIN users u ON st.created_by = u.id
          `);
          exportData.stock_transactions = stockTransactions;
          break;
      }
    }
    
    exportData.exported_at = new Date().toISOString();
    exportData.exported_by = req.userId;
    
    res.status(200).json({
      message: 'Data exported successfully',
      data: exportData
    });
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ message: 'Error exporting data' });
  }
};

// Import products from CSV/JSON
exports.importProducts = async (req, res) => {
  try {
    const { products, mode = 'create' } = req.body; // mode: 'create', 'update', 'upsert'
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Products array is required' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Validate required fields
        if (!product.name || !product.cost_price || !product.selling_price) {
          results.errors.push(`Row ${i + 1}: Missing required fields (name, cost_price, selling_price)`);
          continue;
        }
        
        // Handle category
        let categoryId = null;
        if (product.category_name) {
          let category = await Category.findByName(product.category_name);
          if (!category) {
            category = await Category.create({
              name: product.category_name,
              description: `Auto-created during import`
            });
          }
          categoryId = category.id;
        }
        
        const productData = {
          name: product.name,
          sku: product.sku || null,
          barcode: product.barcode || null,
          description: product.description || '',
          category_id: categoryId,
          unit_type_id: product.unit_type_id || null,
          cost_price: parseFloat(product.cost_price),
          selling_price: parseFloat(product.selling_price),
          current_stock: parseFloat(product.current_stock || 0),
          minimum_stock: parseFloat(product.minimum_stock || 0),
          maximum_stock: product.maximum_stock ? parseFloat(product.maximum_stock) : null,
          reorder_point: product.reorder_point ? parseFloat(product.reorder_point) : null,
          has_batches: product.has_batches === 'true' || product.has_batches === true,
          has_expiry: product.has_expiry === 'true' || product.has_expiry === true,
          shelf_life_days: product.shelf_life_days ? parseInt(product.shelf_life_days) : null
        };
        
        if (mode === 'update' || mode === 'upsert') {
          // Try to find existing product by SKU or name
          let existingProduct = null;
          if (product.sku) {
            const [rows] = await pool.execute('SELECT * FROM products WHERE sku = ?', [product.sku]);
            existingProduct = rows[0];
          }
          if (!existingProduct && product.name) {
            existingProduct = await Product.findByName(product.name);
          }
          
          if (existingProduct) {
            await Product.update(existingProduct.id, productData);
            results.updated++;
            continue;
          } else if (mode === 'update') {
            results.errors.push(`Row ${i + 1}: Product not found for update`);
            continue;
          }
        }
        
        // Create new product
        await Product.create(productData);
        results.created++;
        
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    res.status(200).json({
      message: 'Import completed',
      data: results
    });
  } catch (error) {
    console.error('Import products error:', error);
    res.status(500).json({ message: 'Error importing products' });
  }
};

// Import suppliers from CSV/JSON
exports.importSuppliers = async (req, res) => {
  try {
    const { suppliers, mode = 'create' } = req.body;
    
    if (!suppliers || !Array.isArray(suppliers)) {
      return res.status(400).json({ message: 'Suppliers array is required' });
    }
    
    const results = {
      created: 0,
      updated: 0,
      errors: []
    };
    
    for (let i = 0; i < suppliers.length; i++) {
      const supplier = suppliers[i];
      
      try {
        if (!supplier.name) {
          results.errors.push(`Row ${i + 1}: Supplier name is required`);
          continue;
        }
        
        const supplierData = {
          name: supplier.name,
          contact_person: supplier.contact_person || null,
          email: supplier.email || null,
          phone: supplier.phone || null
        };
        
        if (mode === 'update' || mode === 'upsert') {
          const existingSupplier = await Supplier.findByName(supplier.name);
          if (existingSupplier) {
            await Supplier.update(existingSupplier.id, supplierData);
            results.updated++;
            continue;
          } else if (mode === 'update') {
            results.errors.push(`Row ${i + 1}: Supplier not found for update`);
            continue;
          }
        }
        
        await Supplier.create(supplierData);
        results.created++;
        
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }
    
    res.status(200).json({
      message: 'Import completed',
      data: results
    });
  } catch (error) {
    console.error('Import suppliers error:', error);
    res.status(500).json({ message: 'Error importing suppliers' });
  }
};

// Get backup status and history
exports.getBackupStatus = async (req, res) => {
  try {
    // Get database size
    const [sizeResult] = await pool.execute(`
      SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS db_size_mb
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);
    
    // Get record counts
    const [productCount] = await pool.execute('SELECT COUNT(*) as count FROM products');
    const [categoryCount] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    const [supplierCount] = await pool.execute('SELECT COUNT(*) as count FROM suppliers');
    const [invoiceCount] = await pool.execute('SELECT COUNT(*) as count FROM invoices');
    const [poCount] = await pool.execute('SELECT COUNT(*) as count FROM purchase_orders');
    const [stockTxnCount] = await pool.execute('SELECT COUNT(*) as count FROM stock_transactions');
    
    const status = {
      database: {
        size_mb: sizeResult[0].db_size_mb,
        last_updated: new Date().toISOString()
      },
      records: {
        products: productCount[0].count,
        categories: categoryCount[0].count,
        suppliers: supplierCount[0].count,
        invoices: invoiceCount[0].count,
        purchase_orders: poCount[0].count,
        stock_transactions: stockTxnCount[0].count
      }
    };
    
    res.status(200).json({
      message: 'Backup status retrieved successfully',
      data: status
    });
  } catch (error) {
    console.error('Get backup status error:', error);
    res.status(500).json({ message: 'Error retrieving backup status' });
  }
};

module.exports = exports;