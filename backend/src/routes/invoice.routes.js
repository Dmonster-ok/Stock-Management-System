const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all invoices
router.get('/', verifyToken, invoiceController.getInvoices);

// Get sales statistics
router.get('/stats', verifyToken, invoiceController.getSalesStats);

// Get daily sales
router.get('/daily-sales', verifyToken, invoiceController.getDailySales);

// Get top selling products
router.get('/top-products', verifyToken, invoiceController.getTopSellingProducts);

// Get invoice by ID
router.get('/:id', verifyToken, invoiceController.getInvoiceById);

// Create new invoice
router.post('/', verifyToken, invoiceController.createInvoice);

// Update payment status
router.patch('/:id/payment', verifyToken, invoiceController.updatePaymentStatus);

module.exports = router;