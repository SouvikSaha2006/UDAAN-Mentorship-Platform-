import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEMO_ACCOUNTS } from '../data/mockUsers';
import { storageService } from '../services/storageService';
import { apiClient } from '../services/apiClient';
import { useAccessibility } from './AccessibilityContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { applySettings } = useAccessibility();

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = storageService.get('users', null);
    return saved || DEMO_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return storageService.get('current_user', null);
  });

  const [currentProfile, setCurrentProfile] = useState(() => {
    return storageService.get('current_profile', null);
  });

  const [isHydrating, setIsHydrating] = useState(true);

  const persistUsers = useCallback((nextUsers) => {
    setRegisteredUsers(nextUsers);
    storageService.set('users', nextUsers);
  }, []);

  // Feature 2: Session Hydration on page reload
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
          storageService.set('current_user', data.user);
          if (data.profile) {
            setCurrentProfile(data.profile);
            storageService.set('current_profile', data.profile);
          }
          if (data.accessibility_settings) {
            applySettings(data.accessibility_settings);
          }
        }
      } catch (err) {
        // If token expired or invalid, clear session
        if (err.status === 401) {
          storageService.remove('auth_token');
          storageService.remove('refresh_token');
          storageService.remove('current_user');
          storageService.remove('current_profile');
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

  // Feature 2: Login
  const login = useCallback(
    async ({ email, password, role }) => {
      const normalizedEmail = email.trim().toLowerCase();

      try {
        // 1. Try real backend login
        const data = await apiClient.auth.login({
          email: normalizedEmail,
          password,
          role,
        });

        setCurrentUser(data.user);
        storageService.set('current_user', data.user);

        if (data.profile) {
          setCurrentProfile(data.profile);
          storageService.set('current_profile', data.profile);
        }

        // Apply student's persisted UI accessibility settings immediately
        if (data.accessibility_settings) {
          applySettings(data.accessibility_settings);
        }

        return { ok: true, user: data.user, profile: data.profile };
      } catch (apiErr) {
        // 2. Fallback to demo accounts if server offline
        const matched = registeredUsers.find(
          (u) =>
            u.email.toLowerCase() === normalizedEmail &&
            (!role || u.role === role) &&
            u.password === password
        );

        if (!matched) {
          return {
            ok: false,
            error: apiErr.message || 'Invalid credentials or role selection.',
          };
        }

        const { password: _removed, ...safeUser } = matched;
        setCurrentUser(safeUser);
        storageService.set('current_user', safeUser);
        return { ok: true, user: safeUser };
      }
    },
    [registeredUsers, applySettings]
  );

  // Quick Demo Role Login
  const loginWithDemoRole = useCallback(
    async (role) => {
      const demoEmail = `${role}@udaan.edu`;
      return login({ email: demoEmail, password: 'Password@123', role });
    },
    [login]
  );

  // Feature 1: Student & Mentor Registration
  const register = useCallback(
    async (payload) => {
      try {
        // 1. Try real backend registration
        const data = await apiClient.auth.register(payload);

        setCurrentUser(data.user);
        storageService.set('current_user', data.user);

        if (data.profile) {
          setCurrentProfile(data.profile);
          storageService.set('current_profile', data.profile);
        }

        if (data.accessibility_settings) {
          applySettings(data.accessibility_settings);
        }

        return { ok: true, user: data.user, profile: data.profile };
      } catch (apiErr) {
        // 2. Fallback to local demo storage
        const exists = registeredUsers.some(
          (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase()
        );
        if (exists) {
          return { ok: false, error: apiErr.message || 'An account with this email already exists.' };
        }

        const newUser = {
          id: `${payload.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          studentId: `UDN-2026-${payload.department?.slice(0, 3).toUpperCase() || 'GEN'}-${Date.now().toString().slice(-4)}`,
          role: payload.role,
          name: payload.name.trim(),
          email: payload.email.trim().toLowerCase(),
          password: payload.password,
          department: payload.department || 'Computer Science & Engineering',
          course: payload.course || (payload.role === 'student' ? 'B.Tech Computer Science' : undefined),
          semester: payload.semester || (payload.role === 'student' ? '1st Semester' : undefined),
          qualification: payload.qualification || (payload.role === 'mentor' ? 'M.Tech / Industry Specialist' : undefined),
          experienceYears: payload.experienceYears ? Number(payload.experienceYears) : 4,
          expertise: payload.expertise
            ? payload.expertise.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Academic Guidance', 'Career Mentoring'],
          accessibilityNeeds: payload.accessibilityNeeds || ['Screen Reader Support'],
          assignedMentorId: payload.role === 'student' ? 'men-201' : undefined,
          profileCompletion: 75,
          cgpa: 8.5,
          avatarColor: 'from-royal-600 to-violet-600',
          bio: payload.bio || 'New UDAAN member.',
        };

        const updated = [...registeredUsers, newUser];
        persistUsers(updated);
        const { password: _removed, ...safeUser } = newUser;
        setCurrentUser(safeUser);
        storageService.set('current_user', safeUser);
        return { ok: true, user: safeUser };
      }
    },
    [registeredUsers, persistUsers, applySettings]
  );

  // Feature 3: Update Profile with ownership check
  const updateProfile = useCallback(
    async (updates) => {
      if (!currentUser) return;
      const nextCurrent = { ...currentUser, ...updates };
      setCurrentUser(nextCurrent);
      storageService.set('current_user', nextCurrent);

      const nextList = registeredUsers.map((u) =>
        u.id === currentUser.id ? { ...u, ...updates } : u
      );
      persistUsers(nextList);

      // Also sync to backend API if authenticated
      try {
        await apiClient.students.updateProfile(updates);
      } catch {
        // Ignored in offline/demo fallback
      }
    },
    [currentUser, registeredUsers, persistUsers]
  );

  const resetPasswordDemo = useCallback(
    async (email, newPassword) => {
      try {
        await apiClient.auth.resetPassword(email, 'UDAAN-2026', newPassword);
        return { ok: true };
      } catch {
        const normalized = email.trim().toLowerCase();
        const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === normalized);
        if (idx === -1) {
          return { ok: false, error: 'No account matches this email address.' };
        }
        const nextList = registeredUsers.map((u, i) =>
          i === idx ? { ...u, password: newPassword } : u
        );
        persistUsers(nextList);
        return { ok: true };
      }
    },
    [registeredUsers, persistUsers]
  );

  // Feature 2: Logout with token revocation
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
      storageService.remove('current_user');
      storageService.remove('current_profile');
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentProfile,
        isHydrating,
        registeredUsers,
        login,
        loginWithDemoRole,
        register,
        updateProfile,
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
