'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export type TrustedRole = 'customer' | 'worker' | 'admin';

export interface AppUser {
  id: string;
  uid: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  photoURL: string | null;
  user_metadata: { name?: string | null; full_name?: string | null; avatar_url?: string | null };
}

export interface Profile {
  id: string;
  role: 'user' | 'worker' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  display_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  worker_data?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SessionUser {
  uid: string;
  phone: string | null;
  email: string | null;
  displayName: string;
  role: TrustedRole;
  accountStatus: 'active' | 'pending' | 'suspended' | 'disabled';
}

interface AuthContextType {
  user: AppUser | null;
  role: TrustedRole | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, profile: null, loading: true, authError: null, signOut: async () => undefined, refresh: async () => undefined });

function mapSession(identity: SessionUser) {
  const user: AppUser = {
    id: identity.uid,
    uid: identity.uid,
    email: identity.email,
    phone: identity.phone,
    displayName: identity.displayName,
    photoURL: null,
    user_metadata: { name: identity.displayName, full_name: identity.displayName },
  };
  const profile: Profile = {
    id: identity.uid,
    role: identity.role === 'customer' ? 'user' : identity.role,
    status: identity.accountStatus === 'pending' ? 'pending_approval' : identity.accountStatus === 'active' ? 'active' : 'suspended',
    display_name: identity.displayName,
    email: identity.email || undefined,
    phone: identity.phone || undefined,
  };
  return { user, profile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<TrustedRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store', credentials: 'include' });
      if (response.status === 401) {
        setUser(null); setRole(null); setProfile(null); setAuthError(null);
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.user) throw new Error(result.error || 'Unable to load your account.');
      const identity = result.user as SessionUser;
      const mapped = mapSession(identity);
      setUser(mapped.user); setRole(identity.role); setProfile(mapped.profile); setAuthError(null);
    } catch (error) {
      console.error('Unable to load the Turso session.', error);
      setUser(null); setRole(null); setProfile(null);
      setAuthError('We could not verify your account session. Please sign in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/session', { method: 'DELETE', credentials: 'include' });
    setUser(null); setRole(null); setProfile(null);
    router.replace('/login');
  }, [router]);

  const value = useMemo(() => ({ user, role, profile, loading, authError, signOut, refresh }), [user, role, profile, loading, authError, signOut, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
