import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import SolarIcon from '../common/SolarIcon';

export const AdminHeader = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="h-16 w-full bg-white/95 dark:bg-[#0B0F19]/95 border-b border-slate-200 dark:border-slate-800/80 px-3.5 sm:px-6 flex items-center justify-between z-30 sticky top-0 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          aria-label="Menyuni ochish"
        >
          <SolarIcon name="Menu" size={22} />
        </button>

        {/* Mobile Brand with Official Favicon */}
        <div className="flex items-center gap-2 lg:hidden">
          <img src="/favicon.png" alt="Milliy Narx" className="w-7 h-7 object-contain rounded-lg shadow-xs" />
          <span className="text-xs font-black text-slate-900 dark:text-white tracking-tight leading-none">
            MILLIY NARX
          </span>
        </div>

        {/* Live Status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-bold">TIZIM:</span>
          <span className="font-semibold">ONLINE (8000)</span>
        </div>
      </div>

      {/* Right Tools */}
      <div className="flex items-center gap-1.5 sm:gap-3">
        {/* Dark/Light mode toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={isDark ? "Yorug' rejimga o'tish (Light Mode)" : "Tungi rejimga o'tish (Dark Mode)"}
          aria-label="Mavzuni o'zgartirish"
        >
          <SolarIcon name={isDark ? "sun" : "moon"} size={19} className={isDark ? "text-amber-400" : "text-slate-600"} />
        </button>

        {/* Root Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <SolarIcon name="Shield" size={14} className="text-red-500" />
          <span className="font-mono font-medium truncate max-w-[150px]">{user?.email}</span>
        </div>

        {/* Quick Exit */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-red-950/50 hover:bg-rose-100 dark:hover:bg-red-900/60 border border-rose-200 dark:border-red-800/60 text-rose-700 dark:text-red-300 hover:text-rose-900 dark:hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          title="Tizimdan chiqish"
        >
          <SolarIcon name="Logout" size={15} />
          <span className="hidden sm:inline">Chiqish</span>
        </button>
      </div>
    </header>
  );
};

export default AdminHeader;
