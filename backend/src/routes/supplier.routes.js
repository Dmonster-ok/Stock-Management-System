const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all suppliers
router.get('/', verifyToken, supplierController.getSuppliers);

// Get supplier statistics
router.get('/stats', verifyToken, supplierController.getSupplierStats);

// Get supplier by ID
router.get('/:id', verifyToken, supplierController.getSupplierById);

// Get supplier products
router.get('/:id/products', verifyToken, supplierController.getSupplierProducts);

// Create new supplier
router.post('/', verifyToken, supplierController.createSupplier);

// Update supplier
router.put('/:id', verifyToken, supplierController.updateSupplier);

// Link product to supplier
router.post('/:id/products', verifyToken, supplierController.linkProductToSupplier);

// Unlink product from supplier
router.delete('/:id/products/:productId', verifyToken, supplierController.unlinkProductFromSupplier);

// Delete supplier
router.delete('/:id', verifyToken, supplierController.deleteSupplier);

module.exports = router;