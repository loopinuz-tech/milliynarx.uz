import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import SolarIcon from '../components/common/SolarIcon';

export const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Kirishda xatolik yuz berdi. Iltimos, ma'lumotlarni tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-white flex flex-col justify-center items-center p-4 relative overflow-hidden transition-colors duration-200">
      {/* Top Bar Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold"
          title={isDark ? "Yorug' rejimga o'tish (Light Mode)" : "Tungi rejimga o'tish (Dark Mode)"}
          aria-label="Mavzuni almashtirish"
        >
          <SolarIcon name={isDark ? "Sun" : "Moon"} size={17} className={isDark ? "text-amber-400" : "text-slate-600"} />
          <span className="hidden sm:inline font-medium">
            {isDark ? "Yorug' rejim" : "Tungi rejim"}
          </span>
        </button>
      </div>

      {/* Background ambient gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 dark:bg-red-600/10 rounded-full blur-3xl pointer-events-none transition-colors duration-300" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-amber-500/10 dark:bg-orange-600/10 rounded-full blur-3xl pointer-events-none transition-colors duration-300" />

      <div className="w-full max-w-md z-10 my-auto py-8">
        {/* Logo and Terminal Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
            <img 
              src="/favicon.png" 
              alt="Milliy Narx" 
              className="w-16 h-16 sm:w-18 sm:h-18 object-contain rounded-2xl shadow-xl shadow-orange-500/20 dark:shadow-orange-500/30 border border-orange-500/20 p-1 bg-white dark:bg-transparent" 
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            MILLIY NARX
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800/80 text-red-700 dark:text-red-400 px-2.5 py-0.5 rounded-full">
              ROOT ADMIN TERMINAL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
            Tizim ma'murlari uchun xavfsiz boshqaruv stantsiyasi
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-[#0D1424] border border-slate-200 dark:border-slate-800/90 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/60 backdrop-blur-xl transition-colors duration-200">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <SolarIcon name="Warning" size={18} className="shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
              <div className="leading-relaxed font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Administrator E-pochtasi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <SolarIcon name="User" size={17} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@milliynarx.uz"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Xavfsizlik Paroli
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <SolarIcon name="Lock" size={17} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-[#090D16] border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm rounded-xl shadow-md shadow-orange-600/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99] mt-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Tekshirilmoqda...</span>
                </>
              ) : (
                <>
                  <SolarIcon name="Lock" size={18} />
                  <span>Terminalga Kirish</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="mt-6 sm:mt-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
          <p className="font-medium">Milliy Narx v1.0 &bull; B2B & B2C Price Intelligence</p>
          <div>
            <a
              href="http://localhost:5173"
              className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              <span>&larr; Asosiy xarid platformasiga qaytish</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
