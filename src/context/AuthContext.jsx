import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

const ROLE_DASHBOARD_MAP = {
  ADMIN: '/dashboard/admin',
  DOCTOR: '/dashboard/doctor',
  RECEPTIONIST: '/dashboard/receptionist',
  TECHNICIAN: '/dashboard/technician',
  PATIENT: '/profile',
};

// Authoritative role mapping — sourced from the `users` table (role_id), which
// only privileged/server code can write. We deliberately do NOT trust
// `user_metadata.role` for access decisions: a logged-in user can rewrite their
// own user_metadata via supabase.auth.updateUser({ data: { role: 'ADMIN' } }),
// which would otherwise let a patient escalate into staff dashboards.
const ROLE_BY_ID = { 1: 'ADMIN', 2: 'DOCTOR', 3: 'TECHNICIAN', 4: 'RECEPTIONIST', 5: 'PATIENT' };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // Tracks whether the initial Supabase session lookup has resolved.
  // Without this, a refresh momentarily reports the user as logged-out,
  // bouncing authenticated users to /login before the session loads.
  const [loading, setLoading] = useState(true);

  // Authoritative role from the DB, keyed to the uid it was resolved for so a
  // session change can't be read against a previous user's resolution state.
  const [roleState, setRoleState] = useState({ uid: null, role: null, resolved: false });

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

  // Resolve the authoritative role from the `users` table whenever the
  // logged-in user changes. Gated so ProtectedRoute waits for it.
  useEffect(() => {
    let active = true;
    const uid = session?.user?.id || null;
    if (!uid) {
      setRoleState({ uid: null, role: null, resolved: true });
      return;
    }
    setRoleState({ uid, role: null, resolved: false });
    // Safety net: never block the UI forever if the lookup stalls.
    const timer = setTimeout(() => {
      if (active) setRoleState((s) => (s.uid === uid ? { ...s, resolved: true } : s));
    }, 6000);
    supabase
      .from('users')
      .select('role_id')
      .eq('user_id', uid)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setRoleState({ uid, role: data ? (ROLE_BY_ID[Number(data.role_id)] || 'PATIENT') : null, resolved: true });
      })
      .catch(() => { if (active) setRoleState({ uid, role: null, resolved: true }); })
      .finally(() => { clearTimeout(timer); });
    return () => { active = false; clearTimeout(timer); };
  }, [session?.user?.id]);

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

  // The role is only trustworthy once it's been resolved FOR THE CURRENT uid.
  const currentUid = session?.user?.id || null;
  const roleReady = roleState.uid === currentUid && roleState.resolved;

  if (session?.user && !isResettingPassword) {
    // Authoritative role from the DB once resolved; fall back to least-privilege
    // PATIENT (never to the spoofable user_metadata role) for access decisions.
    const role = roleReady ? (roleState.role || 'PATIENT') : 'PATIENT';
    activeUser = {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.email,
      role: role,
      avatar: session.user.user_metadata?.avatar_url,
      isSupabase: true
    };
  }

  // Hold `loading` true until the authoritative role is known for THIS logged-in
  // user, so ProtectedRoute never grants/denies access on a stale/guessed role.
  const effectiveLoading = loading || (!!session?.user && !isResettingPassword && !roleReady);

  return (
    <AuthContext.Provider value={{ user: activeUser, session, loading: effectiveLoading, login, logout, getDashboardPath }}>
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
