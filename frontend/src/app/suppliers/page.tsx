'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([
    { id: 1, name: 'TechCorp Solutions', contact_person: 'John Smith', email: 'john@techcorp.com', phone: '+1-555-0123', status: 'Active' },
    { id: 2, name: 'Fashion Forward Ltd', contact_person: 'Sarah Johnson', email: 'sarah@fashion.com', phone: '+1-555-0124', status: 'Active' },
    { id: 3, name: 'Home & Garden Pro', contact_person: 'Mike Wilson', email: 'mike@homegarden.com', phone: '+1-555-0125', status: 'Inactive' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', email: '', phone: '', status: 'Active' });
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState('corporate');

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingSupplier) {
      // Update existing supplier
      setSuppliers(suppliers.map(s => 
        s.id === editingSupplier.id ? { ...s, ...newSupplier } : s
      ));
      setEditingSupplier(null);
    } else {
      // Add new supplier
      const newId = Math.max(...suppliers.map(s => s.id)) + 1;
      setSuppliers([...suppliers, { id: newId, ...newSupplier }]);
    }
    setShowModal(false);
    setNewSupplier({ name: '', contact_person: '', email: '', phone: '', status: 'Active' });
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setNewSupplier({ 
      name: supplier.name, 
      contact_person: supplier.contact_person, 
      email: supplier.email, 
      phone: supplier.phone, 
      status: supplier.status 
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
    setShowDeleteConfirm(null);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setNewSupplier({ name: '', contact_person: '', email: '', phone: '', status: 'Active' });
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
            <li><Link href="/suppliers" className="btn btn-ghost btn-active">Suppliers</Link></li>
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
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Add Supplier
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra bg-base-100 shadow-xl">
            <thead>
              <tr><th>Supplier Name</th><th>Contact Person</th><th>Email</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {suppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="font-bold">{supplier.name}</td>
                  <td>{supplier.contact_person}</td>
                  <td>{supplier.email}</td>
                  <td>{supplier.phone}</td>
                  <td>
                    <span className={`badge ${supplier.status === 'Active' ? 'badge-success' : 'badge-error'}`}>
                      {supplier.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-sm btn-outline btn-info"
                        onClick={() => handleEdit(supplier)}
                        title="Edit Supplier"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn btn-sm btn-outline btn-error"
                        onClick={() => setShowDeleteConfirm(supplier.id)}
                        title="Delete Supplier"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Name</span></label>
                  <input type="text" className="input input-bordered" value={newSupplier.name}
                    onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Contact Person</span></label>
                  <input type="text" className="input input-bordered" value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier({...newSupplier, contact_person: e.target.value})} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input type="email" className="input input-bordered" value={newSupplier.email}
                    onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})} required />
                </div>
                <div className="form-control">
                  <label className="label"><span className="label-text">Phone</span></label>
                  <input type="tel" className="input input-bordered" value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} required />
                </div>
                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text">Status</span></label>
                  <select 
                    className="select select-bordered" 
                    value={newSupplier.status}
                    onChange={(e) => setNewSupplier({...newSupplier, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {editingSupplier ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn" onClick={resetModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete this supplier? This action cannot be undone.</p>
            <div className="modal-action">
              <button 
                className="btn btn-error"
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete
              </button>
              <button 
                className="btn" 
                onClick={() => setShowDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}