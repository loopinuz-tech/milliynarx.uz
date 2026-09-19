import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { alertService } from '../../api/services';
import SolarIcon from '../common/SolarIcon';
import SearchAutocomplete from '../common/SearchAutocomplete';
import KatalogMenu from './KatalogMenu';
import MobileDrawer from './MobileDrawer';

export const Header = () => {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [katalogOpen, setKatalogOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);
  const katalogRef = useRef(null);
  const katalogBtnRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      alertService.getNotifications()
        .then(data => setNotifications(data))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
      if (
        katalogOpen &&
        katalogRef.current &&
        !katalogRef.current.contains(e.target) &&
        katalogBtnRef.current &&
        !katalogBtnRef.current.contains(e.target)
      ) {
        setKatalogOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [katalogOpen]);

  // Close menus and drawer when route changes
  useEffect(() => {
    setShowUserMenu(false);
    setKatalogOpen(false);
    setMobileDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await alertService.markAsRead(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.link) {
      navigate(notif.link);
      setShowNotifs(false);
    }
  };

  // Main navigation links including dedicated AI Maslahatchi section
  const mainNavLinks = [
    { 
      to: isAuthenticated ? '/dashboard' : '/', 
      label: 'Bosh sahifa', 
      sub: isAuthenticated ? 'Bozor terminali' : 'Platforma', 
      icon: isAuthenticated ? 'Dashboard' : 'Home2', 
      exact: true 
    },
    { to: '/search', label: 'Narx tahlili', sub: 'Bozor qidiruvi', icon: 'Search' },
    { to: '/ai-advisor', label: 'AI Maslahatchi', sub: 'Aqlli tahlil', icon: 'Sparkles' },
    { to: '/compare', label: 'Taqqoslash', sub: '2-5 mahsulot', icon: 'Compare' },
    { to: '/favorites', label: 'Sevimlilar', sub: 'Saqlanganlar', icon: 'Heart' },
    { to: '/alerts', label: 'Ogohlantirishlar', sub: 'Narx tushishi', icon: 'Bell' },
  ];

  // Contextual sub-navs
  const isSellerArea = location.pathname.startsWith('/seller');
  const isAdminArea = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname.startsWith('/onboarding');

  const sellerSubNav = [
    { to: '/seller', label: 'Ko\'rsatkichlar', exact: true },
    { to: '/seller/products', label: 'Mahsulotlarim' },
    { to: '/seller/products/new', label: '+ Yangi mahsulot' },
    { to: '/seller/price-history', label: 'Narx tarixi' },
    { to: '/seller/store', label: 'Do\'kon profili' },
  ];

  const adminSubNav = [
    { to: '/admin', label: 'Monitoring Terminali', exact: true },
    { to: '/admin/sellers', label: 'Sotuvchilar' },
    { to: '/admin/products', label: 'Mahsulotlar moderatsiyasi' },
    { to: '/admin/users', label: 'Foydalanuvchilar' },
    { to: '/admin/categories', label: 'Katalog daraxti' },
    { to: '/admin/data-sources', label: 'Manbalar' },
    { to: '/admin/audit-logs', label: 'Audit jurnali' },
  ];

  return (
    <div className="sticky top-0 z-50 w-full bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      {/* Primary Top Bar: Brand, Katalog, Search, User Actions */}
      <header className="w-full bg-white dark:bg-[#0B0F19] border-b border-slate-100 dark:border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        
        {/* Left: Mobile Hamburger + Brand Logo + Desktop Katalog Button */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Hamburger Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="md:hidden p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Asosiy menyu"
            aria-label="Asosiy menyuni ochish"
          >
            <SolarIcon name="Menu" size={22} />
          </button>

          {/* Logo */}
          <NavLink to="/" className="flex items-center group py-0.5 shrink-0" title="Milliy Narx">
            <img
              src="/topbarnmimg.png"
              alt="Milliy Narx"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </NavLink>

          {/* Desktop Katalog Button */}
          <button
            ref={katalogBtnRef}
            type="button"
            onClick={() => setKatalogOpen(!katalogOpen)}
            className={`hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
              katalogOpen
                ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400/40'
                : 'bg-orange-50 hover:bg-orange-100/80 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 dark:hover:bg-orange-900/60 border border-orange-200/70 dark:border-orange-800/40'
            }`}
            aria-expanded={katalogOpen}
            aria-label="Mahsulotlar katalogini ochish"
          >
            <SolarIcon name={katalogOpen ? "Close" : "Widget"} size={16} />
            <span>Katalog</span>
            <SolarIcon 
              name="ChevronDown" 
              size={13} 
              className={`transition-transform duration-200 ${katalogOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* Center: Spacious, Uncramped Global Search Input with Autocomplete (Desktop/Tablet) */}
        <div className="hidden md:block flex-1 max-w-2xl min-w-0">
          <SearchAutocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={(term) => {
              if (term && term.trim()) {
                navigate(`/search?q=${encodeURIComponent(term.trim())}`);
              } else {
                navigate('/search');
              }
            }}
            variant="header"
            placeholder="Mahsulot nomi, model, brend yoki SKU kiriting..."
            buttonLabel="Qidirish"
          />
        </div>

        {/* Right Section: Quick action buttons & Account */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`md:hidden p-2 rounded-xl transition-colors cursor-pointer ${
              mobileSearchOpen 
                ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/60 dark:text-orange-400' 
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Qidiruv"
            aria-label="Qidiruvni ochish yoki yopish"
          >
            <SolarIcon name={mobileSearchOpen ? "Close" : "Search"} size={19} />
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center relative group"
            title={isDark ? "Yorug' rejimga o'tish (Light Mode)" : "Tungi rejimga o'tish (Dark Mode)"}
            aria-label="Tungi rejimni yoqish yoki o'chirish"
          >
            {isDark ? (
              <SolarIcon name="sun" size={20} className="text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <SolarIcon name="moon" size={20} className="text-slate-600 dark:text-slate-300 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>

          {/* Notifications Bell (Authenticated) */}
          {isAuthenticated && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50/60 dark:hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
                title="Bildirishnomalar"
                aria-label="Bildirishnomalar"
              >
                <SolarIcon name="Bell" size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                      Bildirishnomalar
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-numeric">
                      {unreadCount} ta yangi
                    </span>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        Yangi bildirishnomalar mavjud emas
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${!n.is_read ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''}`}
                        >
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                            {n.title}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Auth Action */}
          {isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
                aria-expanded={showUserMenu}
                aria-label="Foydalanuvchi menyusi"
              >
                <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">
                    {user?.full_name || user?.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-orange-600 dark:text-orange-400 font-semibold uppercase">
                    {user?.role}
                  </div>
                </div>
                <SolarIcon name="ChevronDown" size={14} className="text-slate-400 hidden lg:inline-block" />
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user?.full_name || 'Foydalanuvchi'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {user?.email}
                    </div>
                    <div className="mt-1.5 inline-block text-[10px] uppercase font-bold bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded">
                      Rol: {user?.role}
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); navigate('/dashboard'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800/80 font-bold text-left transition-colors cursor-pointer"
                    >
                      <SolarIcon name="Dashboard" size={16} className="text-orange-600" />
                      <span>Shaxsiy Dashboard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-orange-700 dark:hover:text-orange-400 text-left transition-colors cursor-pointer"
                    >
                      <SolarIcon name="Profile" size={16} />
                      <span>Mening profilim</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); navigate('/favorites'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-orange-700 dark:hover:text-orange-400 text-left transition-colors cursor-pointer"
                    >
                      <SolarIcon name="Heart" size={16} />
                      <span>Sevimlilar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); navigate('/alerts'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-orange-700 dark:hover:text-orange-400 text-left transition-colors cursor-pointer"
                    >
                      <SolarIcon name="Bell" size={16} />
                      <span>Narx ogohlantirishlari</span>
                    </button>

                    {/* Role Sections */}
                    {(isSeller || isAdmin) && (
                      <div className="my-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="px-4 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Boshqaruv
                        </div>
                        {isSeller && (
                          <button
                            type="button"
                            onClick={() => { setShowUserMenu(false); navigate('/seller'); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800/80 text-left font-semibold transition-colors cursor-pointer"
                          >
                            <SolarIcon name="Store" size={16} />
                            <span>Sotuvchi do'kon paneli</span>
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800/80 text-left font-semibold transition-colors cursor-pointer font-mono"
                          >
                            <SolarIcon name="Shield" size={16} />
                            <span>Administrator terminali</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Theme Switcher in User Menu */}
                  <div className="py-2 px-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
                      <SolarIcon name={isDark ? "sun" : "moon"} size={15} className={isDark ? "text-amber-400" : "text-slate-500"} />
                      <span>{isDark ? "Tungi rejim (Dark)" : "Yorug' rejim (Light)"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${isDark ? 'bg-orange-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'}`}
                      title="Mavzuni o'zgartirish"
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs block"></span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setShowUserMenu(false); logout(); navigate('/'); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800/80 text-left font-semibold transition-colors cursor-pointer"
                    >
                      <SolarIcon name="Logout" size={16} />
                      <span>Tizimdan chiqish</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
              >
                Kirish
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="hidden sm:inline-flex text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                Ro'yxatdan o'tish
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Expandable Search Bar with Autocomplete & Dismiss Button */}
      {mobileSearchOpen && (
        <div className="md:hidden px-3 py-2 bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 shadow-md">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={(term) => {
                  setMobileSearchOpen(false);
                  if (term && term.trim()) {
                    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
                  } else {
                    navigate('/search');
                  }
                }}
                variant="mobile"
                placeholder="Mahsulot nomi, model, brend..."
                autoFocus
                buttonLabel="Qidirish"
              />
            </div>
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Qidiruvni yopish"
              aria-label="Qidiruvni yopish"
            >
              <SolarIcon name="Close" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Katalog Mega-Menu Panel */}
      <KatalogMenu
        isOpen={katalogOpen}
        onClose={() => setKatalogOpen(false)}
        menuRef={katalogRef}
      />

      {/* Mobile Comprehensive Navigation Drawer */}
      <MobileDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        isSeller={isSeller}
        isAdmin={isAdmin}
        logout={logout}
        isDark={isDark}
        toggleTheme={toggleTheme}
      />

      {/* Secondary Navigation Strip: Hidden on auth pages (login/register) and on landing page if not authenticated */}
      {!isAuthPage && (isAuthenticated || location.pathname !== '/') && (
        <nav className="hidden md:flex w-full bg-slate-50 dark:bg-[#0D1424] border-b border-slate-200/80 dark:border-slate-800/90 px-4 sm:px-6 lg:px-8 h-11 items-center justify-between overflow-x-auto gap-4 scrollbar-none transition-colors duration-200">
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {mainNavLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.exact}
                className={({ isActive }) => `
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap font-medium
                  ${isActive 
                    ? 'bg-orange-600 text-white shadow-xs font-bold' 
                    : 'text-slate-700 dark:text-slate-200 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-white dark:hover:bg-slate-800/80'}
                `}
              >
                {link.to === '/ai-advisor' ? (
                  <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain shrink-0" />
                ) : (
                  <SolarIcon name={link.icon} size={15} />
                )}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Live status badge & Quick role toggle on right */}
          <div className="flex items-center gap-2.5 shrink-0">
            {isSeller && (
              <NavLink 
                to="/seller"
                className="text-[11px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 dark:hover:bg-orange-900/60 border border-transparent dark:border-orange-800/40 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              >
                <SolarIcon name="Store" size={13} />
                <span>Do'kon paneli</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink 
                to="/admin"
                className="text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/60 hover:bg-red-200 dark:hover:bg-red-900/60 border border-transparent dark:border-red-800/50 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 font-mono"
              >
                <SolarIcon name="Shield" size={13} />
                <span>ROOT Terminal</span>
              </NavLink>
            )}
          </div>
        </nav>
      )}

      {/* Contextual Sub-Nav Bar for Seller & Admin (when deep inside these panels) */}
      {isSellerArea && (
        <div className="w-full bg-slate-900 text-slate-300 border-b border-slate-800 px-4 sm:px-8 py-2 flex items-center justify-start sm:justify-between overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium shrink-0">
            <span className="text-orange-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] shrink-0">
              <SolarIcon name="Store" size={15} />
              Sotuvchi:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {sellerSubNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `
                    px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap
                    ${isActive ? 'bg-orange-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-300'}
                  `}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 shrink-0 hidden md:block">
            Do'kon statusi: <span className="text-emerald-400 font-bold">{user?.seller_status || 'AKTIV'}</span>
          </div>
        </div>
      )}

      {isAdminArea && (
        <div className="w-full bg-slate-950 text-slate-300 border-b border-slate-800 px-4 sm:px-8 py-2 flex items-center justify-start sm:justify-between overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium shrink-0">
            <span className="text-red-400 font-bold flex items-center gap-1.5 uppercase tracking-wider text-[11px] shrink-0">
              <SolarIcon name="Shield" size={15} />
              Admin:
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {adminSubNav.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) => `
                    px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap
                    ${isActive ? 'bg-orange-600 text-white font-bold shadow-xs' : 'hover:bg-slate-800 hover:text-white text-slate-300'}
                  `}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
          <div className="text-[11px] font-mono text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded font-bold shrink-0 hidden md:block">
            ROOT ACCESS
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
