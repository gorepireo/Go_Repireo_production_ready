'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '@/lib/services/auth.service';
import { UserService } from '@/lib/services/user.service';
import { WorkerService } from '@/lib/services/worker.service';
import { User } from 'firebase/auth';

export interface Profile {
  id: string;
  role: 'user' | 'worker' | 'shopkeeper' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  display_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  address?: any;
  worker_data?: any;
  shop_data?: any;
  earnings?: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refresh: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileForUser = async (firebaseUser: User) => {
    try {
      // First try to fetch as a regular user
      const userProfile = await UserService.getProfile(firebaseUser.uid);
      
      let p: Profile | null = null;

      if (userProfile) {
        p = {
          id: userProfile.uid,
          role: userProfile.role === 'customer' ? 'user' : userProfile.role as any,
          status: userProfile.isActive ? 'active' : 'suspended',
          display_name: userProfile.name,
          email: userProfile.email,
          phone: userProfile.phone,
          avatar_url: userProfile.profilePhoto || undefined,
        };

        // If worker, augment with worker data
        if (p.role === 'worker') {
          const workerProfile = await WorkerService.getProfile(firebaseUser.uid);
          if (workerProfile) {
             p.worker_data = workerProfile;
             if (workerProfile.verification.status === 'pending' || workerProfile.verification.status === 'under_review') {
                p.status = 'pending_approval';
             }
          }
        }
      } else {
        // Fallback or legacy mapping if not found in Firestore yet
        p = {
          id: firebaseUser.uid,
          role: 'user',
          status: 'active',
          display_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || undefined,
          avatar_url: firebaseUser.photoURL || undefined,
        };
        // Auto-create basic profile
        await UserService.createProfile(firebaseUser.uid, {
          name: p.display_name!,
          email: p.email || '',
        });
      }

      setProfile(p);
    } catch (err) {
      console.error("Error fetching user profile:", err);
    }
  };

  const refresh = async () => {
    if (user) {
      await fetchProfileForUser(user);
    }
  };

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfileForUser(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await AuthService.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
