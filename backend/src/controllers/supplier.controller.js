const Supplier = require('../models/supplier.model');
const Product = require('../models/product.model');

// Get all suppliers
exports.getSuppliers = async (req, res) => {
  try {
    const options = {
      search: req.query.search,
      limit: req.query.limit
    };

    const suppliers = await Supplier.getAll(options);

    res.status(200).json({
      message: 'Suppliers retrieved successfully',
      data: suppliers,
      count: suppliers.length
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ message: 'Error retrieving suppliers' });
  }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Supplier retrieved successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ message: 'Error retrieving supplier' });
  }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ message: 'Supplier name is required' });
    }

    if (req.body.name.trim().length < 2) {
      return res.status(400).json({ message: 'Supplier name must be at least 2 characters long' });
    }

    // Check if supplier with same name already exists
    const existingSupplier = await Supplier.findByName(req.body.name.trim());
    if (existingSupplier) {
      return res.status(400).json({ message: 'Supplier with this name already exists' });
    }

    // Validate email if provided
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Check if email already exists
      const supplierWithEmail = await Supplier.findByEmail(req.body.email.trim());
      if (supplierWithEmail) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }

    // Create new supplier
    const supplier = await Supplier.create({
      name: req.body.name.trim(),
      contact_person: req.body.contact_person ? req.body.contact_person.trim() : null,
      email: req.body.email ? req.body.email.trim() : null,
      phone: req.body.phone ? req.body.phone.trim() : null
    });

    res.status(201).json({
      message: 'Supplier created successfully',
      data: supplier
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ message: 'Error creating supplier' });
  }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Validate name if provided
    if (req.body.name) {
      if (req.body.name.trim().length < 2) {
        return res.status(400).json({ message: 'Supplier name must be at least 2 characters long' });
      }

      // Check if another supplier with same name exists
      const supplierWithSameName = await Supplier.findByName(req.body.name.trim());
      if (supplierWithSameName && supplierWithSameName.id != id) {
        return res.status(400).json({ message: 'Supplier with this name already exists' });
      }
    }

    // Validate email if provided
    if (req.body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(req.body.email)) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      // Check if another supplier with same email exists
      const supplierWithSameEmail = await Supplier.findByEmail(req.body.email.trim());
      if (supplierWithSameEmail && supplierWithSameEmail.id != id) {
        return res.status(400).json({ message: 'Supplier with this email already exists' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name.trim();
    if (req.body.contact_person !== undefined) updateData.contact_person = req.body.contact_person ? req.body.contact_person.trim() : null;
    if (req.body.email !== undefined) updateData.email = req.body.email ? req.body.email.trim() : null;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone ? req.body.phone.trim() : null;

    // Update supplier
    const updated = await Supplier.update(id, updateData);
    if (!updated) {
      return res.status(400).json({ message: 'No changes made to supplier' });
    }

    // Get updated supplier
    const updatedSupplier = await Supplier.findById(id);

    res.status(200).json({
      message: 'Supplier updated successfully',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ message: 'Error updating supplier' });
  }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Delete supplier
    const deleted = await Supplier.delete(id);
    if (!deleted) {
      return res.status(400).json({ message: 'Supplier could not be deleted' });
    }

    res.status(200).json({
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    if (error.message === 'Cannot delete supplier with linked products') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting supplier' });
  }
};

// Get supplier products
exports.getSupplierProducts = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const products = await Supplier.getSupplierProducts(id);

    res.status(200).json({
      message: 'Supplier products retrieved successfully',
      data: products,
      count: products.length,
      supplier: supplier.name
    });
  } catch (error) {
    console.error('Get supplier products error:', error);
    res.status(500).json({ message: 'Error retrieving supplier products' });
  }
};

// Link product to supplier
exports.linkProductToSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_id } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    if (!product_id || isNaN(product_id)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check if product exists
    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Link product to supplier
    const linked = await Supplier.linkProductToSupplier(product_id, id);
    
    res.status(200).json({
      message: linked ? 'Product linked to supplier successfully' : 'Product already linked to supplier',
      data: {
        supplier_id: id,
        product_id: product_id,
        supplier_name: supplier.name,
        product_name: product.name
      }
    });
  } catch (error) {
    console.error('Link product to supplier error:', error);
    res.status(500).json({ message: 'Error linking product to supplier' });
  }
};

// Unlink product from supplier
exports.unlinkProductFromSupplier = async (req, res) => {
  try {
    const { id, productId } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid supplier ID is required' });
    }

    if (!productId || isNaN(productId)) {
      return res.status(400).json({ message: 'Valid product ID is required' });
    }

    // Check if supplier exists
    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Unlink product from supplier
    const unlinked = await Supplier.unlinkProductFromSupplier(productId, id);
    
    if (!unlinked) {
      return res.status(404).json({ message: 'Product is not linked to this supplier' });
    }

    res.status(200).json({
      message: 'Product unlinked from supplier successfully'
    });
  } catch (error) {
    console.error('Unlink product from supplier error:', error);
    res.status(500).json({ message: 'Error unlinking product from supplier' });
  }
};

// Get supplier statistics
exports.getSupplierStats = async (req, res) => {
  try {
    const stats = await Supplier.getSupplierStats();

    res.status(200).json({
      message: 'Supplier statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get supplier stats error:', error);
    res.status(500).json({ message: 'Error retrieving supplier statistics' });
  }
};