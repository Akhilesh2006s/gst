'use client';

import { useEffect, useState, useRef } from 'react';
import { productsAPI, importExportAPI } from '@/lib/api';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsnCode: '',
    price: '',
    purchasePrice: '',
    gstRate: '',
    stock: '',
    minStock: '',
    unit: 'pcs',
    category: '',
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await productsAPI.create(formData);
      setShowForm(false);
      setFormData({
        name: '', sku: '', hsnCode: '', price: '', purchasePrice: '',
        gstRate: '', stock: '', minStock: '', unit: 'pcs', category: '',
      });
      loadProducts();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create product');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      alert('Please upload a valid Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setUploading(true);
    try {
      const response = await importExportAPI.importProducts(file);
      alert(`Successfully imported ${response.data.imported} products!`);
      loadProducts();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to import products');
    } finally {
      setUploading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await importExportAPI.exportProducts();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to export products');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.5rem' }}>
            Products
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Manage your product catalog and inventory</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <label className="btn btn-secondary" style={{ cursor: 'pointer', position: 'relative' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            {uploading ? '⏳ Uploading...' : '📤 Bulk Upload'}
          </label>
          <button
            onClick={handleExport}
            className="btn btn-secondary"
          >
            📥 Export
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            {showForm ? '✕ Cancel' : '+ Add Product'}
          </button>
        </div>
      </div>

      {/* Upload Instructions */}
      <div className="card" style={{ marginBottom: '2rem', background: 'var(--gray-50)', border: '1px solid var(--gray-200)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--black)' }}>
          📋 Bulk Upload Instructions
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Supported formats:</strong> Excel (.xlsx, .xls) or CSV files
          </p>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Vegetable format:</strong> The system supports vegetable format with columns:
          </p>
          <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }}>
            <li>Vegetable Name (English)</li>
            <li>Vegetable Name (Hindi)</li>
            <li>Quantity (gm) or Quantity (kg)</li>
            <li>Rate (per unit/gm) or Rate (per kg)</li>
          </ul>
          <p style={{ marginBottom: '0.5rem' }}>
            <strong>Standard format:</strong> Name, SKU, HSN Code, Price, Purchase Price, GST Rate, Stock, Min Stock, Unit, Category, Name (Hindi)
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray-500)' }}>
            Note: For vegetables, the system will automatically set unit to 'kg' and category to 'vegetables'
          </p>
        </div>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Add New Product</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="form-input"
                  placeholder="Enter product name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="form-input"
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="form-group">
                <label className="form-label">HSN Code</label>
                <input
                  type="text"
                  value={formData.hsnCode}
                  onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  className="form-input"
                  placeholder="Enter HSN code"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label className="form-label">GST Rate (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.gstRate}
                  onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                  required
                  className="form-input"
                  placeholder="18"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Min Stock Level</label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="form-input"
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="form-input"
                >
                  <option value="pcs">Pieces</option>
                  <option value="kg">Kilogram</option>
                  <option value="g">Gram</option>
                  <option value="ltr">Liter</option>
                  <option value="box">Box</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                  placeholder="Product category"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Product
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No products yet</p>
            <p>Add your first product to get started!</p>
          </div>
        ) : (
          <div className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>HSN</th>
                <th>Price</th>
                <th>GST %</th>
                <th>Stock</th>
                <th>Unit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const isLowStock = product.stock <= product.minStock;
                return (
                  <tr key={product._id || product.id}>
                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                    <td>{product.sku || '-'}</td>
                    <td>{product.hsnCode || '-'}</td>
                    <td style={{ fontWeight: '600' }}>₹{product.price?.toFixed(2)}</td>
                    <td>{product.gstRate}%</td>
                    <td>
                      <span style={{ fontWeight: isLowStock ? '600' : '400', color: isLowStock ? 'var(--black)' : 'inherit' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>{product.unit}</td>
                    <td>
                      {isLowStock && (
                        <span className="badge badge-danger">Low Stock</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </div>
        )}
      </div>
    </div>
  );
}
