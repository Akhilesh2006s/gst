'use client';

import { useEffect, useState } from 'react';
import { customersAPI } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [customerProducts, setCustomerProducts] = useState<any[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', gstin: '', companyName: '', state: '', address: '',
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersAPI.getAll();
      setCustomers(response.data.customers || []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customersAPI.create(formData);
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', gstin: '', companyName: '', state: '', address: '' });
      loadCustomers();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create customer');
    }
  };

  const handleSetPricing = async (customer: any) => {
    setSelectedCustomer(customer);
    setShowPricingModal(true);
    setPricingLoading(true);
    
    try {
      const response = await customersAPI.getProducts(customer._id || customer.id);
      setCustomerProducts(response.data.products || []);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to load products');
      setShowPricingModal(false);
    } finally {
      setPricingLoading(false);
    }
  };

  const handlePriceChange = (productId: string, price: number) => {
    setCustomerProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, customPrice: price || null } : p
    ));
  };

  const handleSavePricing = async () => {
    if (!selectedCustomer) return;

    try {
      // Filter only products with custom prices set
      const pricing = customerProducts
        .filter(p => p.customPrice !== null && p.customPrice !== undefined && p.customPrice !== '')
        .map(p => ({
          productId: p._id,
          price: parseFloat(p.customPrice)
        }));

      if (pricing.length === 0) {
        alert('Please set at least one custom price');
        return;
      }

      await customersAPI.setBulkPricing(selectedCustomer._id || selectedCustomer.id, pricing);
      alert('Pricing saved successfully!');
      setShowPricingModal(false);
      setSelectedCustomer(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save pricing');
    }
  };

  const handleRemovePricing = async (productId: string) => {
    if (!selectedCustomer) return;
    
    try {
      await customersAPI.deletePricing(selectedCustomer._id || selectedCustomer.id, productId);
      handlePriceChange(productId, 0);
      alert('Custom price removed');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to remove pricing');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.5rem' }}>
            Customers
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Manage your customer database and pricing</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
        >
          {showForm ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>Add New Customer</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">GSTIN</label>
                <input type="text" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input type="text" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">State</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className="form-input" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="form-input" rows={3} style={{ resize: 'vertical' }} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Customer</button>
          </form>
        </div>
      )}

      <div className="card">
        {customers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No customers yet</p>
            <p>Add your first customer to get started!</p>
          </div>
        ) : (
          <div className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Company</th>
                <th>GSTIN</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id || customer.id}>
                  <td style={{ fontWeight: '500' }}>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.companyName || '-'}</td>
                  <td>{customer.gstin || '-'}</td>
                  <td>{customer.state || '-'}</td>
                  <td>
                    <button
                      onClick={() => handleSetPricing(customer)}
                      className="btn btn-primary"
                      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                    >
                      💰 Set Pricing
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedCustomer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}
        onClick={() => setShowPricingModal(false)}
        >
          <div className="card" style={{
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPricingModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--gray-600)',
                zIndex: 1
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--black)' }}>
              Set Custom Pricing for {selectedCustomer.name}
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Set custom prices for products visible to this customer. Leave empty to use default price.
            </p>

            {pricingLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                <p style={{ color: 'var(--gray-600)' }}>Loading products...</p>
              </div>
            ) : customerProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
                <p>No products available</p>
              </div>
            ) : (
              <>
                <div className="table" style={{ marginBottom: '1.5rem' }}>
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>Default Price</th>
                      <th>Custom Price</th>
                      <th>Stock</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerProducts.map((product) => (
                      <tr key={product._id}>
                        <td style={{ fontWeight: '500' }}>{product.name}</td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{product.sku || '-'}</td>
                        <td style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>{product.category || '-'}</td>
                        <td style={{ fontWeight: '600' }}>₹{product.defaultPrice.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            value={product.customPrice || ''}
                            onChange={(e) => handlePriceChange(product._id, parseFloat(e.target.value) || 0)}
                            placeholder="Enter price"
                            min="0"
                            step="0.01"
                            className="form-input"
                            style={{ width: '120px', padding: '0.5rem' }}
                          />
                        </td>
                        <td style={{ fontSize: '0.875rem' }}>
                          {product.stock} {product.unit || 'pcs'}
                        </td>
                        <td>
                          {product.customPrice && (
                            <button
                              onClick={() => handleRemovePricing(product._id)}
                              className="btn btn-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePricing}
                    className="btn btn-primary"
                  >
                    Save Pricing
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
