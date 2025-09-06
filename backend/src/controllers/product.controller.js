const Product = require('../models/product.model');
const Category = require('../models/category.model');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const options = {
      category_id: req.query.category_id,
      low_stock: req.query.low_stock,
      search: req.query.search,
      limit: req.query.limit
    };

    const products = await Product.getAll(options);

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error retrieving products' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Error retrieving product' });
  }
};

// Create new product
exports.createProduct = async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['name', 'category_id', 'cost_price', 'selling_price'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Validate name length
    if (req.body.name.trim().length < 2) {
      return res.status(400).json({ message: 'Product name must be at least 2 characters long' });
    }

    // Validate prices
    const costPrice = parseFloat(req.body.cost_price);
    const sellingPrice = parseFloat(req.body.selling_price);

    if (isNaN(costPrice) || costPrice < 0) {
      return res.status(400).json({ message: 'Cost price must be a valid positive number' });
    }

    if (isNaN(sellingPrice) || sellingPrice < 0) {
      return res.status(400).json({ message: 'Selling price must be a valid positive number' });
    }

    // Validate category exists
    const category = await Category.findById(req.body.category_id);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }

    // Check if product with same name already exists
    const existingProduct = await Product.findByName(req.body.name.trim());
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this name already exists' });
    }

    // Validate stock quantities
    const currentStock = req.body.current_stock ? parseInt(req.body.current_stock) : 0;
    const minimumStock = req.body.minimum_stock ? parseInt(req.body.minimum_stock) : 0;

    if (isNaN(currentStock) || currentStock < 0) {
      return res.status(400).json({ message: 'Current stock must be a valid non-negative number' });
    }

    if (isNaN(minimumStock) || minimumStock < 0) {
      return res.status(400).json({ message: 'Minimum stock must be a valid non-negative number' });
    }

    // Create new product
    const product = await Product.create({
      name: req.body.name.trim(),
      description: req.body.description ? req.body.description.trim() : null,
      category_id: req.body.category_id,
      cost_price: costPrice,
      selling_price: sellingPrice,
      current_stock: currentStock,
      minimum_stock: minimumStock
    });

    res.status(201).json({
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate name if provided
    if (req.body.name) {
      if (req.body.name.trim().length < 2) {
        return res.status(400).json({ message: 'Product name must be at least 2 characters long' });
      }

      // Check if another product with same name exists
      const productWithSameName = await Product.findByName(req.body.name.trim());
      if (productWithSameName && productWithSameName.id != id) {
        return res.status(400).json({ message: 'Product with this name already exists' });
      }
    }

    // Validate category if provided
    if (req.body.category_id) {
      const category = await Category.findById(req.body.category_id);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category ID' });
      }
    }

    // Validate prices if provided
    if (req.body.cost_price !== undefined) {
      const costPrice = parseFloat(req.body.cost_price);
      if (isNaN(costPrice) || costPrice < 0) {
        return res.status(400).json({ message: 'Cost price must be a valid positive number' });
      }
    }

    if (req.body.selling_price !== undefined) {
      const sellingPrice = parseFloat(req.body.selling_price);
      if (isNaN(sellingPrice) || sellingPrice < 0) {
        return res.status(400).json({ message: 'Selling price must be a valid positive number' });
      }
    }

    // Validate stock quantities if provided
    if (req.body.current_stock !== undefined) {
      const currentStock = parseInt(req.body.current_stock);
      if (isNaN(currentStock) || currentStock < 0) {
        return res.status(400).json({ message: 'Current stock must be a valid non-negative number' });
      }
    }

    if (req.body.minimum_stock !== undefined) {
      const minimumStock = parseInt(req.body.minimum_stock);
      if (isNaN(minimumStock) || minimumStock < 0) {
        return res.status(400).json({ message: 'Minimum stock must be a valid non-negative number' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.description !== undefined) updateData.description = req.body.description ? req.body.description.trim() : null;
    if (req.body.category_id) updateData.category_id = req.body.category_id;
    if (req.body.cost_price !== undefined) updateData.cost_price = parseFloat(req.body.cost_price);
    if (req.body.selling_price !== undefined) updateData.selling_price = parseFloat(req.body.selling_price);
    if (req.body.current_stock !== undefined) updateData.current_stock = parseInt(req.body.current_stock);
    if (req.body.minimum_stock !== undefined) updateData.minimum_stock = parseInt(req.body.minimum_stock);

    // Update product
    const updated = await Product.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ message: 'No changes made to product' });
    }

    // Get updated product
    const updatedProduct = await Product.findById(id);

    res.status(200).json({
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete product
    const deleted = await Product.delete(id);
    if (!deleted) {
      return res.status(400).json({ message: 'Product could not be deleted' });
    }

    res.status(200).json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.message.includes('Cannot delete product')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// Update product stock
exports.updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    if (quantity === undefined || isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    if (!['set', 'add', 'subtract'].includes(operation)) {
      return res.status(400).json({ message: 'Operation must be set, add, or subtract' });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Update stock
    const updated = await Product.updateStock(id, parseInt(quantity), operation);
    if (!updated) {
      if (operation === 'subtract') {
        return res.status(400).json({ message: 'Insufficient stock for this operation' });
      }
      return res.status(400).json({ message: 'Stock could not be updated' });
    }

    // Get updated product
    const updatedProduct = await Product.findById(id);

    res.status(200).json({
      message: 'Product stock updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ message: 'Error updating product stock' });
  }
};

// Get low stock products
exports.getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.getLowStockProducts();

    res.status(200).json({
      message: 'Low stock products retrieved successfully',
      data: products,
      count: products.length
    });
  } catch (error) {
    console.error('Get low stock products error:', error);
    res.status(500).json({ message: 'Error retrieving low stock products' });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId || isNaN(categoryId)) {
      return res.status(400).json({ message: 'Valid category ID is required' });
    }

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const products = await Product.getProductsByCategory(categoryId);

    res.status(200).json({
      message: 'Products retrieved successfully',
      data: products,
      count: products.length,
      category: category.name
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({ message: 'Error retrieving products by category' });
  }
};

// Get stock summary
exports.getStockSummary = async (req, res) => {
  try {
    const summary = await Product.getStockSummary();

    res.status(200).json({
      message: 'Stock summary retrieved successfully',
      data: summary
    });
  } catch (error) {
    console.error('Get stock summary error:', error);
    res.status(500).json({ message: 'Error retrieving stock summary' });
  }
};