const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Generic API call function
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
};

// Products API
export const productsAPI = {
  getAll: () => apiCall('/products'),
  getById: (id) => apiCall(`/products/${id}`),
  create: (product) => apiCall('/products', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  update: (id, product) => apiCall(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  delete: (id) => apiCall(`/products/${id}`, { method: 'DELETE' }),
  search: (query) => apiCall(`/products/search?q=${encodeURIComponent(query)}`),
  lowStock: () => apiCall('/products/low-stock'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => apiCall('/categories'),
  getById: (id) => apiCall(`/categories/${id}`),
  create: (category) => apiCall('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  }),
  update: (id, category) => apiCall(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  }),
  delete: (id) => apiCall(`/categories/${id}`, { method: 'DELETE' }),
};

// Suppliers API
export const suppliersAPI = {
  getAll: () => apiCall('/suppliers'),
  getById: (id) => apiCall(`/suppliers/${id}`),
  create: (supplier) => apiCall('/suppliers', {
    method: 'POST',
    body: JSON.stringify(supplier),
  }),
  update: (id, supplier) => apiCall(`/suppliers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(supplier),
  }),
  delete: (id) => apiCall(`/suppliers/${id}`, { method: 'DELETE' }),
};

// Stock API
export const stockAPI = {
  getTransactions: () => apiCall('/stock'),
  addTransaction: (transaction) => apiCall('/stock', {
    method: 'POST',
    body: JSON.stringify(transaction),
  }),
  getById: (id) => apiCall(`/stock/${id}`),
};

// Sales/Invoice API
export const salesAPI = {
  getAll: () => apiCall('/sales'),
  getById: (id) => apiCall(`/sales/${id}`),
  create: (sale) => apiCall('/sales', {
    method: 'POST',
    body: JSON.stringify(sale),
  }),
  update: (id, sale) => apiCall(`/sales/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sale),
  }),
  delete: (id) => apiCall(`/sales/${id}`, { method: 'DELETE' }),
  getPending: () => apiCall('/sales/pending'),
  markPaid: (id) => apiCall(`/sales/${id}/paid`, { method: 'PUT' }),
};

// Unit Types API
export const unitTypesAPI = {
  getAll: () => apiCall('/unit-types'),
  getById: (id) => apiCall(`/unit-types/${id}`),
  getByType: (type) => apiCall(`/unit-types/type/${type}`),
  create: (unitType) => apiCall('/unit-types', {
    method: 'POST',
    body: JSON.stringify(unitType),
  }),
  update: (id, unitType) => apiCall(`/unit-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(unitType),
  }),
  delete: (id) => apiCall(`/unit-types/${id}`, { method: 'DELETE' }),
};

// Product Batches API
export const productBatchesAPI = {
  getAll: () => apiCall('/product-batches'),
  getById: (id) => apiCall(`/product-batches/${id}`),
  getByProduct: (productId) => apiCall(`/product-batches/product/${productId}`),
  getExpiring: (days) => apiCall(`/product-batches/expiring${days ? `?days=${days}` : ''}`),
  create: (batch) => apiCall('/product-batches', {
    method: 'POST',
    body: JSON.stringify(batch),
  }),
  update: (id, batch) => apiCall(`/product-batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(batch),
  }),
  updateQuantity: (id, quantity) => apiCall(`/product-batches/${id}/quantity`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  }),
  delete: (id) => apiCall(`/product-batches/${id}`, { method: 'DELETE' }),
};

// Purchase Orders API
export const purchaseOrdersAPI = {
  getAll: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/purchase-orders${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiCall(`/purchase-orders/${id}`),
  getStats: () => apiCall('/purchase-orders/stats'),
  create: (purchaseOrder) => apiCall('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(purchaseOrder),
  }),
  update: (id, purchaseOrder) => apiCall(`/purchase-orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(purchaseOrder),
  }),
  updateStatus: (id, status) => apiCall(`/purchase-orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  delete: (id) => apiCall(`/purchase-orders/${id}`, { method: 'DELETE' }),
  recordReceipt: (id, receiptData) => apiCall(`/purchase-orders/${id}/receipt`, {
    method: 'POST',
    body: JSON.stringify(receiptData),
  }),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => apiCall('/reports/dashboard'),
  getInventory: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/reports/inventory${queryString ? `?${queryString}` : ''}`);
  },
  getSales: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/reports/sales${queryString ? `?${queryString}` : ''}`);
  },
  getPurchases: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/reports/purchases${queryString ? `?${queryString}` : ''}`);
  },
  getProfitLoss: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/reports/profit-loss${queryString ? `?${queryString}` : ''}`);
  },
  getStockMovements: (params) => {
    const queryString = params ? new URLSearchParams(params).toString() : '';
    return apiCall(`/reports/stock-movements${queryString ? `?${queryString}` : ''}`);
  },
};

// Backup API
export const backupAPI = {
  getStatus: () => apiCall('/backup/status'),
  exportData: (tables) => {
    const queryString = tables ? `?tables=${tables.join(',')}` : '';
    return apiCall(`/backup/export${queryString}`);
  },
  importProducts: (data) => apiCall('/backup/import/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  importSuppliers: (data) => apiCall('/backup/import/suppliers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default { authAPI, productsAPI, categoriesAPI, suppliersAPI, stockAPI, salesAPI, unitTypesAPI, productBatchesAPI, purchaseOrdersAPI, reportsAPI, backupAPI };