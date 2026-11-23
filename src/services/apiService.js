import { storageService } from './storageService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request(endpoint, options = {}) {
  const token = storageService.get('auth_token', null);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'Network request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const apiService = {
  auth: {
    async login({ email, password, role }) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
      }
      return data;
    },

    async register(payload) {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
      }
      return data;
    },

    async getMe() {
      return request('/api/auth/me');
    },

    async forgotPassword(email) {
      return request('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async resetPassword(email, resetCode, newPassword) {
      return request('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, resetCode, newPassword }),
      });
    },

    logout() {
      storageService.remove('auth_token');
      storageService.remove('current_user');
    },
  },

  academics: {
    async getDepartments() {
      return request('/api/academics/departments');
    },

    async getCourses(departmentId) {
      const query = departmentId ? `?department_id=${departmentId}` : '';
      return request(`/api/academics/courses${query}`);
    },
  },

  students: {
    async getProfile() {
      return request('/api/students/profile');
    },

    async updateProfile(updates) {
      return request('/api/students/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async listStudents(departmentId) {
      const query = departmentId ? `?department_id=${departmentId}` : '';
      return request(`/api/students${query}`);
    },
  },

  accessibility: {
    async getSettings() {
      return request('/api/accessibility');
    },

    async updateSettings(settings) {
      return request('/api/accessibility', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },
};
