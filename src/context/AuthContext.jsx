import React, { createContext, useContext, useState, useCallback } from 'react';
import { DEMO_ACCOUNTS } from '../data/mockUsers';
import { storageService } from '../services/storageService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = storageService.get('users', null);
    return saved || DEMO_ACCOUNTS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    return storageService.get('current_user', null);
  });

  const persistUsers = useCallback((nextUsers) => {
    setRegisteredUsers(nextUsers);
    storageService.set('users', nextUsers);
  }, []);

  const login = useCallback(
    ({ email, password, role }) => {
      const normalizedEmail = email.trim().toLowerCase();
      const matched = registeredUsers.find(
        (u) =>
          u.email.toLowerCase() === normalizedEmail &&
          (!role || u.role === role) &&
          u.password === password
      );
      if (!matched) {
        return { ok: false, error: 'Invalid demo credentials or role selection. Try one of the sample demo accounts below.' };
      }
      const { password: _removed, ...safeUser } = matched;
      setCurrentUser(safeUser);
      storageService.set('current_user', safeUser);
      return { ok: true, user: safeUser };
    },
    [registeredUsers]
  );

  const loginWithDemoRole = useCallback(
    (role) => {
      const matched = registeredUsers.find((u) => u.role === role);
      if (!matched) return { ok: false, error: 'Demo account not found.' };
      const { password: _removed, ...safeUser } = matched;
      setCurrentUser(safeUser);
      storageService.set('current_user', safeUser);
      return { ok: true, user: safeUser };
    },
    [registeredUsers]
  );

  const register = useCallback(
    (payload) => {
      const exists = registeredUsers.some(
        (u) => u.email.toLowerCase() === payload.email.trim().toLowerCase()
      );
      if (exists) {
        return { ok: false, error: 'An account with this email already exists in demo storage.' };
      }

      const newUser = {
        id: `${payload.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`,
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
        accessibilityNeeds: payload.accessibilityNeeds || ['Accessible Learning Materials'],
        assignedMentorId: payload.role === 'student' ? 'men-201' : undefined,
        profileCompletion: 72,
        cgpa: 8.5,
        avatarColor: 'from-royal-600 to-violet-600',
        bio: payload.bio || 'New UDAAN demo member.',
      };

      const updated = [...registeredUsers, newUser];
      persistUsers(updated);
      const { password: _removed, ...safeUser } = newUser;
      setCurrentUser(safeUser);
      storageService.set('current_user', safeUser);
      return { ok: true, user: safeUser };
    },
    [registeredUsers, persistUsers]
  );

  const updateProfile = useCallback(
    (updates) => {
      if (!currentUser) return;
      const nextCurrent = { ...currentUser, ...updates };
      setCurrentUser(nextCurrent);
      storageService.set('current_user', nextCurrent);

      const nextList = registeredUsers.map((u) =>
        u.id === currentUser.id ? { ...u, ...updates } : u
      );
      persistUsers(nextList);
    },
    [currentUser, registeredUsers, persistUsers]
  );

  const resetPasswordDemo = useCallback(
    (email, newPassword) => {
      const normalized = email.trim().toLowerCase();
      const idx = registeredUsers.findIndex((u) => u.email.toLowerCase() === normalized);
      if (idx === -1) {
        return { ok: false, error: 'No demo account matches this email address.' };
      }
      const nextList = registeredUsers.map((u, i) =>
        i === idx ? { ...u, password: newPassword } : u
      );
      persistUsers(nextList);
      return { ok: true };
    },
    [registeredUsers, persistUsers]
  );

  const logout = useCallback(() => {
    setCurrentUser(null);
    storageService.remove('current_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
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
