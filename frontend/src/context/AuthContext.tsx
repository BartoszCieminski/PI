import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'admin' | 'trainer' | 'client' | null;

interface AuthContextType {
  token: string | null;
  role: Role;
  userId: string | null;
  loading: boolean;
  login: (token: string, role: Exclude<Role, null>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const decodeJWT = (token: string): { sub?: string } | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role') as Role | null;

    if (savedToken) {
      setToken(savedToken);
      const payload = decodeJWT(savedToken);
      if (payload?.sub) setUserId(payload.sub);
    }

    if (savedRole) setRole(savedRole);
    setLoading(false);
  }, []);

  const login = (newToken: string, newRole: Exclude<Role, null>) => {
    const payload = decodeJWT(newToken);
    const uid = payload?.sub || null;

    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);

    setToken(newToken);
    setRole(newRole);
    setUserId(uid);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');

    setToken(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
