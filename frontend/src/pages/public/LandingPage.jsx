import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, favoriteService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import SearchAutocomplete from '../../components/common/SearchAutocomplete';

// Official @solar-icons/react LINEAR icons (clean outline styling, non-bold)
import { ShieldCheckIcon as ShieldIcon } from '@solar-icons/react/linear/shield-check';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { Chart2Icon as ChartIcon } from '@solar-icons/react/linear/chart-2';
import { StarsIcon } from '@solar-icons/react/linear/stars';
import { CheckCircleIcon } from '@solar-icons/react/linear/check-circle';
import { ScaleIcon } from '@solar-icons/react/linear/scale';
import { HeartIcon } from '@solar-icons/react/linear/heart';
import { BellIcon } from '@solar-icons/react/linear/bell';
import { BoxIcon } from '@solar-icons/react/linear/box';
import { UserIcon } from '@solar-icons/react/linear/user';
import { ShopIcon } from '@solar-icons/react/linear/shop';
import { ClockCircleIcon } from '@solar-icons/react/linear/clock-circle';
import { TagPriceIcon as TagIcon } from '@solar-icons/react/linear/tag-price';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';

export const LandingPage = () => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Strictly fetch real active products from database
        const prods = await productService.getProducts({ limit: 8 });
        setProducts(Array.isArray(prods) ? prods : []);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleQuickTagClick = (tag) => {
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const handleToggleFavorite = async (e, productId) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await favoriteService.toggle(productId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full space-y-16 sm:space-y-20 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION: 100% FULL WIDTH WITH 2-COLUMN GRID & LANDINGIMG.PNG      */}
      {/* ========================================================================= */}
      <section className="w-full bg-white dark:bg-[#090D16] border-b border-orange-100/90 dark:border-slate-800/80 py-10 sm:py-14 lg:py-18 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative overflow-hidden shadow-2xs transition-colors">
        {/* Subtle Warm Flame Glow Accents across full screen */}
        <div className="absolute -top-28 -right-28 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-28 -left-28 w-96 sm:w-[540px] h-96 sm:h-[540px] bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Headline, Search & Trust Badges */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-semibold mb-5 sm:mb-6 shadow-2xs w-fit">
              <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
              <ShieldIcon size={14} className="text-orange-600 dark:text-orange-400" />
              <span>O'zbekistonning 1-mustaqil narx tahlili platformasi &bull; 100% Real ma'lumot</span>
            </div>

            {/* Main Headline with Flame Orange Gradient */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-4 sm:mb-5 leading-[1.15]">
              Bozorning{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                haqiqiy narxini
              </span>{' '}
              biling.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 mb-6 sm:mb-8 leading-relaxed font-normal max-w-2xl">
              Real sotuvchilar takliflarini bir joyda solishtiring va xarid qilishdan oldin bozorni tahlil qiling. Hech qanday soxta chegirma va sun'iy narxlarsiz.
            </p>

            {/* Master Search Input with Google-Style Autocomplete */}
            <div className="w-full max-w-2xl">
              <SearchAutocomplete
                value={query}
                onChange={setQuery}
                onSubmit={(term) => {
                  if (term && term.trim()) {
                    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
                  } else {
                    navigate('/search');
                  }
                }}
                variant="hero"
                placeholder="Mahsulot nomini kiriting (masalan: iPhone 15, Artel, Samsung)..."
                buttonLabel="Qidirish"
              />
            </div>

            {/* Quick Search Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Ommabop:</span>
              {['Artel', 'Samsung', 'iPhone', 'Konditsioner', 'Noutbuk'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/60 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-200 dark:hover:border-orange-800 border border-transparent rounded-lg transition-colors font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Pillars List */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap gap-5 sm:gap-6 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircleIcon size={15} className="text-emerald-500" />
                <span className="font-semibold text-slate-700">Tasdiqlangan sotuvchilar</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartIcon size={15} className="text-orange-500" />
                <span className="font-semibold text-slate-700">Haqiqiy narxlar dinamikasi</span>
              </div>
              <div className="flex items-center gap-2">
                <StarsIcon size={15} className="text-amber-500" />
                <span className="font-semibold text-slate-700">Mustaqil AI tahlili</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Platform Illustration (/landingimg.png) */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end relative">
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none flex items-center justify-center">
              {/* Soft warm radial glow behind the illustration */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/20 via-amber-400/15 to-transparent rounded-full blur-3xl transform scale-95 pointer-events-none" />
              <img
                src="/landingimg.png"
                alt="Milliy Narx Tahlil Platformasi"
                className="relative z-10 w-full h-auto max-h-[460px] sm:max-h-[520px] lg:max-h-[580px] object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-[1.02] select-none"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* REST OF SECTIONS: KEPT IN MAX-W-7XL MX-AUTO AS REQUESTED                 */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {/* 2. THREE CORE GUARANTEES (DATA INTEGRITY PILLARS)                         */}
        {/* ========================================================================= */}
        <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              <ShieldIcon size={13} />
              Kafolatlar va Xolislik
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Nima uchun aynan Milliy Narx?
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md">
            O'zbekistonda birinchi marta sun'iy chegirmalarsiz, soxta sharhlarsiz va yolg'on narxlarsiz platforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ShieldIcon size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                100% Real Ma'lumot
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Platformada nol soxta mahsulot va nol soxta do'konlar. Barcha narxlar haqiqiy sotuvchilar tomonidan kiritiladi va moderator tomonidan tasdiqlanadi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
              <CheckCircleIcon size={14} />
              <span>Zero Fake Data kafolati</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <ChartIcon size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Shaffof Narxlar Tarixi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Har bir narx o'zgarishi o'zgarmas bazada saqlanadi. Qachon va qancha arzonlashganini interaktiv grafik orqali tekshiring va aldanmang.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-orange-600">
              <ClockCircleIcon size={14} />
              <span>O'zgarmas narxlar jurnali</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <StarsIcon size={24} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Xolis AI Xulosasi
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sun'iy intellekt raqamlarni to'qimaydi. U bazadagi minimal, maksimal va o'rtacha narxlarni tahlil qilib, xarid uchun qulay vaqtni baholaydi.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-amber-600">
              <CheckCircleIcon size={14} />
              <span>Bozor algoritmi &bull; Xolis baho</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. REAL ACTIVE PRODUCTS CATALOG (ZERO FAKE DATA)                          */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Bozordagi Faol Takliflar
              </h2>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-numeric">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Jonli Baza
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Rasmiy va tekshirilgan sotuvchilar tomonidan kiritilgan haqiqiy narxlar
            </p>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors cursor-pointer px-3.5 py-2 rounded-xl hover:bg-orange-50/70"
          >
            <span>Barcha takliflarni ko'rish</span>
            <AltArrowRightIcon size={16} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon="Box"
            title="Mahsulotlar hali mavjud emas"
            description="Bazada hozircha faol mahsulotlar yo'q. Sotuvchilar o'z takliflarini kiritib, administrator tasdiqlaganidan so'ng mahsulotlar bu yerda aks etadi."
            actionLabel={isAuthenticated ? "Katalogga o'tish" : "Sotuvchi sifatida ro'yxatdan o'tish"}
            onAction={() => navigate(isAuthenticated ? '/search' : '/register')}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((p) => {
              const primaryImg = p.images?.find(img => img.is_primary)?.image_url || p.images?.[0]?.image_url;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.slug || p.id}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-lg hover:border-orange-400 dark:hover:border-orange-500/50 transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.98]"
                >
                  <div className="h-36 xs:h-44 sm:h-52 w-full bg-slate-50 dark:bg-slate-800/40 relative flex items-center justify-center overflow-hidden border-b border-slate-100 dark:border-slate-800 p-2.5 sm:p-4">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={p.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center gap-1">
                        <BoxIcon size={36} />
                        <span className="text-[9px] text-slate-400">Rasm yo'q</span>
                      </div>
                    )}

                    <button
                      onClick={(e) => handleToggleFavorite(e, p.id)}
                      className="absolute top-2 right-2 p-1.5 sm:p-2 rounded-xl bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-750 text-slate-400 hover:text-rose-500 shadow-sm transition-colors cursor-pointer"
                      title="Sevimlilarga qo'shish"
                    >
                      <HeartIcon size={15} />
                    </button>

                    {p.availability && (
                      <div className="absolute bottom-2 left-2 hidden xs:block">
                        <Badge status={p.availability} size="xs" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] text-orange-700 dark:text-orange-400 font-bold uppercase tracking-wider bg-orange-50 dark:bg-orange-950/50 px-1.5 py-0.5 rounded mb-1.5">
                        <TagIcon size={10} className="text-orange-600 dark:text-orange-400" />
                        <span className="truncate max-w-[100px]">{p.brand_name || p.category_name || 'Katalog'}</span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-tight">
                        {p.name}
                      </h3>
                    </div>

                    <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-1 flex flex-col xs:flex-row xs:items-baseline justify-between gap-1">
                      <div>
                        <div className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-numeric leading-tight">
                          {formatPrice(p.price)}
                        </div>
                        {p.old_price && p.old_price > p.price && (
                          <div className="text-[10px] sm:text-xs text-slate-400 line-through font-numeric">
                            {formatPrice(p.old_price)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        <ShopIcon size={12} className="text-slate-400 shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-[100px]">{p.seller_name || "Sotuvchi"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 3.5. AI MARKET INTELLIGENCE & ADVISOR SHOWCASE (LIGHT MODE)              */}
      {/* ========================================================================= */}
      <section className="w-full bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-xs hover:border-orange-300 transition-all">
        {/* Soft Warm Glow Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-orange-700 text-xs font-semibold shadow-2xs">
              <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain" />
              <span>Sun'iy Intellekt &bull; Bozor Tahlili</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Sun'iy Intellekt Maslahatchisi bilan{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                xaridni rejalashtiring
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl font-normal">
              Milliy Narx AI — bozor narxlarining real dinamikasini o'rganib, xaridorlarga eng tejamkor xarid vaqtini, sotuvchilarga esa raqobatbardosh narx strategiyasini tavsiya qiluvchi O'zbekistondagi ilk mustaqil sun'iy intellekt xizmati.
            </p>

            {/* Quick Prompts with Official Solar Icons (Zero Emojis) */}
            <div className="flex flex-wrap gap-2.5 pt-1">
              {[
                { label: "Eng arzon telefonlar qaysi?", icon: TagIcon },
                { label: "Texnika narxlari o'zgarishi", icon: ChartIcon },
                { label: "Sotuvchilar uchun narx strategiyasi", icon: ShopIcon }
              ].map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => navigate('/ai-advisor')}
                    className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 text-xs font-semibold text-slate-700 hover:text-orange-700 transition-all shadow-2xs cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <IconComponent size={14} className="text-orange-600 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Clean Light Interactive Card */}
          <div className="lg:col-span-5 bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">AI Jonli Savol-Javob</span>
              </div>
              <span className="text-[10px] text-orange-700 font-mono font-bold bg-orange-100/70 px-2 py-0.5 rounded-md">
                Milliy Narx AI
              </span>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5 shadow-2xs">
              <div className="text-orange-600 font-bold flex items-center gap-1.5">
                <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain inline-block" />
                <span>AI Maslahatchiga savol bering:</span>
              </div>
              <div className="text-slate-500 text-[11px] leading-relaxed">
                Masalan: "Qaysi telefonni olish foydali?", "Do'konim uchun narx qanday qo'yish kerak?"
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/ai-advisor')}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <img src="/aiimg.png" alt="AI" className="w-5 h-5 object-contain" />
              <span>AI Maslahatchi bo'limiga o'tish</span>
              <AltArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (3-STEP PROCESS)                                          */}
      {/* ========================================================================= */}
      <section className="w-full bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 sm:p-10 lg:p-14">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-[11px] font-bold uppercase tracking-wider mb-2">
            <CheckCircleIcon size={13} />
            Qulay & Shaffof
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Milliy Narx qanday ishlaydi?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Oddiy, shaffof va eng asosiysi — faqat real sotuvchilar ma'lumotlariga asoslangan 3 bosqich
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold">
                  <MagnifierIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                  01-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Mahsulotni qidiring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Katalogdan kerakli model, SKU yoki brend nomini kiriting. Tizim tasdiqlangan barcha rasmiy do'konlar narxlarini jamlaydi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-400">
              <BoxIcon size={13} />
              <span>Barcha do'konlar katalogi</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold">
                  <ScaleIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                  02-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Narxlarni solishtiring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                2 tadan 5 tagacha bo'lgan takliflarni bitta jadvalda kafolat, yetkazib berish va narx ko'rsatkichlari bo'yicha taqqoslang.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-400">
              <ChartIcon size={13} />
              <span>Texnik xususiyatlar solishtiruvi</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center font-bold">
                  <BellIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-md">
                  03-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
                Eng maqbul narxda oling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Haqiqiy narx tarixini ko'rib xarid qiling yoki narx tushganda avtomatik xabar beruvchi "Narx ogohlantirishini" yoqing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-xs text-slate-400">
              <CheckCircleIcon size={13} />
              <span>Foydali xarid kafolati</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. BUYER & SELLER DUAL SHOWCASE                                            */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* For Buyers */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xs hover:border-orange-400 transition-all">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-4">
              <UserIcon size={15} />
              <span>Xaridorlar uchun</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Xarid qilishdan oldin bozor haqiqatini biling
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <span>Bozordagi eng past, eng yuqori va o'rtacha muvozanatli narxni ko'rish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <span>Narx tushishi bo'yicha shaxsiy ogohlantirish (Price Drop Alert)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <span>Bir xil modeldagi barcha do'konlar takliflarini taqqoslash jadvali</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-orange-600 shrink-0 mt-0.5" />
                <span>Hech qanday botlar va soxta reytinglarsiz sof bozor tahlili</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/search')}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Bozorni tahlil qilish</span>
            <AltArrowRightIcon size={16} />
          </button>
        </div>

        {/* For Sellers */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-all">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
              <ShopIcon size={15} />
              <span>Do'konlar va Sotuvchilar uchun</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Raqobatchilar narxlarini kuzating va savdoni oshiring
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 mb-8">
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Rasmiy verifikatsiyadan o'tgan ishonchli do'kon maqomi</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>O'z mahsulotlaringiz bo'yicha real ko'rishlar va qiziqishlar analitikasi</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Narxlarni bir zumda yangilash va xaridorlarga to'g'ridan-to'g'ri chiqish</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Raqobatchilar narx o'zgarishlarini kuzatuvchi maxsus sotuvchi kabineti</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Do'konni ro'yxatdan o'tkazish</span>
            <AltArrowRightIcon size={16} />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CALL TO ACTION: FIERY GRADIENT HERO BANNER                             */}
      {/* ========================================================================= */}
      <section className="w-full bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 text-white rounded-3xl p-8 sm:p-12 lg:p-16 text-center shadow-xl shadow-orange-600/20 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white text-xs font-semibold">
            <StarsIcon size={14} />
            <span>Real Bozor Terminali</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Bozor tahlilini hoziroq boshlang
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 leading-relaxed font-normal">
            Hech qanday soxta ma'lumotlarsiz, faqat rasmiy ro'yxatdan o'tgan do'konlarning haqiqiy narxlari asosida eng to'g'ri xarid qarorini qabul qiling.
          </p>
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => navigate('/search')}
              className="px-6 py-3 bg-white text-orange-700 hover:bg-orange-50 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <MagnifierIcon size={16} />
              <span>Qidiruv terminaliga o'tish</span>
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 bg-orange-950/40 hover:bg-orange-950/60 text-white border border-white/30 font-bold rounded-xl text-xs sm:text-sm transition-all active:scale-98 cursor-pointer flex items-center gap-2"
            >
              <ShopIcon size={16} />
              <span>Sotuvchi bo'lib qo'shilish</span>
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};

export default LandingPage;
