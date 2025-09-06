const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all products (with optional filters)
router.get('/', verifyToken, productController.getProducts);

// Get stock summary
router.get('/summary', verifyToken, productController.getStockSummary);

// Get low stock products
router.get('/low-stock', verifyToken, productController.getLowStockProducts);

// Get products by category
router.get('/category/:categoryId', verifyToken, productController.getProductsByCategory);

// Get product by ID
router.get('/:id', verifyToken, productController.getProductById);

// Create new product
router.post('/', verifyToken, productController.createProduct);

// Update product
router.put('/:id', verifyToken, productController.updateProduct);

// Update product stock
router.patch('/:id/stock', verifyToken, productController.updateProductStock);

// Delete product
router.delete('/:id', verifyToken, productController.deleteProduct);

module.exports = router;