/**
 * Pick specified keys from an object to prevent mass-assignment vulnerabilities.
 */
export function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  if (!obj || typeof obj !== 'object') return result;
  for (const key of keys) {
    if (key in obj && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}
