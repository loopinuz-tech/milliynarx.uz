import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../../components/common/SolarIcon';
import TelegramAuthModal from '../../components/auth/TelegramAuthModal';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);

  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect');

  const handleAuthRedirect = (user) => {
    if (redirectUrl) {
      navigate(decodeURIComponent(redirectUrl));
    } else if (user.role === 'ADMIN') {
      navigate('/admin');
    } else if (user.role === 'SELLER') {
      navigate('/seller');
    } else {
      navigate('/');
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      handleAuthRedirect(user);
    } catch (err) {
      setError(err.response?.data?.detail || "Kirishda xatolik yuz berdi. Parol yoki elektron pochtani tekshiring.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTelegramSuccess = (token, user) => {
    setTelegramModalOpen(false);
    loginWithToken(token, user);
    handleAuthRedirect(user);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10">
      <div className="w-full max-w-lg bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Header Brand Logo */}
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <Link to="/" className="inline-flex items-center justify-center group" title="Bosh sahifa">
            <img src="/topbarnmimg.png" alt="Milliy Narx" className="h-8 sm:h-9 w-auto object-contain hover:opacity-90 transition-opacity" />
          </Link>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-center text-slate-900 dark:text-white mb-1 tracking-tight">
          Tizimga kirish
        </h2>
        <p className="text-xs sm:text-sm text-center text-slate-500 dark:text-slate-400 mb-6">
          Milliy bozor tahlili va boshqaruv terminali
        </p>

        {redirectUrl && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-800 dark:text-amber-200 mb-4 flex items-center gap-2">
            <SolarIcon name="Lock" size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Ushbu sahifaga kirish uchun avval tizimga kiring</span>
          </div>
        )}

        {/* SOCIAL AUTH BUTTONS: Telegram (Active) & Google/Apple/Microsoft (Soon) */}
        <div className="space-y-3 mb-6">
          {/* Telegram Login Button (ACTIVE & FUNCTIONAL) */}
          <button
            type="button"
            onClick={() => setTelegramModalOpen(true)}
            className="w-full py-3 px-5 bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
            </svg>
            <span>Telegram orqali tezkor kirish</span>
          </button>

          {/* Other SSO Providers (Google, Apple, Microsoft - COMING SOON) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Google */}
            <div 
              className="py-2.5 px-3 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 opacity-70 cursor-not-allowed select-none"
              title="Google orqali kirish tez kunda ishga tushadi"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Google</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">Soon</span>
            </div>

            {/* Apple */}
            <div 
              className="py-2.5 px-3 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 opacity-70 cursor-not-allowed select-none"
              title="Apple orqali kirish tez kunda ishga tushadi"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 fill-slate-900 dark:fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.56.64-1.05 1.7-0.92 2.73 1 .08 2.03-.49 2.64-1.23z" />
                </svg>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Apple</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">Soon</span>
            </div>

            {/* Microsoft */}
            <div 
              className="py-2.5 px-3 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 opacity-70 cursor-not-allowed select-none"
              title="Microsoft orqali kirish tez kunda ishga tushadi"
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M1 13h10v10H1z"/>
                  <path fill="#7fba00" d="M13 1h10v10H13z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Microsoft</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">Soon</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-700 dark:text-rose-300 mb-4 flex items-center gap-2">
            <SolarIcon name="CloseCircle" size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Elektron pochta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@milliynarx.uz yoki nom@do'kon.uz"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1C2538] focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-300 font-semibold">Parol</label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:bg-white dark:focus:bg-[#1C2538] focus:border-orange-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm shadow-orange-600/20 transition-all text-xs sm:text-sm disabled:opacity-50 mt-3 cursor-pointer active:scale-98"
          >
            {submitting ? 'Tekshirilmoqda...' : 'Tizimga kirish'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Akkauntingiz yo'qmi?{' '}
          <Link to="/register" className="text-orange-600 dark:text-orange-400 hover:underline font-bold">
            Ro'yxatdan o'tish
          </Link>
        </div>
      </div>

      {/* Telegram Auth Modal */}
      <TelegramAuthModal
        isOpen={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        onSuccess={handleTelegramSuccess}
        role="BUYER"
      />
    </div>
  );
};

export default LoginPage;
