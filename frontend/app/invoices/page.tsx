'use client';

import { useEffect, useState } from 'react';
import { invoicesAPI, customersAPI, productsAPI } from '@/lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', quantity: '', unitPrice: '' }],
  });

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadProducts();
  }, []);

  const loadInvoices = async () => {
    try {
      const response = await invoicesAPI.getAll();
      setInvoices(response.data.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', quantity: '', unitPrice: '' }]
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'productId') {
      const product = products.find(p => (p._id || p.id) === value);
      if (product) {
        newItems[index].unitPrice = product.price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const invoiceData = {
        customerId: formData.customerId,
        date: formData.date,
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        }))
      };
      
      await invoicesAPI.create(invoiceData);
      setShowForm(false);
      setFormData({
        customerId: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ productId: '', quantity: '', unitPrice: '' }],
      });
      loadInvoices();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      const response = await invoicesAPI.getPDF(invoiceId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      a.click();
    } catch (error) {
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            Invoices
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Create and manage your invoices</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        >
          {showForm ? '✕ Cancel' : '+ Create Invoice'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Create New Invoice</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Customer *</label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="form-input"
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label">Items</label>
                <button type="button" onClick={handleAddItem} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                  + Add Item
                </button>
              </div>
              {formData.items.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <select
                    value={item.productId}
                    onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    required
                    className="form-input"
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p._id || p.id} value={p._id || p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Quantity"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                    className="form-input"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    required
                    className="form-input"
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Create Invoice
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No invoices yet</p>
            <p>Create your first invoice to get started!</p>
          </div>
        ) : (
          <div className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice._id || invoice.id}>
                  <td style={{ fontWeight: '500' }}>{invoice.invoiceNumber}</td>
                  <td>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{invoice.customerId?.name || '-'}</td>
                  <td style={{ fontWeight: '600' }}>₹{invoice.grandTotal?.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'info'}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleDownloadPDF(invoice._id || invoice.id)}
                      className="btn btn-success"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </div>
        )}
      </div>
    </div>
  );
}
