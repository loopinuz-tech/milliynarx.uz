import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import SolarIcon from '../common/SolarIcon';
import { productService } from '../../api/services';

export const MobileDrawer = ({
  isOpen,
  onClose,
  user,
  isAuthenticated,
  isSeller,
  isAdmin,
  logout,
  isDark,
  toggleTheme
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    onClose?.();
  }, [location.pathname]);

  // Prevent background body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fetch categories once on mount
  useEffect(() => {
    productService.getCategoryStats()
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose?.();
    navigate(path);
  };

  const mainLinks = [
    { to: isAuthenticated ? '/dashboard' : '/', label: 'Bosh sahifa', icon: isAuthenticated ? 'Dashboard' : 'Home2', exact: true },
    { to: '/search', label: 'Narx tahlili & Qidiruv', icon: 'Search' },
    { to: '/ai-advisor', label: 'AI Maslahatchi', icon: 'Sparkles', isAi: true },
    { to: '/compare', label: 'Taqqoslash', icon: 'Compare', badge: 'Yangi' },
    { to: '/favorites', label: 'Sevimlilar ro\'yxati', icon: 'Heart' },
    { to: '/alerts', label: 'Narx ogohlantirishlari', icon: 'Bell' },
  ];

  return (
    <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        aria-hidden="true"
      />

      {/* Drawer Sheet */}
      <div className="relative w-[85vw] max-w-xs sm:max-w-sm h-full bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left duration-250 border-r border-slate-200/80 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#0F1422]">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2">
            <img src="/topbarnmimg.png" alt="Milliy Narx" className="h-7 w-auto object-contain" />
          </NavLink>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <SolarIcon name="Close" size={18} />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs scrollbar-thin">
          
          {/* User Auth Card */}
          {isAuthenticated && user ? (
            <div className="p-3.5 bg-gradient-to-br from-orange-50 to-amber-50/50 dark:from-slate-800/90 dark:to-slate-900 border border-orange-200/70 dark:border-slate-700/80 rounded-2xl shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 dark:text-white truncate text-xs">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">
                    {user?.email}
                  </div>
                  <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-orange-200/70 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300">
                    {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'SELLER' ? 'Sotuvchi' : 'Xaridor'}
                  </span>
                </div>
              </div>

              {/* Quick Profile Shortcuts */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-orange-200/50 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleNavigate('/dashboard')}
                  className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-orange-100/50 dark:hover:bg-slate-700/80 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                >
                  <SolarIcon name="Dashboard" size={13} className="text-orange-600" />
                  <span>Dashboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="py-1.5 px-2 bg-white dark:bg-slate-800 hover:bg-orange-100/50 dark:hover:bg-slate-700/80 rounded-xl font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[11px]"
                >
                  <SolarIcon name="User" size={13} className="text-slate-500" />
                  <span>Profilim</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 rounded-2xl space-y-3">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-xs">
                  Milliy Narxga xush kelibsiz!
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Bozor narxlarini taqqoslash va monitoring terminali
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigate('/login')}
                  className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-300/80 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white text-center transition-colors cursor-pointer shadow-2xs"
                >
                  Kirish
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/register')}
                  className="w-full py-2 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-center transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  Ro'yxatdan o'tish
                </button>
              </div>

              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1 text-center font-medium">
                <span>Google va Telegram orqali tezkor kirish mumkin</span>
              </div>
            </div>
          )}

          {/* Katalog Accordion (14 Categories) */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SolarIcon name="Widget" size={16} className="text-orange-600" />
                <span>Mahsulotlar Katalogi</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 rounded-md">
                  {categories.length || 14}
                </span>
              </div>
              <SolarIcon 
                name="ChevronDown" 
                size={15} 
                className={`text-slate-400 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} 
              />
            </button>

            {categoriesOpen && (
              <div className="pl-2 pr-1 py-1.5 space-y-1 max-h-56 overflow-y-auto border-l-2 border-orange-500/40 ml-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id || cat.slug}
                    type="button"
                    onClick={() => handleNavigate(`/search?category=${cat.slug}`)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <SolarIcon name={cat.icon || "Box"} size={14} className="text-slate-400 shrink-0" />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {cat.products_count !== undefined && (
                      <span className="text-[10px] text-slate-400 font-numeric shrink-0 ml-1">
                        {cat.products_count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Navigation Links */}
          <div className="space-y-0.5">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Asosiy Xizmatlar
            </div>
            {mainLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={onClose}
                className={({ isActive }) => `
                  w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-colors
                  ${isActive 
                    ? 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold' 
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  {item.isAi ? (
                    <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain" />
                  ) : (
                    <SolarIcon name={item.icon} size={16} className={item.to === location.pathname ? "text-orange-600" : "text-slate-400"} />
                  )}
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Seller / Business Section */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Sotuvchilar & Biznes
            </div>

            {isSeller ? (
              <button
                type="button"
                onClick={() => handleNavigate('/seller')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl font-bold text-left transition-colors cursor-pointer"
              >
                <SolarIcon name="Store" size={16} />
                <span>Sotuvchi do'kon paneli</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate('/register')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl font-bold text-left transition-colors cursor-pointer"
              >
                <SolarIcon name="Plus" size={16} />
                <span>Do'kon ochish (100% Bepul)</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => handleNavigate('/admin')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl font-bold text-left transition-colors cursor-pointer font-mono"
              >
                <SolarIcon name="Shield" size={16} />
                <span>Administrator Terminali</span>
              </button>
            )}
          </div>

          {/* Legal / Policy Links */}
          <div className="space-y-0.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Ma'lumot & Xavfsizlik
            </div>
            <NavLink
              to="/terms"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SolarIcon name="Document" size={15} />
              <span>Foydalanish shartlari</span>
            </NavLink>
            <NavLink
              to="/privacy"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SolarIcon name="Lock" size={15} />
              <span>Maxfiylik siyosati</span>
            </NavLink>
            <NavLink
              to="/policy"
              onClick={onClose}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:text-orange-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <SolarIcon name="Shield" size={15} />
              <span>Xavfsizlik & Cookie</span>
            </NavLink>
          </div>
        </div>

        {/* Drawer Bottom Action Panel */}
        <div className="p-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0F1422] shrink-0 space-y-2">
          {/* Dark Mode Switcher Row */}
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <SolarIcon name={isDark ? "sun" : "moon"} size={16} className={isDark ? "text-amber-400" : "text-slate-500"} />
              <span>{isDark ? "Tungi rejim" : "Yorug' rejim"}</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className={`w-10 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isDark ? 'bg-orange-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
              title="Mavzuni o'zgartirish"
              aria-label="Tungi rejim"
            >
              <span className="w-5 h-5 rounded-full bg-white shadow-xs block"></span>
            </button>
          </div>

          {/* Logout Button if Logged In */}
          {isAuthenticated && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                logout?.();
                navigate('/');
              }}
              className="w-full py-2 px-3 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SolarIcon name="Logout" size={15} />
              <span>Tizimdan chiqish</span>
            </button>
          )}

          <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 font-mono">
            Milliy Narx &bull; Xorazm, O'zbekiston
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDrawer;
