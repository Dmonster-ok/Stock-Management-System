'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { productsAPI, categoriesAPI, unitTypesAPI, productBatchesAPI } from '@/lib/api';

interface Product {
  id: number;
  name: string;
  sku?: string;
  barcode?: string;
  description: string;
  category_id: number;
  category_name: string;
  unit_type_id?: number;
  unit_name?: string;
  unit_abbr?: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  maximum_stock?: number;
  reorder_point?: number;
  has_batches: boolean;
  has_expiry: boolean;
  shelf_life_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: number;
  name: string;
  description?: string;
}

interface UnitType {
  id: number;
  name: string;
  abbreviation: string;
  type: string;
  base_unit: boolean;
  conversion_factor: number;
}

interface ProductBatch {
  id: number;
  product_id: number;
  batch_number: string;
  quantity: number;
  available_quantity: number;
  cost_price?: number;
  manufacture_date?: string;
  expiry_date?: string;
  supplier_id?: number;
  supplier_name?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export default function ProductsPage() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedProductBatches, setSelectedProductBatches] = useState<ProductBatch[]>([]);
  const [currentTheme, setCurrentTheme] = useState('corporate');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: '',
    unit_type_id: '',
    cost_price: '',
    selling_price: '',
    current_stock: '',
    minimum_stock: '',
    maximum_stock: '',
    reorder_point: '',
    has_batches: false,
    has_expiry: false,
    shelf_life_days: ''
  });

  // Theme change function
  const changeTheme = (theme: string) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleLogout = () => {
    logout();
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, unitTypesRes] = await Promise.all([
        productsAPI.getAll(),
        categoriesAPI.getAll(),
        unitTypesAPI.getAll()
      ]);
      setProducts(productsRes.data || []);
      setCategories(categoriesRes.data || []);
      setUnitTypes(unitTypesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: '',
      unit_type_id: '',
      cost_price: '',
      selling_price: '',
      current_stock: '',
      minimum_stock: '',
      maximum_stock: '',
      reorder_point: '',
      has_batches: false,
      has_expiry: false,
      shelf_life_days: ''
    });
    setEditingProduct(null);
  };

  // Open add modal
  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description,
      category_id: product.category_id.toString(),
      unit_type_id: product.unit_type_id?.toString() || '',
      cost_price: product.cost_price.toString(),
      selling_price: product.selling_price.toString(),
      current_stock: product.current_stock.toString(),
      minimum_stock: product.minimum_stock.toString(),
      maximum_stock: product.maximum_stock?.toString() || '',
      reorder_point: product.reorder_point?.toString() || '',
      has_batches: product.has_batches,
      has_expiry: product.has_expiry,
      shelf_life_days: product.shelf_life_days?.toString() || ''
    });
    setEditingProduct(product);
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const productData = {
        ...formData,
        category_id: parseInt(formData.category_id),
        unit_type_id: formData.unit_type_id ? parseInt(formData.unit_type_id) : null,
        cost_price: parseFloat(formData.cost_price),
        selling_price: parseFloat(formData.selling_price),
        current_stock: parseFloat(formData.current_stock),
        minimum_stock: parseFloat(formData.minimum_stock),
        maximum_stock: formData.maximum_stock ? parseFloat(formData.maximum_stock) : null,
        reorder_point: formData.reorder_point ? parseFloat(formData.reorder_point) : null,
        shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : null
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, productData);
      } else {
        await productsAPI.create(productData);
      }
      
      setShowModal(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product');
    }
  };

  // Delete product
  const deleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await productsAPI.delete(product.id);
        await loadData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  // View product batches
  const viewBatches = async (product: Product) => {
    try {
      const batches = await productBatchesAPI.getByProduct(product.id);
      setSelectedProductBatches(batches.data || []);
      setShowBatchModal(true);
    } catch (error) {
      console.error('Error loading batches:', error);
      alert('Error loading batches');
    }
  };

  // Filter products
  const filteredProducts = (products || []).filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         product.category_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category_id.toString() === selectedCategory;
    
    const matchesStock = !stockFilter ||
                        (stockFilter === 'low' && product.current_stock <= product.minimum_stock) ||
                        (stockFilter === 'in_stock' && product.current_stock > product.minimum_stock);
    
    return matchesSearch && matchesCategory && matchesStock;
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
            <li><Link href="/products" className="btn btn-ghost btn-active">Products</Link></li>
            <li><Link href="/categories" className="btn btn-ghost">Categories</Link></li>
            <li><Link href="/suppliers" className="btn btn-ghost">Suppliers</Link></li>
            <li><Link href="/sales" className="btn btn-ghost">Sales</Link></li>
            <li><Link href="/stock" className="btn btn-ghost">Stock</Link></li>
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

      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Products</h1>
            <p className="text-base-content/70">Manage your product inventory with enhanced features</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={openAddModal}
          >
            ➕ Add Product
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card bg-base-100 shadow-sm mb-6">
          <div className="card-body">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="form-control flex-1">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Search products by name, SKU, or description..."
                    className="input input-bordered flex-1"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button className="btn btn-square btn-primary">
                    🔍
                  </button>
                </div>
              </div>
              <select 
                className="select select-bordered"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select 
                className="select select-bordered"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="in_stock">In Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="card-body">
                  {/* Product Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h2 className="card-title text-lg">{product.name}</h2>
                      {product.sku && (
                        <p className="text-sm text-base-content/60">SKU: {product.sku}</p>
                      )}
                    </div>
                    <div className={`badge ${
                      product.current_stock <= product.minimum_stock 
                        ? 'badge-error' 
                        : product.current_stock <= product.minimum_stock * 2
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}>
                      {product.current_stock <= product.minimum_stock ? 'Low Stock' : 'In Stock'}
                    </div>
                  </div>
                  
                  {/* Product Details */}
                  <p className="text-base-content/70 text-sm mb-3">{product.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Category:</span>
                      <span className="badge badge-outline">{product.category_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Unit:</span>
                      <span>{product.unit_name || 'N/A'} ({product.unit_abbr || '-'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Cost Price:</span>
                      <span className="font-medium">${product.cost_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Selling Price:</span>
                      <span className="font-medium text-success">${product.selling_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/70">Stock:</span>
                      <span className={`font-medium ${
                        product.current_stock <= product.minimum_stock ? 'text-error' : 'text-success'
                      }`}>
                        {product.current_stock} / {product.minimum_stock} min
                      </span>
                    </div>
                    {product.has_batches && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Batches:</span>
                        <span className="badge badge-info">Tracked</span>
                      </div>
                    )}
                    {product.has_expiry && (
                      <div className="flex justify-between">
                        <span className="text-base-content/70">Expiry:</span>
                        <span className="badge badge-warning">Tracked</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="card-actions justify-end mt-4 gap-2">
                    {product.has_batches && (
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => viewBatches(product)}
                      >
                        📦 Batches
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-outline"
                      onClick={() => openEditModal(product)}
                    >
                      📝 Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-error"
                      onClick={() => deleteProduct(product)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-base-content/60">No products found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
}