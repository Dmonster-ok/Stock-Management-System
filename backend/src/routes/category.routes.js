const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Get all categories
router.get('/', verifyToken, categoryController.getCategories);

// Get category by ID
router.get('/:id', verifyToken, categoryController.getCategoryById);

// Create new category (Admin/Staff can create)
router.post('/', verifyToken, categoryController.createCategory);

// Update category (Admin/Staff can update)
router.put('/:id', verifyToken, categoryController.updateCategory);

// Delete category (Admin/Staff can delete)
router.delete('/:id', verifyToken, categoryController.deleteCategory);

module.exports = router;