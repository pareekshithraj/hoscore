export const getBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Android emulator loopback redirection
    if (hostname === '10.0.2.2') {
      return 'http://10.0.2.2:5000/api';
    }
    // Local / LAN development check
    const isLocal = 
      hostname === 'localhost' || 
      hostname === '127.0.0.1' || 
      hostname.startsWith('192.168.') || 
      hostname.startsWith('10.') || 
      hostname.startsWith('172.');
      
    if (isLocal) {
      return `http://${hostname}:5000/api`;
    }
    // Production domain redirects (secure HTTPS without port 5000)
    return `https://${hostname}/api`;
  }
  return 'http://localhost:5000/api';
};

export const BASE_URL = getBaseUrl();

