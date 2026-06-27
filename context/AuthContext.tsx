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
           // Special override: company email is always admin
           if (data.user.email === 'gorepireo@gmail.com') {
             finalProfile.role = 'admin';
           }
        } else {
          // Fallback to auth profile
          const { data: profileData } = await insforge.auth.getProfile(data.user.id);
          finalProfile = profileData;
          if (data.user.email === 'gorepireo@gmail.com') {
             if (finalProfile) finalProfile.role = 'admin';
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
      insforge.getHttpClient().setAuthToken(null);
    }
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
