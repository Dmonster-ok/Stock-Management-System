'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { reportsAPI } from '@/lib/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState('corporate');
  const [loading, setLoading] = useState(true);

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
            <li><Link href="/reports" className="btn btn-ghost">Reports</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              Theme: {currentTheme}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-base-content max-h-96 overflow-y-auto">
              {['light', 'dark', 'corporate', 'business', 'cyberpunk', 'retro', 'synthwave', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula'].map((theme) => (
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
              <li><div className="px-4 py-1 text-xs text-base-content/50">Role: {user?.role}</div></li>
              <div className="divider my-1"></div>
              <li><a>Profile</a></li>
              <li><a>Settings</a></li>
              <li><a onClick={handleLogout} className="text-error">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-base-content mb-2">Dashboard</h1>
          <p className="text-base-content/70">Welcome to your Stock Management System</p>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Total Products</h2>
                  <p className="text-3xl font-bold">{dashboardData?.inventory?.totalProducts || 0}</p>
                </div>
                <div className="text-4xl opacity-80">📦</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Low Stock</h2>
                  <p className="text-3xl font-bold">{dashboardData?.inventory?.lowStockProducts || 0}</p>
                </div>
                <div className="text-4xl opacity-80">⚠️</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Today's Sales</h2>
                  <p className="text-3xl font-bold">${dashboardData?.sales?.todayTotal?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-4xl opacity-80">💰</div>
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-r from-red-500 to-red-600 text-white shadow-xl">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="card-title text-white/90">Unpaid Amount</h2>
                  <p className="text-3xl font-bold">${dashboardData?.sales?.unpaidTotal?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-4xl opacity-80">📄</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">🚀 Quick Actions</h2>
              <div className="grid grid-cols-2 gap-4">
                <button className="btn btn-primary btn-outline">
                  ➕ Add Product
                </button>
                <button className="btn btn-secondary btn-outline">
                  🛒 New Sale
                </button>
                <button className="btn btn-success btn-outline">
                  📈 Stock In
                </button>
                <button className="btn btn-warning btn-outline">
                  📉 Stock Out
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-primary mb-4">📋 Recent Activity</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-8 h-8">
                        <span className="text-xs">📱</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">New product added</p>
                      <p className="text-sm text-base-content/70">Samsung Galaxy S24</p>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/50">2 min ago</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-success text-success-content rounded-full w-8 h-8">
                        <span className="text-xs">💰</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Sale completed</p>
                      <p className="text-sm text-base-content/70">Invoice #INV-20250906-002</p>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/50">5 min ago</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="avatar placeholder">
                      <div className="bg-warning text-warning-content rounded-full w-8 h-8">
                        <span className="text-xs">📈</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Stock updated</p>
                      <p className="text-sm text-base-content/70">Cotton T-Shirt restocked</p>
                    </div>
                  </div>
                  <div className="text-xs text-base-content/50">10 min ago</div>
                </div>
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-sm">View All</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
