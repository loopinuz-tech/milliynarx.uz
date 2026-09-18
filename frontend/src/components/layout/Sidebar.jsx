import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isSeller, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation sets based on permissions
  const publicNav = [
    { to: '/', icon: 'Dashboard', label: 'Bozor', sub: 'Asosiy sahifa' },
    { to: '/search', icon: 'Search', label: 'Narx tahlili', sub: 'Bozor qidiruvi' },
    { to: '/compare', icon: 'Compare', label: 'Taqqoslash', sub: '2-5 mahsulot' },
    { to: '/favorites', icon: 'Heart', label: 'Sevimlilar', sub: 'Saqlanganlar' },
    { to: '/alerts', icon: 'Bell', label: 'Ogohlantirishlar', sub: 'Narx tushishi' },
  ];

  const sellerNav = [
    { to: '/seller', icon: 'Dashboard', label: 'Do\'kon paneli', sub: 'Ko\'rsatkichlar', exact: true },
    { to: '/seller/products', icon: 'Box', label: 'Mahsulotlarim', sub: 'Katalog boshqaruvi' },
    { to: '/seller/products/new', icon: 'Plus', label: 'Mahsulot qo\'shish', sub: 'Yangi taklif' },
    { to: '/seller/price-history', icon: 'Tag', label: 'Narx tarixi', sub: 'O\'zgarishlar jurnali' },
    { to: '/seller/store', icon: 'Store', label: 'Do\'kon profili', sub: 'Biznes ma\'lumotlari' },
  ];

  const adminNav = [
    { to: '/admin', icon: 'Dashboard', label: 'Terminal', sub: 'Asosiy monitoring', exact: true },
    { to: '/admin/sellers', icon: 'Store', label: 'Sotuvchilar', sub: 'Tasdiqlash & nazorat' },
    { to: '/admin/products', icon: 'Box', label: 'Mahsulotlar', sub: 'Moderatsiya' },
    { to: '/admin/users', icon: 'Users', label: 'Foydalanuvchilar', sub: 'Baza nazorati' },
    { to: '/admin/categories', icon: 'Database', label: 'Katalog daraxti', sub: 'Kategoriya & Brend' },
    { to: '/admin/data-sources', icon: 'Shield', label: 'Platforma manbalari', sub: 'Adapterlar holati' },
    { to: '/admin/audit-logs', icon: 'Document', label: 'Audit jurnali', sub: 'Xavfsizlik loglari' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 lg:static
        w-[260px] flex-shrink-0 bg-[#0B0F19] text-slate-300
        flex flex-col border-r border-slate-800/80
        transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Logo & Terminal Identifier */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/60 bg-[#0B0F19]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md">
              <SolarIcon name="Chart" size={18} />
            </div>
            <span className="text-sm font-bold tracking-tight text-white leading-none">
              MILLIY NARX
            </span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <SolarIcon name="CloseCircle" size={20} />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main / Public Section */}
          <div>
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Bozor & Tahlil
            </div>
            <nav className="space-y-1">
              {publicNav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group
                    ${isActive 
                      ? 'bg-orange-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                  `}
                >
                  <SolarIcon name={item.icon} size={18} />
                  <div className="flex flex-col text-left">
                    <span className="leading-tight">{item.label}</span>
                    <span className="text-[10px] opacity-70 font-normal leading-tight">{item.sub}</span>
                  </div>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Seller Section */}
          {(isSeller || isAdmin) && (
            <div>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Sotuvchi paneli</span>
                {user?.seller_status && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono ${
                    user.seller_status === 'APPROVED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {user.seller_status}
                  </span>
                )}
              </div>
              <nav className="space-y-1">
                {sellerNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group
                      ${isActive 
                        ? 'bg-orange-600 text-white shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                    `}
                  >
                    <SolarIcon name={item.icon} size={18} />
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">{item.label}</span>
                      <span className="text-[10px] opacity-70 font-normal leading-tight">{item.sub}</span>
                    </div>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}

          {/* Admin Section */}
          {isAdmin && (
            <div>
              <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
                <span>Administrator</span>
                <span className="text-[9px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded font-mono">
                  ROOT
                </span>
              </div>
              <nav className="space-y-1">
                {adminNav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => onClose && onClose()}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all group
                      ${isActive 
                        ? 'bg-orange-600 text-white shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}
                    `}
                  >
                    <SolarIcon name={item.icon} size={18} />
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">{item.label}</span>
                      <span className="text-[10px] opacity-70 font-normal leading-tight">{item.sub}</span>
                    </div>
                  </NavLink>
                ))}
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-slate-800/60 bg-[#080B12]">
          {isAuthenticated ? (
            <div className="flex items-center justify-between px-2 py-1.5 rounded bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-orange-950/80 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0 border border-orange-800/60">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-slate-200 truncate">
                    {user?.full_name || user?.email}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    {user?.role}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => { logout(); navigate('/'); }}
                title="Tizimdan chiqish"
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <SolarIcon name="Logout" size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-2 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded text-center transition-colors shadow-sm"
              >
                Kirish
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded text-center transition-colors"
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
