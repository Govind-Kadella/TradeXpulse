import React, { useState } from 'react';
import { HistoricalEconomicPoint } from '../../types';

interface EventHistoricalChartProps {
  eventName: string;
  data: HistoricalEconomicPoint[];
  range: string;
  onRangeChange: (range: string) => void;
}

export const EventHistoricalChart: React.FC<EventHistoricalChartProps> = ({
  eventName,
  data,
  range,
  onRangeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const displayData = data && data.length > 0 ? data : [
    { date: 'Jan', value: 0.3, forecast: 0.3, previous: 0.2 },
    { date: 'Feb', value: 0.5, forecast: 0.4, previous: 0.3 },
    { date: 'Mar', value: 0.3, forecast: 0.3, previous: 0.5 },
    { date: 'Apr', value: 0.25, forecast: 0.3, previous: 0.3 },
    { date: 'May', value: 0.2, forecast: 0.2, previous: 0.25 },
    { date: 'Jun', value: 0.15, forecast: 0.2, previous: 0.2 },
    { date: 'Jul', value: 0.35, forecast: 0.3, previous: 0.15 },
    { date: 'Aug', value: 0.2, forecast: 0.3, previous: 0.35 }
  ];

  // SVG dimensions
  const width = 380;
  const height = 150;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 26;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate min and max values
  const allValues = displayData.flatMap((d) => [d.value, d.forecast, d.previous].filter((v): v is number => typeof v === 'number'));
  let minVal = Math.min(...allValues);
  let maxVal = Math.max(...allValues);

  if (minVal === maxVal) {
    minVal -= 0.1;
    maxVal += 0.1;
  } else {
    const margin = (maxVal - minVal) * 0.15;
    minVal -= margin;
    maxVal += margin;
  }

  const getX = (index: number) => {
    if (displayData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (displayData.length - 1)) * chartWidth;
  };

  const getY = (val: number | null) => {
    if (val === null || typeof val !== 'number') return height - paddingBottom;
    const ratio = (val - minVal) / (maxVal - minVal);
    return height - paddingBottom - ratio * chartHeight;
  };

  // Build SVG path lines
  const actualPoints = displayData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');
  const forecastPoints = displayData.map((d, i) => `${getX(i)},${getY(d.forecast)}`).join(' ');

  // Grid lines
  const yTicks = [minVal, (minVal + maxVal) / 2, maxVal];

  return (
    <div 
      id="historical-data-chart-container" 
      className="p-3 bg-[#0B1220] rounded-lg border border-[#182337] flex flex-col"
    >
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#162135]">
        <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
          Historical Trend
        </div>
        <div className="flex items-center gap-1">
          {['3M', '6M', '1Y', 'All'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`px-1.5 py-0.5 text-[9px] rounded font-mono transition-colors ${
                range === r
                  ? 'bg-blue-600/30 border border-blue-500/50 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#142036]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 py-1 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded bg-cyan-400" />
          <span className="text-slate-300">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 border-t border-dashed border-amber-400" />
          <span className="text-amber-400">Forecast</span>
        </div>
        {hoveredIndex !== null && displayData[hoveredIndex] && (
          <div className="ml-auto text-[10px] text-cyan-300 font-bold">
            {displayData[hoveredIndex].date}: Act {displayData[hoveredIndex].value}% / Frc {displayData[hoveredIndex].forecast}%
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full h-[140px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          {/* Grid lines */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#1E293B"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <text
                  x={paddingLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748B"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Area gradient under Actual line */}
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Forecast dashed line */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="1.5"
            strokeDasharray="3,3"
            points={forecastPoints}
          />

          {/* Actual line & shaded area */}
          <polygon
            fill="url(#actualGradient)"
            points={`${getX(0)},${height - paddingBottom} ${actualPoints} ${getX(displayData.length - 1)},${height - paddingBottom}`}
          />
          <polyline
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={actualPoints}
          />

          {/* Points & Interactive Nodes */}
          {displayData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.value);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Date Label */}
                <text
                  x={cx}
                  y={height - 8}
                  textAnchor="middle"
                  fill={isHovered ? '#38BDF8' : '#64748B'}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {d.date}
                </text>

                {/* Actual node */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3}
                  fill="#0B1220"
                  stroke="#38BDF8"
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  className="transition-all cursor-pointer"
                />

                {/* Hit area for hovering */}
                <rect
                  x={cx - 15}
                  y={paddingTop}
                  width={30}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="cursor-pointer"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
