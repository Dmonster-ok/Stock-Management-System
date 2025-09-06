const Category = require('../models/category.model');

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const includeCount = req.query.include_count === 'true';
    
    let categories;
    if (includeCount) {
      categories = await Category.getWithProductCount();
    } else {
      categories = await Category.getAll();
    }

    res.status(200).json({
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error retrieving categories' });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.status(200).json({
      message: 'Category retrieved successfully',
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Error retrieving category' });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    if (req.body.name.trim().length < 2) {
      return res.status(400).json({ message: 'Category name must be at least 2 characters long' });
    }

    // Check if category already exists
    const existingCategory = await Category.findByName(req.body.name.trim());
    if (existingCategory) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    // Create new category
    const category = await Category.create({
      name: req.body.name.trim(),
      description: req.body.description ? req.body.description.trim() : null
    });

    res.status(201).json({
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    // Check if category exists
    const existingCategory = await Category.findById(id);
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Validate name if provided
    if (req.body.name) {
      if (req.body.name.trim().length < 2) {
        return res.status(400).json({ message: 'Category name must be at least 2 characters long' });
      }

      // Check if another category with same name exists
      const categoryWithSameName = await Category.findByName(req.body.name.trim());
      if (categoryWithSameName && categoryWithSameName.id != id) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
    }

    // Update category
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description ? req.body.description.trim() : null;

    const updated = await Category.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ message: 'No changes made to category' });
    }

    // Get updated category
    const updatedCategory = await Category.findById(id);

    res.status(200).json({
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Delete category
    const deleted = await Category.delete(id);
    if (!deleted) {
      return res.status(400).json({ message: 'Category could not be deleted' });
    }

    res.status(200).json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.message === 'Cannot delete category with existing products') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting category' });
  }
};