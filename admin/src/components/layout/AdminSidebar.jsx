import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

export const AdminSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: 'Dashboard', label: 'Boshqaruv Terminali', sub: 'Asosiy monitoring', exact: true },
    { to: '/sellers', icon: 'Store', label: 'Sotuvchilar', sub: 'Tasdiqlash & INN nazorati' },
    { to: '/products', icon: 'Box', label: 'Mahsulotlar', sub: 'Moderatsiya & narxlar' },
    { to: '/users', icon: 'Users', label: 'Foydalanuvchilar', sub: 'Akkauntlar bazasi' },
    { to: '/categories', icon: 'Database', label: 'Toifalar daraxti', sub: 'Katalog & Brendlar' },
    { to: '/data-sources', icon: 'Shield', label: 'Platforma manbalari', sub: 'Zero-Fake & adapterlar' },
    { to: '/audit-logs', icon: 'Document', label: 'Audit jurnali', sub: 'Xavfsizlik loglari' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 lg:static
        w-[270px] flex-shrink-0 bg-white dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300
        flex flex-col border-r border-slate-200 dark:border-slate-800/90
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header with Official Favicon */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#080B12]">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon.png" 
              alt="Milliy Narx" 
              className="w-9 h-9 object-contain rounded-xl shadow-md shrink-0" 
            />
            <div>
              <div className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-none">
                MILLIY NARX
              </div>
              <div className="text-[10px] font-mono text-red-600 dark:text-red-400 font-bold uppercase tracking-wider mt-0.5">
                ROOT ADMIN PANEL
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
            aria-label="Yopish"
          >
            <SolarIcon name="CloseCircle" size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center justify-between">
              <span>Boshqaruv Menyusi</span>
              <span className="text-[9px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/70 px-1.5 py-0.5 rounded font-mono font-bold">
                ROOT
              </span>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group
                    ${isActive 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md font-semibold' 
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'}
                  `}
                >
                  <SolarIcon name={item.icon} size={18} className="shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{item.label}</span>
                    <span className="text-[10px] opacity-70 font-normal leading-tight mt-0.5">{item.sub}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* External Platform Link */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800/60">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Tashqi Havolalar
            </div>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors border border-dashed border-slate-200 dark:border-slate-800 hover:border-orange-500/40"
            >
              <div className="flex items-center gap-2.5">
                <SolarIcon name="Dashboard" size={16} />
                <span>Asosiy Bozor (Port 5173)</span>
              </div>
              <SolarIcon name="ArrowRight" size={14} />
            </a>
          </div>
        </div>

        {/* Admin Footer User Info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#080B12]">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs shrink-0 border border-red-200 dark:border-red-800/60">
                {(user?.full_name || user?.email || 'A')[0].toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {user?.full_name || user?.email}
                </div>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-mono font-semibold">
                  ROOT ADMINISTRATOR
                </div>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              title="Tizimdan chiqish"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <SolarIcon name="Logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
