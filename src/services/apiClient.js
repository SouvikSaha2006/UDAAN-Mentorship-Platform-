import { storageService } from './storageService';

const DEFAULT_BASE_URL = typeof window !== 'undefined' && window.location.port === '5173'
  ? '/api/v1'
  : 'http://localhost:8000/api/v1';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

/**
 * Screen-reader-friendly error parser for WCAG accessibility compliance.
 * Normalizes FastAPI string errors, 422 field validation arrays, and network exceptions
 * into plain-language verbal feedback suitable for screen readers and live announcements.
 */
export function formatAccessibleError(errorData, fallbackStatus = 500) {
  if (!errorData) {
    if (fallbackStatus === 401) {
      return 'Authentication required. Please sign in to your UDAAN account.';
    }
    if (fallbackStatus === 403) {
      return 'Access denied. Administrator privileges are required to perform this action.';
    }
    if (fallbackStatus === 404) {
      return 'The requested academic record was not found.';
    }
    return 'Unable to communicate with the UDAAN academic server. Please check your network connection.';
  }

  // 1. FastAPI detail string
  if (typeof errorData.detail === 'string') {
    return errorData.detail;
  }

  // 2. FastAPI Pydantic 422 validation error array
  if (Array.isArray(errorData.detail)) {
    const fieldErrors = errorData.detail.map((err) => {
      const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
      const cleanField = String(field).replace(/_/g, ' ');
      return `${cleanField}: ${err.msg}`;
    });
    return `Form validation error. ${fieldErrors.join('. ')}.`;
  }

  // 3. Generic message object
  if (errorData.message) {
    return errorData.message;
  }

  return 'An unexpected server error occurred. Please try again.';
}

/**
 * Core HTTP Request wrapper with automated Bearer token injection
 * and accessible error handling.
 */
async function apiRequest(endpoint, options = {}) {
  const token = storageService.get('auth_token', null);
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    let data = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    }

    if (!response.ok) {
      const accessibleMessage = formatAccessibleError(data, response.status);
      const error = new Error(accessibleMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err; // Already formatted accessible error
    }
    // Network / offline error
    const netError = new Error(
      'Unable to connect to the UDAAN backend server. Working in offline fallback mode.'
    );
    netError.status = 0;
    netError.original = err;
    throw netError;
  }
}

export const apiClient = {
  // Feature 8: Academic Metadata APIs
  academics: {
    async getDepartments() {
      return apiRequest('/academics/departments');
    },

    async getDepartmentCourses(departmentId) {
      return apiRequest(`/academics/departments/${encodeURIComponent(departmentId)}/courses`);
    },

    async createDepartment(departmentData) {
      return apiRequest('/academics/departments', {
        method: 'POST',
        body: JSON.stringify(departmentData),
      });
    },

    async createCourse(courseData) {
      return apiRequest('/academics/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });
    },
  },

  // Student Profile & Feature 6 Student ID
  students: {
    async getProfile(studentId = null) {
      const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
      return apiRequest(`/students/profile${query}`);
    },

    async updateProfile(updates) {
      return apiRequest('/students/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  },

  // Authentication & Session
  auth: {
    async register(payload) {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
        storageService.set('current_user', data.user);
      }
      return data;
    },

    async login(credentials) {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
        storageService.set('current_user', data.user);
      }
      return data;
    },

    async getMe() {
      return apiRequest('/auth/me');
    },

    logout() {
      storageService.remove('auth_token');
      storageService.remove('current_user');
    },
  },

  // Accessibility Settings Sync
  accessibility: {
    async getSettings() {
      return apiRequest('/accessibility');
    },

    async updateSettings(settings) {
      return apiRequest('/accessibility', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
    },
  },
};
