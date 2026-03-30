import React, { createContext, useContext, useState, useCallback } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  city: string;
  memberSince: string;
  bioCoins: number;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, city: string) => Promise<boolean>;
  logout: () => void;
  updateCoins: (amount: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "demo@greenbharat.in": {
    password: "demo123",
    user: {
      id: "1",
      name: "Rahul Sharma",
      email: "demo@greenbharat.in",
      city: "Mumbai",
      memberSince: "June 2023",
      bioCoins: 1250,
    },
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("gb_user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    const stored = localStorage.getItem("gb_users");
    const users = stored ? JSON.parse(stored) : MOCK_USERS;
    const entry = users[email];
    if (entry && entry.password === password) {
      setUser(entry.user);
      localStorage.setItem("gb_user", JSON.stringify(entry.user));
      return true;
    }
    return false;
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, city: string) => {
    const stored = localStorage.getItem("gb_users");
    const users = stored ? JSON.parse(stored) : { ...MOCK_USERS };
    if (users[email]) return false;
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      city,
      memberSince: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      bioCoins: 0,
    };
    users[email] = { password, user: newUser };
    localStorage.setItem("gb_users", JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem("gb_user", JSON.stringify(newUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("gb_user");
  }, []);

  const updateCoins = useCallback((amount: number) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, bioCoins: prev.bioCoins + amount };
      localStorage.setItem("gb_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, updateCoins }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
