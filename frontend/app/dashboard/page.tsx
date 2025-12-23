'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { dashboardAPI, authAPI } from '@/lib/api';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadDashboard();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      );
      
      const response = await Promise.race([
        authAPI.getCurrentUser(),
        timeoutPromise
      ]) as any;
      
      if (response?.data) {
        setUser(response.data);
      }
    } catch (error) {
      router.push('/login');
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Sales',
      value: `₹${dashboardData?.salesSummary?.totalSales?.toLocaleString() || '0'}`,
      icon: '💰',
      color: '#10b981',
      bgColor: '#d1fae5',
      link: '/invoices'
    },
    {
      title: 'Invoices',
      value: dashboardData?.salesSummary?.invoiceCount || '0',
      icon: '🧾',
      color: '#3b82f6',
      bgColor: '#dbeafe',
      link: '/invoices'
    },
    {
      title: 'GST Collected',
      value: `₹${dashboardData?.salesSummary?.gstCollected?.toLocaleString() || '0'}`,
      icon: '📊',
      color: '#8b5cf6',
      bgColor: '#ede9fe',
      link: '/reports'
    },
    {
      title: 'Customers',
      value: dashboardData?.customerCount || '0',
      icon: '👥',
      color: '#f59e0b',
      bgColor: '#fef3c7',
      link: '/customers'
    },
    {
      title: 'Products',
      value: dashboardData?.inventoryOverview?.totalProducts || '0',
      icon: '📦',
      color: '#ef4444',
      bgColor: '#fee2e2',
      link: '/products'
    },
    {
      title: 'Orders',
      value: dashboardData?.ordersCount || '0',
      icon: '🛒',
      color: '#06b6d4',
      bgColor: '#cffafe',
      link: '/orders'
    }
  ];

  const quickActions = [
    {
      title: 'Create Invoice',
      description: 'Generate new invoice',
      icon: '📝',
      link: '/invoices',
      color: '#3b82f6',
      bgColor: '#dbeafe'
    },
    {
      title: 'Add Product',
      description: 'Add new product',
      icon: '➕',
      link: '/products',
      color: '#10b981',
      bgColor: '#d1fae5'
    },
    {
      title: 'Add Customer',
      description: 'Register new customer',
      icon: '👤',
      link: '/customers',
      color: '#f59e0b',
      bgColor: '#fef3c7'
    },
    {
      title: 'View Reports',
      description: 'GST & sales reports',
      icon: '📈',
      link: '/reports',
      color: '#8b5cf6',
      bgColor: '#ede9fe'
    }
  ];

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div style={{ 
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '2.25rem', 
            fontWeight: '700', 
            color: 'var(--black)',
            marginBottom: '0.5rem',
            lineHeight: '1.2'
          }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '1rem' }}>
            Here's what's happening with your business today.
          </p>
        </div>
        <div style={{ 
          padding: '1rem 1.5rem',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 'var(--radius-lg)',
          color: 'white',
          textAlign: 'right'
        }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.25rem' }}>Today</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        {stats.map((stat, index) => (
          <Link key={index} href={stat.link} style={{ textDecoration: 'none' }}>
            <div className="card" style={{
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              border: 'none',
              background: 'var(--white)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow)';
            }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                background: stat.bgColor,
                borderRadius: '50%',
                transform: 'translate(30%, -30%)',
                opacity: 0.5
              }}></div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-600)',
                    marginBottom: '0.75rem',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {stat.title}
                  </p>
                  <p style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: '700', 
                    color: stat.color,
                    margin: 0,
                    lineHeight: '1.2'
                  }}>
                    {stat.value}
                  </p>
                </div>
                <div style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: 'var(--radius-lg)',
                  background: stat.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: '600', 
          color: 'var(--black)',
          marginBottom: '1.5rem'
        }}>
          ⚡ Quick Actions
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          {quickActions.map((action, index) => (
            <Link key={index} href={action.link} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '1.25rem',
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-200)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--gray-200)';
              }}
              >
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: 'var(--radius)',
                  background: action.bgColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  flexShrink: 0
                }}>
                  {action.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: 'var(--black)',
                    marginBottom: '0.25rem'
                  }}>
                    {action.title}
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--gray-600)',
                    margin: 0
                  }}>
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        {/* Inventory Overview */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--black)' }}>
              📦 Inventory Overview
            </h2>
            <Link href="/products" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              View All →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            <div style={{
              padding: '1rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500' }}>Total Products</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                {dashboardData?.inventoryOverview?.totalProducts || '0'}
              </p>
            </div>
            <div style={{
              padding: '1rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500' }}>Stock Value</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                ₹{dashboardData?.inventoryOverview?.stockValue?.toLocaleString() || '0'}
              </p>
            </div>
            <div style={{
              padding: '1rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius)',
              textAlign: 'center'
            }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '500' }}>Low Stock</p>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ef4444', margin: 0 }}>
                {dashboardData?.inventoryOverview?.lowStockCount || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        {dashboardData?.lowStockProducts?.length > 0 ? (
          <div className="card" style={{ border: '2px solid #fef3c7', background: '#fffbeb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--black)' }}>
                Low Stock Alert
              </h2>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {dashboardData.lowStockProducts.slice(0, 5).map((product: any, idx: number) => (
                <div key={product._id || product.id || idx} style={{
                  padding: '0.75rem',
                  background: 'var(--white)',
                  borderRadius: 'var(--radius)',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--gray-200)'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--black)' }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', margin: 0 }}>
                      {product.stock} {product.unit || 'pcs'} / Min: {product.minStock} {product.unit || 'pcs'}
                    </p>
                  </div>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Low</span>
                </div>
              ))}
            </div>
            {dashboardData.lowStockProducts.length > 5 && (
              <Link href="/products" style={{
                display: 'block',
                textAlign: 'center',
                marginTop: '1rem',
                color: 'var(--black)',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                View all {dashboardData.lowStockProducts.length} low stock items →
              </Link>
            )}
          </div>
        ) : (
          <div className="card" style={{ background: 'var(--gray-50)', border: '1px dashed var(--gray-300)' }}>
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', margin: 0 }}>
                All products are well stocked!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      {dashboardData?.recentInvoices?.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--black)' }}>
              📋 Recent Invoices
            </h2>
            <Link href="/invoices" className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
              View All →
            </Link>
          </div>
          <div className="table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.recentInvoices.slice(0, 10).map((invoice: any) => (
                <tr key={invoice._id || invoice.id}>
                  <td style={{ fontWeight: '600', color: 'var(--black)' }}>{invoice.invoiceNumber}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{new Date(invoice.date).toLocaleDateString()}</td>
                  <td>{invoice.customerId?.name || 'N/A'}</td>
                  <td style={{ fontWeight: '600', color: 'var(--black)' }}>₹{invoice.grandTotal?.toFixed(2)}</td>
                  <td>
                    <span className={`badge badge-${invoice.status === 'paid' ? 'success' : invoice.status === 'pending' ? 'warning' : 'info'}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </div>
        </div>
      )}

      {/* Empty State for Recent Invoices */}
      {(!dashboardData?.recentInvoices || dashboardData.recentInvoices.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.5rem' }}>
            No invoices yet
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: '1.5rem' }}>
            Start by creating your first invoice
          </p>
          <Link href="/invoices" className="btn btn-primary">
            Create Invoice
          </Link>
        </div>
      )}
    </div>
  );
}
