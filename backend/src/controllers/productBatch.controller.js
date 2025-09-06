const ProductBatch = require('../models/productBatch.model');
const Product = require('../models/product.model');

// Get all product batches
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await ProductBatch.getAll();
    res.status(200).json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({ message: 'Error retrieving batches' });
  }
};

// Get batches by product ID
exports.getBatchesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const batches = await ProductBatch.getByProductId(productId);
    res.status(200).json(batches);
  } catch (error) {
    console.error('Get batches by product error:', error);
    res.status(500).json({ message: 'Error retrieving batches' });
  }
};

// Get batch by ID
exports.getBatchById = async (req, res) => {
  try {
    const { id } = req.params;
    const batch = await ProductBatch.findById(id);
    
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }
    
    res.status(200).json(batch);
  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({ message: 'Error retrieving batch' });
  }
};

// Get expiring batches
exports.getExpiringBatches = async (req, res) => {
  try {
    const { days } = req.query;
    const expiringDays = days ? parseInt(days) : 30;
    const batches = await ProductBatch.getExpiringSoon(expiringDays);
    res.status(200).json(batches);
  } catch (error) {
    console.error('Get expiring batches error:', error);
    res.status(500).json({ message: 'Error retrieving expiring batches' });
  }
};

// Create new batch
exports.createBatch = async (req, res) => {
  try {
    // Validate request
    if (!req.body.product_id || !req.body.batch_number || !req.body.quantity) {
      return res.status(400).json({ 
        message: 'Product ID, batch number, and quantity are required' 
      });
    }

    // Check if product exists
    const product = await Product.findById(req.body.product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if batch number already exists for this product
    const existingBatch = await ProductBatch.findByBatchNumber(
      req.body.product_id, 
      req.body.batch_number
    );
    if (existingBatch) {
      return res.status(400).json({ 
        message: 'Batch number already exists for this product' 
      });
    }

    // Validate expiry date if product has expiry
    if (product.has_expiry && !req.body.expiry_date) {
      return res.status(400).json({ 
        message: 'Expiry date is required for products with expiry tracking' 
      });
    }

    const batch = await ProductBatch.create(req.body);
    
    // Update product stock
    await Product.updateStock(
      req.body.product_id, 
      parseFloat(req.body.quantity), 
      'add'
    );
    
    res.status(201).json({
      message: 'Batch created successfully',
      batch
    });
  } catch (error) {
    console.error('Create batch error:', error);
    res.status(500).json({ message: 'Error creating batch' });
  }
};

// Update batch
exports.updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if batch exists
    const existingBatch = await ProductBatch.findById(id);
    if (!existingBatch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // If quantity is being updated, adjust product stock
    if (req.body.quantity !== undefined || req.body.available_quantity !== undefined) {
      const oldQuantity = existingBatch.quantity;
      const newQuantity = req.body.quantity !== undefined ? 
        parseFloat(req.body.quantity) : oldQuantity;
      
      const quantityDifference = newQuantity - oldQuantity;
      
      if (quantityDifference !== 0) {
        await Product.updateStock(
          existingBatch.product_id,
          Math.abs(quantityDifference),
          quantityDifference > 0 ? 'add' : 'subtract'
        );
      }
    }

    const success = await ProductBatch.update(id, req.body);
    
    if (success) {
      const updatedBatch = await ProductBatch.findById(id);
      res.status(200).json({
        message: 'Batch updated successfully',
        batch: updatedBatch
      });
    } else {
      res.status(400).json({ message: 'No changes made to batch' });
    }
  } catch (error) {
    console.error('Update batch error:', error);
    res.status(500).json({ message: 'Error updating batch' });
  }
};

// Delete batch
exports.deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if batch exists
    const batch = await ProductBatch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    // Update product stock by subtracting batch quantity
    if (batch.available_quantity > 0) {
      await Product.updateStock(
        batch.product_id,
        parseFloat(batch.available_quantity),
        'subtract'
      );
    }

    const success = await ProductBatch.delete(id);
    
    if (success) {
      res.status(200).json({ message: 'Batch deleted successfully' });
    } else {
      res.status(400).json({ message: 'Failed to delete batch' });
    }
  } catch (error) {
    console.error('Delete batch error:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      res.status(400).json({ 
        message: 'Cannot delete batch - it is referenced in stock transactions' 
      });
    } else {
      res.status(500).json({ message: 'Error deleting batch' });
    }
  }
};

// Update batch quantity (for stock transactions)
exports.updateBatchQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }

    // Check if batch exists
    const batch = await ProductBatch.findById(id);
    if (!batch) {
      return res.status(404).json({ message: 'Batch not found' });
    }

    const success = await ProductBatch.updateQuantity(id, quantity);
    
    if (success) {
      const updatedBatch = await ProductBatch.findById(id);
      res.status(200).json({
        message: 'Batch quantity updated successfully',
        batch: updatedBatch
      });
    } else {
      res.status(400).json({ message: 'Failed to update batch quantity' });
    }
  } catch (error) {
    console.error('Update batch quantity error:', error);
    res.status(500).json({ message: 'Error updating batch quantity' });
  }
};