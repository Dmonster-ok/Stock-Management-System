const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get dashboard summary
router.get('/dashboard', verifyToken, reportsController.getDashboardSummary);

// Get inventory report
router.get('/inventory', verifyToken, reportsController.getInventoryReport);

// Get sales report
router.get('/sales', verifyToken, reportsController.getSalesReport);

// Get purchase report
router.get('/purchases', verifyToken, reportsController.getPurchaseReport);

// Get profit & loss report
router.get('/profit-loss', verifyToken, reportsController.getProfitLossReport);

// Get stock movement report
router.get('/stock-movements', verifyToken, reportsController.getStockMovementReport);

module.exports = router;