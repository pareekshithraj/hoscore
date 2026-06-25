export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      'Cannot reach the HOSCORE API. Set VITE_API_URL to your backend URL (including /api) in Vercel project settings, then redeploy.',
    );
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error('Network error — could not reach the HOSCORE API. Check that the backend is running.');
  }

  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text();

  if (!contentType.includes('application/json')) {
    if (response.status === 404 || text.startsWith('The page')) {
      throw new Error(
        'API endpoint not found. Set VITE_API_URL to your deployed backend (e.g. https://your-server.com/api) in Vercel environment variables.',
      );
    }
    throw new Error(`Unexpected server response (${response.status}). The API may be misconfigured.`);
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new Error('Invalid JSON from server. Check VITE_API_URL points to the HOSCORE API, not the frontend.');
  }

  return { data, response };
}
