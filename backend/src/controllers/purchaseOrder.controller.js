const PurchaseOrder = require('../models/purchaseOrder.model');
const Supplier = require('../models/supplier.model');
const Product = require('../models/product.model');

// Get all purchase orders
exports.getPurchaseOrders = async (req, res) => {
  try {
    const options = {
      supplier_id: req.query.supplier_id,
      status: req.query.status,
      search: req.query.search,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const purchaseOrders = await PurchaseOrder.getAll(options);

    res.status(200).json({
      message: 'Purchase orders retrieved successfully',
      data: purchaseOrders,
      count: purchaseOrders.length
    });
  } catch (error) {
    console.error('Get purchase orders error:', error);
    res.status(500).json({ message: 'Error retrieving purchase orders' });
  }
};

// Get purchase order by ID
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid purchase order ID is required' });
    }

    const purchaseOrder = await PurchaseOrder.getPOWithItems(id);
    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.status(200).json({
      message: 'Purchase order retrieved successfully',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Get purchase order error:', error);
    res.status(500).json({ message: 'Error retrieving purchase order' });
  }
};

// Create new purchase order
exports.createPurchaseOrder = async (req, res) => {
  try {
    const { supplier_id, order_date, expected_delivery_date, status, notes, items } = req.body;

    // Validate required fields
    if (!supplier_id || !order_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Supplier ID, order date, and items are required' 
      });
    }

    // Validate supplier exists
    const supplier = await Supplier.findById(supplier_id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_cost) {
        return res.status(400).json({ 
          message: 'Each item must have product_id, quantity, and unit_cost' 
        });
      }
      
      if (item.quantity <= 0 || item.unit_cost < 0) {
        return res.status(400).json({ 
          message: 'Quantity must be positive and unit_cost cannot be negative' 
        });
      }

      // Check if product exists
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({ 
          message: `Product with ID ${item.product_id} not found` 
        });
      }
    }

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      supplier_id,
      order_date,
      expected_delivery_date,
      status: status || 'Draft',
      notes,
      created_by: req.userId
    }, items);

    // Get full purchase order with items
    const fullPO = await PurchaseOrder.getPOWithItems(purchaseOrder.id);

    res.status(201).json({
      message: 'Purchase order created successfully',
      data: fullPO
    });
  } catch (error) {
    console.error('Create purchase order error:', error);
    res.status(500).json({ message: 'Error creating purchase order' });
  }
};

// Update purchase order
exports.updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { supplier_id, order_date, expected_delivery_date, status, notes } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid purchase order ID is required' });
    }

    // Check if PO exists
    const existingPO = await PurchaseOrder.findById(id);
    if (!existingPO) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Check if PO can be updated (only Draft and Sent status)
    if (!['Draft', 'Sent'].includes(existingPO.status)) {
      return res.status(400).json({ 
        message: 'Only draft and sent purchase orders can be updated' 
      });
    }

    // Validate supplier if provided
    if (supplier_id) {
      const supplier = await Supplier.findById(supplier_id);
      if (!supplier) {
        return res.status(404).json({ message: 'Supplier not found' });
      }
    }

    // Update purchase order
    const updated = await PurchaseOrder.update(id, {
      supplier_id,
      order_date,
      expected_delivery_date,
      status,
      notes
    });

    if (!updated) {
      return res.status(400).json({ message: 'No changes made to purchase order' });
    }

    // Get updated purchase order
    const updatedPO = await PurchaseOrder.getPOWithItems(id);

    res.status(200).json({
      message: 'Purchase order updated successfully',
      data: updatedPO
    });
  } catch (error) {
    console.error('Update purchase order error:', error);
    res.status(500).json({ message: 'Error updating purchase order' });
  }
};

// Update purchase order status
exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid purchase order ID is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const validStatuses = ['Draft', 'Sent', 'Confirmed', 'Partially_Received', 'Received', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` 
      });
    }

    // Check if PO exists
    const existingPO = await PurchaseOrder.findById(id);
    if (!existingPO) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Update status
    const updated = await PurchaseOrder.updateStatus(id, status, req.userId);

    if (!updated) {
      return res.status(400).json({ message: 'Failed to update purchase order status' });
    }

    // Get updated purchase order
    const updatedPO = await PurchaseOrder.findById(id);

    res.status(200).json({
      message: 'Purchase order status updated successfully',
      data: updatedPO
    });
  } catch (error) {
    console.error('Update purchase order status error:', error);
    res.status(500).json({ message: 'Error updating purchase order status' });
  }
};

// Delete purchase order
exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid purchase order ID is required' });
    }

    const deleted = await PurchaseOrder.delete(id);

    if (!deleted) {
      return res.status(400).json({ message: 'Purchase order not found or cannot be deleted' });
    }

    res.status(200).json({
      message: 'Purchase order deleted successfully'
    });
  } catch (error) {
    console.error('Delete purchase order error:', error);
    if (error.message === 'Only draft purchase orders can be deleted') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting purchase order' });
  }
};

// Get purchase order statistics
exports.getPurchaseOrderStats = async (req, res) => {
  try {
    const stats = await PurchaseOrder.getStats();

    res.status(200).json({
      message: 'Purchase order statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get purchase order stats error:', error);
    res.status(500).json({ message: 'Error retrieving purchase order statistics' });
  }
};

// Record goods receipt
exports.recordGoodsReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_date, notes, items } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid purchase order ID is required' });
    }

    if (!received_date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        message: 'Received date and items are required' 
      });
    }

    // Check if PO exists and can receive goods
    const po = await PurchaseOrder.findById(id);
    if (!po) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (!['Sent', 'Confirmed', 'Partially_Received'].includes(po.status)) {
      return res.status(400).json({ 
        message: 'Can only receive goods for sent, confirmed, or partially received purchase orders' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.purchase_order_item_id || !item.product_id || !item.received_quantity || !item.unit_cost) {
        return res.status(400).json({ 
          message: 'Each item must have purchase_order_item_id, product_id, received_quantity, and unit_cost' 
        });
      }
      
      if (item.received_quantity <= 0 || item.unit_cost < 0) {
        return res.status(400).json({ 
          message: 'Received quantity must be positive and unit_cost cannot be negative' 
        });
      }
    }

    // Record goods receipt
    const receipt = await PurchaseOrder.recordGoodsReceipt(id, {
      received_date,
      notes,
      po_number: po.po_number,
      supplier_id: po.supplier_id
    }, items, req.userId);

    res.status(201).json({
      message: 'Goods receipt recorded successfully',
      data: receipt
    });
  } catch (error) {
    console.error('Record goods receipt error:', error);
    res.status(500).json({ message: 'Error recording goods receipt' });
  }
};

module.exports = exports;