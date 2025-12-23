'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ordersAPI, invoicesAPI, authAPI } from '@/lib/api';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadData();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
      if (response.data.userType !== 'customer') {
        router.push('/dashboard');
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const loadData = async () => {
    try {
      const [ordersRes, invoicesRes] = await Promise.all([
        ordersAPI.getAll(),
        invoicesAPI.getAll()
      ]);
      setOrders(ordersRes.data.orders || []);
      setInvoices(invoicesRes.data.invoices || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Header */}
      <header style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--gray-200)',
        boxShadow: 'var(--shadow-sm)',
        padding: '1rem 2rem'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--black)'
          }}>
            Customer Portal
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--gray-700)' }}>👤 {user?.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem 0', maxWidth: '1280px', margin: '0 auto', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
              Welcome, {user?.name}
            </h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '1rem' }}>View your orders and invoices</p>
            <Link href="/catalog" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 1.5rem' }}>
              🛍️ Browse Products & Order
            </Link>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div className="card">
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Orders</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                {orders.length}
              </p>
            </div>
            <div className="card">
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Invoices</p>
              <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                {invoices.length}
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>🛒 Recent Orders</h3>
            {orders.length === 0 ? (
              <p style={{ color: 'var(--gray-600)', textAlign: 'center', padding: '2rem' }}>No orders yet</p>
            ) : (
              <div className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order: any) => (
                    <tr key={order._id || order.id}>
                      <td>#{order._id || order.id}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>₹{order.total?.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${order.status === 'completed' ? 'success' : 'warning'}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>🧾 Recent Invoices</h3>
            {invoices.length === 0 ? (
              <p style={{ color: 'var(--gray-600)', textAlign: 'center', padding: '2rem' }}>No invoices yet</p>
            ) : (
              <div className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((invoice: any) => (
                    <tr key={invoice._id || invoice.id}>
                      <td style={{ fontWeight: '500' }}>{invoice.invoiceNumber}</td>
                      <td>{new Date(invoice.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: '600' }}>₹{invoice.grandTotal?.toFixed(2)}</td>
                      <td>
                        <span className={`badge badge-${invoice.status === 'paid' ? 'success' : 'warning'}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={async () => {
                            try {
                              const response = await invoicesAPI.getPDF(invoice._id || invoice.id);
                              const blob = new Blob([response.data], { type: 'application/pdf' });
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `invoice-${invoice.invoiceNumber}.pdf`;
                              a.click();
                            } catch (error) {
                              alert('Failed to download PDF');
                            }
                          }}
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
      </main>
    </div>
  );
}

