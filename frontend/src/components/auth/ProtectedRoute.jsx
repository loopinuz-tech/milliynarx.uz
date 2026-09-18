import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

/**
 * ProtectedRoute component that enforces authentication and role-based access.
 * - Redirects unauthenticated users to /login with return URL.
 * - Shows an Uzbek-language access denied screen if user doesn't have required role.
 */
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, loading, isAdmin, isSeller, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 rounded-full border-3 border-orange-500 border-t-transparent animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium">Tizim holati tekshirilmoqda...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login with query param
  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  // Check role requirements
  if (requiredRole) {
    const roleUpper = requiredRole.toUpperCase();

    if (roleUpper === 'ADMIN' && !isAdmin) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-rose-200 rounded-2xl shadow-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4 border border-rose-100">
            <SolarIcon name="Lock" size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            Administrator ruxsati talab qilinadi
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Siz hozirda <strong className="text-slate-800">{user?.email}</strong> ({user?.role}) akkaunti orqali kirgansiz. Ushbu bo'lim faqat bosh administratorlar uchun mo'ljallangan.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                logout();
                navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
              }}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              Administrator sifatida kirish
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      );
    }

    if (roleUpper === 'SELLER' && !isSeller && !isAdmin) {
      return (
        <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-amber-200 rounded-2xl shadow-xs text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-4 border border-amber-100">
            <SolarIcon name="Store" size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1.5">
            Sotuvchi profili talab qilinadi
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Siz xaridor sifatida tizimga kirgansiz. Do'kon boshqaruvi va mahsulot qo'shish uchun sotuvchi hisobiga ega bo'lishingiz lozim.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate('/register')}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
            >
              Sotuvchi sifatida ro'yxatdan o'tish
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Bosh sahifaga qaytish
            </button>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
