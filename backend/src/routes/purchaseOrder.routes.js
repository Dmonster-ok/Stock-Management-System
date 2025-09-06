const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all purchase orders
router.get('/', verifyToken, purchaseOrderController.getPurchaseOrders);

// Get purchase order statistics
router.get('/stats', verifyToken, purchaseOrderController.getPurchaseOrderStats);

// Get purchase order by ID
router.get('/:id', verifyToken, purchaseOrderController.getPurchaseOrderById);

// Create new purchase order
router.post('/', verifyToken, purchaseOrderController.createPurchaseOrder);

// Update purchase order
router.put('/:id', verifyToken, purchaseOrderController.updatePurchaseOrder);

// Update purchase order status
router.patch('/:id/status', verifyToken, purchaseOrderController.updatePurchaseOrderStatus);

// Record goods receipt for purchase order
router.post('/:id/receipt', verifyToken, purchaseOrderController.recordGoodsReceipt);

// Delete purchase order
router.delete('/:id', verifyToken, purchaseOrderController.deletePurchaseOrder);

module.exports = router;