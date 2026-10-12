import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types/User';
import { authApi } from '../api/authApi';
import { onSessionExpired } from '../api/http';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      setUser(await authApi.restore());
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    onSessionExpired(() => setUser(null));
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setUser(await authApi.login(email, password));
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
    await login(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}