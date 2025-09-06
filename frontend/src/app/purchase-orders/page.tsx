'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { purchaseOrdersAPI, suppliersAPI, productsAPI } from '@/lib/api';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  expected_delivery_date?: string;
  status: 'Draft' | 'Sent' | 'Confirmed' | 'Partially_Received' | 'Received' | 'Cancelled';
  total_amount: number;
  notes?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

interface Product {
  id: number;
  name: string;
  sku?: string;
  cost_price: number;
  unit_name?: string;
  unit_abbr?: string;
}

interface POItem {
  product_id: number;
  quantity: number;
  unit_cost: number;
  notes?: string;
}

export default function PurchaseOrdersPage() {
  const { user, logout } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [currentTheme, setCurrentTheme] = useState('corporate');

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for PO creation/editing
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    items: [] as POItem[]
  });

  // Receipt form state
  const [receiptData, setReceiptData] = useState({
    received_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [] as any[]
  });

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [posRes, suppliersRes, productsRes] = await Promise.all([
        purchaseOrdersAPI.getAll(),
        suppliersAPI.getAll(),
        productsAPI.getAll()
      ]);
      setPurchaseOrders(posRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: 0, quantity: 1, unit_cost: 0, notes: '' }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      supplier_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      notes: '',
      items: []
    });
    setEditingPO(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (po: PurchaseOrder) => {
    // This would need to fetch the PO with items first
    setEditingPO(po);
    setFormData({
      supplier_id: po.supplier_id.toString(),
      order_date: po.order_date,
      expected_delivery_date: po.expected_delivery_date || '',
      notes: po.notes || '',
      items: [] // Would need to load items
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id || formData.items.length === 0) {
      alert('Please select a supplier and add at least one item');
      return;
    }

    try {
      const poData = {
        supplier_id: parseInt(formData.supplier_id),
        order_date: formData.order_date,
        expected_delivery_date: formData.expected_delivery_date || null,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id.toString()),
          quantity: parseFloat(item.quantity.toString()),
          unit_cost: parseFloat(item.unit_cost.toString()),
          notes: item.notes
        }))
      };

      if (editingPO) {
        await purchaseOrdersAPI.update(editingPO.id, poData);
      } else {
        await purchaseOrdersAPI.create(poData);
      }
      
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving purchase order:', error);
      alert('Error saving purchase order');
    }
  };

  const updateStatus = async (po: PurchaseOrder, newStatus: string) => {
    try {
      await purchaseOrdersAPI.updateStatus(po.id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const deletePO = async (po: PurchaseOrder) => {
    if (confirm(`Are you sure you want to delete PO ${po.po_number}?`)) {
      try {
        await purchaseOrdersAPI.delete(po.id);
        await loadData();
      } catch (error) {
        console.error('Error deleting purchase order:', error);
        alert('Error deleting purchase order');
      }
    }
  };

  const openReceiptModal = async (po: PurchaseOrder) => {
    try {
      const poDetails = await purchaseOrdersAPI.getById(po.id);
      setSelectedPO(poDetails.data);
      setReceiptData({
        received_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: poDetails.data.items?.map((item: any) => ({
          purchase_order_item_id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          ordered_quantity: item.quantity,
          received_quantity: 0,
          unit_cost: item.unit_cost,
          batch_number: '',
          expiry_date: '',
          notes: ''
        })) || []
      });
      setShowReceiptModal(true);
    } catch (error) {
      console.error('Error loading PO details:', error);
      alert('Error loading PO details');
    }
  };

  const updateReceiptItem = (index: number, field: string, value: any) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const recordReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPO) return;

    try {
      const receiptItems = receiptData.items.filter(item => item.received_quantity > 0);
      
      if (receiptItems.length === 0) {
        alert('Please enter received quantities for at least one item');
        return;
      }

      await purchaseOrdersAPI.recordReceipt(selectedPO.id, {
        received_date: receiptData.received_date,
        notes: receiptData.notes,
        items: receiptItems
      });
      
      setShowReceiptModal(false);
      await loadData();
    } catch (error) {
      console.error('Error recording receipt:', error);
      alert('Error recording receipt');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'Draft': 'badge-neutral',
      'Sent': 'badge-info',
      'Confirmed': 'badge-primary',
      'Partially_Received': 'badge-warning',
      'Received': 'badge-success',
      'Cancelled': 'badge-error'
    };
    return statusColors[status as keyof typeof statusColors] || 'badge-neutral';
  };

  const filteredPOs = (purchaseOrders || []).filter(po => {
    const matchesStatus = !statusFilter || po.status === statusFilter;
    const matchesSupplier = !supplierFilter || po.supplier_id.toString() === supplierFilter;
    const matchesSearch = !searchTerm || 
      po.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.notes && po.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesSupplier && matchesSearch;
  });

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-base-200" data-theme={currentTheme}>
      {/* Navigation */}
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-base-content">
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/categories">Categories</Link></li>
              <li><Link href="/suppliers">Suppliers</Link></li>
              <li><Link href="/purchase-orders">Purchase Orders</Link></li>
              <li><Link href="/sales">Sales</Link></li>
              <li><Link href="/stock">Stock</Link></li>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            📦 Stock Manager
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/products" className="btn btn-ghost">Products</Link></li>
            <li><Link href="/categories" className="btn btn-ghost">Categories</Link></li>
            <li><Link href="/suppliers" className="btn btn-ghost">Suppliers</Link></li>
            <li><Link href="/purchase-orders" className="btn btn-ghost btn-active">Purchase Orders</Link></li>
            <li><Link href="/sales" className="btn btn-ghost">Sales</Link></li>
            <li><Link href="/stock" className="btn btn-ghost">Stock</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              Theme: {currentTheme}
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-base-content max-h-96 overflow-y-auto">
              {['light', 'dark', 'corporate', 'business', 'cyberpunk', 'retro'].map((theme) => (
                <li key={theme}>
                  <a onClick={() => changeTheme(theme)} className={currentTheme === theme ? 'active' : ''}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="dropdown dropdown-end ml-2">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary-content text-primary">
                <div className="flex items-center justify-center w-full h-full font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-base-content">
              <li><div className="px-4 py-2 text-sm text-base-content/70">Signed in as <strong>{user?.username}</strong></div></li>
              <li><a onClick={handleLogout} className="text-error">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Purchase Orders</h1>
            <p className="text-base-content/70">Manage purchase orders and goods receipts</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Create Purchase Order
          </button>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="form-control flex-1">
                <input
                  type="text"
                  placeholder="Search by PO number, supplier, or notes..."
                  className="input input-bordered"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                className="select select-bordered"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Partially_Received">Partially Received</option>
                <option value="Received">Received</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <select 
                className="select select-bordered"
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Orders Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Supplier</th>
                      <th>Order Date</th>
                      <th>Expected Delivery</th>
                      <th>Status</th>
                      <th>Total Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map((po) => (
                      <tr key={po.id}>
                        <td className="font-medium">{po.po_number}</td>
                        <td>{po.supplier_name}</td>
                        <td>{new Date(po.order_date).toLocaleDateString()}</td>
                        <td>{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '-'}</td>
                        <td>
                          <div className={`badge ${getStatusBadge(po.status)}`}>
                            {po.status.replace('_', ' ')}
                          </div>
                        </td>
                        <td>${po.total_amount.toFixed(2)}</td>
                        <td>
                          <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                              ⋮
                            </div>
                            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                              <li><a onClick={() => openEditModal(po)}>✏️ Edit</a></li>
                              {['Sent', 'Confirmed', 'Partially_Received'].includes(po.status) && (
                                <li><a onClick={() => openReceiptModal(po)}>📦 Receive Goods</a></li>
                              )}
                              {po.status === 'Draft' && (
                                <>
                                  <li><a onClick={() => updateStatus(po, 'Sent')}>📤 Send to Supplier</a></li>
                                  <li><a onClick={() => deletePO(po)} className="text-error">🗑️ Delete</a></li>
                                </>
                              )}
                              {po.status === 'Sent' && (
                                <li><a onClick={() => updateStatus(po, 'Confirmed')}>✅ Mark Confirmed</a></li>
                              )}
                              <li><a onClick={() => updateStatus(po, 'Cancelled')} className="text-error">❌ Cancel</a></li>
                            </ul>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit PO Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">
              {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Supplier *</span>
                  </label>
                  <select
                    name="supplier_id"
                    className="select select-bordered"
                    value={formData.supplier_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Order Date *</span>
                  </label>
                  <input
                    type="date"
                    name="order_date"
                    className="input input-bordered"
                    value={formData.order_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Expected Delivery Date</span>
                  </label>
                  <input
                    type="date"
                    name="expected_delivery_date"
                    className="input input-bordered"
                    value={formData.expected_delivery_date}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  name="notes"
                  className="textarea textarea-bordered"
                  rows={3}
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>

              {/* Items Section */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Items</h4>
                  <button type="button" className="btn btn-sm btn-primary" onClick={addItem}>
                    + Add Item
                  </button>
                </div>
                
                {formData.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2 p-2 border rounded">
                    <select
                      className="select select-bordered select-sm"
                      value={item.product_id}
                      onChange={(e) => updateItem(index, 'product_id', parseInt(e.target.value))}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Quantity"
                      className="input input-bordered input-sm"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Unit Cost"
                      className="input input-bordered input-sm"
                      value={item.unit_cost}
                      onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Notes"
                      className="input input-bordered input-sm"
                      value={item.notes}
                      onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-error"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPO ? 'Update' : 'Create'} Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goods Receipt Modal */}
      {showReceiptModal && selectedPO && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-5xl">
            <h3 className="font-bold text-lg mb-4">
              Receive Goods - PO {selectedPO.po_number}
            </h3>
            <form onSubmit={recordReceipt}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Received Date *</span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered"
                    value={receiptData.received_date}
                    onChange={(e) => setReceiptData(prev => ({ ...prev, received_date: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Receipt Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  rows={2}
                  value={receiptData.notes}
                  onChange={(e) => setReceiptData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {/* Receipt Items */}
              <div className="mb-4">
                <h4 className="font-semibold mb-2">Items to Receive</h4>
                <div className="overflow-x-auto">
                  <table className="table table-compact">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Ordered</th>
                        <th>Received Qty</th>
                        <th>Unit Cost</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptData.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product_name}</td>
                          <td>{item.ordered_quantity}</td>
                          <td>
                            <input
                              type="number"
                              className="input input-bordered input-sm w-20"
                              value={item.received_quantity}
                              onChange={(e) => updateReceiptItem(index, 'received_quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              max={item.ordered_quantity}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="input input-bordered input-sm w-20"
                              value={item.unit_cost}
                              onChange={(e) => updateReceiptItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="input input-bordered input-sm w-20"
                              value={item.batch_number}
                              onChange={(e) => updateReceiptItem(index, 'batch_number', e.target.value)}
                              placeholder="Batch"
                            />
                          </td>
                          <td>
                            <input
                              type="date"
                              className="input input-bordered input-sm w-28"
                              value={item.expiry_date}
                              onChange={(e) => updateReceiptItem(index, 'expiry_date', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowReceiptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}