'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '@/lib/db';

interface Profile {
  id: string;
  role: 'user' | 'worker' | 'shopkeeper' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  full_name?: string;
  name?: string;
  display_name?: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  address?: {
    state: string;
    district: string;
    area: string;
    pincode: string;
    lat: number;
    lng: number;
  };
  worker_data?: any;
  shop_data?: any;
  earnings?: number;
}

interface AuthContextType {
  user: any | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('repireo_auth_token') || sessionStorage.getItem('repireo_auth_token');
        if (storedToken && db.getHttpClient) {
          db.getHttpClient().setAuthToken(storedToken);
        }

        if (localStorage.getItem('repireo_admin_logged_in') === 'true') {
          const adminEmail = localStorage.getItem('repireo_admin_email') || 'admin@23456';
          setUser({ id: 'admin-id-23456', email: adminEmail });
          setProfile({
            id: 'admin-id-23456',
            role: 'admin',
            status: 'active',
            full_name: 'System Admin',
            display_name: 'System Admin',
            email: adminEmail
          });
          setLoading(false);
          return;
        }
      }

      let currentUser = null;
      let finalProfile: any = null;

      // 1. Attempt InsForge auth lookup
      try {
        const { data } = await db.auth.getCurrentUser();
        if (data?.user) {
          currentUser = data.user;
          const { data: userData } = await db.database
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();
          if (userData) {
            const resolvedName = userData.full_name || userData.name || userData.display_name;
            finalProfile = { 
              ...userData, 
              full_name: resolvedName,
              display_name: resolvedName 
            };
            if (typeof window !== 'undefined' && resolvedName) {
              localStorage.setItem('repireo_user_name', resolvedName);
            }
          }
        }
      } catch (insErr) {
        console.warn('Auth check note:', insErr);
      }

      // 2. Local Storage session fallback + Turso DB user query
      if (typeof window !== 'undefined') {
        const storedEmail = localStorage.getItem('repireo_user_email');
        const storedRole = (localStorage.getItem('repireo_cached_role') as any) || 'user';
        const storedName = localStorage.getItem('repireo_user_name');

        if (storedEmail) {
          currentUser = currentUser || { id: 'usr_' + storedEmail.replace(/[^a-zA-Z0-9]/g, '_'), email: storedEmail };

          if (!finalProfile) {
            try {
              const { data: userData } = await db.database
                .from('users')
                .select('*')
                .eq('email', storedEmail.toLowerCase().trim())
                .maybeSingle();

              if (userData) {
                const resolvedName = userData.full_name || userData.name || userData.display_name || storedName;
                finalProfile = {
                  ...userData,
                  full_name: resolvedName,
                  display_name: resolvedName || storedEmail.split('@')[0],
                  role: userData.role || storedRole,
                  status: userData.status || 'active'
                };
                if (resolvedName) {
                  localStorage.setItem('repireo_user_name', resolvedName);
                }
              } else {
                finalProfile = {
                  id: currentUser.id,
                  email: storedEmail,
                  full_name: storedName || '',
                  display_name: storedName || storedEmail.split('@')[0],
                  role: storedEmail === 'gorepireo@gmail.com' ? 'admin' : storedRole,
                  status: 'active'
                };
              }
            } catch {
              finalProfile = {
                id: currentUser.id,
                email: storedEmail,
                full_name: storedName || '',
                display_name: storedName || storedEmail.split('@')[0],
                role: storedEmail === 'gorepireo@gmail.com' ? 'admin' : storedRole,
                status: 'active'
              };
            }
          }
        }
      }

      if (currentUser) {
        setUser(currentUser);
        setProfile(finalProfile || { id: currentUser.id, email: currentUser.email, role: 'user', status: 'active' });
      } else {
        setUser(null);
        setProfile(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('repireo_cached_role');
          localStorage.removeItem('repireo_cached_avatar');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signOut = async () => {
    await db.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('repireo_auth_token');
      sessionStorage.removeItem('repireo_auth_token');
      localStorage.removeItem('repireo_cached_role');
      localStorage.removeItem('repireo_cached_avatar');
      localStorage.removeItem('repireo_user_name');
      localStorage.removeItem('repireo_admin_email');
      localStorage.removeItem('repireo_admin_logged_in');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
