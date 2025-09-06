const express = require('express');
const router = express.Router();
const stockTransactionController = require('../controllers/stockTransaction.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all stock transactions
router.get('/', verifyToken, stockTransactionController.getStockTransactions);

// Get transaction statistics
router.get('/stats', verifyToken, stockTransactionController.getTransactionStats);

// Get stock movement summary
router.get('/summary', verifyToken, stockTransactionController.getStockMovementSummary);

// Get stock transactions by product
router.get('/product/:productId', verifyToken, stockTransactionController.getStockTransactionsByProduct);

// Get stock transaction by ID
router.get('/:id', verifyToken, stockTransactionController.getStockTransactionById);

// Record stock in
router.post('/in', verifyToken, stockTransactionController.recordStockIn);

// Record stock out
router.post('/out', verifyToken, stockTransactionController.recordStockOut);

// Record stock adjustment
router.post('/adjustment', verifyToken, stockTransactionController.recordStockAdjustment);

module.exports = router;