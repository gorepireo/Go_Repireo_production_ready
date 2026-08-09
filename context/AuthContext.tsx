'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';

interface Profile {
  id: string;
  role: 'user' | 'worker' | 'shopkeeper' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
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
        if (storedToken) {
          insforge.getHttpClient().setAuthToken(storedToken);
        }

        if (localStorage.getItem('repireo_admin_logged_in') === 'true') {
          const adminEmail = localStorage.getItem('repireo_admin_email') || 'admin@23456';
          setUser({ id: 'admin-id-23456', email: adminEmail });
          setProfile({
            id: 'admin-id-23456',
            role: 'admin',
            status: 'active',
            display_name: 'System Admin',
            email: adminEmail
          });
          setLoading(false);
          return;
        }
      }

      const { data, error } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setUser(data.user);
        
        let finalProfile: any = null;
        
        // Check users table first as primary source of truth
        const { data: userData } = await insforge.database
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();
          
        if (userData) {
           finalProfile = {
             ...userData,
             display_name: userData.name || userData.display_name,
           };
           // Special override: company admin emails
           if (data.user.email === 'gorepireo@gmail.com' || data.user.email === 'admin@23456' || data.user.email === 'admin@23456.com') {
             finalProfile.role = 'admin';
           }
        } else {
          // Fallback to auth profile
          const { data: profileData } = await insforge.auth.getProfile(data.user.id);
          finalProfile = profileData || { role: 'user', status: 'active' };
          if (data.user.email === 'gorepireo@gmail.com' || data.user.email === 'admin@23456' || data.user.email === 'admin@23456.com') {
             finalProfile.role = 'admin';
          }
        }

        if (finalProfile) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('repireo_cached_role', finalProfile.role);
            if (finalProfile.avatar_url) {
              localStorage.setItem('repireo_cached_avatar', finalProfile.avatar_url);
            }
          }
        }
        setProfile(finalProfile);
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
    await insforge.auth.signOut();
    setUser(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('repireo_auth_token');
      sessionStorage.removeItem('repireo_auth_token');
      localStorage.removeItem('repireo_cached_role');
      localStorage.removeItem('repireo_cached_avatar');
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
