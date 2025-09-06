'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Categories() {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Electronics', description: 'Electronic devices', productCount: 45 },
    { id: 2, name: 'Clothing', description: 'Fashion items', productCount: 32 },
    { id: 3, name: 'Home & Garden', description: 'Home supplies', productCount: 28 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [currentTheme, setCurrentTheme] = useState('corporate');

  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingCategory) {
      // Update existing category
      setCategories(categories.map(c => 
        c.id === editingCategory.id ? { ...c, name: newCategory.name, description: newCategory.description } : c
      ));
      setEditingCategory(null);
    } else {
      // Add new category
      const newId = Math.max(...categories.map(c => c.id)) + 1;
      setCategories([...categories, { id: newId, ...newCategory, productCount: 0 }]);
    }
    setShowModal(false);
    setNewCategory({ name: '', description: '' });
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setNewCategory({ name: category.name, description: category.description });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    setCategories(categories.filter(c => c.id !== id));
    setShowDeleteConfirm(null);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setNewCategory({ name: '', description: '' });
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
            <li><Link href="/categories" className="btn btn-ghost btn-active">Categories</Link></li>
            <li><Link href="/suppliers" className="btn btn-ghost">Suppliers</Link></li>
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
          <h1 className="text-3xl font-bold">Categories</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div key={category.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">{category.name}</h2>
                <p>{category.description}</p>
                <div className="stat">
                  <div className="stat-title">Products</div>
                  <div className="stat-value text-2xl">{category.productCount}</div>
                </div>
                <div className="card-actions justify-end">
                  <button 
                    className="btn btn-sm btn-outline btn-info"
                    onClick={() => handleEdit(category)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-outline btn-error"
                    onClick={() => setShowDeleteConfirm(category.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-4">
                <label className="label"><span className="label-text">Name</span></label>
                <input type="text" className="input input-bordered" value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} required />
              </div>
              <div className="form-control mb-6">
                <label className="label"><span className="label-text">Description</span></label>
                <textarea className="textarea textarea-bordered" value={newCategory.description}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} required />
              </div>
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update' : 'Create'}
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
            <p className="mb-4">Are you sure you want to delete this category? This action cannot be undone.</p>
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