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
      return 'Access denied. You do not have permission to perform this action.';
    }
    if (fallbackStatus === 404) {
      return 'The requested academic record was not found.';
    }
    return 'Unable to communicate with the UDAAN server. Please verify your connection.';
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
    return `Form error: ${fieldErrors.join('. ')}.`;
  }

  // 3. Generic message object
  if (errorData.message) {
    return errorData.message;
  }

  return 'An unexpected error occurred. Please try again.';
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

  // Feature 4 & 5: Student Profile CRUD & Details Management
  students: {
    async getMe() {
      return apiRequest('/students/me');
    },

    async getProfile(studentId = null) {
      if (studentId) {
        return apiRequest(`/students/${encodeURIComponent(studentId)}`);
      }
      return apiRequest('/students/me');
    },

    async getById(studentId) {
      return apiRequest(`/students/${encodeURIComponent(studentId)}`);
    },

    async updateProfile(updates) {
      return apiRequest('/students/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    async updatePersonal(personalData) {
      return apiRequest('/students/me/personal', {
        method: 'PATCH',
        body: JSON.stringify(personalData),
      });
    },

    async updateAcademics(academicData) {
      return apiRequest('/students/me/academics', {
        method: 'PATCH',
        body: JSON.stringify(academicData),
      });
    },

    async updateAccessibility(a11yData) {
      return apiRequest('/students/me/accessibility', {
        method: 'PUT',
        body: JSON.stringify(a11yData),
      });
    },

    async deactivateAccount() {
      return apiRequest('/students/me', {
        method: 'DELETE',
      });
    },

    async listStudents(params = {}) {
      const q = new URLSearchParams();
      if (params.search) q.append('search', params.search);
      if (params.department_id) q.append('department_id', params.department_id);
      if (params.disability_type) q.append('disability_type', params.disability_type);
      if (params.is_active !== undefined) q.append('is_active', params.is_active);
      const qs = q.toString() ? `?${q.toString()}` : '';
      return apiRequest(`/students${qs}`);
    },

    async updateStatus(studentId, isActive) {
      return apiRequest(`/students/${encodeURIComponent(studentId)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      });
    },
  },

  // Feature 1, 2, 3: Authentication, Session & Token Management
  auth: {
    async register(payload) {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
        if (data.refresh_token) {
          storageService.set('refresh_token', data.refresh_token);
        }
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
        if (data.refresh_token) {
          storageService.set('refresh_token', data.refresh_token);
        }
      }
      return data;
    },

    async getMe() {
      const data = await apiRequest('/auth/me');
      return data;
    },

    async refreshToken() {
      const refreshToken = storageService.get('refresh_token', null);
      if (!refreshToken) {
        throw new Error('No refresh token available.');
      }
      const data = await apiRequest('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      if (data?.access_token) {
        storageService.set('auth_token', data.access_token);
        if (data.refresh_token) {
          storageService.set('refresh_token', data.refresh_token);
        }
      }
      return data;
    },

    async logout() {
      const refreshToken = storageService.get('refresh_token', null);
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      } catch {
        // Ignore logout network failures
      } finally {
        storageService.remove('auth_token');
        storageService.remove('refresh_token');
        storageService.remove('current_user');
      }
      return { ok: true };
    },

    async forgotPassword(email) {
      return apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },

    async verifyResetToken(email, resetCode) {
      return apiRequest('/auth/verify-reset-token', {
        method: 'POST',
        body: JSON.stringify({ email, resetCode }),
      });
    },

    async resetPassword(email, resetCode, newPassword) {
      return apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, resetCode, newPassword }),
      });
    },
  },

  // Feature 2: Accessibility Settings Sync
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
