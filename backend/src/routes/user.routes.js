const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Get all users (admin only)
router.get('/', verifyToken, isAdmin, userController.getAllUsers);

// Get user by ID (admin or own profile)
router.get('/:id', verifyToken, userController.getUserById);

// Update user (admin or own profile)
router.put('/:id', verifyToken, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;