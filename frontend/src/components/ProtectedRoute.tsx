import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'trainer' | 'client';
}

const ProtectedRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const { token, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p>Ładowanie...</p>;

  // Brak tokena -> /login z informacją dokąd wrócić
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Token jest, ale zła rola
  if (requiredRole && role !== requiredRole) {
    return <p>Brak dostępu — musisz być {requiredRole}.</p>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
