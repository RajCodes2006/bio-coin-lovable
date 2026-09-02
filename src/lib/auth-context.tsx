import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  memberSince: string;
  bioCoins: number;
  avatar?: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (name: string, email: string, password: string, city: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateCoins: (amount: number) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function loadProfile(supabaseUser: SupabaseUser): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, city, bio_coins, member_since, avatar_url, is_admin")
    .eq("id", supabaseUser.id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: supabaseUser.email ?? "",
    city: data.city,
    memberSince: new Date(data.member_since).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    bioCoins: data.bio_coins,
    avatar: data.avatar_url ?? undefined,
    isAdmin: data.is_admin ?? false,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) {
      setUser(null);
      return;
    }
    const profile = await loadProfile(supabaseUser);
    setUser(profile);
  }, []);

  useEffect(() => {
    // Restore session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await loadProfile(session.user);
        setUser(profile);
      }
      setLoading(false);
    });

    // Keep in sync across tabs / token refresh / sign-out elsewhere
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, city: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, city } }, // read by the handle_new_user() trigger
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateCoins = useCallback(async (amount: number) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .update({ bio_coins: user.bioCoins + amount })
      .eq("id", user.id)
      .select("bio_coins")
      .single();

    if (!error && data) {
      setUser((prev) => (prev ? { ...prev, bioCoins: data.bio_coins } : prev));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateCoins, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
