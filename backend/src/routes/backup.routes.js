const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get backup status
router.get('/status', verifyToken, backupController.getBackupStatus);

// Export data
router.get('/export', verifyToken, backupController.exportData);

// Import products
router.post('/import/products', verifyToken, backupController.importProducts);

// Import suppliers
router.post('/import/suppliers', verifyToken, backupController.importSuppliers);

module.exports = router;