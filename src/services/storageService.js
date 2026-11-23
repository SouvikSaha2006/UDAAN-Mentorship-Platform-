const PREFIX = 'udaan_v1_';

/**
 * Strict whitelist: localStorage is used ONLY for JWT access and refresh tokens,
 * and initial pre-login accessibility preferences before authentication.
 * All user data, departments, courses, and profiles live in the Django database.
 */
const ALLOWED_STORAGE_KEYS = new Set([
  'auth_token',
  'refresh_token',
  'accessibility',
]);

export const storageService = {
  get(key, fallback = null) {
    if (!ALLOWED_STORAGE_KEYS.has(key)) {
      return fallback;
    }
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    if (!ALLOWED_STORAGE_KEYS.has(key)) {
      return;
    }
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Ignore quota errors in restricted browsing contexts
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      // Ignore
    }
  },
  clearAll() {
    try {
      Object.keys(window.localStorage).forEach((k) => {
        if (k.startsWith(PREFIX)) {
          window.localStorage.removeItem(k);
        }
      });
    } catch {
      // Ignore
    }
  },
  clearTokens() {
    this.remove('auth_token');
    this.remove('refresh_token');
  },
};
