// API Configuration
// Use environment variable when provided, otherwise use relative URLs (Vite proxy) or hosted backend
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    // Ensure no trailing slash
    return url.replace(/\/$/, '');
  }
  
  // For local development with Vite proxy, use relative URL (same-origin = cookies work!)
  // Vite proxy will forward /api/* to http://localhost:5000/api/*
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Use relative URL - Vite proxy handles it
    return '/api';
  }
  
  // Default to hosted backend for production (Vercel)
  const baseUrl = 'https://web-production-f50e6.up.railway.app/api';
  // Ensure no trailing slash
  return baseUrl.replace(/\/$/, '');
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

