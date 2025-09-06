const Invoice = require('../models/invoice.model');
const Product = require('../models/product.model');

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const options = {
      payment_status: req.query.payment_status,
      customer_name: req.query.customer_name,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      created_by: req.query.created_by,
      limit: req.query.limit
    };

    const invoices = await Invoice.getAll(options);

    res.status(200).json({
      message: 'Invoices retrieved successfully',
      data: invoices,
      count: invoices.length
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Error retrieving invoices' });
  }
};

// Get invoice by ID with items
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid invoice ID is required' });
    }

    const invoice = await Invoice.getInvoiceWithItems(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.status(200).json({
      message: 'Invoice retrieved successfully',
      data: invoice
    });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Error retrieving invoice' });
  }
};

// Create new invoice
exports.createInvoice = async (req, res) => {
  try {
    const { customer_name, invoice_date, payment_status, items } = req.body;

    // Validate required fields
    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer name and items are required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        return res.status(400).json({ message: 'Each item must have product_id, quantity, and unit_price' });
      }
      if (item.quantity <= 0 || item.unit_price < 0) {
        return res.status(400).json({ message: 'Quantity must be positive and unit_price cannot be negative' });
      }
    }

    // Create invoice
    const invoice = await Invoice.create({
      customer_name: customer_name.trim(),
      invoice_date,
      payment_status: payment_status || 'Unpaid',
      created_by: req.userId
    }, items);

    // Get full invoice with items
    const fullInvoice = await Invoice.getInvoiceWithItems(invoice.id);

    res.status(201).json({
      message: 'Invoice created successfully',
      data: fullInvoice
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating invoice' });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Valid invoice ID is required' });
    }

    if (!payment_status || !['Paid', 'Unpaid'].includes(payment_status)) {
      return res.status(400).json({ message: 'Valid payment status (Paid/Unpaid) is required' });
    }

    // Check if invoice exists
    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Update payment status
    const updated = await Invoice.updatePaymentStatus(id, payment_status, req.userId);
    if (!updated) {
      return res.status(400).json({ message: 'Payment status could not be updated' });
    }

    // Get updated invoice
    const updatedInvoice = await Invoice.findById(id);

    res.status(200).json({
      message: 'Payment status updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ message: 'Error updating payment status' });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const options = {
      date_from: req.query.date_from,
      date_to: req.query.date_to
    };

    const stats = await Invoice.getSalesStats(options);

    res.status(200).json({
      message: 'Sales statistics retrieved successfully',
      data: stats
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ message: 'Error retrieving sales statistics' });
  }
};

// Get daily sales
exports.getDailySales = async (req, res) => {
  try {
    const options = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const sales = await Invoice.getDailySales(options);

    res.status(200).json({
      message: 'Daily sales retrieved successfully',
      data: sales
    });
  } catch (error) {
    console.error('Get daily sales error:', error);
    res.status(500).json({ message: 'Error retrieving daily sales' });
  }
};

// Get top selling products
exports.getTopSellingProducts = async (req, res) => {
  try {
    const options = {
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const products = await Invoice.getTopSellingProducts(options);

    res.status(200).json({
      message: 'Top selling products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Get top selling products error:', error);
    res.status(500).json({ message: 'Error retrieving top selling products' });
  }
};