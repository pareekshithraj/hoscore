const AUTH_KEYS = ['token', 'user', 'contexts', 'activeContext', 'selectedPatientId'] as const;

export function clearAuthStorage() {
  AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
}
