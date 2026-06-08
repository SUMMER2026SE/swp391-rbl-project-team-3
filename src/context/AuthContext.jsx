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

  // Mock user profiles per role — dùng để demo đúng dữ liệu mẫu
  const MOCK_PROFILES = {
    PATIENT: {
      id: 'pat-01',
      name: 'Lê Minh Khôi',
      phone: '0901 234 567',
      email: 'leminhkhoi@gmail.com',
      gender: 'Nam',
      dob: '1995-03-15',
      address: '45 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
      avatar: 'https://i.pravatar.cc/150?u=pat01',
    },
    DOCTOR: {
      id: 'doc-01',
      name: 'BS. CKII. Trần Văn A',
    },
    RECEPTIONIST: {
      id: 'staff-01',
      name: 'Lễ tân Hoàng Anh',
    },
    TECHNICIAN: {
      id: 'tech-01',
      name: 'KTV. Lê Thị C',
    },
    ADMIN: {
      id: 'admin-01',
      name: 'Quản trị viên',
    },
  };

  const login = (role, customUserData = null) => {
    const profile = MOCK_PROFILES[role] || {};
    const newUser = customUserData || {
      id: profile.id || `mock-${role.toLowerCase()}-${Date.now()}`,
      name: profile.name || ROLE_DISPLAY_NAMES[role] || role,
      role,
      ...profile,
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
