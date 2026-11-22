const PREFIX = 'udaan_v1_';

export const storageService = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
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
};
