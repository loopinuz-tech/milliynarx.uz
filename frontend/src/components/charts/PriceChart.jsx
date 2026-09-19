import React, { useState, useMemo, useRef } from 'react';
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

/**
 * Minimalist Financial Price Dynamics Chart with Line & Pie Chart (Doiraviy Taqsimot) Modes
 */
export const PriceChart = ({ data = [], height = 300 }) => {
  const [activeTimeframe, setActiveTimeframe] = useState('Barchasi');
  const [chartType, setChartType] = useState('line'); // 'line' | 'pie'
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const svgRef = useRef(null);

  const timeframes = [
    { key: '7K', days: 7 },
    { key: '1O', days: 30 },
    { key: '3O', days: 90 },
    { key: '1Y', days: 365 },
    { key: 'Barchasi', days: null },
  ];

  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height: `${height}px` }} 
        className="w-full flex flex-col items-center justify-center bg-slate-50/50 dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center"
      >
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Narx tarixi hali mavjud emas
        </p>
      </div>
    );
  }

  // Filter or sort points
  const points = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
    const selected = timeframes.find(t => t.key === activeTimeframe);
    
    if (!selected || !selected.days || sorted.length <= 1) {
      return sorted;
    }

    const latestDate = new Date(sorted[sorted.length - 1].recorded_at);
    const cutoffDate = new Date(latestDate);
    cutoffDate.setDate(cutoffDate.getDate() - selected.days);

    const withinRange = sorted.filter(p => new Date(p.recorded_at) >= cutoffDate);
    if (withinRange.length >= 2) return withinRange;

    const basePrice = sorted[sorted.length - 1].price;
    const startPrice = sorted[0].price;
    const count = Math.min(5, Math.max(3, sorted.length));
    const res = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(cutoffDate);
      d.setDate(d.getDate() + Math.floor((selected.days / (count - 1)) * i));
      const stepPrice = Math.round(startPrice + ((basePrice - startPrice) / (count - 1)) * i);
      res.push({ id: `int-${i}`, price: stepPrice, recorded_at: d.toISOString() });
    }
    return res;
  }, [data, activeTimeframe]);

  const prices = points.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const currentPrice = prices[prices.length - 1];

  // Calculate Pie/Donut Chart segmentation (Price brackets breakdown)
  const pieSegments = useMemo(() => {
    if (!points || points.length === 0) return [];
    const span = maxPrice - minPrice;
    const lowThreshold = minPrice + span * 0.33;
    const highThreshold = minPrice + span * 0.67;

    let lowCount = 0;
    let midCount = 0;
    let highCount = 0;

    points.forEach(p => {
      if (p.price <= lowThreshold) lowCount++;
      else if (p.price <= highThreshold) midCount++;
      else highCount++;
    });

    if (span === 0 || (lowCount === 0 && midCount === 0 && highCount === 0)) {
      lowCount = points.length;
    }

    const total = points.length;
    const rawSegments = [
      {
        id: 'low',
        label: 'Eng qulay narxlar',
        shortLabel: 'Qulay narx',
        count: lowCount,
        pct: Math.round((lowCount / total) * 100) || 0,
        color: '#10B981', // emerald-500
        glow: 'rgba(16, 185, 129, 0.25)',
        priceText: span === 0 ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(Math.round(lowThreshold))}`
      },
      {
        id: 'mid',
        label: "O'rtacha narxlar",
        shortLabel: "O'rtacha",
        count: midCount,
        pct: Math.round((midCount / total) * 100) || 0,
        color: '#F59E0B', // amber-500
        glow: 'rgba(245, 158, 11, 0.25)',
        priceText: `${formatPrice(Math.round(lowThreshold))} - ${formatPrice(Math.round(highThreshold))}`
      },
      {
        id: 'high',
        label: 'Maksimal narxlar',
        shortLabel: 'Maksimal',
        count: highCount,
        pct: Math.round((highCount / total) * 100) || 0,
        color: '#F43F5E', // rose-500
        glow: 'rgba(244, 63, 94, 0.25)',
        priceText: `${formatPrice(Math.round(highThreshold))} - ${formatPrice(maxPrice)}`
      }
    ].filter(s => s.count > 0);

    // Normalize percentages to sum to exactly 100%
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

    // Calculate start & end angles for SVG drawing
    let currentAngle = 0;
    return rawSegments.map(s => {
      const sliceAngle = (s.count / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      return {
        ...s,
        startAngle,
        endAngle
      };
    });
  }, [points, minPrice, maxPrice]);

  const currentCategory = useMemo(() => {
    if (!pieSegments.length) return null;
    const span = maxPrice - minPrice;
    if (span === 0) {
      return { 
        label: "Standart narx toifasi", 
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
      };
    }
    const lowThreshold = minPrice + span * 0.33;
    const highThreshold = minPrice + span * 0.67;
    if (currentPrice <= lowThreshold) {
      return { 
        label: "Eng qulay toifada", 
        badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60' 
      };
    }
    if (currentPrice <= highThreshold) {
      return { 
        label: "O'rtacha toifada", 
        badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60' 
      };
    }
    return { 
      label: "Yuqori toifada", 
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60' 
    };
  }, [currentPrice, minPrice, maxPrice, pieSegments]);

  // SVG Line Chart Dimensions & Padding
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 25;
  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const rawRange = maxPrice - minPrice;
  const buffer = rawRange === 0 ? (minPrice * 0.05 || 50000) : rawRange * 0.15;
  const effectiveMin = Math.max(0, minPrice - buffer);
  const effectiveMax = maxPrice + buffer;
  const effectiveRange = effectiveMax - effectiveMin || 1;

  const getX = (index) => {
    if (points.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (price) => {
    const normalized = (price - effectiveMin) / effectiveRange;
    return svgHeight - paddingBottom - normalized * chartHeight;
  };

  const pathD = useMemo(() => {
    if (points.length === 1) {
      return `M ${paddingLeft} ${svgHeight / 2} L ${svgWidth - paddingRight} ${svgHeight / 2}`;
    }
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.price)}`).join(' ');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length <= 1) return '';
    const lastX = getX(points.length - 1);
    const firstX = getX(0);
    const bottomY = svgHeight - paddingBottom;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, points]);

  // Magnetic Snapping Cursor
  const handleMouseMove = (e) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;

    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const px = getX(i);
      const diff = Math.abs(px - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }
    setHoveredIdx(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoveredIdx(null);
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;
  const activePointX = hoveredIdx !== null ? getX(hoveredIdx) : 0;
  const activePointY = hoveredIdx !== null ? getY(activePoint.price) : 0;

  const formatCompact = (val) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(2).replace(/\.00$/, '')}M`;
    }
    if (val >= 1000) {
      return `${Math.round(val / 1000)}K`;
    }
    return `${Math.round(val)}`;
  };

  return (
    <div className="w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 transition-colors shadow-2xs space-y-4">
      {/* Header: Title + Chart Mode Toggle (Chiziqli / Doiraviy) + Timeframe Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <SolarIcon name="History" size={18} className="text-orange-600" />
          <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
            Narxlar Dinamikasi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
          {/* Chart View Toggle: Chiziqli vs Doiraviy (Pie) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-bold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SolarIcon name="Chart" size={14} />
              <span>Chiziqli</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                chartType === 'pie'
                  ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 font-bold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <SolarIcon name="PieChart" size={14} />
              <span>Doiraviy (Pie)</span>
            </button>
          </div>

          {/* Timeframe Chips */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {timeframes.map((tf) => (
              <button
                key={tf.key}
                type="button"
                onClick={() => setActiveTimeframe(tf.key)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  activeTimeframe === tf.key
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-2xs font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf.key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Body: Line Mode or Pie Chart Mode */}
      {chartType === 'line' ? (
        <>
          {/* Magnetic SVG Line Chart */}
          <div 
            className="relative w-full overflow-hidden select-none" 
            style={{ height: `${height - 75}px` }}
          >
            <svg 
              ref={svgRef}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onTouchMove={(e) => {
                if (e.touches && e.touches[0]) {
                  handleMouseMove(e.touches[0]);
                }
              }}
              onTouchEnd={handleMouseLeave}
            >
              <defs>
                <linearGradient id="cleanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EA580C" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* 3 Subtle Reference Lines (Top, Middle, Bottom) */}
              {[0, 0.5, 1].map((frac, idx) => {
                const y = paddingTop + frac * chartHeight;
                const priceVal = effectiveMax - frac * effectiveRange;
                return (
                  <g key={idx}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={svgWidth - paddingRight} 
                      y2={y} 
                      stroke="currentColor" 
                      className="text-slate-100 dark:text-slate-800"
                      strokeWidth="1"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 3.5} 
                      fontSize="9.5" 
                      fill="currentColor"
                      className="text-slate-400 dark:text-slate-500 font-mono"
                      textAnchor="end"
                    >
                      {formatCompact(priceVal)}
                    </text>
                  </g>
                );
              })}

              {/* Area Glow */}
              {areaD && (
                <path d={areaD} fill="url(#cleanGlow)" />
              )}

              {/* Clean Orange Dynamic Curve */}
              <path 
                d={pathD} 
                fill="none" 
                stroke="#EA580C" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Subtle Data Points */}
              {points.map((p, idx) => {
                const cx = getX(idx);
                const cy = getY(p.price);
                const isHovered = hoveredIdx === idx;
                return (
                  <circle 
                    key={p.id || idx}
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
              {hoveredIdx !== null && activePoint && (
                <g className="transition-all duration-75 pointer-events-none">
                  <line 
                    x1={activePointX} 
                    y1={paddingTop} 
                    x2={activePointX} 
                    y2={svgHeight - paddingBottom} 
                    stroke="#EA580C" 
                    strokeDasharray="2 2" 
                    strokeWidth="1.5" 
                    opacity="0.6"
                  />
                  <circle 
                    cx={activePointX} 
                    cy={activePointY} 
                    r="10" 
                    fill="#EA580C" 
                    opacity="0.2" 
                    className="animate-ping"
                  />
                  <circle 
                    cx={activePointX} 
                    cy={activePointY} 
                    r="6" 
                    fill="#EA580C" 
                  />
                  <circle 
                    cx={activePointX} 
                    cy={activePointY} 
                    r="2.5" 
                    fill="#FFFFFF" 
                  />
                </g>
              )}

              {/* Invisible Overlay for Mouse/Touch Capture */}
              <rect 
                x={paddingLeft} 
                y={paddingTop} 
                width={chartWidth} 
                height={chartHeight} 
                fill="transparent" 
                className="cursor-crosshair"
              />
            </svg>

            {/* Magnetic Floating Tooltip */}
            {hoveredIdx !== null && activePoint && (
              <div 
                className="absolute z-20 pointer-events-none transition-all duration-75"
                style={{ 
                  left: `${(activePointX / svgWidth) * 100}%`, 
                  top: `${Math.max(10, Math.min(75, (activePointY / svgHeight) * 100))}%`,
                  transform: 'translate(-50%, -120%)'
                }}
              >
                <div className="bg-slate-900 dark:bg-slate-800 text-white rounded-lg px-3 py-1.5 shadow-lg border border-slate-700 text-center whitespace-nowrap">
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatDate(activePoint.recorded_at)}
                  </div>
                  <div className="text-xs font-black font-numeric text-white mt-0.5">
                    {formatPrice(activePoint.price)}
                  </div>
                </div>
                <div className="w-2 h-2 bg-slate-900 dark:bg-slate-800 rotate-45 mx-auto -mt-1 border-r border-b border-slate-700" />
              </div>
            )}
          </div>

          {/* Clean Date Footer */}
          <div className="flex justify-between items-center text-[11px] text-slate-400 dark:text-slate-500 px-3 sm:px-12 font-numeric pt-1 border-t border-slate-100 dark:border-slate-800/80">
            <span>{formatDate(points[0].recorded_at)}</span>
            <span>{formatDate(points[points.length - 1].recorded_at)}</span>
          </div>
        </>
      ) : (
        /* Pie Chart / Doiraviy Taqsimot Mode */
        <div className="flex flex-col md:flex-row items-center justify-around gap-8 py-5 px-2 sm:px-6">
          {/* SVG Donut */}
          <div className="relative w-64 h-64 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="donutGrad-low" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="donutGrad-mid" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="donutGrad-high" x1="0%" y1="0%" x2="100%" y2="100%">
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
                    fill={`url(#donutGrad-${segment.id})`}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Joriy Narx</span>
                  </div>
                  <div className="text-base sm:text-lg font-black font-numeric text-slate-900 dark:text-white tracking-tight leading-snug">
                    {formatPrice(currentPrice)}
                  </div>
                  {currentCategory && (
                    <div className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mt-1 max-w-[130px] truncate ${currentCategory.badgeClass}`}>
                      {currentCategory.label}
                    </div>
                  )}
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
    </div>
  );
};

export default PriceChart;
