import React from 'react';
import { useNavigate } from 'react-router-dom';

// Official categories with verified assets in /public
const INNER_CATEGORIES = [
  { id: 'gadgets', name: 'Smartfonlar va gadjetlar', img: '/gadgetjs.png', query: 'Smartfon' },
  { id: 'laptop', name: 'Noutbuklar va IT', img: '/laptop.png', query: 'Noutbuk' },
  { id: 'texnika', name: 'Maishiy texnika', img: '/texnika.png', query: 'Konditsioner' },
  { id: 'tv', name: 'Televizorlar va audio', img: '/tv.png', query: 'Televizor' },
  { id: 'car', name: 'Avtomobil ehtiyot qismlari', img: '/car.png', query: 'Avto' },
  { id: 'food', name: 'Oziq-ovqat', img: '/food.png', query: 'Oziq-ovqat' },
];

const OUTER_CATEGORIES = [
  { id: 'qurilish', name: 'Qurilish mollari', img: '/qurilish.png', query: 'Qurilish' },
  { id: 'mebel', name: 'Mebel va interyer', img: '/mebel.png', query: 'Mebel' },
  { id: 'clothes', name: 'Kiyim va poyabzal', img: '/clothes.png', query: 'Kiyim' },
  { id: 'toqimachilik', name: 'To‘qimachilik', img: '/toqimachilik.png', query: 'Toqimachilik' },
  { id: 'qishloq', name: 'Qishloq xo‘jaligi', img: '/qishloq.png', query: 'Qishloq xo‘jaligi' },
  { id: 'sanoat', name: 'Sanoat uskunalari', img: '/sanoat.png', query: 'Sanoat' },
  { id: 'tibbiyot', name: 'Tibbiyot va farmatsevtika', img: '/tibbiyot.png', query: 'Tibbiyot' },
  { id: 'kimyo', name: 'Kimyo mahsulotlari', img: '/kimyo.png', query: 'Kimyo' },
];

const ALL_CATEGORIES = [
  ...INNER_CATEGORIES,
  ...OUTER_CATEGORIES,
];

export const CategoryOrbit = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="w-full bg-slate-100/70 dark:bg-[#070B14] text-slate-900 dark:text-white py-8 sm:py-14 border-y border-slate-200/90 dark:border-slate-800/80 relative overflow-hidden select-none transition-colors duration-200">
      {/* Subtle Bloomberg/TradingView style dark/light grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
          backgroundSize: '48px 48px'
        }}
      />

      {/* Gentle Warm Ambient Glow on Right Orbit Area Only */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 w-[480px] h-[480px] bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Scoped CSS Keyframe Animations for Buttery GPU Performance */}
      <style>{`
        @keyframes orbit-spin-cw {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-ccw {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes mobile-marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes mobile-marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .orbit-outer-rotate {
          animation: orbit-spin-cw 85s linear infinite;
        }
        .orbit-outer-counter {
          animation: orbit-spin-ccw 85s linear infinite;
        }
        .orbit-inner-rotate {
          animation: orbit-spin-cw 60s linear infinite;
        }
        .orbit-inner-counter {
          animation: orbit-spin-ccw 60s linear infinite;
        }

        .orbit-container:hover .orbit-outer-rotate,
        .orbit-container:hover .orbit-outer-counter,
        .orbit-container:hover .orbit-inner-rotate,
        .orbit-container:hover .orbit-inner-counter {
          animation-play-state: paused;
        }

        .mobile-marquee-track-1 {
          animation: mobile-marquee-left 30s linear infinite;
        }
        .mobile-marquee-track-2 {
          animation: mobile-marquee-right 32s linear infinite;
        }
        .mobile-marquee-container:hover .mobile-marquee-track-1,
        .mobile-marquee-container:hover .mobile-marquee-track-2 {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-outer-rotate,
          .orbit-outer-counter,
          .orbit-inner-rotate,
          .orbit-inner-counter,
          .mobile-marquee-track-1,
          .mobile-marquee-track-2 {
            animation: none !important;
          }
        }
      `}</style>

      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 relative z-10">
        {/* ================================================================= */}
        {/* RESPONSIVE LAYOUT: LEFT = CATEGORIES LIST, RIGHT = EXPANDED ORBIT */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* --------------------------------------------------------------- */}
          {/* CHAP TOMON (LEFT): YO'NALISHLAR VA TAHLILIY MA'LUMOTLAR         */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-6">
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-100/80 dark:bg-orange-500/10 border border-orange-300/80 dark:border-orange-500/25 text-orange-700 dark:text-orange-400 text-[11px] font-bold tracking-wider uppercase shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600 dark:bg-orange-500 animate-pulse" />
                Yagona AI Ekosistemasi
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white uppercase leading-tight">
                BOZOR TOIFALARI VA ASOSIY YO‘NALISHLAR
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
                O‘zbekiston bozorining turli yo‘nalishlaridagi ulgurji va chakana narxlarni yagona AI platformasida real vaqtda kuzating va xolis tahlillarga ega bo‘ling.
              </p>
            </div>

            {/* 14 Ta Asosiy Yo'nalishlar Ro'yxati (Barcha 14 ta toifa to'liq ko'rinadi, scrollbarsiz) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {ALL_CATEGORIES.map((cat) => {
                const isInner = INNER_CATEGORIES.some((c) => c.id === cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat.query)}
                    className="group flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl bg-white dark:bg-[#0F172A] hover:bg-orange-50/90 dark:hover:bg-[#1E293B] border border-slate-200/90 dark:border-slate-700/80 hover:border-orange-500 dark:hover:border-orange-500 shadow-2xs hover:shadow-md transition-all duration-200 text-left cursor-pointer active:scale-98"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 group-hover:border-orange-500/40 transition-colors shadow-2xs">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isInner ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`text-[10px] font-mono font-semibold ${isInner ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isInner ? 'Jonli Tahlil' : 'B2B Bozor'}
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-400 dark:text-slate-500 group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all text-xs font-bold shrink-0">
                      →
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Pastki Kichik Indicatorlar (To'liq yuqori kontrast) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-semibold">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span>14+ Rasmiy Sanoat Toifasi</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Real Vaqt AI Monitoring</span>
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------------- */}
          {/* O'NG TOMON (RIGHT): DUAL-RING ORBIT (KATTALASHTIRILGAN CARDS)    */}
          {/* --------------------------------------------------------------- */}
          <div className="lg:col-span-7 flex items-center justify-center relative w-full">
            
            {/* Desktop & Tablet Dynamic Orbit */}
            <div className="hidden md:flex relative items-center justify-center w-full max-w-[720px] h-[660px] lg:h-[730px] orbit-container">
              {/* Static Subtle Visual Guide Circles */}
              {/* Outer Guide Ring */}
              <div className="absolute w-[620px] h-[620px] lg:w-[680px] lg:h-[680px] rounded-full border border-slate-300/70 dark:border-slate-800/80 pointer-events-none" />
              {/* Inner Guide Ring */}
              <div className="absolute w-[340px] h-[340px] lg:w-[370px] lg:h-[370px] rounded-full border border-slate-300 dark:border-slate-800 border-dashed pointer-events-none" />
              {/* Core Ambient Ring */}
              <div className="absolute w-[200px] h-[200px] lg:w-[220px] lg:h-[220px] rounded-full border border-orange-500/30 pointer-events-none animate-pulse" />

              {/* ----------------------------------------------------------- */}
              {/* CENTER HUB: STATIONARY MILLIYNARX AI CORE (FAVICON.PNG)     */}
              {/* ----------------------------------------------------------- */}
              <div className="relative z-30 flex items-center justify-center w-36 h-36 sm:w-40 sm:h-40 lg:w-44 lg:h-44 rounded-full bg-white dark:bg-[#131D31] border-2 border-orange-500 shadow-xl dark:shadow-[0_0_45px_rgba(249,115,22,0.35)] transition-transform duration-300 hover:scale-105 p-6">
                {/* Thin Orange Circular Accent Ring */}
                <div className="absolute inset-2 rounded-full border border-orange-500/35 pointer-events-none" />
                
                {/* Official Favicon Asset from /public */}
                <img 
                  src="/favicon.png" 
                  alt="MilliyNarx AI" 
                  className="w-20 h-20 sm:w-22 sm:h-22 lg:w-24 lg:h-24 object-contain drop-shadow-md select-none hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* ----------------------------------------------------------- */}
              {/* INNER ORBIT: 6 HIGH-FREQUENCY CONSUMER TECH & ESSENTIALS    */}
              {/* Spacing: Radius ~170px - 185px                              */}
              {/* ----------------------------------------------------------- */}
              <div className="absolute w-full h-full flex items-center justify-center orbit-inner-rotate pointer-events-none">
                {INNER_CATEGORIES.map((cat, idx) => {
                  const angle = (idx * 360) / INNER_CATEGORIES.length;
                  return (
                    <div
                      key={cat.id}
                      className="absolute"
                      style={{
                        transform: `rotate(${angle}deg) translate(clamp(165px, 18vw, 185px)) rotate(-${angle}deg)`
                      }}
                    >
                      <div className="orbit-inner-counter pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(cat.query)}
                          title={cat.name}
                          aria-label={cat.name}
                          className="group relative flex items-center justify-center w-20 h-20 sm:w-[86px] sm:h-[86px] lg:w-[92px] lg:h-[92px] rounded-3xl bg-white dark:bg-[#131D31] hover:bg-orange-50/90 dark:hover:bg-[#1A2742] border-2 border-slate-200/90 dark:border-slate-700/90 hover:border-orange-500 dark:hover:border-orange-500 shadow-md hover:shadow-xl hover:shadow-orange-500/30 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.45)] backdrop-blur-md transition-all duration-300 hover:scale-115 cursor-pointer active:scale-95 p-2.5 sm:p-3"
                        >
                          <img 
                            src={cat.img} 
                            alt={cat.name} 
                            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200 select-none"
                            loading="eager"
                          />
                          {/* High Contrast Crystal Clear Hover Tooltip */}
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-[#1E293B] dark:text-white border border-slate-700/80 shadow-xl z-50">
                            {cat.name}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ----------------------------------------------------------- */}
              {/* OUTER ORBIT: 8 INDUSTRIAL, LIFESTYLE & RAW MATERIALS        */}
              {/* Spacing: Radius ~315px - 340px (Gap from inner: ~155px!)    */}
              {/* ----------------------------------------------------------- */}
              <div className="absolute w-full h-full flex items-center justify-center orbit-outer-rotate pointer-events-none">
                {OUTER_CATEGORIES.map((cat, idx) => {
                  const angle = (idx * 360) / OUTER_CATEGORIES.length + 22.5;
                  return (
                    <div
                      key={cat.id}
                      className="absolute"
                      style={{
                        transform: `rotate(${angle}deg) translate(clamp(310px, 32vw, 340px)) rotate(-${angle}deg)`
                      }}
                    >
                      <div className="orbit-outer-counter pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(cat.query)}
                          title={cat.name}
                          aria-label={cat.name}
                          className="group relative flex items-center justify-center w-20 h-20 sm:w-[86px] sm:h-[86px] lg:w-[92px] lg:h-[92px] rounded-3xl bg-white dark:bg-[#131D31] hover:bg-orange-50/90 dark:hover:bg-[#1A2742] border-2 border-slate-200/90 dark:border-slate-700/90 hover:border-orange-500 dark:hover:border-orange-500 shadow-md hover:shadow-xl hover:shadow-orange-500/30 dark:shadow-[0_10px_25px_rgba(0,0,0,0.5)] dark:hover:shadow-[0_0_30px_rgba(249,115,22,0.45)] backdrop-blur-md transition-all duration-300 hover:scale-115 cursor-pointer active:scale-95 p-2.5 sm:p-3"
                        >
                          <img 
                            src={cat.img} 
                            alt={cat.name} 
                            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200 select-none"
                            loading="eager"
                          />
                          {/* High Contrast Crystal Clear Hover Tooltip */}
                          <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap text-[11px] font-bold px-3 py-1 rounded-lg bg-slate-900 text-white dark:bg-[#1E293B] dark:text-white border border-slate-700/80 shadow-xl z-50">
                            {cat.name}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile (md:hidden): Dual Marquee with Large Image Cards */}
            <div className="md:hidden w-full space-y-4 flex flex-col items-center">
              {/* Mobile Center Hub (Favicon Only, No Text) */}
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-white dark:bg-[#131D31] border-2 border-orange-500/70 shadow-lg dark:shadow-[0_0_25px_rgba(249,115,22,0.3)] p-4">
                <div className="absolute inset-1.5 rounded-full border border-orange-500/30 pointer-events-none" />
                <img 
                  src="/favicon.png" 
                  alt="MilliyNarx AI" 
                  className="w-14 h-14 object-contain drop-shadow-md select-none"
                />
              </div>

              {/* Dual Seamless Orbit Ribbons (Only Images, Enlarged) */}
              <div className="w-full space-y-2.5 overflow-hidden mobile-marquee-container">
                {/* Track 1: Inner Categories */}
                <div className="flex w-max mobile-marquee-track-1 gap-3">
                  {[...INNER_CATEGORIES, ...INNER_CATEGORIES].map((cat, idx) => (
                    <button
                      key={`${cat.id}-${idx}`}
                      type="button"
                      onClick={() => handleCategoryClick(cat.query)}
                      title={cat.name}
                      aria-label={cat.name}
                      className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-[#131D31] border-2 border-slate-200 dark:border-slate-700 active:border-orange-500 p-2.5 shrink-0 shadow-xs active:scale-95 transition-transform"
                    >
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>

                {/* Track 2: Outer Categories */}
                <div className="flex w-max mobile-marquee-track-2 gap-3">
                  {[...OUTER_CATEGORIES, ...OUTER_CATEGORIES].map((cat, idx) => (
                    <button
                      key={`${cat.id}-${idx}`}
                      type="button"
                      onClick={() => handleCategoryClick(cat.query)}
                      title={cat.name}
                      aria-label={cat.name}
                      className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white dark:bg-[#131D31] border-2 border-slate-200 dark:border-slate-700 active:border-orange-500 p-2.5 shrink-0 shadow-xs active:scale-95 transition-transform"
                    >
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryOrbit;
