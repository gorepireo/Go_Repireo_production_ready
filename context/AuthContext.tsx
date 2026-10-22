'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from '@/lib/firebase';

type AppUser = User & {
  id: string;
  user_metadata: { name?: string | null; full_name?: string | null; avatar_url?: string | null };
};

export type TrustedRole = 'customer' | 'worker' | 'admin';

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

interface AuthContextType {
  user: AppUser | null;
  role: TrustedRole | null;
  profile: Profile | null;
  loading: boolean;
  authError: string | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  profile: null,
  loading: true,
  authError: null,
  signOut: async () => undefined,
  refresh: async () => undefined,
});

function isTrustedRole(value: unknown): value is TrustedRole {
  return value === 'customer' || value === 'worker' || value === 'admin';
}

async function loadIdentity(firebaseUser: User) {
  const token = await firebaseUser.getIdTokenResult();
  const claimRole = token.claims.role;
  const role: TrustedRole | null = isTrustedRole(claimRole)
    ? claimRole
    : token.claims.admin === true
      ? 'admin'
      : null;

  if (!role) return { role: null, profile: null };

  const collectionName = role === 'worker' ? 'workers' : 'customers';
  const snapshot = await getDoc(doc(db, collectionName, firebaseUser.uid));
  const data = snapshot.data() ?? {};
  const privateData = role === 'worker'
    ? (await getDoc(doc(db, 'workerPrivate', firebaseUser.uid))).data() ?? {}
    : {};
  const workerStatus = typeof data.status === 'string' ? data.status : undefined;

  const profile: Profile = {
    id: firebaseUser.uid,
    role: role === 'customer' ? 'user' : role,
    status:
      role === 'worker' && ['draft', 'pendingVerification', 'rejected'].includes(workerStatus ?? '')
        ? 'pending_approval'
        : workerStatus === 'suspended'
          ? 'suspended'
          : 'active',
    display_name:
      (typeof data.fullName === 'string' && data.fullName) ||
      (typeof data.name === 'string' && data.name) ||
      firebaseUser.displayName || undefined,
    avatar_url:
      (typeof data.avatarUrl === 'string' && data.avatarUrl) ||
      (typeof data.avatarBase64 === 'string' && data.avatarBase64) ||
      firebaseUser.photoURL || undefined,
    email: (typeof data.email === 'string' && data.email) || firebaseUser.email || undefined,
    phone: (typeof data.phone === 'string' && data.phone) || firebaseUser.phoneNumber || undefined,
    worker_data: role === 'worker' ? { ...data, ...privateData } : undefined,
  };

  return { role, profile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [role, setRole] = useState<TrustedRole | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const hydrate = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser) {
      const compatibleUser = firebaseUser as AppUser;
      if (!(compatibleUser as any).id) {
        Object.defineProperty(compatibleUser, 'id', { configurable: true, value: firebaseUser.uid });
      }
      if (!(compatibleUser as any).user_metadata) {
        Object.defineProperty(compatibleUser, 'user_metadata', {
          configurable: true,
          value: { name: firebaseUser.displayName, full_name: firebaseUser.displayName, avatar_url: firebaseUser.photoURL },
        });
      }
      setUser(compatibleUser);
    } else {
      setUser(null);
    }
    setAuthError(null);
    if (!firebaseUser) {
      setRole(null);
      setProfile(null);
      return;
    }
    try {
      const identity = await loadIdentity(firebaseUser);
      setRole(identity.role);
      setProfile(identity.profile);
      if (!identity.role) setAuthError('This account does not have a trusted GO_REPIREO role.');
    } catch (error) {
      console.error('Unable to load the authenticated profile.', error);
      setRole(null);
      setProfile(null);
      setAuthError('We could not verify your account permissions. Please sign in again.');
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      await hydrate(firebaseUser);
      setLoading(false);
    });
  }, [hydrate]);

  const refresh = useCallback(async () => {
    if (!firebaseConfigured) return;
    if (!auth.currentUser) return;
    await auth.currentUser.getIdToken(true);
    await hydrate(auth.currentUser);
  }, [hydrate]);

  const signOut = useCallback(async () => {
    if (!firebaseConfigured) {
      window.location.assign('/maintenance');
      return;
    }
    await firebaseSignOut(auth);
    setUser(null);
    setRole(null);
    setProfile(null);
    window.location.assign('/login');
  }, []);

  const value = useMemo(
    () => ({ user, role, profile, loading, authError, signOut, refresh }),
    [user, role, profile, loading, authError, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
