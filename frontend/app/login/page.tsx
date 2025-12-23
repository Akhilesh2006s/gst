'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authAPI } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      if (response.data) {
        // Redirect based on user type
        const userType = response.data.user?.userType;
        if (userType === 'customer') {
          router.push('/customer/dashboard');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--gray-100)',
      padding: '2rem'
    }}>
      <div className="card fade-in" style={{
        padding: '3rem',
        width: '100%',
        maxWidth: '450px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '4rem',
            height: '4rem',
            margin: '0 auto 1rem',
            background: 'var(--black)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            📊
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '700',
            color: 'var(--gray-900)',
            marginBottom: '0.5rem'
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
            Sign in as Business Owner or Customer
          </p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="form-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              className="form-input"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            Don't have an account?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/register" style={{ 
              color: 'var(--black)', 
              fontWeight: '500',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}>
              Register as Business Owner
            </Link>
            <span style={{ color: 'var(--gray-400)' }}>|</span>
            <Link href="/register/customer" style={{ 
              color: 'var(--black)', 
              fontWeight: '500',
              textDecoration: 'none',
              fontSize: '0.875rem'
            }}>
              Register as Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
