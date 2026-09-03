import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  memberSince: string;
  bioCoins: number;
  avatar?: string;
  role: UserRole;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string,
    city: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function loadProfile(
  supabaseUser: SupabaseUser
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, name, city, bio_coins, member_since, avatar_url, role, is_admin"
    )
    .eq("id", supabaseUser.id)
    .single();

  if (error || !data) return null;

  const role: UserRole =
    data.role === "admin" || data.is_admin === true ? "admin" : "user";

  return {
    id: data.id,
    name: data.name,
    email: supabaseUser.email ?? "",
    city: data.city,
    memberSince: new Date(data.member_since).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    bioCoins: Number(data.bio_coins ?? 0),
    avatar: data.avatar_url ?? undefined,
    role,
    isAdmin: role === "admin",
  };
}

export const AuthProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      setUser(null);
      return;
    }

    const profile = await loadProfile(supabaseUser);
    setUser(profile);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await loadProfile(session.user);
        if (mounted) setUser(profile);
      }

      if (mounted) setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        const profile = await loadProfile(session.user);
        if (mounted) setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          ok: false,
          error: error.message,
        };
      }

      return { ok: true };
    },
    []
  );

  const signup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      city: string
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            city,
          },
        },
      });

      if (error) {
        return {
          ok: false,
          error: error.message,
        };
      }

      return { ok: true };
    },
    []
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be inside AuthProvider");
  }

  return ctx;
};