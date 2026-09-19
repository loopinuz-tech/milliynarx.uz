import React, { useState, useRef } from 'react';

export const LineChart = ({
  data = [],
  series = [],
  height = 260,
  yFormatter = (val) => val?.toLocaleString?.() || val,
  xKey = 'label',
  showGrid = true
}) => {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center text-xs text-slate-400 py-12">
        Ma'lumotlar mavjud emas
      </div>
    );
  }

  // Calculate min & max values across all series
  let allVals = [];
  series.forEach(s => {
    data.forEach(d => {
      const v = d[s.key];
      if (typeof v === 'number') allVals.push(v);
    });
  });

  const minVal = allVals.length > 0 ? Math.min(...allVals) : 0;
  const maxVal = allVals.length > 0 ? Math.max(...allVals) : 100;
  // Add 10% headroom
  const range = maxVal - minVal || 1;
  const yMin = Math.max(0, minVal - range * 0.1);
  const yMax = maxVal + range * 0.1;

  const width = 800;
  const chartHeight = 220;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const innerWidth = width - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * innerWidth;
  };

  const getY = (value) => {
    if (value === undefined || value === null) return paddingTop + innerHeight;
    const norm = (value - yMin) / (yMax - yMin || 1);
    return paddingTop + innerHeight - norm * innerHeight;
  };

  // Generate smooth cubic bezier SVG path
  const generateSmoothPath = (points) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? 0 : i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const handlePointerMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - rect.left;
    const relativeX = (clientX / rect.width) * width;

    if (relativeX < paddingLeft || relativeX > width - paddingRight) {
      setHoverIndex(null);
      return;
    }

    const ratio = (relativeX - paddingLeft) / innerWidth;
    const index = Math.round(ratio * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, index));
    setHoverIndex(clamped);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // 4 Y-axis ticks
  const yTicks = [0, 0.33, 0.66, 1].map(r => yMin + r * (yMax - yMin));

  return (
    <div className="w-full space-y-3">
      {/* Legend & Summary */}
      <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          {series.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <span 
                className="w-2.5 h-2.5 rounded-full shadow-xs shrink-0" 
                style={{ backgroundColor: s.color }} 
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">
                {s.name}
              </span>
            </div>
          ))}
        </div>

        {hoverIndex !== null && data[hoverIndex] && (
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
            {data[hoverIndex][xKey]}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div 
        ref={containerRef}
        onMouseMove={handlePointerMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handlePointerMove}
        onTouchMove={handlePointerMove}
        onTouchEnd={handleMouseLeave}
        className="w-full relative select-none cursor-crosshair overflow-hidden rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-100 dark:border-slate-800/60 p-2 sm:p-4"
        style={{ minHeight: `${height}px` }}
      >
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
          style={{ height: `${height}px` }}
        >
          <defs>
            {series.map(s => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines */}
          {showGrid && yTicks.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono font-medium"
                >
                  {yFormatter(Math.round(val))}
                </text>
              </g>
            );
          })}

          {/* Area Fills and Lines for each series */}
          {series.map(s => {
            const points = data.map((d, idx) => ({
              x: getX(idx),
              y: getY(d[s.key]),
              value: d[s.key]
            }));

            const linePath = generateSmoothPath(points);
            if (!linePath) return null;

            const lastPoint = points[points.length - 1];
            const firstPoint = points[0];
            const bottomY = paddingTop + innerHeight;
            const areaPath = `${linePath} L ${lastPoint.x} ${bottomY} L ${firstPoint.x} ${bottomY} Z`;

            return (
              <g key={s.key}>
                {/* Translucent gradient fill */}
                <path d={areaPath} fill={`url(#grad-${s.key})`} />

                {/* Main line stroke */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-300"
                />

                {/* Points on line */}
                {points.map((p, idx) => (
                  <circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r={hoverIndex === idx ? 5 : 2.5}
                    fill={hoverIndex === idx ? '#FFFFFF' : s.color}
                    stroke={s.color}
                    strokeWidth={hoverIndex === idx ? 3 : 1}
                    className="transition-all duration-150"
                  />
                ))}
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, idx) => {
            // Show first, middle, and last, or every 2nd if fewer than 10
            const step = Math.ceil(data.length / 7);
            if (idx % step !== 0 && idx !== data.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight - 8}
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
              >
                {d[xKey]}
              </text>
            );
          })}

          {/* Hover Vertical Guide Line */}
          {hoverIndex !== null && (
            <line
              x1={getX(hoverIndex)}
              y1={paddingTop}
              x2={getX(hoverIndex)}
              y2={paddingTop + innerHeight}
              stroke="#F97316"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div 
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 bg-slate-900/90 dark:bg-[#151D2C]/95 text-white border border-slate-700/80 rounded-xl px-3 py-2 text-[11px] shadow-xl backdrop-blur-md space-y-1 transition-all"
            style={{
              left: `${Math.max(16, Math.min(84, (getX(hoverIndex) / width) * 100))}%`,
              top: '12px'
            }}
          >
            <div className="font-bold text-slate-300 pb-1 border-b border-slate-700 text-[10px]">
              {data[hoverIndex][xKey]}
            </div>
            {series.map(s => (
              <div key={s.key} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300">{s.name}:</span>
                </div>
                <span className="font-mono font-bold text-white">
                  {yFormatter(data[hoverIndex][s.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LineChart;
