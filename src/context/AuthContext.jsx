import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';

const AuthContext = createContext(null);

const ROLE_DASHBOARD_MAP = {
  ADMIN: '/dashboard/admin',
  DOCTOR: '/dashboard/doctor',
  RECEPTIONIST: '/dashboard/receptionist',
  TECHNICIAN: '/dashboard/technician',
  PATIENT: '/',
};

const ROLE_DISPLAY_NAMES = {
  ADMIN: 'Quản trị viên',
  DOCTOR: 'Bác sĩ',
  RECEPTIONIST: 'Lễ tân',
  TECHNICIAN: 'Kỹ thuật viên',
  PATIENT: 'Bệnh nhân',
};

export function AuthProvider({ children }) {
  const [mockUser, setMockUser] = useState(() => {
    try {
      const stored = localStorage.getItem('dermasmart_mock_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [session, setSession] = useState(null);

  useEffect(() => {
    AuthModel.getSession().then((session) => {
      setSession(session);
    }).catch(console.error);

    const subscription = AuthModel.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (role) => {
    const newUser = {
      id: role === 'DOCTOR' ? 'doc-01' : Date.now(),
      name: ROLE_DISPLAY_NAMES[role] || role,
      role,
    };
    setMockUser(newUser);
    localStorage.setItem('dermasmart_mock_user', JSON.stringify(newUser));
    return ROLE_DASHBOARD_MAP[role] || '/';
  };

  const logout = async () => {
    setMockUser(null);
    localStorage.removeItem('dermasmart_mock_user');
    try {
      await AuthModel.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const getDashboardPath = (role) => {
    return ROLE_DASHBOARD_MAP[role] || '/';
  };

  // Determine active user
  let activeUser = null;
  const isResettingPassword = sessionStorage.getItem('isResettingPassword') === 'true';

  if (mockUser) {
    activeUser = mockUser;
  } else if (session?.user && !isResettingPassword) {
    const role = session.user.user_metadata?.role || 'PATIENT';

    activeUser = {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.email,
      role: role,
      avatar: session.user.user_metadata?.avatar_url,
      isSupabase: true
    };
  }

  return (
    <AuthContext.Provider value={{ user: activeUser, session, login, logout, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
