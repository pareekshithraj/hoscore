import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useApi<T>(endpoint: string, autoFetch: boolean = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (customData?: any, method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET') => {
    setLoading(true);
    setError(null);
    try {
      let result;
      switch (method) {
        case 'GET':
          result = await api.get(endpoint);
          break;
        case 'POST':
          result = await api.post(endpoint, customData);
          break;
        case 'PATCH':
          result = await api.patch(endpoint, customData);
          break;
        case 'PUT':
          result = await api.put(endpoint, customData);
          break;
        case 'DELETE':
          result = await api.delete(endpoint);
          break;
      }
      setData(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  useEffect(() => {
    if (autoFetch) {
      refetch().catch(() => {});
    }
  }, [autoFetch, refetch]);

  return { data, loading, error, execute, refetch, setData };
}
