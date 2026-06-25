import { BASE_URL } from '../utils/apiConfig';

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function request(method: string, endpoint: string, data?: unknown) {
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new Error(await parseError(response));
  }
  return response.json();
}

export const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, data: any) => request('POST', endpoint, data),
  patch: (endpoint: string, data: any) => request('PATCH', endpoint, data),
  put: (endpoint: string, data: any) => request('PUT', endpoint, data),
  delete: (endpoint: string) => request('DELETE', endpoint),
};
