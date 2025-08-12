import React, { createContext, useContext, useEffect, useState } from 'react';

type Role = 'admin' | 'trainer' | 'client' | null;

interface AuthContextType {
  token: string | null;
  role: Role;
  loading: boolean;
  login: (token: string, role: Exclude<Role, null>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  // Inicjalizacja ze storage
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role') as Role | null;
    if (savedToken) setToken(savedToken);
    if (savedRole) setRole(savedRole);
    setLoading(false);
  }, []);

  const login = (newToken: string, newRole: Exclude<Role, null>) => {
    // DEBUG: usuń w produkcji
    console.log('LOGIN CALLED', newToken ? 'token_set' : undefined, newRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setRole(newRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
