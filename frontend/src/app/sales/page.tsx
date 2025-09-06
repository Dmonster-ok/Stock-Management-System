'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invoice {
  id: number;
  invoice_number: string;
  customer_name: string;
  invoice_date: string;
  total_amount: number;
  payment_status: 'Paid' | 'Unpaid';
}

export default function SalesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [filter, setFilter] = useState('All');

  // Mock data
  useEffect(() => {
    const mockInvoices: Invoice[] = [
      {
        id: 1,
        invoice_number: 'INV-20250906-001',
        customer_name: 'John Customer',
        invoice_date: '2025-09-06',
        total_amount: 2425.00,
        payment_status: 'Paid'
      },
      {
        id: 2,
        invoice_number: 'INV-20250906-002',
        customer_name: 'Jane Smith',
        invoice_date: '2025-09-06',
        total_amount: 1200.00,
        payment_status: 'Unpaid'
      },
      {
        id: 3,
        invoice_number: 'INV-20250905-001',
        customer_name: 'Bob Wilson',
        invoice_date: '2025-09-05',
        total_amount: 850.00,
        payment_status: 'Paid'
      }
    ];
    
    setTimeout(() => {
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    filter === 'All' || invoice.payment_status === filter
  );

  const totalSales = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const paidAmount = invoices.filter(inv => inv.payment_status === 'Paid').reduce((sum, inv) => sum + inv.total_amount, 0);
  const unpaidAmount = invoices.filter(inv => inv.payment_status === 'Unpaid').reduce((sum, inv) => sum + inv.total_amount, 0);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold">
            📦 Stock Manager
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/products" className="btn btn-ghost">Products</Link></li>
            <li><Link href="/categories" className="btn btn-ghost">Categories</Link></li>
            <li><Link href="/suppliers" className="btn btn-ghost">Suppliers</Link></li>
            <li><Link href="/sales" className="btn btn-ghost btn-active">Sales</Link></li>
            <li><Link href="/stock" className="btn btn-ghost">Stock</Link></li>
          </ul>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Sales & Invoices</h1>
            <p className="text-base-content/70">Manage your sales transactions</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowNewSaleModal(true)}
          >
            🛒 New Sale
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Total Sales</h2>
                  <p className="text-2xl font-bold">${totalSales.toLocaleString()}</p>
                </div>
                <div className="text-3xl opacity-80">💰</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Paid Amount</h2>
                  <p className="text-2xl font-bold">${paidAmount.toLocaleString()}</p>
                </div>
                <div className="text-3xl opacity-80">✅</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Unpaid Amount</h2>
                  <p className="text-2xl font-bold">${unpaidAmount.toLocaleString()}</p>
                </div>
                <div className="text-3xl opacity-80">📋</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <div className="flex gap-4">
              <select 
                className="select select-bordered"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All Invoices</option>
                <option value="Paid">Paid Only</option>
                <option value="Unpaid">Unpaid Only</option>
              </select>
              <input 
                type="date" 
                className="input input-bordered"
                placeholder="From Date"
              />
              <input 
                type="date" 
                className="input input-bordered"
                placeholder="To Date"
              />
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title mb-4">Recent Invoices</h2>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <div className="font-medium">{invoice.invoice_number}</div>
                        </td>
                        <td>
                          <div className="font-medium">{invoice.customer_name}</div>
                        </td>
                        <td>{invoice.invoice_date}</td>
                        <td>
                          <div className="font-bold text-success">
                            ${invoice.total_amount.toLocaleString()}
                          </div>
                        </td>
                        <td>
                          <div className={`badge ${
                            invoice.payment_status === 'Paid' 
                              ? 'badge-success' 
                              : 'badge-error'
                          }`}>
                            {invoice.payment_status}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-outline">👁️ View</button>
                            {invoice.payment_status === 'Unpaid' && (
                              <button className="btn btn-sm btn-success">💳 Mark Paid</button>
                            )}
                            <button className="btn btn-sm btn-primary">🖨️ Print</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Sale Modal */}
      {showNewSaleModal && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-4xl">
            <h3 className="font-bold text-lg mb-4">🛒 Create New Sale</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-4">
                <h4 className="font-semibold">Customer Information</h4>
                <input 
                  type="text" 
                  placeholder="Customer Name" 
                  className="input input-bordered w-full" 
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="input input-bordered w-full" 
                />
                <textarea 
                  placeholder="Address (Optional)" 
                  className="textarea textarea-bordered w-full"
                ></textarea>
              </div>

              {/* Product Selection */}
              <div className="space-y-4">
                <h4 className="font-semibold">Add Products</h4>
                <select className="select select-bordered w-full">
                  <option>Select Product</option>
                  <option>Samsung Galaxy S24 - $1200</option>
                  <option>Cotton T-Shirt - $25</option>
                  <option>Gaming Laptop - $1800</option>
                </select>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="Qty" 
                    className="input input-bordered flex-1" 
                  />
                  <button className="btn btn-primary">➕ Add</button>
                </div>
                
                {/* Selected Items */}
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h5 className="font-medium mb-2">Selected Items:</h5>
                    <div className="text-sm text-base-content/70">No items selected</div>
                    
                    <div className="divider"></div>
                    
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-success">$0.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-action">
              <button 
                className="btn"
                onClick={() => setShowNewSaleModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary">💳 Process Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}