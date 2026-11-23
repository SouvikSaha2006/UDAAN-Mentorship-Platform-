import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { useAccessibility } from './AccessibilityContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { applySettings } = useAccessibility();

  const [currentUser, setCurrentUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // Session Hydration directly from the live Django API on mount/page reload
  useEffect(() => {
    let isMounted = true;
    async function hydrateSession() {
      const token = storageService.get('auth_token', null);
      if (!token) {
        if (isMounted) setIsHydrating(false);
        return;
      }

      try {
        const data = await apiClient.auth.getMe();
        if (isMounted && data?.user) {
          setCurrentUser(data.user);
          if (data.profile) {
            setCurrentProfile(data.profile);
          }
          if (data.accessibility_settings) {
            applySettings(data.accessibility_settings);
          }
        }
      } catch (err) {
        // If token expired or invalid, revoke stored tokens
        if (err.status === 401 || err.status === 403) {
          storageService.remove('auth_token');
          storageService.remove('refresh_token');
          if (isMounted) {
            setCurrentUser(null);
            setCurrentProfile(null);
          }
        }
      } finally {
        if (isMounted) setIsHydrating(false);
      }
    }

    hydrateSession();
    return () => {
      isMounted = false;
    };
  }, [applySettings]);

  // Real database authentication
  const login = useCallback(
    async ({ email, password, role }) => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        const data = await apiClient.auth.login({
          email: normalizedEmail,
          password,
          role,
        });

        setCurrentUser(data.user);

        if (data.profile) {
          setCurrentProfile(data.profile);
        }

        // Apply student's persisted UI accessibility settings immediately
        if (data.accessibility_settings) {
          applySettings(data.accessibility_settings);
        }

        return { ok: true, user: data.user, profile: data.profile };
      } catch (apiErr) {
        return {
          ok: false,
          error: apiErr.message || 'Invalid credentials or role selection.',
        };
      }
    },
    [applySettings]
  );

  // Quick Demo Role Login authenticated directly against the live seeded database
  const loginWithDemoRole = useCallback(
    async (role) => {
      const demoEmail = `${role}@udaan.edu`;
      return login({ email: demoEmail, password: 'Password@123', role });
    },
    [login]
  );

  // Real database registration with atomic student ID sequence allocation
  const register = useCallback(
    async (payload) => {
      try {
        const data = await apiClient.auth.register(payload);

        setCurrentUser(data.user);

        if (data.profile) {
          setCurrentProfile(data.profile);
        }

        if (data.accessibility_settings) {
          applySettings(data.accessibility_settings);
        }

        return { ok: true, user: data.user, profile: data.profile };
      } catch (apiErr) {
        return {
          ok: false,
          error: apiErr.message || 'Registration failed. Please review your details and try again.',
        };
      }
    },
    [applySettings]
  );

  // Update profile in React state from fresh database response
  const updateProfile = useCallback(
    (profileOrUserUpdates) => {
      if (!profileOrUserUpdates) return;
      if (profileOrUserUpdates.fullName || profileOrUserUpdates.studentId || profileOrUserUpdates.student_id) {
        setCurrentProfile((prev) => ({ ...(prev || {}), ...profileOrUserUpdates }));
        setCurrentUser((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            name: profileOrUserUpdates.fullName || profileOrUserUpdates.name || prev.name,
            ...(profileOrUserUpdates.email ? { email: profileOrUserUpdates.email } : {}),
            ...(profileOrUserUpdates.studentId ? { studentId: profileOrUserUpdates.studentId } : {}),
            ...(profileOrUserUpdates.student_id ? { student_id: profileOrUserUpdates.student_id } : {}),
            department: profileOrUserUpdates.departmentName || profileOrUserUpdates.department || prev.department,
            course: profileOrUserUpdates.courseName || profileOrUserUpdates.course || prev.course,
            semester: profileOrUserUpdates.semester || prev.semester,
            phone: profileOrUserUpdates.phone ?? prev.phone,
            bio: profileOrUserUpdates.bio ?? prev.bio,
            careerGoal: profileOrUserUpdates.careerGoal ?? prev.careerGoal,
            profileCompletion: profileOrUserUpdates.profileCompletion ?? prev.profileCompletion,
            accessibilityNeeds:
              profileOrUserUpdates.assistiveDevices ||
              profileOrUserUpdates.accessibilityNeeds ||
              prev.accessibilityNeeds,
          };
        });
      } else {
        setCurrentUser((prev) => ({ ...(prev || {}), ...profileOrUserUpdates }));
      }
    },
    []
  );

  // Password Reset API bindings
  const requestPasswordReset = useCallback(async (email) => {
    try {
      const res = await apiClient.auth.forgotPassword(email);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Unable to request password reset code.' };
    }
  }, []);

  const verifyResetToken = useCallback(async (email, resetCode) => {
    try {
      const res = await apiClient.auth.verifyResetToken(email, resetCode);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Invalid or expired verification code.' };
    }
  }, []);

  const resetPassword = useCallback(async (email, resetCode, newPassword) => {
    try {
      const res = await apiClient.auth.resetPassword(email, resetCode, newPassword);
      return { ok: true, data: res };
    } catch (err) {
      return { ok: false, error: err.message || 'Unable to reset password.' };
    }
  }, []);

  const resetPasswordDemo = useCallback(async (email, newPassword) => {
    try {
      await apiClient.auth.resetPassword(email, 'UDAAN-2026', newPassword);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message || 'Unable to reset password in backend.' };
    }
  }, []);

  // Logout with backend token revocation and local token cleanup
  const logout = useCallback(async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // Ignored
    } finally {
      setCurrentUser(null);
      setCurrentProfile(null);
      storageService.remove('auth_token');
      storageService.remove('refresh_token');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentProfile,
        isHydrating,
        login,
        loginWithDemoRole,
        register,
        updateProfile,
        requestPasswordReset,
        verifyResetToken,
        resetPassword,
        resetPasswordDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
