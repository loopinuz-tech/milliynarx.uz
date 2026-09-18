import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { adminService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import SolarIcon from '../common/SolarIcon';

export const KatalogMenu = ({ isOpen, onClose, menuRef }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const { user, isSeller, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      adminService.getCategories()
        .then(data => {
          setCategories(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error("Failed to fetch categories for Katalog:", err);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Bozor & Tahlil items matching user's reference
  const tahlilItems = [
    {
      to: '/search',
      icon: 'Search',
      title: 'Narx tahlili',
      sub: 'Bozor qidiruvi va narxlar taqsimoti',
      desc: 'Bozordagi barcha real sotuvchilar narxlarini solishtiring va eng qulay narxni toping.'
    },
    {
      to: '/compare',
      icon: 'Compare',
      title: 'Taqqoslash',
      sub: '2-5 ta mahsulot parametrlarini solishtirish',
      badge: 'YANGI',
      desc: 'Bir xil toifadagi turli modellarning narx va texnik xususiyatlarini yonma-yon solishtiring.'
    },
    {
      to: '/',
      icon: 'Dashboard',
      title: 'Bozor monitoringi',
      sub: 'Asosiy sahifa va real narxlar',
      desc: 'O\'zbekiston bozoridagi o\'rtacha narxlar dinamikasi va faol bozor ko\'rsatkichlari.'
    },
    {
      to: '/favorites',
      icon: 'Heart',
      title: 'Sevimlilar',
      sub: 'Kuzatilayotgan saqlangan tovarlar',
      desc: 'Siz saqlagan tovarlar ro\'yxati. Ularning narxi o\'zgarganda darhol xabardor bo\'ling.'
    },
    {
      to: '/alerts',
      icon: 'Bell',
      title: 'Ogohlantirishlar',
      sub: 'Narx tushganda avtomatik signal',
      desc: 'Istalgan mahsulotga narx chegarasini belgilang. Narx tushishi bilan bildirishnoma oling.'
    },
    {
      to: isSeller ? '/seller' : '/seller-register',
      icon: 'Store',
      title: 'Sotuvchilar portali',
      sub: isSeller ? 'Do\'kon boshqaruvi' : 'Do\'koningizni ulang',
      desc: 'Rasmiy sotuvchi sifatida o\'z mahsulotlaringizni joylashtiring va narxlaringizni boshqaring.'
    },
  ];

  // AI & Extra services
  const aiItems = [
    {
      to: '/search?ai=true',
      icon: 'Sparkles',
      title: 'AI Narx prognozi',
      sub: 'Sun\'iy intellekt tahlili',
      desc: 'Bozor trendlari asosida mahsulot narxi oshishi yoki tushishini oldindan bashorat qiluvchi AI modeli.'
    },
    {
      to: '/search',
      icon: 'Shield',
      title: 'Zero Fake Data',
      sub: 'Mustaqil moderatorlik',
      desc: 'Soxta sharhlar, sun\'iy chegirmalar va botlarsiz mustaqil narx kafolati.'
    },
    {
      to: '/search',
      icon: 'Clock',
      title: 'Shaffof narxlar tarixi',
      sub: 'O\'zgarmas narxlar jurnali',
      desc: 'Har bir narx o\'zgarishi vaqt tamg\'asi bilan bazaga muhrlanadi.'
    },
  ];

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
    onClose();
    navigate(`/search?category=${encodeURIComponent(categoryName)}`);
  };

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    /* Dropdown Mega-Menu Panel attached directly below header - NO MODAL BACKDROP */
    <div
      ref={menuRef}
      className="absolute top-full left-0 w-full z-40 bg-white border-b border-slate-200/90 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* ========================================================================= */}
          {/* COLUMN 1: LEFT PREVIEW CARD (Matches "Bo'limlarni o'rganing" from screenshot) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 bg-slate-50/90 border border-slate-200/70 rounded-2xl p-5 sm:p-6 flex flex-col justify-between h-full min-h-[260px] shadow-2xs">
            <div>
              {/* Soft Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-orange-100/80 text-orange-600 flex items-center justify-center mb-4 shadow-2xs transition-transform duration-200">
                <SolarIcon name={hoveredItem ? hoveredItem.icon : "Sparkles"} size={24} />
              </div>

              {/* Card Title */}
              <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2 transition-colors">
                {hoveredItem ? hoveredItem.title : "Bo'limlarni o'rganing"}
              </h4>

              {/* Card Subtitle / Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {hoveredItem 
                  ? hoveredItem.desc 
                  : "Menyuda bo'limlarni bossangiz yoki ustiga kelsangiz, bu yerda batafsil tahliliy ma'lumot ko'rinadi."}
              </p>
            </div>

            {/* Quick action button when hovered item has a link */}
            {hoveredItem?.link && (
              <button
                onClick={() => handleNavigate(hoveredItem.link)}
                className="mt-5 w-full py-2.5 px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
              >
                <span>Bo'limga o'tish</span>
                <SolarIcon name="ArrowRight" size={14} />
              </button>
            )}
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 2: KATEGORIYALAR (Matches "FANLAR" 2-col pill grid from screenshot) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div>
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3.5 px-1">
                <div className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                  <SolarIcon name="Grid" size={13} />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  KATEGORIYALAR
                </span>
              </div>

              {/* 2-Column Pill Buttons Grid */}
              {loading ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <div key={n} className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <SolarIcon name="Box" size={24} className="mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-medium text-slate-500">Kategoriyalar mavjud emas</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isSelected = activeCategory === cat.name;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.name)}
                        onMouseEnter={() => setHoveredItem({
                          icon: cat.icon || 'Box',
                          title: cat.name,
                          desc: `${cat.name} bo'yicha tasdiqlangan sotuvchilar takliflari va narxlar tahlili.`,
                          link: `/search?category=${encodeURIComponent(cat.name)}`
                        })}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`
                          p-2.5 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer group
                          ${isSelected
                            ? 'bg-orange-50/90 border-orange-300 text-orange-700 font-bold shadow-2xs'
                            : 'bg-slate-50/70 border-slate-200/80 hover:bg-orange-50/60 hover:border-orange-200 text-slate-700'}
                        `}
                      >
                        <div className={`
                          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                          ${isSelected 
                            ? 'bg-orange-600 text-white' 
                            : 'bg-white text-orange-600 border border-slate-200/60 group-hover:bg-orange-600 group-hover:text-white'}
                        `}>
                          <SolarIcon name={cat.icon || 'Box'} size={14} />
                        </div>
                        <span className="text-xs font-medium truncate group-hover:text-orange-700 transition-colors">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom "Barcha fanlar / kategoriyalar ›" Link */}
            <div className="mt-3 pt-2">
              <button
                type="button"
                onClick={() => handleNavigate('/search')}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer group px-1"
              >
                <span>Barcha kategoriyalar</span>
                <SolarIcon name="ChevronRight" size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 3: BOZOR & TAHLIL (Matches "TEST & TAHLIL" list from screenshot)    */}
          {/* ========================================================================= */}
          <div className="lg:col-span-3 flex flex-col justify-between">
            <div>
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3.5 px-1">
                <div className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                  <SolarIcon name="Chart" size={13} />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  BOZOR & TAHLIL
                </span>
              </div>

              {/* Vertical List Items */}
              <div className="space-y-1">
                {tahlilItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => handleNavigate(item.to)}
                    onMouseEnter={() => setHoveredItem({
                      icon: item.icon,
                      title: item.title,
                      desc: item.desc,
                      link: item.to
                    })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-orange-50 group-hover:text-orange-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <SolarIcon name={item.icon} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 bg-orange-100 text-orange-700 rounded font-mono">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* COLUMN 4: AI XIZMATLARI & STATUS (Matches "AI XIZMATLARI" from screenshot) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              {/* Column Header */}
              <div className="flex items-center gap-2 mb-3.5 px-1">
                <div className="w-5 h-5 rounded-md bg-orange-100 text-orange-600 flex items-center justify-center">
                  <SolarIcon name="Sparkles" size={13} />
                </div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  AI XIZMATLARI
                </span>
              </div>

              {/* Vertical List Items */}
              <div className="space-y-1">
                {aiItems.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => handleNavigate(item.to)}
                    onMouseEnter={() => setHoveredItem({
                      icon: item.icon,
                      title: item.title,
                      desc: item.desc,
                      link: item.to
                    })}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 text-left transition-colors cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <SolarIcon name={item.icon} size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-600 transition-colors block">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.sub}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Card (Matches the Premium / Cheksiz card in screenshot) */}
            <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-1">
                <SolarIcon name="Shield" size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800">Mustaqil Tahlilchi</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                100% real ma'lumotlar va bozor tahlili.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default KatalogMenu;
