import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';

const AuthContext = createContext(null);

const ROLE_DASHBOARD_MAP = {
  ADMIN: '/dashboard/admin',
  DOCTOR: '/dashboard/doctor',
  RECEPTIONIST: '/dashboard/receptionist',
  TECHNICIAN: '/dashboard/technician',
  PATIENT: '/profile',
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Tracks whether the initial Supabase session lookup has resolved.
  // Without this, a refresh momentarily reports the user as logged-out,
  // bouncing authenticated users to /login before the session loads.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    AuthModel.getSession()
      .then((session) => {
        if (mounted) setSession(session);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const subscription = AuthModel.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = () => {
    console.warn("login() bypass removed. Please use real Supabase auth.");
    return '/';
  };

  const logout = async () => {
    try {
      await AuthModel.signOut();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace('/');
    }
  };

  const getDashboardPath = (role) => {
    return ROLE_DASHBOARD_MAP[role] || '/';
  };

  let activeUser = null;
  const isResettingPassword = sessionStorage.getItem('isResettingPassword') === 'true';

  if (session?.user && !isResettingPassword) {
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
    <AuthContext.Provider value={{ user: activeUser, session, loading, login, logout, getDashboardPath }}>
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
