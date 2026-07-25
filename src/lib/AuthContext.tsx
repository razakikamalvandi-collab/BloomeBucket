import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';
import { getCurrentProfile } from './api';
import type { Profile } from './types';

interface AuthContextValue {
  profile: (Profile & { email: string }) | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
  isLoggedIn: false,
  isAdmin: false,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<(Profile & { email: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    try {
      const p = await getCurrentProfile();
      setProfile(p);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, _session) => {
      refreshProfile();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      profile, loading,
      isLoggedIn: !!profile,
      isAdmin: profile?.role === 'admin',
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
