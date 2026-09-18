import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../api/services';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../common/SolarIcon';

export const CategoryAnalyticsHub = ({ categoryId, categoryName, onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState('trend'); // 'trend' or 'comparison'
  const [hoveredTrend, setHoveredTrend] = useState(null);

  useEffect(() => {
    if (!categoryId) return;
    let isMounted = true;
    setLoading(true);

    productService.getCategoryAnalytics(categoryId)
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Failed to load category analytics:", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [categoryId]);

  if (loading) {
    return (
      <div className="bg-white border border-orange-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-lg w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-44 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const { category, stats, price_trend = [], product_comparisons = [], ai_analysis = {} } = data;

  const handleConsultAi = () => {
    const prompt = `${category.name} toifasidagi mahsulotlar bo'yicha bozor analitikasi: o'rtacha narx ${formatPrice(stats.avg_price)}, eng arzon taklif ${formatPrice(stats.min_price)}, narx spredi ${stats.spread_percent}%. B2B tadbirkorlar va xaridorlar uchun eng maqbul xarid strategiyasi va ishonchli savdo markazlari bo'yicha batafsil tahlil bering.`;
    navigate(`/ai-advisor?prompt=${encodeURIComponent(prompt)}`);
  };

  // SVG dimensions for Trend Chart
  const svgWidth = 700;
  const svgHeight = 200;
  const padX = 45;
  const padY = 25;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  const trendPrices = price_trend.map(pt => pt.avg_price);
  const trendMin = trendPrices.length > 0 ? Math.min(...trendPrices) : 0;
  const trendMax = trendPrices.length > 0 ? Math.max(...trendPrices) : 1;
  const trendRange = trendMax - trendMin || (trendMin * 0.1) || 10000;

  const getTrendX = (index) => {
    if (price_trend.length <= 1) return svgWidth / 2;
    return padX + (index / (price_trend.length - 1)) * chartW;
  };

  const getTrendY = (price) => {
    if (trendMax === trendMin) return svgHeight / 2;
    const norm = (price - trendMin) / trendRange;
    return svgHeight - padY - norm * chartH;
  };

  const trendPathD = price_trend.length <= 1
    ? `M ${padX} ${svgHeight / 2} L ${svgWidth - padX} ${svgHeight / 2}`
    : price_trend.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getTrendX(idx)} ${getTrendY(pt.avg_price)}`).join(' ');

  const trendAreaD = price_trend.length <= 1
    ? ''
    : `${trendPathD} L ${getTrendX(price_trend.length - 1)} ${svgHeight - padY} L ${getTrendX(0)} ${svgHeight - padY} Z`;

  return (
    <div className="bg-gradient-to-b from-orange-50/40 via-white to-white dark:bg-none dark:bg-[#0B0F19] border-2 border-orange-300/80 dark:border-orange-500/30 rounded-3xl p-5 sm:p-7 shadow-md space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-200/20 dark:bg-orange-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* 1. Header with Chamber of Commerce Problem #19 Tag */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-orange-600 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-md shadow-2xs">
              Savdo-sanoat palatasi #19-vazifa
            </span>
            <span className="px-2.5 py-0.5 bg-slate-900 dark:bg-slate-800 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bozor-Analitika (B2B AI Platform)</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{category.name}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
              {stats.total_products} ta faol taklif
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real vaqt rejimida bozorlarni tahlil qiluvchi, o'rtacha narxlar va eng maqbul savdo takliflarini topish tizimi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConsultAi}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain rounded-full shadow-2xs" />
            <span>Codexa AI Tahlilchi</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Kategoriya tahlilini yopish"
            >
              <SolarIcon name="CloseCircle" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-Time Price Indicators Grid (O'rtacha Narxlar & KPI) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Category Average Price */}
        <div className="bg-white dark:bg-[#111827] border border-orange-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-orange-400 dark:hover:border-orange-500 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>O'rtacha Bozor Narxi</span>
            <SolarIcon name="Chart" size={16} className="text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatPrice(stats.avg_price)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Bozor benchmark narxi
          </div>
        </div>

        {/* Card 2: Lowest Price (Benchmark) */}
        <div className="bg-emerald-50/60 dark:bg-[#0D2818]/70 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold mb-1">
            <span>Eng Arzon Taklif</span>
            <SolarIcon name="CheckCircle" size={16} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-numeric tracking-tight">
            {formatPrice(stats.min_price)}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium mt-1">
            Eng qulay xarid nuqtasi
          </div>
        </div>

        {/* Card 3: Maximum Price */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>Maksimal Narx</span>
            <SolarIcon name="Shield" size={16} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 font-numeric tracking-tight">
            {formatPrice(stats.max_price)}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            Chakana yuqori chegara
          </div>
        </div>

        {/* Card 4: Arbitrage Spread / Savings */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:bg-none dark:bg-[#1E1710] border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 text-[11px] font-semibold mb-1">
            <span>Arbitraj / Tejamkorlik</span>
            <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-extrabold px-1.5 py-0.2 rounded">
              +{stats.spread_percent}%
            </span>
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-800 dark:text-amber-400 font-numeric tracking-tight">
            {formatPrice(stats.spread_amount)}
          </div>
          <div className="text-[10px] text-amber-700 dark:text-amber-400/80 font-medium mt-1">
            Do'konlararo narx spredi
          </div>
        </div>

        {/* Card 5: Active Stores Count */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>Sotuvchi Do'konlar</span>
            <SolarIcon name="Shop" size={16} className="text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {stats.active_sellers_count} ta do'kon
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Barcha yirik bozorlar
          </div>
        </div>
      </div>

      {/* 3. AI Market Verdict & Commentary Card (Savdo-sanoat palatasi 19-muammo) */}
      <div className="bg-white/90 dark:bg-[#111827] border border-orange-200 dark:border-orange-500/30 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white p-1 flex items-center justify-center shadow-2xs">
              <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              Codexa AI Bozor Tahlili va Treyderlik Xulosasi
            </span>
          </div>

          {/* Verdict badge */}
          {ai_analysis?.verdict === 'BUY_NOW' ? (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="CheckCircle" size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Xarid uchun eng qulay fursat (Arbitraj marjasi yuqori)</span>
            </span>
          ) : ai_analysis?.verdict === 'WAIT' ? (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Clock" size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Narxlar barqarorlashuvini kutish tavsiya etiladi</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Shield" size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Bozor muvozanatli narxi (Standart konyunktura)</span>
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {ai_analysis?.summary}
        </p>

        {ai_analysis?.recommendation && (
          <div className="p-3 bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 rounded-xl text-xs text-orange-950 dark:text-orange-200 flex items-start gap-2">
            <SolarIcon name="Sparkles" size={16} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-900 dark:text-orange-300 font-bold">B2B Treyderlik Tavsiyasi:</strong> {ai_analysis.recommendation}
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Price Charts Section */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SolarIcon name="Chart" size={18} className="text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {chartTab === 'trend' ? "O'rtacha Narxlar Dinamikasi (Haftalik tendensiya)" : "Mahsulotlar Bo'yicha Narxlar Solishtirmasi"}
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setChartTab('trend')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartTab === 'trend' ? 'bg-white dark:bg-[#151D2C] text-orange-600 dark:text-orange-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Narx Dinamikasi
            </button>
            <button
              onClick={() => setChartTab('comparison')}
              className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                chartTab === 'comparison' ? 'bg-white dark:bg-[#151D2C] text-orange-600 dark:text-orange-400 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mahsulotlar Spredi
            </button>
          </div>
        </div>

        {/* Tab 1: Trend Line Chart */}
        {chartTab === 'trend' && (
          <div className="space-y-3">
            {price_trend.length > 0 ? (
              <div className="relative w-full overflow-hidden" style={{ height: `${svgHeight}px` }}>
                <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="catTrendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 0.5, 1].map((frac, idx) => {
                    const y = padY + frac * chartH;
                    const pVal = trendMax - frac * trendRange;
                    return (
                      <g key={idx}>
                        <line x1={padX} y1={y} x2={svgWidth - padX} y2={y} stroke="#F1F5F9" strokeDasharray="4 4" strokeWidth="1" />
                        <text x={padX - 8} y={y + 3} fontSize="9" fill="#94A3B8" textAnchor="end" fontFamily="monospace">
                          {formatPrice(pVal).replace(" so'm", "")}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area */}
                  {trendAreaD && <path d={trendAreaD} fill="url(#catTrendGrad)" />}

                  {/* Main Line */}
                  <path d={trendPathD} fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Points */}
                  {price_trend.map((pt, idx) => {
                    const cx = getTrendX(idx);
                    const cy = getTrendY(pt.avg_price);
                    const isHovered = hoveredTrend?.date === pt.date;
                    return (
                      <g key={pt.date || idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 4}
                          fill="#FFFFFF"
                          stroke="#EA580C"
                          strokeWidth={isHovered ? 3 : 2}
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredTrend({ ...pt, x: cx, y: cy })}
                          onMouseLeave={() => setHoveredTrend(null)}
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredTrend && (
                  <div
                    className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs rounded-lg shadow-lg px-2.5 py-1.5 -translate-x-1/2 -translate-y-full mb-2"
                    style={{
                      left: `${(hoveredTrend.x / svgWidth) * 100}%`,
                      top: `${(hoveredTrend.y / svgHeight) * 100}%`
                    }}
                  >
                    <div className="font-bold text-white font-numeric">
                      O'rtacha: {formatPrice(hoveredTrend.avg_price)}
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Sana: {formatDate(hoveredTrend.date)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Ushbu kategoriya bo'yicha tarixiy narx nuqtalari shakllanmoqda.
              </div>
            )}

            {/* Date axis */}
            {price_trend.length > 1 && (
              <div className="flex justify-between items-center text-[11px] text-slate-400 px-10 font-numeric">
                <span>{formatDate(price_trend[0].date)}</span>
                {price_trend.length > 2 && (
                  <span>{formatDate(price_trend[Math.floor(price_trend.length / 2)].date)}</span>
                )}
                <span>{formatDate(price_trend[price_trend.length - 1].date)}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Product Comparative Price Bars */}
        {chartTab === 'comparison' && (
          <div className="space-y-3 pt-1">
            {product_comparisons.map((item) => {
              const barWidth = stats.max_price > 0
                ? Math.max(20, Math.min(100, Math.round((item.min_price / stats.max_price) * 100)))
                : 50;

              return (
                <div key={item.id} className="p-3 bg-slate-50/70 dark:bg-[#151D2C] rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-white truncate max-w-sm flex items-center gap-2">
                      <span>{item.name}</span>
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded font-mono">
                        {item.sellers_count} ta do'kon
                      </span>
                    </span>
                    <div className="text-right font-numeric">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                        {formatPrice(item.min_price)}
                      </span>
                      {item.spread > 0 && (
                        <span className="text-[11px] text-slate-400 ml-2">
                          (O'rtacha: {formatPrice(item.avg_price)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-3 bg-slate-200/80 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full transition-all duration-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-numeric">
                    <span>Eng past narx: <strong className="text-emerald-700 dark:text-emerald-400">{formatPrice(item.min_price)}</strong></span>
                    {item.spread > 0 ? (
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">
                        Farq: {formatPrice(item.spread)} (+{item.spread_pct}%)
                      </span>
                    ) : (
                      <span className="text-slate-400">Yagona do'kon taklifi</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAnalyticsHub;
