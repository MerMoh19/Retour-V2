import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile, Warehouse } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  warehouses: Warehouse[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);

      const { data: userWarehousesData } = await supabase
        .from('user_warehouses')
        .select('warehouse_id')
        .eq('user_id', userId);

      if (userWarehousesData && userWarehousesData.length > 0) {
        const warehouseIds = userWarehousesData.map((uw) => uw.warehouse_id);
        const { data: warehousesData } = await supabase
          .from('warehouses')
          .select('*')
          .in('id', warehouseIds)
          .order('name');

        if (warehousesData) {
          setWarehouses(warehousesData);
        }
      } else if (profileData.role === 'super_admin') {
        const { data: allWarehouses } = await supabase
          .from('warehouses')
          .select('*')
          .order('name');

        if (allWarehouses) {
          setWarehouses(allWarehouses);
        }
      }
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setWarehouses([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setWarehouses([]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        warehouses,
        loading,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
