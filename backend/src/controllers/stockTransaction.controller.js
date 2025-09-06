const StockTransaction = require('../models/stockTransaction.model');
const Product = require('../models/product.model');

// Get all stock transactions
exports.getStockTransactions = async (req, res) => {
  try {
    const options = {
      product_id: req.query.product_id,
      transaction_type: req.query.transaction_type,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      created_by: req.query.created_by,
      limit: req.query.limit
    };

    const transactions = await StockTransaction.getAll(options);

    res.status(200).json({
      message: 'Stock transactions retrieved successfully',
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({ message: 'Error retrieving stock transactions' });
  }
};

// Get stock transaction by ID
exports.getStockTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid transaction ID is required' });
    }

    const transaction = await StockTransaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Stock transaction not found' });
    }

    res.status(200).json({
      message: 'Stock transaction retrieved successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Get stock transaction error:', error);
    res.status(500).json({ message: 'Error retrieving stock transaction' });
  }
};

// Get stock transactions by product
exports.getStockTransactionsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const options = {
      transaction_type: req.query.transaction_type,
      limit: req.query.limit
    };

    const transactions = await StockTransaction.getByProduct(productId, options);

    res.status(200).json({
      message: 'Product stock transactions retrieved successfully',
      data: transactions,
      count: transactions.length,
      product: product.name
    });
  } catch (error) {
    console.error('Get product stock transactions error:', error);
    res.status(500).json({ message: 'Error retrieving product stock transactions' });
  }
};

// Record stock in
exports.recordStockIn = async (req, res) => {
  try {
    const { product_id, quantity, reference_id } = req.body;

    // Validate required fields
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    if (isNaN(product_id) || isNaN(quantity)) {
      return res.status(400).json({ message: 'Product ID and quantity must be valid numbers' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Record stock in transaction
    const transaction = await StockTransaction.recordStockIn(
      product_id, 
      parseInt(quantity), 
      req.userId, 
      reference_id
    );

    // Get updated product info
    const updatedProduct = await Product.findById(product_id);

    res.status(201).json({
      message: 'Stock in recorded successfully',
      data: {
        transaction,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          previous_stock: updatedProduct.current_stock - quantity,
          current_stock: updatedProduct.current_stock
        }
      }
    });
  } catch (error) {
    console.error('Record stock in error:', error);
    res.status(500).json({ message: 'Error recording stock in' });
  }
};

// Record stock out
exports.recordStockOut = async (req, res) => {
  try {
    const { product_id, quantity, reference_id } = req.body;

    // Validate required fields
    if (!product_id || !quantity) {
      return res.status(400).json({ message: 'Product ID and quantity are required' });
    }

    if (isNaN(product_id) || isNaN(quantity)) {
      return res.status(400).json({ message: 'Product ID and quantity must be valid numbers' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be greater than 0' });
    }

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Record stock out transaction
    const transaction = await StockTransaction.recordStockOut(
      product_id, 
      parseInt(quantity), 
      req.userId, 
      reference_id
    );

    // Get updated product info
    const updatedProduct = await Product.findById(product_id);

    res.status(201).json({
      message: 'Stock out recorded successfully',
      data: {
        transaction,
        product: {
          id: updatedProduct.id,
          name: updatedProduct.name,
          previous_stock: updatedProduct.current_stock + quantity,
          current_stock: updatedProduct.current_stock
        }
      }
    });
  } catch (error) {
    console.error('Record stock out error:', error);
    if (error.message.includes('Insufficient stock') || error.message.includes('Product not found')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error recording stock out' });
  }
};

// Record stock adjustment
exports.recordStockAdjustment = async (req, res) => {
  try {
    const { product_id, new_quantity, reference_id } = req.body;

    // Validate required fields
    if (!product_id || new_quantity === undefined) {
      return res.status(400).json({ message: 'Product ID and new quantity are required' });
    }

    if (isNaN(product_id) || isNaN(new_quantity)) {
      return res.status(400).json({ message: 'Product ID and new quantity must be valid numbers' });
    }

    if (new_quantity < 0) {
      return res.status(400).json({ message: 'New quantity cannot be negative' });
    }

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Record stock adjustment transaction
    const transaction = await StockTransaction.recordStockAdjustment(
      product_id, 
      parseInt(new_quantity), 
      req.userId, 
      reference_id
    );

    res.status(201).json({
      message: 'Stock adjustment recorded successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Record stock adjustment error:', error);
    if (error.message.includes('Product not found')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error recording stock adjustment' });
  }
};

// Get stock movement summary
exports.getStockMovementSummary = async (req, res) => {
  try {
    const options = {
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };

    const summary = await StockTransaction.getStockMovementSummary(options);

    res.status(200).json({
      message: 'Stock movement summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Get stock movement summary error:', error);
    res.status(500).json({ message: 'Error retrieving stock movement summary' });
  }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const stats = await StockTransaction.getTransactionStats();

    res.status(200).json({
      message: 'Transaction statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Error retrieving transaction statistics' });
  }
};