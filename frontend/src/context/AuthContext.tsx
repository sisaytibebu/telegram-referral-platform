import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminLogin } from '../services/adminApi';

interface Admin { id: number; username: string; role: string; }
interface AuthContextType {
  admin: Admin | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const stored = localStorage.getItem('admin_user');
    if (token && stored) {
      try { setAdmin(JSON.parse(stored)); } catch { logout(); }
    }
  }, []);

  const login = async (username: string, password: string) => {
    const res = await adminLogin(username, password);
    localStorage.setItem('admin_token', res.data.token);
    localStorage.setItem('admin_user', JSON.stringify(res.data.admin));
    setAdmin(res.data.admin);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout, isAuthenticated: !!admin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
