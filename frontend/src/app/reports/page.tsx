'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { reportsAPI, productsAPI, categoriesAPI, suppliersAPI } from '@/lib/api';

export default function ReportsPage() {
  const { user, logout } = useAuth();
  const [currentTheme, setCurrentTheme] = useState('corporate');
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState('inventory');
  const [reportData, setReportData] = useState<any>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    category_id: '',
    supplier_id: '',
    product_id: '',
    status: '',
    payment_status: '',
    transaction_type: '',
    low_stock_only: false
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const [productsRes, categoriesRes, suppliersRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        suppliersAPI.getAll()
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setSuppliers(suppliersRes.data || []);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeReport) {
        case 'inventory':
          response = await reportsAPI.getInventory(filters);
          break;
        case 'sales':
          response = await reportsAPI.getSales(filters);
          break;
        case 'purchases':
          response = await reportsAPI.getPurchases(filters);
          break;
        case 'profit-loss':
          response = await reportsAPI.getProfitLoss(filters);
          break;
        case 'stock-movements':
          response = await reportsAPI.getStockMovements(filters);
          break;
        default:
          response = await reportsAPI.getInventory(filters);
      }
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const reports = [
    { id: 'inventory', name: 'Inventory Report', icon: '📦' },
    { id: 'sales', name: 'Sales Report', icon: '💰' },
    { id: 'purchases', name: 'Purchase Report', icon: '🛒' },
    { id: 'profit-loss', name: 'Profit & Loss', icon: '📊' },
    { id: 'stock-movements', name: 'Stock Movements', icon: '📈' }
  ];

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
              <li><Link href="/reports">Reports</Link></li>
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
            <li><Link href="/purchase-orders" className="btn btn-ghost">Purchase Orders</Link></li>
            <li><Link href="/sales" className="btn btn-ghost">Sales</Link></li>
            <li><Link href="/stock" className="btn btn-ghost">Stock</Link></li>
            <li><Link href="/reports" className="btn btn-ghost btn-active">Reports</Link></li>
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
            <h1 className="text-3xl font-bold text-base-content">Reports & Analytics</h1>
            <p className="text-base-content/70">Generate comprehensive business reports</p>
          </div>
          {reportData && (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-primary">
                📥 Export
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
                <li><a onClick={() => exportToCSV(reportData.items || reportData.invoices || reportData.purchaseOrders || reportData.transactions || [], activeReport)}>📄 Export to CSV</a></li>
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Selection */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title mb-4">Select Report</h2>
                <div className="space-y-2">
                  {reports.map(report => (
                    <button
                      key={report.id}
                      className={`btn btn-block justify-start ${activeReport === report.id ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setActiveReport(report.id)}
                    >
                      <span className="mr-2">{report.icon}</span>
                      {report.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="card bg-base-100 shadow-xl mt-6">
              <div className="card-body">
                <h2 className="card-title mb-4">Filters</h2>
                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Start Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={filters.start_date}
                      onChange={(e) => handleFilterChange('start_date', e.target.value)}
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">End Date</span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered input-sm"
                      value={filters.end_date}
                      onChange={(e) => handleFilterChange('end_date', e.target.value)}
                    />
                  </div>

                  {/* Category Filter */}
                  {['inventory', 'sales', 'stock-movements'].includes(activeReport) && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Category</span>
                      </label>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.category_id}
                        onChange={(e) => handleFilterChange('category_id', e.target.value)}
                      >
                        <option value="">All Categories</option>
                        {categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Supplier Filter */}
                  {['purchases'].includes(activeReport) && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Supplier</span>
                      </label>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.supplier_id}
                        onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
                      >
                        <option value="">All Suppliers</option>
                        {suppliers.map((sup: any) => (
                          <option key={sup.id} value={sup.id}>{sup.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status Filters */}
                  {activeReport === 'sales' && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Payment Status</span>
                      </label>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.payment_status}
                        onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Partial">Partial</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </div>
                  )}

                  {activeReport === 'purchases' && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Status</span>
                      </label>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                      >
                        <option value="">All Status</option>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Received">Received</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  )}

                  {activeReport === 'stock-movements' && (
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Transaction Type</span>
                      </label>
                      <select
                        className="select select-bordered select-sm"
                        value={filters.transaction_type}
                        onChange={(e) => handleFilterChange('transaction_type', e.target.value)}
                      >
                        <option value="">All Types</option>
                        <option value="In">Stock In</option>
                        <option value="Out">Stock Out</option>
                        <option value="Adjustment">Adjustment</option>
                      </select>
                    </div>
                  )}

                  {activeReport === 'inventory' && (
                    <div className="form-control">
                      <label className="cursor-pointer label">
                        <span className="label-text">Low Stock Only</span>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-primary"
                          checked={filters.low_stock_only}
                          onChange={(e) => handleFilterChange('low_stock_only', e.target.checked)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-block mt-4"
                  onClick={generateReport}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Generating...
                    </>
                  ) : (
                    '📊 Generate Report'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3">
            {reportData ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                {reportData.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Object.entries(reportData.summary).map(([key, value]: any) => (
                      <div key={key} className="stat bg-base-100 shadow rounded-lg">
                        <div className="stat-title">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase())}</div>
                        <div className="stat-value text-primary">
                          {typeof value === 'number' && key.includes('Amount') || key.includes('Value') || key.includes('Total') && !key.includes('Count') ? 
                            `$${value.toFixed(2)}` : 
                            value
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Data Table */}
                <div className="card bg-base-100 shadow-xl">
                  <div className="card-body">
                    <h2 className="card-title">Report Data</h2>
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            {reportData.items && reportData.items[0] && Object.keys(reportData.items[0]).map((key: string) => (
                              <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</th>
                            ))}
                            {reportData.invoices && reportData.invoices[0] && Object.keys(reportData.invoices[0]).map((key: string) => (
                              <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</th>
                            ))}
                            {reportData.purchaseOrders && reportData.purchaseOrders[0] && Object.keys(reportData.purchaseOrders[0]).map((key: string) => (
                              <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</th>
                            ))}
                            {reportData.transactions && reportData.transactions[0] && Object.keys(reportData.transactions[0]).map((key: string) => (
                              <th key={key}>{key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(reportData.items || reportData.invoices || reportData.purchaseOrders || reportData.transactions || []).slice(0, 100).map((row: any, index: number) => (
                            <tr key={index}>
                              {Object.values(row).map((value: any, cellIndex: number) => (
                                <td key={cellIndex}>
                                  {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(2) : value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold mb-2">No Report Generated</h3>
                    <p className="text-base-content/70 mb-4">Select a report type and click "Generate Report" to view data</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}