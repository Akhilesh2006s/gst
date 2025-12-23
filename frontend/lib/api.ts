// API utility for making HTTP requests
import axios from 'axios';

// Normalize base URL and ensure `/api` prefix matches backend routes
// Default to Railway backend if env not provided
const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-f50e6.up.railway.app';
const normalizedBaseUrl = rawBaseUrl.replace(/\/$/, '');
const API_BASE_URL = normalizedBaseUrl.endsWith('/api') 
  ? normalizedBaseUrl 
  : `${normalizedBaseUrl}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5 second timeout to prevent hanging
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Don't redirect on 401 in Layout component - let it handle it
    // Only redirect if we're not already on login/register pages
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        // Only redirect if not on auth pages
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  registerCustomer: (data: any) => api.post('/auth/register/customer', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
};

// Products API
export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  updateStock: (id: string, quantity: number, type: string) => api.patch(`/products/${id}/stock`, { quantity, type }),
  getLowStock: () => api.get('/products/inventory/low-stock'),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
  getProducts: (customerId: string) => api.get(`/customers/${customerId}/products`),
  setPricing: (customerId: string, productId: string, price: number) => 
    api.post(`/customers/${customerId}/pricing`, { productId, price }),
  setBulkPricing: (customerId: string, pricing: Array<{ productId: string, price: number }>) =>
    api.post(`/customers/${customerId}/pricing/bulk`, { pricing }),
  getPricing: (customerId: string, productId: string) => 
    api.get(`/customers/${customerId}/pricing/${productId}`),
  deletePricing: (customerId: string, productId: string) =>
    api.delete(`/customers/${customerId}/pricing/${productId}`),
};

// Orders API
export const ordersAPI = {
  getAll: () => api.get('/orders'),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  updateStatus: (id: string, status: string) => api.patch(`/orders/${id}/status`, { status }),
  convertToInvoice: (id: string) => api.post(`/orders/${id}/convert-to-invoice`),
  delete: (id: string) => api.delete(`/orders/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  getPDF: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
};

// Import/Export API
export const importExportAPI = {
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import-export/import/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  importCustomers: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import-export/import/customers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  exportProducts: () => api.get('/import-export/export/products', { responseType: 'blob' }),
  exportCustomers: () => api.get('/import-export/export/customers', { responseType: 'blob' }),
  exportInvoices: (startDate?: string, endDate?: string) => 
    api.get('/import-export/export/invoices', { 
      params: { startDate, endDate },
      responseType: 'blob' 
    }),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: (month?: number, year?: number) => api.get('/dashboard', { params: { month, year } }),
  getSales: (month?: number, year?: number) => api.get('/dashboard/sales', { params: { month, year } }),
  getInventory: () => api.get('/dashboard/inventory'),
};

// Reports API
export const reportsAPI = {
  getSalesReport: (startDate: string, endDate: string) => 
    api.get('/reports/sales', { params: { startDate, endDate } }),
  getProfitLoss: (startDate: string, endDate: string) => 
    api.get('/reports/profit-loss', { params: { startDate, endDate } }),
  getProductSales: (startDate: string, endDate: string) => 
    api.get('/reports/product-sales', { params: { startDate, endDate } }),
  getGSTR1: (period: string) => api.get('/reports/gstr-1', { params: { period } }),
  getGSTR3B: (period: string) => api.get('/reports/gstr-3b', { params: { period } }),
  // Transaction Reports
  getSalesTransactions: (startDate: string, endDate: string) =>
    api.get('/reports/transactions/sales', { params: { startDate, endDate } }),
  getPurchaseTransactions: (startDate: string, endDate: string) =>
    api.get('/reports/transactions/purchases', { params: { startDate, endDate } }),
  // Bill-wise Reports
  getBillWiseItems: (startDate: string, endDate: string) =>
    api.get('/reports/bill-wise/items', { params: { startDate, endDate } }),
  // Item Reports
  getStockSummary: () => api.get('/reports/items/stock-summary'),
  getPLStatement: (startDate: string, endDate: string) =>
    api.get('/reports/items/pl-statement', { params: { startDate, endDate } }),
};

export default api;

