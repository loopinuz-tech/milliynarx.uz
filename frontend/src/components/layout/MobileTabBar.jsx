import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

export const MobileTabBar = () => {
  const location = useLocation();
  const { user, isAuthenticated, isSeller, isAdmin } = useAuth();

  // Determine profile/cabinet route based on auth status and role
  const profileRoute = !isAuthenticated 
    ? '/login' 
    : isAdmin 
    ? '/admin' 
    : isSeller 
    ? '/seller' 
    : '/profile';

  const profileLabel = !isAuthenticated 
    ? 'Kirish' 
    : isAdmin 
    ? 'Admin' 
    : isSeller 
    ? 'Do\'kon' 
    : 'Kabinet';

  const navItems = [
    {
      to: '/',
      label: 'Bozor',
      icon: 'Home2',
      exact: true
    },
    {
      to: '/search',
      label: 'Qidiruv',
      icon: 'Search'
    },
    {
      to: '/ai-advisor',
      label: 'AI Tahlil',
      isAi: true
    },
    {
      to: '/compare',
      label: 'Taqqoslash',
      icon: 'Widget'
    },
    {
      to: profileRoute,
      label: profileLabel,
      icon: 'User',
      isProfile: true
    }
  ];

  return (
    <nav 
      aria-label="Mobil ilova navigatsiyasi"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.45)] bottom-bar-safe transition-colors duration-200"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = item.exact 
            ? location.pathname === item.to 
            : location.pathname.startsWith(item.to) && item.to !== '/';

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={`
                relative flex flex-col items-center justify-center h-full w-full py-1 
                transition-all duration-150 active:scale-90 select-none
                ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}
              `}
            >
              {item.isAi ? (
                // Special prominent AI Tab with subtle flame glow
                <div className="relative -mt-3 flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-orange-500/30 scale-105 ring-2 ring-orange-400/50' 
                      : 'bg-slate-900 text-orange-400 dark:bg-slate-800 dark:text-orange-400 shadow-slate-900/20'}
                  `}>
                    <img src="/aiimg.png" alt="AI" className="w-5 h-5 object-contain" />
                  </div>
                  <span className={`text-[10px] font-extrabold mt-0.5 tracking-tight ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <div className="relative flex items-center justify-center">
                    {item.isProfile && isAuthenticated && user ? (
                      <div className={`
                        w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black
                        ${isActive 
                          ? 'bg-orange-600 text-white ring-2 ring-orange-500/30' 
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}
                      `}>
                        {(user.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    ) : (
                      <SolarIcon 
                        name={item.icon} 
                        size={21} 
                        className={`transition-transform duration-200 ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.6]'}`}
                      />
                    )}

                    {/* Active micro-indicator dot */}
                    {isActive && (
                      <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-orange-600 dark:bg-orange-400 animate-pulse" />
                    )}
                  </div>

                  <span className={`text-[10px] tracking-tight leading-none mt-1 font-medium transition-all ${isActive ? 'font-bold text-orange-600 dark:text-orange-400' : ''}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileTabBar;
