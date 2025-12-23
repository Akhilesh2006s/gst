'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in with timeout
    const checkAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        await Promise.race([
          authAPI.getCurrentUser(),
          timeoutPromise
        ]);
        
        router.push('/dashboard');
      } catch (error) {
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [router]);

  return (
    <main style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--gray-100)'
    }}>
      <div style={{ textAlign: 'center', color: 'var(--black)' }}>
        <div style={{
          width: '4rem',
          height: '4rem',
          margin: '0 auto 1rem',
          background: 'var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          📊
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>GST Billing System</h1>
        <p style={{ opacity: 0.9 }}>Loading...</p>
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </main>
  );
}

