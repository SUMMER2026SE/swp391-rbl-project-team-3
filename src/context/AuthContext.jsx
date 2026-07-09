import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthModel } from '../models/AuthModel';
import { supabase } from '../supabaseClient';
import { ProfileModel } from '../models/ProfileModel';

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
      .then(async ({ data }) => {
        if (!data) {
          // No user row found. Try loading the profile to trigger the merge/auto-heal!
          try {
            await ProfileModel.getProfile(uid, 'PATIENT');
            if (active) {
              setRoleState({ uid, role: 'PATIENT', resolved: true });
            }
          } catch (e) {
            console.error('Auto-heal/merge failed in AuthContext:', e);
            if (active) {
              setRoleState({ uid, role: null, resolved: true });
            }
          }
        } else {
          if (active) setRoleState({ uid, role: ROLE_BY_ID[Number(data.role_id)] || 'PATIENT', resolved: true });
        }
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
      // Clear auth tokens and session data, but preserve doctor EMR drafts
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('appointment_draft_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
      window.location.replace('/login');
    }
  };

  const getDashboardPath = (role) => {
    return ROLE_DASHBOARD_MAP[role] || '/';
  };

  let activeUser = null;
  const isResettingPassword = sessionStorage.getItem('isResettingPassword') === 'true';

  // The role is only trustworthy once it's been resolved FOR THE CURRENT uid.
  const currentUid = session?.user?.id || null;
  const roleResolved = roleState.uid === currentUid && roleState.resolved;

  if (session?.user && !isResettingPassword) {
    if (roleResolved) {
      // Authoritative role from the DB once resolved
      const role = roleState.role || 'PATIENT';
      activeUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || session.user.email,
        role: role,
        avatar: session.user.user_metadata?.avatar_url,
        isSupabase: true
      };
    }
    // If not roleResolved, activeUser remains null.
  }

  // Hold `loading` true until the authoritative role is known for THIS logged-in
  // user, so ProtectedRoute never grants/denies access on a stale/guessed role.
  const effectiveLoading = loading || (!!session?.user && !isResettingPassword && !roleResolved);

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
