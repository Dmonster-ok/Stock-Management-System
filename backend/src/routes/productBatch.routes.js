const express = require('express');
const router = express.Router();
const productBatchController = require('../controllers/productBatch.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Get all batches (accessible by all authenticated users)
router.get('/', verifyToken, productBatchController.getAllBatches);

// Get expiring batches
router.get('/expiring', verifyToken, productBatchController.getExpiringBatches);

// Get batches by product ID
router.get('/product/:productId', verifyToken, productBatchController.getBatchesByProduct);

// Get batch by ID
router.get('/:id', verifyToken, productBatchController.getBatchById);

// Create new batch (Owner/Manager/Staff)
router.post('/', verifyToken, productBatchController.createBatch);

// Update batch (Owner/Manager/Staff)
router.put('/:id', verifyToken, productBatchController.updateBatch);

// Update batch quantity (for stock transactions)
router.patch('/:id/quantity', verifyToken, productBatchController.updateBatchQuantity);

// Delete batch (Owner/Manager only)
router.delete('/:id', verifyToken, roleMiddleware(['Owner', 'Manager']), productBatchController.deleteBatch);

module.exports = router;
