// Production API host (Vercel). Client rewrites /api/* → this service.
export const PRODUCTION_API_ORIGIN = 'https://hoscore-api.vercel.app';

export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === '10.0.2.2') {
      return 'http://10.0.2.2:5000/api';
    }
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.');

    if (isLocal) {
      return `http://${hostname}:5000/api`;
    }
    // Vercel: same-origin /api is proxied to Render in vercel.json
    if (hostname.endsWith('.vercel.app')) {
      return `https://${hostname}/api`;
    }
    if (hostname === 'hoscore.in' || hostname === 'www.hoscore.in') {
      return `${PRODUCTION_API_ORIGIN}/api`;
    }
    return `https://${hostname}/api`;
  }
  return 'http://localhost:5000/api';
};

export const BASE_URL = getBaseUrl();

