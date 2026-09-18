import React, { useState } from 'react';
import { formatPrice, formatDate } from '../../utils/formatters';
import SolarIcon from '../common/SolarIcon';

export const PriceChart = ({ data = [], height = 300 }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // If no price history exists, render genuine financial empty state
  if (!data || data.length === 0) {
    return (
      <div 
        style={{ height: `${height}px` }} 
        className="w-full flex flex-col items-center justify-center bg-slate-50/50 border border-slate-200 rounded-lg p-6 text-center"
      >
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <SolarIcon name="Chart" size={22} />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-0.5">
          Narx tarixi hali mavjud emas
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          Ushbu mahsulot bo'yicha narx o'zgarishlari qayd etilgach, real grafik bu yerda ko'rinadi.
        </p>
      </div>
    );
  }

  // Sort chronological for plotting
  const points = [...data].sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));
  
  const prices = points.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || (minPrice * 0.1) || 100000;
  
  // Chart dimensions inside SVG viewBox
  const svgWidth = 800;
  const svgHeight = 260;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  const getX = (index) => {
    if (points.length <= 1) return svgWidth / 2;
    return paddingX + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (price) => {
    if (maxPrice === minPrice) return svgHeight / 2;
    const normalized = (price - minPrice) / range;
    return svgHeight - paddingY - normalized * chartHeight;
  };

  const pathD = points.length === 1
    ? `M ${paddingX} ${svgHeight / 2} L ${svgWidth - paddingX} ${svgHeight / 2}`
    : points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.price)}`).join(' ');

  const areaD = points.length === 1
    ? ''
    : `${pathD} L ${getX(points.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${svgHeight - paddingY} Z`;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-lg p-4 relative">
      {/* Chart Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Real narxlar dinamikasi
          </div>
          <div className="text-lg font-bold text-slate-900 font-numeric">
            {formatPrice(points[points.length - 1].price)}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            Min: <span className="font-semibold text-slate-800 font-numeric">{formatPrice(minPrice)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block" />
            Max: <span className="font-semibold text-slate-800 font-numeric">{formatPrice(maxPrice)}</span>
          </div>
          <div className="text-slate-400 font-numeric">
            {points.length} ta yozuv
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden" style={{ height: `${height - 70}px` }}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac, idx) => {
            const y = paddingY + frac * chartHeight;
            const priceVal = maxPrice - frac * range;
            return (
              <g key={idx}>
                <line 
                  x1={paddingX} 
                  y1={y} 
                  x2={svgWidth - paddingX} 
                  y2={y} 
                  stroke="#F1F5F9" 
                  strokeDasharray="4 4" 
                  strokeWidth="1"
                />
                <text 
                  x={paddingX - 8} 
                  y={y + 3} 
                  fontSize="9" 
                  fill="#94A3B8" 
                  textAnchor="end"
                  fontFamily="Inter, monospace"
                >
                  {formatPrice(priceVal).replace(" so'm", "")}
                </text>
              </g>
            );
          })}

          {/* Fill Gradient area with warm flame orange */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA580C" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#EA580C" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {areaD && (
            <path d={areaD} fill="url(#priceGradient)" />
          )}

          {/* Main Price Line */}
          <path 
            d={pathD} 
            fill="none" 
            stroke="#EA580C" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.price);
            const isHovered = hoveredPoint?.id === p.id;
            return (
              <g key={p.id || idx}>
                <circle 
                  cx={cx} 
                  cy={cy} 
                  r={isHovered ? 6 : 4} 
                  fill="#FFFFFF" 
                  stroke="#EA580C" 
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all cursor-pointer"
                  onMouseEnter={() => setHoveredPoint({ ...p, x: cx, y: cy })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Interactive Floating Tooltip */}
        {hoveredPoint && (
          <div 
            className="absolute z-20 pointer-events-none bg-slate-900 text-white text-xs rounded shadow-lg px-2.5 py-1.5 -translate-x-1/2 -translate-y-full mb-2"
            style={{ 
              left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
              top: `${(hoveredPoint.y / svgHeight) * 100}%` 
            }}
          >
            <div className="font-bold text-white font-numeric">
              {formatPrice(hoveredPoint.price)}
            </div>
            <div className="text-[10px] text-slate-300">
              {formatDate(hoveredPoint.recorded_at)}
            </div>
          </div>
        )}
      </div>

      {/* Date Axis Labels */}
      <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 px-12 font-numeric">
        <span>{formatDate(points[0].recorded_at)}</span>
        {points.length > 2 && (
          <span>{formatDate(points[Math.floor(points.length / 2)].recorded_at)}</span>
        )}
        <span>{formatDate(points[points.length - 1].recorded_at)}</span>
      </div>
    </div>
  );
};

export default PriceChart;
