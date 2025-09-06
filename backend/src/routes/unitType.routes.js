const express = require('express');
const router = express.Router();
const unitTypeController = require('../controllers/unitType.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

// Get all unit types (accessible by all authenticated users)
router.get('/', verifyToken, unitTypeController.getAllUnitTypes);

// Get unit types by type
router.get('/type/:type', verifyToken, unitTypeController.getUnitTypesByType);

// Get unit type by ID
router.get('/:id', verifyToken, unitTypeController.getUnitTypeById);

// Create new unit type (Owner/Manager only)
router.post('/', verifyToken, roleMiddleware(['Owner', 'Manager']), unitTypeController.createUnitType);

// Update unit type (Owner/Manager only)
router.put('/:id', verifyToken, roleMiddleware(['Owner', 'Manager']), unitTypeController.updateUnitType);

// Delete unit type (Owner only)
router.delete('/:id', verifyToken, roleMiddleware(['Owner']), unitTypeController.deleteUnitType);

module.exports = router;
