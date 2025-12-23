'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Skip auth check on login/register pages
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login' || path === '/register' || path.startsWith('/register/')) {
        setLoading(false);
        setUser(null);
        return;
      }
    }
    loadUser();
  }, [pathname]);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadUser = async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000)
      );
      
      const response = await Promise.race([
        authAPI.getCurrentUser(),
        timeoutPromise
      ]) as any;
      
      if (response?.data) {
        setUser(response.data);
      }
    } catch (error) {
      // Not logged in or error - just continue without user
      setUser(null);
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
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'var(--gray-100)'
      }}>
        <div style={{ 
          color: 'var(--black)', 
          fontSize: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div className="spinner"></div>
          Loading...
        </div>
      </div>
    );
  }

  // Check if we're on an auth page
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname.startsWith('/register/');
  
  // Don't show sidebar on auth pages or if user is not logged in
  if (!user || isAuthPage) {
    return <>{children}</>;
  }

  // Only show sidebar for admin/business owners, not customers
  const isBusinessOwner = user.userType === 'admin' || user.userType === 'superAdmin';
  
  if (!isBusinessOwner) {
    // Customer layout - no sidebar
    return <>{children}</>;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      height: '100vh',
      background: 'var(--gray-50)', 
      display: 'flex',
      width: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Sidebar */}
      <aside 
        className={`sidebar ${sidebarOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          background: 'var(--white)',
          borderRight: '1px solid var(--gray-200)',
          padding: '1.5rem 0',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          overflowY: 'auto',
          zIndex: 100,
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <Link href="/dashboard" style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--black)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📊</span>
            <span>GST Billing</span>
          </Link>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 1rem' }}>
          <SidebarNavLink href="/dashboard" icon="📊" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Dashboard
          </SidebarNavLink>
          <SidebarNavLink href="/products" icon="📦" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Products
          </SidebarNavLink>
          <SidebarNavLink href="/customers" icon="👥" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Customers
          </SidebarNavLink>
          <SidebarNavLink href="/orders" icon="🛒" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Orders
          </SidebarNavLink>
          <SidebarNavLink href="/invoices" icon="🧾" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Invoices
          </SidebarNavLink>
          <SidebarNavLink href="/reports" icon="📈" pathname={pathname} onClick={() => setSidebarOpen(false)}>
            Reports
          </SidebarNavLink>
        </nav>

        <div style={{ 
          marginTop: 'auto', 
          padding: '1.5rem', 
          borderTop: '1px solid var(--gray-200)',
          marginTop: '2rem'
        }}>
          <div style={{
            padding: '0.75rem',
            background: 'var(--gray-50)',
            borderRadius: 'var(--radius)',
            marginBottom: '1rem'
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '0.25rem' }}>Logged in as</p>
            <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--black)' }}>👤 {user.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: '100%', fontSize: '0.875rem' }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content-area" style={{ 
        flex: 1, 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}>
        {/* Top Header Bar */}
        <header style={{
          background: 'var(--white)',
          borderBottom: '1px solid var(--gray-200)',
          boxShadow: 'var(--shadow-sm)',
          position: 'sticky',
          top: 0,
          zIndex: 99,
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          flexShrink: 0
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              display: typeof window !== 'undefined' && window.innerWidth < 768 ? 'block' : 'none',
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.5rem'
            }}
          >
            ☰
          </button>
          <div style={{ flex: 1 }}></div>
          <div style={{
            padding: '0.5rem 1rem',
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            color: 'var(--gray-700)',
            whiteSpace: 'nowrap'
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>

        {/* Main Content */}
        <main style={{ 
          padding: '1.5rem',
          width: '100%',
          maxWidth: '100%',
          overflowX: 'hidden',
          overflowY: 'auto',
          flex: 1,
          boxSizing: 'border-box',
          minHeight: 0
        }}>
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && typeof window !== 'undefined' && window.innerWidth < 768 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

function SidebarNavLink({ href, icon, children, pathname, onClick }: { 
  href: string; 
  icon: string; 
  children: React.ReactNode; 
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
  
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius)',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: isActive ? 'var(--black)' : 'var(--gray-700)',
        background: isActive ? 'var(--gray-100)' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.2s',
        borderLeft: isActive ? '3px solid var(--black)' : '3px solid transparent',
        marginLeft: isActive ? '0' : '3px'
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--gray-50)';
          e.currentTarget.style.color = 'var(--black)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--gray-700)';
        }
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

