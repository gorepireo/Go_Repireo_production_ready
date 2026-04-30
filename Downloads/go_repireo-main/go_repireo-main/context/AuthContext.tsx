'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '@/lib/insforge';

interface Profile {
  id: string;
  role: 'user' | 'worker' | 'shopkeeper' | 'admin';
  status: 'active' | 'pending_approval' | 'suspended';
  display_name?: string;
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
      const { data, error } = await insforge.auth.getCurrentUser();
      if (data?.user) {
        setUser(data.user);
        const { data: profileData } = await insforge.auth.getProfile(data.user.id);
        setProfile(profileData as any);
      } else {
        setUser(null);
        setProfile(null);
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
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut, refresh: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
