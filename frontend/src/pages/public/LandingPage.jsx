import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService, favoriteService } from '../../api/services';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/formatters';
import EmptyState from '../../components/common/EmptyState';
import Badge from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/Skeleton';
import SearchAutocomplete from '../../components/common/SearchAutocomplete';
import CategoryOrbit from '../../components/common/CategoryOrbit';
import AiAdvisorDemo from '../../components/common/AiAdvisorDemo';

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
  const [plans, setPlans] = useState([]);
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

        // Fetch official monetization plans from database
        try {
          const planData = await productService.getSubscriptionPlans();
          if (Array.isArray(planData) && planData.length > 0) {
            setPlans(planData);
          }
        } catch (planErr) {
          console.error("Failed to load subscription plans:", planErr);
        }
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

  // Map database plans by tier with reliable defaults
  const planMap = plans.reduce((acc, p) => {
    acc[p.tier] = p;
    return acc;
  }, {});

  const startFeatures = planMap.START?.features || {};
  const bizFeatures = planMap.BUSINESS?.features || {};
  const proFeatures = planMap.PRO?.features || {};

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

            {isAuthenticated && (
              <div className="mb-6 p-4 bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <StarsIcon size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      Shaxsiy Bozor Terminalingiz Faol
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bozor tahlili, so'rovlar kvotasi va kuzatuvdagi tovarlar statistikasi
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <span>Dashboardga o'tish</span>
                  <AltArrowRightIcon size={14} />
                </button>
              </div>
            )}

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
      {/* 2. BOZOR TOIFALARI VA YO'NALISHLAR (ORBITAL AI ECOSYSTEM)                */}
      {/* ========================================================================= */}
      <CategoryOrbit />

      {/* ========================================================================= */}
      {/* FULL-WIDTH RESPONSIVE CONTAINER ACROSS ALL REMAINING SECTIONS             */}
      {/* ========================================================================= */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 space-y-16 sm:space-y-20">
        {/* 3. THREE CORE GUARANTEES (DATA INTEGRITY PILLARS)                         */}
        {/* ========================================================================= */}
        <section className="space-y-6 sm:space-y-8">
          {/* Section Header Left-Aligned with Cards */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Platformamizning{' '}
              <span className="text-orange-600 dark:text-orange-500">
                3 asosiy tamoyili
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal">
              MilliyNarx AI ishonchli bozor ma’lumotlari va xolis tahlilga tayanadi.
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
      {/* 3.5. AI MARKET INTELLIGENCE & ADVISOR (LIVE QUERY & RESPONSE DEMO)        */}
      {/* ========================================================================= */}
      <section className="w-full bg-white dark:bg-[#070B14] border border-slate-200/90 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 lg:p-12 relative overflow-hidden shadow-xs hover:border-orange-300 dark:hover:border-orange-500/40 transition-all text-slate-900 dark:text-white">
        {/* Soft Warm Glow Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 dark:bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Flow Explanation, Value Prop, Action Button */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/15 border border-orange-200/80 dark:border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs font-semibold shadow-2xs">
              <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain" />
              <span>Sun'iy Intellekt &bull; Bozor Tahlili</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Sun'iy Intellekt Maslahatchisi bilan{' '}
              <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                xaridni rejalashtiring
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl font-normal">
              Milliy Narx AI — bozor narxlarining real dinamikasini o‘rganib, xaridorlarga eng tejamkor xarid vaqtini, sotuvchilarga esa raqobatbardosh narx strategiyasini tavsiya qiluvchi O‘zbekistondagi ilk mustaqil sun'iy intellekt xizmati.
            </p>

            {/* 3 ta Oddiy Qadam (Qanday so'rov yuboriladi va javob olinadi) */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Savol yuboring:</strong> O‘zingiz qiziqqan mahsulot yoki narx haqida istalgan tilda so‘rang.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Jonli AI tahlili:</strong> Sun'iy intellekt bozor narxlari tarixi va do‘konlarni bir necha soniyada taqqoslaydi.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Aniq tavsiya oling:</strong> Eng arzon taklif, narx tushishi va qulay xarid vaqti bo‘yicha xolis xulosaga ega bo‘ling.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/ai-advisor')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer"
              >
                <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain" />
                <span>AI Maslahatchi bilan suhbatlashish</span>
                <AltArrowRightIcon size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Live AI Query & Response Terminal */}
          <div className="lg:col-span-7 flex items-center justify-center relative w-full">
            <AiAdvisorDemo />
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3.8. PLATFORMS COMPARISON MATRIX (USER'S EXACT COMPARISON TABLE)          */}
      {/* ========================================================================= */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-bold shadow-2xs">
            <ScaleIcon size={14} />
            <span>Bozor Vositalari Taqqoslovi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Nima uchun aynan <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">MilliyNarx</span>?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            O'zbekistondagi asosiy savdo va tahlil kanallarining real imkoniyatlari solishtiruvi
          </p>
        </div>

        {/* Comparison Table Card */}
        <div className="w-full bg-white dark:bg-[#0B0F19] border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80">
                  <th className="py-4 sm:py-5 px-5 text-left text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider w-1/4">
                    Xususiyat
                  </th>
                  <th className="py-4 sm:py-5 px-5 bg-orange-500/10 dark:bg-orange-950/40 border-x border-orange-200/70 dark:border-orange-800/50 w-1/5 relative">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-600 text-white tracking-wider shadow-2xs">
                        Lider
                      </span>
                      <span className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 tracking-tight">
                        MilliyNarx
                      </span>
                    </div>
                  </th>
                  <th className="py-4 sm:py-5 px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-1/5">
                    Uzum Market
                  </th>
                  <th className="py-4 sm:py-5 px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-1/5">
                    Telegram
                  </th>
                  <th className="py-4 sm:py-5 px-5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 w-1/5">
                    Turon Market
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                {/* 1. Bir joyda ma'lumotlar */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 sm:py-5 px-5 text-left font-bold text-slate-900 dark:text-white">
                    Bir joyda ma'lumotlar
                  </td>
                  <td className="py-4 sm:py-5 px-5 bg-orange-500/5 dark:bg-orange-950/20 border-x border-orange-200/60 dark:border-orange-800/40">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                </tr>

                {/* 2. Narxlarni solishtirish */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 sm:py-5 px-5 text-left font-bold text-slate-900 dark:text-white">
                    Narxlarni solishtirish
                  </td>
                  <td className="py-4 sm:py-5 px-5 bg-orange-500/5 dark:bg-orange-950/20 border-x border-orange-200/60 dark:border-orange-800/40">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                </tr>

                {/* 3. AI integratsiya */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 sm:py-5 px-5 text-left font-bold text-slate-900 dark:text-white">
                    AI integratsiya
                  </td>
                  <td className="py-4 sm:py-5 px-5 bg-orange-500/5 dark:bg-orange-950/20 border-x border-orange-200/60 dark:border-orange-800/40">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                </tr>

                {/* 4. B2B */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors">
                  <td className="py-4 sm:py-5 px-5 text-left font-bold text-slate-900 dark:text-white">
                    B2B
                  </td>
                  <td className="py-4 sm:py-5 px-5 bg-orange-500/5 dark:bg-orange-950/20 border-x border-orange-200/60 dark:border-orange-800/40">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                  <td className="py-4 sm:py-5 px-5">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MONETIZATSIYA MODELI (FULL-WIDTH 1-TO-1 DATABASE INTEGRATED)          */}
      {/* ========================================================================= */}
      <section className="w-full bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xs">
        {/* Title and Red Accent Underline */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 dark:bg-orange-950/50 border border-orange-200/80 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-3 shadow-2xs">
            <TagIcon size={14} />
            <span>B2B SaaS Obuna Modellari</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Monetizatsiya modeli
          </h2>
          <div className="w-20 h-1.5 bg-[#FF6F61] rounded-full mt-3 mb-2"></div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Korxona, fabrika, do'kon va distribyutorlar uchun shaffof va ochiq tahliliy xizmat rejalari
          </p>
        </div>

        {/* 14-Row Subscription Matrix Table with Complete Grid Borders (Full Width) */}
        <div className="w-full overflow-hidden">
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#090D16]">
            <table className="w-full min-w-[620px] text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/40">
                  <th className="py-3.5 px-5 text-left border-r border-slate-200 dark:border-slate-800 w-[37%] font-bold text-slate-700 dark:text-slate-300">
                    Xizmat va imkoniyatlar
                  </th>
                  <th className="py-3.5 px-4 text-left border-r border-slate-200 dark:border-slate-800 w-[21%]">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shrink-0"></span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">START</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-left border-r border-slate-200 dark:border-slate-800 w-[21%]">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] shrink-0"></span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">BUSINESS</span>
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-left w-[21%]">
                    <div className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA] shrink-0"></span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">PRO</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {/* Row 1: Narx */}
                <tr className="font-bold text-slate-900 dark:text-white bg-slate-100/60 dark:bg-slate-800/50">
                  <td className="py-3 px-5 border-r border-slate-200 dark:border-slate-800 font-bold">Narx</td>
                  <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    {startFeatures.price_usd || "$10/oy"}
                  </td>
                  <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800 font-bold text-blue-600 dark:text-blue-400 text-sm">
                    {bizFeatures.price_usd || "$30/oy"}
                  </td>
                  <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400 text-sm">
                    {proFeatures.price_usd || "$60/oy"}
                  </td>
                </tr>

                {/* Row 2: Mahsulotlar katalogi */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Mahsulotlar katalogi</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.catalog || "✓"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.catalog || "✓"}</td>
                  <td className="py-2.5 px-4">{proFeatures.catalog || "✓"}</td>
                </tr>

                {/* Row 3: Narxlarni solishtirish */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Narxlarni solishtirish</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.comparison || "✓"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.comparison || "✓"}</td>
                  <td className="py-2.5 px-4">{proFeatures.comparison || "✓"}</td>
                </tr>

                {/* Row 4: Hududlar bo'yicha narx */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Hududlar bo'yicha narx</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.region_prices || "✓"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.region_prices || "✓"}</td>
                  <td className="py-2.5 px-4">{proFeatures.region_prices || "✓"}</td>
                </tr>

                {/* Row 5: Narxlar tarixi */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Narxlar tarixi</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.price_history || "30 kun"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.price_history || "1 yil"}</td>
                  <td className="py-2.5 px-4">{proFeatures.price_history || "Cheksiz"}</td>
                </tr>

                {/* Row 6: Talab/taklif tahlili */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Talab/taklif tahlili</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.demand_supply || "Basic + AI"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.demand_supply || "Advanced + AI"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{proFeatures.demand_supply || "Professional + AI"}</td>
                </tr>

                {/* Row 7: Narx o'zgarishi alertlari */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Narx o'zgarishi alertlari</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.price_alerts || "5 ta"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.price_alerts || "30 ta"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{proFeatures.price_alerts || "Cheksiz"}</td>
                </tr>

                {/* Row 8: Sotuvchi/ta'minotchi qidirish */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Sotuvchi/ta'minotchi qidirish</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.supplier_search || "✓"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.supplier_search || "✓"}</td>
                  <td className="py-2.5 px-4">{proFeatures.supplier_search || "✓"}</td>
                </tr>

                {/* Row 9: Bozor hisobotlari */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Bozor hisobotlari</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-slate-400">{startFeatures.market_reports || "—"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.market_reports || "✓"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{proFeatures.market_reports || "✓ + AI"}</td>
                </tr>

                {/* Row 10: Excel/CSV eksport */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Excel/CSV eksport</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-slate-400">{startFeatures.excel_export || "—"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.excel_export || "✓"}</td>
                  <td className="py-2.5 px-4">{proFeatures.excel_export || "✓"}</td>
                </tr>

                {/* Row 11: API */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">API</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-slate-400">{startFeatures.api || "—"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-slate-400">{bizFeatures.api || "—"}</td>
                  <td className="py-2.5 px-4">{proFeatures.api || "✓"}</td>
                </tr>

                {/* Row 12: AI Market Assistant */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">AI Market Assistant</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.ai_assistant || "✓"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.ai_assistant || "✓"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{proFeatures.ai_assistant || "✓ Advanced"}</td>
                </tr>

                {/* Row 13: Bir nechta xodim */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Bir nechta xodim</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-right pr-6">{startFeatures.team_seats || "1"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800 text-right pr-6">{bizFeatures.team_seats || "5"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white text-right pr-6">{proFeatures.team_seats || "15"}</td>
                </tr>

                {/* Row 14: Qo'llab-quvvatlash */}
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-850/20">
                  <td className="py-2.5 px-5 border-r border-slate-200 dark:border-slate-800 font-normal">Qo'llab-quvvatlash</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{startFeatures.support || "Standard"}</td>
                  <td className="py-2.5 px-4 border-r border-slate-200 dark:border-slate-800">{bizFeatures.support || "Priority"}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{proFeatures.support || "Dedicated"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. HOW IT WORKS (3-STEP PROCESS)                                          */}
      {/* ========================================================================= */}
      <section className="w-full bg-slate-50/90 dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-2xs">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/70 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 text-[11px] font-bold uppercase tracking-wider mb-2">
            <CheckCircleIcon size={13} />
            Qulay & Shaffof
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Milliy Narx qanday ishlaydi?
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Oddiy, shaffof va eng asosiysi — faqat real sotuvchilar ma'lumotlariga asoslangan 3 bosqich
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/60 flex items-center justify-center font-bold">
                  <MagnifierIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  01-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Mahsulotni qidiring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Katalogdan kerakli model, SKU yoki brend nomini kiriting. Tizim tasdiqlangan barcha rasmiy do'konlar narxlarini jamlaydi.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <BoxIcon size={13} />
              <span>Barcha do'konlar katalogi</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/60 flex items-center justify-center font-bold">
                  <ScaleIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  02-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Narxlarni solishtiring
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                2 tadan 5 tagacha bo'lgan takliflarni bitta jadvalda kafolat, yetkazib berish va narx ko'rsatkichlari bo'yicha taqqoslang.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <ChartIcon size={13} />
              <span>Texnik xususiyatlar solishtiruvi</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white dark:bg-[#0c121e] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-6 sm:p-8 relative shadow-2xs hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800/60 flex items-center justify-center font-bold">
                  <BellIcon size={20} />
                </div>
                <span className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2.5 py-1 rounded-md">
                  03-BOSQICH
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                Eng maqbul narxda oling
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Haqiqiy narx tarixini ko'rib xarid qiling yoki narx tushganda avtomatik xabar beruvchi "Narx ogohlantirishini" yoqing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
              <CheckCircleIcon size={13} />
              <span>Foydali xarid kafolati</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BUYER & SELLER DUAL SHOWCASE                                            */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* For Buyers */}
        <div className="bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xs hover:border-orange-400 transition-all">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/60 text-orange-700 dark:text-orange-300 text-xs font-bold mb-4">
              <UserIcon size={15} />
              <span>Xaridorlar uchun</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Xarid qilishdan oldin bozor haqiqatini biling
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8">
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
        <div className="bg-white dark:bg-[#090D16] border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-xs hover:border-amber-400 transition-all">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold mb-4">
              <ShopIcon size={15} />
              <span>Do'konlar va Sotuvchilar uchun</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
              Raqobatchilar narxlarini kuzating va savdoni oshiring
            </h3>
            <ul className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-8">
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
