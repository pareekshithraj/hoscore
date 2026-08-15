import { BASE_URL } from '../utils/apiConfig';
import { clearAuthStorage } from '../utils/authStorage';

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function request(method: string, endpoint: string, data?: any) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${next}`;
    }
    throw new Error(await parseError(response));
  }
  return response.json();
}

export const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, data?: any) => request('POST', endpoint, data),
  patch: (endpoint: string, data?: any) => request('PATCH', endpoint, data),
  put: (endpoint: string, data?: any) => request('PUT', endpoint, data),
  delete: (endpoint: string) => request('DELETE', endpoint),
  upload: async (endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) throw new Error(await parseError(response));
    return response.json();
  },
};
