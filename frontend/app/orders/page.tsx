'use client';

import { useEffect, useState } from 'react';
import { ordersAPI, invoicesAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await ordersAPI.getAll();
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await ordersAPI.updateStatus(orderId, status);
      loadOrders();
      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update order status');
    }
  };

  const createInvoiceFromOrder = async (order: any) => {
    try {
      // First convert order to invoice format
      const invoiceData = {
        customerId: order.customerId._id || order.customerId,
        items: order.items.map((item: any) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: 0 // Will be calculated from product
        })),
        notes: `Invoice created from order #${order._id || order.id}`
      };

      await invoicesAPI.create(invoiceData);
      alert('Invoice created successfully!');
      router.push('/invoices');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create invoice');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      'pending': '#f59e0b',
      'confirmed': '#3b82f6',
      'processing': '#8b5cf6',
      'on the way': '#06b6d4',
      'delivered': '#10b981',
      'completed': '#10b981',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      'pending': 'warning',
      'confirmed': 'info',
      'processing': 'info',
      'on the way': 'info',
      'delivered': 'success',
      'completed': 'success',
      'cancelled': 'danger'
    };
    return badges[status] || 'info';
  };

  const statusOptions = [
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'confirmed', label: 'Confirmed', icon: '✅' },
    { value: 'processing', label: 'Processing', icon: '⚙️' },
    { value: 'on the way', label: 'On the Way', icon: '🚚' },
    { value: 'delivered', label: 'Delivered', icon: '📦' },
    { value: 'completed', label: 'Completed', icon: '✔️' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--gray-600)' }}>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.5rem' }}>
          Orders Management
        </h1>
        <p style={{ color: 'var(--gray-600)' }}>View, manage, and track customer orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-600)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No orders yet</p>
          <p>Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {orders.map((order) => (
            <div key={order._id || order.id} className="card" style={{
              borderLeft: `4px solid ${getStatusColor(order.status)}`
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--black)' }}>
                      Order #{order._id?.toString().slice(-8) || order.id}
                    </h3>
                    <span className={`badge badge-${getStatusBadge(order.status)}`} style={{
                      background: getStatusColor(order.status) + '20',
                      color: getStatusColor(order.status),
                      borderColor: getStatusColor(order.status)
                    }}>
                      {order.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    Customer: <strong>{order.customerId?.name || 'N/A'}</strong>
                  </p>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    Date: {new Date(order.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                    Total: <strong style={{ color: 'var(--black)', fontSize: '1.125rem' }}>₹{order.total?.toFixed(2)}</strong>
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowDetails(true);
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Order Items Preview */}
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'var(--gray-50)', borderRadius: 'var(--radius)' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--black)' }}>
                  Items ({order.items?.length || 0}):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {order.items?.slice(0, 3).map((item: any, idx: number) => (
                    <span key={idx} style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--white)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--gray-200)'
                    }}>
                      {item.productName} (x{item.quantity})
                    </span>
                  ))}
                  {order.items?.length > 3 && (
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--white)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.75rem',
                      border: '1px solid var(--gray-200)'
                    }}>
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <select
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order._id || order.id, e.target.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--gray-300)',
                    background: 'var(--white)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: '150px'
                  }}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                
                {order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    onClick={() => createInvoiceFromOrder(order)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    📝 Create Invoice
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
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
        onClick={() => setShowDetails(false)}
        >
          <div className="card" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDetails(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: 'var(--gray-600)'
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--black)' }}>
              Order Details
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Order ID: <strong>{selectedOrder._id || selectedOrder.id}</strong>
              </p>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Customer: <strong>{selectedOrder.customerId?.name || 'N/A'}</strong>
              </p>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Email: <strong>{selectedOrder.customerId?.email || 'N/A'}</strong>
              </p>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                Phone: <strong>{selectedOrder.customerId?.phone || 'N/A'}</strong>
              </p>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Date: <strong>{new Date(selectedOrder.createdAt).toLocaleString()}</strong>
              </p>
              <div style={{ display: 'inline-block' }}>
                <span className={`badge badge-${getStatusBadge(selectedOrder.status)}`} style={{
                  background: getStatusColor(selectedOrder.status) + '20',
                  color: getStatusColor(selectedOrder.status),
                  borderColor: getStatusColor(selectedOrder.status)
                }}>
                  {selectedOrder.status}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--black)' }}>
                Order Items
              </h3>
              <div className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td>{item.productName}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unitPrice?.toFixed(2)}</td>
                      <td style={{ fontWeight: '600' }}>₹{(item.quantity * item.unitPrice)?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </div>
            </div>

            <div style={{
              padding: '1rem',
              background: 'var(--gray-50)',
              borderRadius: 'var(--radius)',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: '600' }}>
                <span>Total Amount:</span>
                <span>₹{selectedOrder.total?.toFixed(2)}</span>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--black)' }}>
                  Notes
                </h3>
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>{selectedOrder.notes}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <select
                value={selectedOrder.status}
                onChange={(e) => {
                  updateOrderStatus(selectedOrder._id || selectedOrder.id, e.target.value);
                  setSelectedOrder({ ...selectedOrder, status: e.target.value });
                }}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--gray-300)',
                  background: 'var(--white)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
              
              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                <button
                  onClick={() => {
                    createInvoiceFromOrder(selectedOrder);
                    setShowDetails(false);
                  }}
                  className="btn btn-primary"
                  style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                >
                  📝 Create Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
