'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Stock() {
  const [transactions, setTransactions] = useState([
    { id: 1, product_name: 'Samsung Galaxy S24', type: 'IN', quantity: 50, notes: 'New stock', created_at: '2024-03-01T10:30:00', user: 'Admin' },
    { id: 2, product_name: 'Cotton T-Shirt', type: 'OUT', quantity: 15, notes: 'Sale', created_at: '2024-03-01T14:20:00', user: 'Staff' },
    { id: 3, product_name: 'Gaming Laptop', type: 'ADJUSTMENT', quantity: -2, notes: 'Damaged', created_at: '2024-03-02T09:15:00', user: 'Manager' }
  ]);
  const [products] = useState([
    { id: 1, name: 'Samsung Galaxy S24', current_stock: 125 },
    { id: 2, name: 'Cotton T-Shirt', current_stock: 85 },
    { id: 3, name: 'Gaming Laptop', current_stock: 23 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ product_id: '', type: 'IN', quantity: '', notes: '' });
  const [currentTheme, setCurrentTheme] = useState('corporate');

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const product = products.find(p => p.id === parseInt(newTransaction.product_id));
    if (!product) return;

    const newId = Math.max(...transactions.map(t => t.id)) + 1;
    const newTrans = {
      id: newId, product_name: product.name, type: newTransaction.type,
      quantity: parseInt(newTransaction.quantity), notes: newTransaction.notes,
      created_at: new Date().toISOString(), user: 'Current User'
    };
    setTransactions([newTrans, ...transactions]);
    setShowModal(false);
    setNewTransaction({ product_id: '', type: 'IN', quantity: '', notes: '' });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'IN': return 'badge-success';
      case 'OUT': return 'badge-error';
      case 'ADJUSTMENT': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="min-h-screen bg-base-200" data-theme={currentTheme}>
      <div className="navbar bg-primary text-primary-content shadow-lg">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold">📦 Stock Manager</Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/products" className="btn btn-ghost">Products</Link></li>
            <li><Link href="/categories" className="btn btn-ghost">Categories</Link></li>
            <li><Link href="/suppliers" className="btn btn-ghost">Suppliers</Link></li>
            <li><Link href="/sales" className="btn btn-ghost">Sales</Link></li>
            <li><Link href="/stock" className="btn btn-ghost btn-active">Stock</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              Theme: {currentTheme}
            </div>
            <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow text-base-content max-h-96 overflow-y-auto">
              {['light', 'dark', 'corporate', 'business', 'cyberpunk', 'retro', 'synthwave', 'valentine'].map((theme) => (
                <li key={theme}>
                  <a onClick={() => changeTheme(theme)} className={currentTheme === theme ? 'active' : ''}>
                    {theme.charAt(0).toUpperCase() + theme.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Stock Management</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>📝 Add Transaction</button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Current Stock Levels</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title text-lg">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{product.current_stock}</span>
                    <span className={`badge ${product.current_stock < 20 ? 'badge-error' : product.current_stock < 50 ? 'badge-warning' : 'badge-success'}`}>
                      {product.current_stock < 20 ? 'Low Stock' : product.current_stock < 50 ? 'Medium' : 'In Stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Stock Transactions</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra bg-base-100 shadow-xl">
            <thead>
              <tr><th>Date & Time</th><th>Product</th><th>Type</th><th>Quantity</th><th>User</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</div>
                    <div className="text-sm opacity-70">{new Date(transaction.created_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="font-medium">{transaction.product_name}</td>
                  <td><span className={`badge ${getTypeColor(transaction.type)}`}>{transaction.type}</span></td>
                  <td>
                    <span className={`font-bold ${transaction.type === 'IN' ? 'text-success' : transaction.type === 'OUT' ? 'text-error' : 'text-warning'}`}>
                      {transaction.type === 'IN' ? `+${transaction.quantity}` : transaction.type === 'OUT' ? `-${transaction.quantity}` : `${transaction.quantity}`}
                    </span>
                  </td>
                  <td>{transaction.user}</td>
                  <td>{transaction.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add Stock Transaction</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Product</span></label>
                <select className="select select-bordered" value={newTransaction.product_id}
                  onChange={(e) => setNewTransaction({...newTransaction, product_id: e.target.value})} required>
                  <option value="">Select Product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} (Stock: {product.current_stock})</option>
                  ))}
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Type</span></label>
                <select className="select select-bordered" value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}>
                  <option value="IN">Stock In (+)</option>
                  <option value="OUT">Stock Out (-)</option>
                  <option value="ADJUSTMENT">Adjustment (±)</option>
                </select>
              </div>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Quantity</span></label>
                <input type="number" className="input input-bordered" value={newTransaction.quantity}
                  onChange={(e) => setNewTransaction({...newTransaction, quantity: e.target.value})} min="1" required />
              </div>
              <div className="form-control mb-6">
                <label className="label"><span className="label-text">Notes</span></label>
                <textarea className="textarea textarea-bordered" value={newTransaction.notes}
                  onChange={(e) => setNewTransaction({...newTransaction, notes: e.target.value})} />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">Add Transaction</button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}