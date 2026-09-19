import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../api/services';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../common/SolarIcon';

/**
 * Polar to Cartesian coordinates helper for SVG Donut/Pie Arc
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Creates SVG path for a donut arc
 */
function describeDonutArc(cx, cy, rInner, rOuter, startAngle, endAngle) {
  const angleDiff = endAngle - startAngle;
  if (angleDiff >= 359.9) {
    return [
      'M', cx, cy - rOuter,
      'A', rOuter, rOuter, 0, 1, 1, cx, cy + rOuter,
      'A', rOuter, rOuter, 0, 1, 1, cx, cy - rOuter,
      'M', cx, cy - rInner,
      'A', rInner, rInner, 0, 1, 0, cx, cy + rInner,
      'A', rInner, rInner, 0, 1, 0, cx, cy - rInner,
      'Z'
    ].join(' ');
  }
  const startOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArcFlag = angleDiff <= 180 ? '0' : '1';

  return [
    'M', startOuter.x, startOuter.y,
    'A', rOuter, rOuter, 0, largeArcFlag, 1, endOuter.x, endOuter.y,
    'L', startInner.x, startInner.y,
    'A', rInner, rInner, 0, largeArcFlag, 0, endInner.x, endInner.y,
    'Z'
  ].join(' ');
}

export const CategoryAnalyticsHub = ({ categoryId, categoryName, onClose }) => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartTab, setChartTab] = useState('trend'); // 'trend' | 'pie' | 'comparison'
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const trendSvgRef = useRef(null);

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
    const prompt = `${category.name} toifasidagi mahsulotlar bo'yicha bozor analitikasi: o'rtacha narx ${formatPrice(stats.avg_price)}, eng arzon taklif ${formatPrice(stats.min_price)}. Bozor tahlili va ishonchli do'konlar bo'yicha tavsiya bering.`;
    navigate(`/ai-advisor?prompt=${encodeURIComponent(prompt)}`);
  };

  // Clean AI text from any residual demo/hackathon phrases
  const cleanSummary = (ai_analysis?.summary || '')
    .replace(/^Codexa AI Bozor Tahlili\s*\(.*?\):\s*/i, '')
    .replace(/Savdo-sanoat palatasi #?19-[^\s.]*[\s.]*/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || `Ushbu toifada eng arzon taklif ${formatPrice(stats?.min_price || 0)}, o'rtacha bozor narxi esa ${formatPrice(stats?.avg_price || 0)} ni tashkil qilmoqda.`;

  const cleanRecommendation = (ai_analysis?.recommendation || '')
    .replace(/^B2B Treyderlik Tavsiyasi:\s*/i, '')
    .replace(/benchmark\s*/gi, '')
    .trim() || "Xarid qilishdan oldin birinchi qo'l do'konlar takliflarini taqqoslab xarid qilish tavsiya etiladi.";

  // SVG dimensions for Trend Chart
  const svgWidth = 800;
  const svgHeight = 220;
  const padLeft = 70;
  const padRight = 25;
  const padY = 22;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padY * 2;

  const formatCompact = (val) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}K`;
    }
    return `${Math.round(val)}`;
  };

  const trendPrices = price_trend.map(pt => pt.avg_price);
  const trendMin = trendPrices.length > 0 ? Math.min(...trendPrices) : 0;
  const trendMax = trendPrices.length > 0 ? Math.max(...trendPrices) : 1;
  const trendRange = trendMax - trendMin || (trendMin * 0.1) || 10000;

  const getTrendX = (index) => {
    if (price_trend.length <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (price_trend.length - 1)) * chartW;
  };

  const getTrendY = (price) => {
    if (trendMax === trendMin) return svgHeight / 2;
    const norm = (price - trendMin) / trendRange;
    return svgHeight - padY - norm * chartH;
  };

  const trendPathD = price_trend.length <= 1
    ? `M ${padLeft} ${svgHeight / 2} L ${svgWidth - padRight} ${svgHeight / 2}`
    : price_trend.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${getTrendX(idx)} ${getTrendY(pt.avg_price)}`).join(' ');

  const trendAreaD = price_trend.length <= 1
    ? ''
    : `${trendPathD} L ${getTrendX(price_trend.length - 1)} ${svgHeight - padY} L ${getTrendX(0)} ${svgHeight - padY} Z`;

  // Calculate Category Pie/Donut segmentation
  const pieSegments = (() => {
    const minP = stats?.min_price || 0;
    const maxP = stats?.max_price || 0;
    const avgP = stats?.avg_price || 0;
    const span = maxP - minP;

    if (span <= 0) {
      return [
        {
          id: 'mid',
          label: "Bozor narxi",
          shortLabel: "O'rtacha",
          count: 1,
          pct: 100,
          color: '#10B981',
          priceText: formatPrice(avgP || minP),
          startAngle: 0,
          endAngle: 360
        }
      ];
    }

    const lowThresh = minP + span * 0.33;
    const highThresh = minP + span * 0.67;

    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    const samplePrices = [];
    if (product_comparisons && product_comparisons.length > 0) {
      product_comparisons.forEach(p => {
        if (p.min_price) samplePrices.push(p.min_price);
        if (p.avg_price) samplePrices.push(p.avg_price);
        if (p.max_price) samplePrices.push(p.max_price);
      });
    }
    if (price_trend && price_trend.length > 0) {
      price_trend.forEach(pt => {
        if (pt.avg_price) samplePrices.push(pt.avg_price);
      });
    }

    if (samplePrices.length === 0) {
      samplePrices.push(minP, avgP, maxP);
    }

    samplePrices.forEach(pr => {
      if (pr <= lowThresh) lowCount++;
      else if (pr <= highThresh) midCount++;
      else highCount++;
    });

    const total = samplePrices.length || 1;
    const rawSegments = [
      {
        id: 'low',
        label: 'Eng qulay narxlar',
        shortLabel: 'Qulay narx',
        count: lowCount,
        pct: Math.round((lowCount / total) * 100) || 0,
        color: '#10B981',
        priceText: `${formatPrice(minP)} - ${formatPrice(Math.round(lowThresh))}`
      },
      {
        id: 'mid',
        label: "O'rtacha narxlar",
        shortLabel: "O'rtacha",
        count: midCount,
        pct: Math.round((midCount / total) * 100) || 0,
        color: '#F59E0B',
        priceText: `${formatPrice(Math.round(lowThresh))} - ${formatPrice(Math.round(highThresh))}`
      },
      {
        id: 'high',
        label: 'Maksimal narxlar',
        shortLabel: 'Maksimal',
        count: highCount,
        pct: Math.round((highCount / total) * 100) || 0,
        color: '#F43F5E',
        priceText: `${formatPrice(Math.round(highThresh))} - ${formatPrice(maxP)}`
      }
    ].filter(s => s.count > 0);

    if (rawSegments.length > 0) {
      const sumPct = rawSegments.reduce((acc, s) => acc + s.pct, 0);
      if (sumPct !== 100 && sumPct !== 0) {
        let maxSeg = rawSegments[0];
        rawSegments.forEach(s => {
          if (s.count > maxSeg.count) maxSeg = s;
        });
        maxSeg.pct += (100 - sumPct);
      }
    }

    let curAngle = 0;
    return rawSegments.map(s => {
      const sliceAngle = (s.count / total) * 360;
      const startAngle = curAngle;
      const endAngle = curAngle + sliceAngle;
      curAngle = endAngle;
      return {
        ...s,
        startAngle,
        endAngle
      };
    });
  })();

  // Magnetic Snapping Cursor for Category Trend Chart
  const handleTrendMouseMove = (e) => {
    if (!trendSvgRef.current || price_trend.length === 0) return;
    const clientX = e.touches ? e.touches[0]?.clientX : e.clientX;
    if (clientX === undefined) return;
    const rect = trendSvgRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < price_trend.length; i++) {
      const px = getTrendX(i);
      const diff = Math.abs(px - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredTrendIdx(closestIdx);
  };

  const handleTrendMouseLeave = () => {
    setHoveredTrendIdx(null);
  };

  const activeTrendPoint = hoveredTrendIdx !== null ? price_trend[hoveredTrendIdx] : null;
  const activeTrendX = hoveredTrendIdx !== null ? getTrendX(hoveredTrendIdx) : 0;
  const activeTrendY = activeTrendPoint ? getTrendY(activeTrendPoint.avg_price) : 0;

  return (
    <div className="bg-gradient-to-b from-orange-50/40 via-white to-white dark:bg-none dark:bg-[#0B0F19] border-2 border-orange-300/80 dark:border-orange-500/30 rounded-3xl p-5 sm:p-7 shadow-md space-y-6 relative overflow-hidden transition-all duration-300">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-200/20 dark:bg-orange-600/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* 1. Clean Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-orange-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 text-[11px] font-bold rounded-md flex items-center gap-1.5">
              <SolarIcon name="Chart" size={13} />
              <span>Bozor Narxlari Tahlili</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{category.name}</span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-[#151D2C] border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
              {stats.total_products} ta taklif
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Ushbu toifadagi real narxlar tahlili va eng maqbul xarid takliflari.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleConsultAi}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          >
            <img src="/aiimg.png" alt="AI" className="w-4 h-4 object-contain rounded-full shadow-2xs" />
            <span>AI Maslahatchi</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              title="Yopish"
            >
              <SolarIcon name="CloseCircle" size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 2. Simplified Price Indicators (Eng arzon, O'rtacha, Eng yuqori, Sotuvchilar) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Lowest Price */}
        <div className="bg-emerald-50/70 dark:bg-[#0D2818]/60 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold mb-1">
            <span>Eng Arzon Taklif</span>
            <SolarIcon name="CheckCircle" size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400 font-numeric tracking-tight">
            {formatPrice(stats.min_price)}
          </div>
        </div>

        {/* Card 2: Average Price */}
        <div className="bg-white dark:bg-[#111827] border border-orange-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between hover:border-orange-400 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>O'rtacha Bozor Narxi</span>
            <SolarIcon name="Chart" size={16} className="text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {formatPrice(stats.avg_price)}
          </div>
        </div>

        {/* Card 3: Maximum Price */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>Eng Yuqori Narx</span>
            <SolarIcon name="Shield" size={16} className="text-slate-400 dark:text-slate-500" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-700 dark:text-slate-200 font-numeric tracking-tight">
            {formatPrice(stats.max_price)}
          </div>
        </div>

        {/* Card 4: Active Stores Count */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-semibold mb-1">
            <span>Sotuvchi Do'konlar</span>
            <SolarIcon name="Shop" size={16} className="text-orange-500" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-numeric tracking-tight">
            {stats.active_sellers_count} ta do'kon
          </div>
        </div>
      </div>

      {/* 3. AI Market Verdict & Commentary Card */}
      <div className="bg-white/90 dark:bg-[#111827] border border-orange-200/80 dark:border-orange-500/30 rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-orange-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white p-1 flex items-center justify-center shadow-2xs">
              <img src="/aiimg.png" alt="AI" className="w-full h-full object-contain" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">
              AI Bozor Xulosasi
            </span>
          </div>

          {/* Verdict badge */}
          {ai_analysis?.verdict === 'BUY_NOW' ? (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="CheckCircle" size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Xarid uchun qulay fursat</span>
            </span>
          ) : ai_analysis?.verdict === 'WAIT' ? (
            <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Clock" size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Kutish tavsiya etiladi</span>
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <SolarIcon name="Shield" size={14} className="text-blue-600 dark:text-blue-400" />
              <span>Narxlar barqaror</span>
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
          {cleanSummary}
        </p>

        {cleanRecommendation && (
          <div className="p-3 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-800/50 rounded-xl text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2">
            <SolarIcon name="Sparkles" size={16} className="text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-orange-900 dark:text-orange-300 font-bold">Tavsiya: </strong>
              <span>{cleanRecommendation}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Interactive Price Charts Section */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <SolarIcon name={chartTab === 'pie' ? "PieChart" : "Chart"} size={18} className="text-orange-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {chartTab === 'trend' 
                ? "O'rtacha Narxlar Dinamikasi (Haftalik tendensiya)" 
                : chartTab === 'pie' 
                ? "Bozor Narxlari Taqsimoti (Doiraviy)" 
                : "Mahsulotlar Bo'yicha Narxlar Solishtirmasi"}
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setChartTab('trend')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartTab === 'trend' ? 'bg-white dark:bg-[#151D2C] text-orange-600 dark:text-orange-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SolarIcon name="Chart" size={14} />
              <span>Narx Dinamikasi</span>
            </button>
            <button
              onClick={() => setChartTab('pie')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartTab === 'pie' ? 'bg-white dark:bg-[#151D2C] text-orange-600 dark:text-orange-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SolarIcon name="PieChart" size={14} />
              <span>Doiraviy (Pie)</span>
            </button>
            <button
              onClick={() => setChartTab('comparison')}
              className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                chartTab === 'comparison' ? 'bg-white dark:bg-[#151D2C] text-orange-600 dark:text-orange-400 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SolarIcon name="Layers" size={14} />
              <span>Mahsulotlar Taqqoslovi</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Trend Line Chart */}
        {chartTab === 'trend' && (
          <div className="space-y-3">
            {price_trend.length > 0 ? (
              <div className="relative w-full overflow-hidden" style={{ height: `${svgHeight}px` }}>
                <svg 
                  ref={trendSvgRef}
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
                  className="w-full h-full overflow-visible select-none" 
                  preserveAspectRatio="none"
                  onMouseMove={handleTrendMouseMove}
                  onMouseLeave={handleTrendMouseLeave}
                  onTouchMove={handleTrendMouseMove}
                  onTouchEnd={handleTrendMouseLeave}
                >
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
                        <line 
                          x1={padLeft} 
                          y1={y} 
                          x2={svgWidth - padRight} 
                          y2={y} 
                          stroke="currentColor" 
                          className="text-slate-100 dark:text-slate-800"
                          strokeDasharray="4 4" 
                          strokeWidth="1" 
                        />
                        <text 
                          x={padLeft - 8} 
                          y={y + 3.5} 
                          fontSize="9.5" 
                          fill="currentColor"
                          className="text-slate-400 dark:text-slate-500 font-mono font-medium"
                          textAnchor="end"
                        >
                          {formatCompact(pVal)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area */}
                  {trendAreaD && <path d={trendAreaD} fill="url(#catTrendGrad)" />}

                  {/* Main Line */}
                  <path d={trendPathD} fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                  {/* Regular Points */}
                  {price_trend.map((pt, idx) => {
                    const cx = getTrendX(idx);
                    const cy = getTrendY(pt.avg_price);
                    const isHovered = hoveredTrendIdx === idx;
                    return (
                      <circle
                        key={pt.date || idx}
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 5.5 : 3.5}
                        fill="#FFFFFF"
                        stroke="#EA580C"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-100"
                      />
                    );
                  })}

                  {/* Magnetic Vertical Guide & Active Snapping Dot */}
                  {hoveredTrendIdx !== null && activeTrendPoint && (
                    <g className="transition-all duration-75 pointer-events-none">
                      <line 
                        x1={activeTrendX} 
                        y1={padY} 
                        x2={activeTrendX} 
                        y2={svgHeight - padY} 
                        stroke="#EA580C" 
                        strokeDasharray="3 3" 
                        strokeWidth="1.5" 
                        opacity="0.6"
                      />
                      <circle 
                        cx={activeTrendX} 
                        cy={activeTrendY} 
                        r="10" 
                        fill="#EA580C" 
                        opacity="0.25" 
                        className="animate-ping"
                      />
                      <circle 
                        cx={activeTrendX} 
                        cy={activeTrendY} 
                        r="6" 
                        fill="#EA580C" 
                      />
                      <circle 
                        cx={activeTrendX} 
                        cy={activeTrendY} 
                        r="2.5" 
                        fill="#FFFFFF" 
                      />
                    </g>
                  )}

                  {/* Invisible Overlay for Mouse/Touch Capture */}
                  <rect 
                    x={padLeft} 
                    y={padY} 
                    width={chartW} 
                    height={chartH} 
                    fill="transparent" 
                    className="cursor-crosshair"
                  />
                </svg>

                {/* Floating Magnetic Tooltip */}
                {hoveredTrendIdx !== null && activeTrendPoint && (
                  <div
                    className="absolute z-20 pointer-events-none transition-all duration-75"
                    style={{
                      left: `${(activeTrendX / svgWidth) * 100}%`,
                      top: `${Math.max(10, Math.min(75, (activeTrendY / svgHeight) * 100))}%`,
                      transform: 'translate(-50%, -120%)'
                    }}
                  >
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur text-white rounded-xl px-3 py-1.5 shadow-xl border border-slate-700/80 text-center whitespace-nowrap">
                      <div className="text-[10px] text-slate-300 font-mono flex items-center justify-center gap-1">
                        <SolarIcon name="Calendar" size={11} className="text-orange-400" />
                        <span>{formatDate(activeTrendPoint.date)}</span>
                      </div>
                      <div className="text-xs font-black font-numeric text-white mt-0.5">
                        {formatPrice(activeTrendPoint.avg_price)}
                      </div>
                      <div className="text-[9px] text-orange-400 font-medium">
                        O'rtacha narx
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700/80" />
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
              <div 
                className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 font-numeric pt-2 border-t border-slate-100 dark:border-slate-800/80"
                style={{ paddingLeft: `${(padLeft / svgWidth) * 100}%`, paddingRight: `${(padRight / svgWidth) * 100}%` }}
              >
                <span>{formatDate(price_trend[0].date)}</span>
                {price_trend.length > 2 && (
                  <span>{formatDate(price_trend[Math.floor(price_trend.length / 2)].date)}</span>
                )}
                <span>{formatDate(price_trend[price_trend.length - 1].date)}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Pie / Donut Chart */}
        {chartTab === 'pie' && (
          <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-5 px-2 sm:px-6">
            {/* SVG Donut */}
            <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="catDonutGrad-low" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="catDonutGrad-mid" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <linearGradient id="catDonutGrad-high" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F43F5E" />
                    <stop offset="100%" stopColor="#E11D48" />
                  </linearGradient>
                </defs>

                {/* Background Track Ring */}
                <circle 
                  cx="100" 
                  cy="100" 
                  r="76.5" 
                  fill="none" 
                  stroke="currentColor" 
                  className="text-slate-100 dark:text-slate-800/80" 
                  strokeWidth="17" 
                />

                {/* Slices with angular gap and hover state */}
                {pieSegments.map((segment) => {
                  const isHovered = hoveredSlice?.id === segment.id;
                  const gap = pieSegments.length > 1 ? 2.5 : 0;
                  const effStart = segment.startAngle + gap;
                  const effEnd = segment.endAngle - gap;
                  const pathStr = describeDonutArc(
                    100, 
                    100, 
                    68, 
                    isHovered ? 89 : 85, 
                    effEnd > effStart ? effStart : segment.startAngle, 
                    effEnd > effStart ? effEnd : segment.endAngle
                  );

                  return (
                    <path
                      key={segment.id}
                      d={pathStr}
                      fill={`url(#catDonutGrad-${segment.id})`}
                      stroke="currentColor"
                      className="text-white dark:text-[#111827] stroke-[3px] stroke-linejoin-round transition-all duration-300 cursor-pointer"
                      style={{
                        filter: isHovered ? 'drop-shadow(0 6px 14px rgba(0,0,0,0.18))' : 'none',
                        opacity: hoveredSlice && !isHovered ? 0.35 : 1,
                      }}
                      onMouseEnter={() => setHoveredSlice(segment)}
                      onMouseLeave={() => setHoveredSlice(null)}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Info */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                {hoveredSlice ? (
                  <div className="flex flex-col items-center justify-center transition-all animate-fade-in">
                    <div 
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1"
                      style={{ 
                        backgroundColor: `${hoveredSlice.color}18`, 
                        color: hoveredSlice.color,
                        border: `1px solid ${hoveredSlice.color}35`
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: hoveredSlice.color }} />
                      <span className="truncate max-w-[100px]">{hoveredSlice.shortLabel}</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black font-numeric text-slate-900 dark:text-white tracking-tight leading-none">
                      {hoveredSlice.pct}%
                    </div>
                    <div className="text-[11px] font-numeric font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[125px] truncate">
                      {hoveredSlice.priceText}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center transition-all">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                      <span>O'rtacha Narx</span>
                    </div>
                    <div className="text-base sm:text-lg font-black font-numeric text-slate-900 dark:text-white tracking-tight leading-snug">
                      {formatPrice(stats.avg_price)}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                      Bozor taqsimoti
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown Cards (Legend) */}
            <div className="w-full max-w-sm flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 uppercase tracking-wider">
                <span>Bozor toifalari</span>
                <span>Taqsimot</span>
              </div>

              {pieSegments.map((seg) => {
                const isHovered = hoveredSlice?.id === seg.id;
                return (
                  <div
                    key={seg.id}
                    onMouseEnter={() => setHoveredSlice(seg)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                      isHovered
                        ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm translate-x-1'
                        : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:bg-white dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-xs"
                        style={{ backgroundColor: seg.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {seg.label}
                        </div>
                        <div className="text-[11px] font-numeric text-slate-500 dark:text-slate-400 truncate">
                          {seg.priceText}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="w-14 hidden sm:block bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                        />
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded-md text-xs font-black font-numeric"
                        style={{ 
                          backgroundColor: `${seg.color}15`, 
                          color: seg.color,
                          border: `1px solid ${seg.color}35`
                        }}
                      >
                        {seg.pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Product Comparative Price Bars */}
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
