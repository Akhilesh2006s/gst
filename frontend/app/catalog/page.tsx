'use client';

import { useEffect, useState } from 'react';
import { productsAPI, ordersAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  stock: number;
}

export default function CatalogPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCart();
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

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(newCart));
    setCart(newCart);
  };

  const addToCart = (product: any) => {
    const existingItem = cart.find(item => item.productId === product._id || item.productId === product.id);
    
    // Use custom price if available, otherwise use default price
    const priceToUse = product.hasCustomPrice ? product.price : (product.originalPrice || product.price);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock) {
        alert('Not enough stock available');
        return;
      }
      const updatedCart = cart.map(item =>
        item.productId === (product._id || product.id)
          ? { ...item, quantity: item.quantity + 1, unitPrice: priceToUse }
          : item
      );
      saveCart(updatedCart);
    } else {
      if (product.stock < 1) {
        alert('Product out of stock');
        return;
      }
      
      const newItem: CartItem = {
        productId: product._id || product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: priceToUse,
        stock: product.stock
      };
      saveCart([...cart, newItem]);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    const item = cart.find(item => item.productId === productId);
    if (item && newQuantity > item.stock) {
      alert('Not enough stock available');
      return;
    }

    const updatedCart = cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    saveCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.productId !== productId);
    saveCart(updatedCart);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    try {
      const items = cart.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }));

      await ordersAPI.create({
        items,
        notes: 'Order placed from catalog'
      });

      localStorage.removeItem('cart');
      setCart([]);
      alert('Order placed successfully!');
      router.push('/customer/dashboard');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to place order');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <div className="fade-in" style={{ 
      width: '100%', 
      maxWidth: '100%',
      boxSizing: 'border-box',
      padding: 0,
      margin: 0
    }}>
      {/* Header with Search and Cart */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--black)', marginBottom: '0.5rem' }}>
            Product Catalog
          </h1>
          <p style={{ color: 'var(--gray-600)' }}>Browse and order products</p>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ minWidth: '200px', flex: '1 1 200px' }}
          />
          
          <button
            onClick={() => setShowCart(!showCart)}
            className="btn btn-primary"
            style={{ position: 'relative', whiteSpace: 'nowrap' }}
          >
            🛒 Cart ({cart.length})
            {cart.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '400px',
          maxWidth: '90vw',
          height: '100vh',
          background: 'var(--white)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--black)' }}>Shopping Cart</h2>
            <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-600)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map((item) => (
                  <div key={item.productId} className="card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--black)' }}>{item.productName}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>₹{item.unitPrice} each</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.25rem' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                        min="1"
                        max={item.stock}
                        style={{ width: '60px', textAlign: 'center', padding: '0.25rem' }}
                        className="form-input"
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', minWidth: 'auto' }}
                        disabled={item.quantity >= item.stock}
                      >
                        +
                      </button>
                      <div style={{ marginLeft: 'auto', fontWeight: '600', color: 'var(--black)' }}>
                        ₹{(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div style={{ borderTop: '2px solid var(--gray-200)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
                <span>Total:</span>
                <span>₹{getCartTotal().toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.875rem' }}
              >
                Place Order
              </button>
            </div>
          )}
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ color: 'var(--gray-600)', fontSize: '1.125rem' }}>
            {searchTerm ? 'No products found matching your search' : 'No products available'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1.25rem',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {filteredProducts.map((product) => {
            const cartItem = cart.find(item => item.productId === (product._id || product.id));
            const inStock = product.stock > 0;
            
            return (
              <div key={product._id || product.id} className="card" style={{
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s',
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow)';
              }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'var(--gray-100)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '4rem',
                    marginBottom: '1rem'
                  }}>
                    📦
                  </div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--black)', marginBottom: '0.5rem' }}>
                    {product.name}
                  </h3>
                  {product.category && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                      {product.category}
                    </p>
                  )}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                      ₹{product.hasCustomPrice ? product.price : (product.originalPrice || product.price)}
                    </p>
                    {product.hasCustomPrice && product.originalPrice && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', textDecoration: 'line-through', margin: '0.25rem 0 0 0' }}>
                        ₹{product.originalPrice}
                      </p>
                    )}
                    {product.hasCustomPrice && (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.125rem 0.5rem',
                        background: 'var(--gray-100)',
                        borderRadius: 'var(--radius)',
                        color: 'var(--black)',
                        fontWeight: '500'
                      }}>
                        Special Price
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                    Stock: {product.stock} {product.unit || 'pcs'}
                  </p>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  {!inStock ? (
                    <button className="btn btn-secondary" disabled style={{ width: '100%' }}>
                      Out of Stock
                    </button>
                  ) : cartItem ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateQuantity(product._id || product.id, cartItem.quantity - 1)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.5rem' }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: '600' }}>
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product._id || product.id, cartItem.quantity + 1)}
                        className="btn btn-secondary"
                        style={{ flex: 1, padding: '0.5rem' }}
                        disabled={cartItem.quantity >= product.stock}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

