// API Configuration
// Use environment variable when provided, otherwise fall back to local or hosted backend
const getApiBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    const url = import.meta.env.VITE_API_URL;
    // Ensure no trailing slash
    return url.replace(/\/$/, '');
  }
  
  // For local development, use localhost backend
  // In production (Vercel), this will use the hosted backend
  if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const baseUrl = 'https://web-production-f50e6.up.railway.app/api';
    return baseUrl.replace(/\/$/, '');
  }
  
  // Default to hosted backend for production
  const baseUrl = 'https://web-production-f50e6.up.railway.app/api';
  // Ensure no trailing slash
  return baseUrl.replace(/\/$/, '');
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

