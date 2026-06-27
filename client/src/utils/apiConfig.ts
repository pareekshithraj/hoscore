// Canonical production API origin.
export const PRODUCTION_API_ORIGIN = 'https://api.hoscore.in';

// Guarantee the base URL ends with exactly one /api segment.
const withApiSuffix = (origin: string): string => {
  const trimmed = origin.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return withApiSuffix(import.meta.env.VITE_API_URL as string);
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
    // Production web app talks to the dedicated API subdomain.
    return `${PRODUCTION_API_ORIGIN}/api`;
  }
  return 'http://localhost:5000/api';
};

export const BASE_URL = getBaseUrl();

