import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

export const AdminProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090D16] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono text-slate-400 tracking-wider">
          XAVFSIZ ADMIN SEANSI TEKSHIRILMOQDA...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
