import React, { useMemo } from 'react';
import { MonthlyReturn } from '../../types';
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface BacktestMonthlyReturnsTabProps {
  monthlyReturns: MonthlyReturn[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BacktestMonthlyReturnsTab: React.FC<BacktestMonthlyReturnsTabProps> = ({
  monthlyReturns
}) => {
  // Extract unique years
  const years = useMemo(() => {
    const set = new Set(monthlyReturns.map(m => m.year));
    return Array.from(set).sort((a: number, b: number) => b - a);
  }, [monthlyReturns]);

  // Map month key: `${year}_${month}`
  const monthMap = useMemo(() => {
    const map = new Map<string, MonthlyReturn>();
    monthlyReturns.forEach(m => {
      map.set(`${m.year}_${m.month}`, m);
    });
    return map;
  }, [monthlyReturns]);

  // Calculate year totals
  const yearTotals = useMemo(() => {
    const map = new Map<number, { pnl: number; returnPercent: number; trades: number; winRate: number }>();
    years.forEach(yr => {
      const yrMonths = monthlyReturns.filter(m => m.year === yr);
      const pnl = yrMonths.reduce((sum, m) => sum + m.pnl, 0);
      const returnPercent = yrMonths.reduce((sum, m) => sum + m.returnPercent, 0);
      const trades = yrMonths.reduce((sum, m) => sum + m.trades, 0);
      const totalWins = yrMonths.reduce((sum, m) => sum + Math.round((m.winRate / 100) * m.trades), 0);
      const winRate = trades > 0 ? (totalWins / trades) * 100 : 0;
      map.set(yr, {
        pnl: Number(pnl.toFixed(2)),
        returnPercent: Number(returnPercent.toFixed(2)),
        trades,
        winRate: Number(winRate.toFixed(1))
      });
    });
    return map;
  }, [years, monthlyReturns]);

  // Color helper based on percentage return
  const getCellColor = (returnPercent: number) => {
    if (returnPercent > 5) return 'bg-emerald-500/35 text-emerald-300 font-bold border-emerald-500/50';
    if (returnPercent > 2) return 'bg-emerald-500/20 text-emerald-400 font-semibold border-emerald-500/30';
    if (returnPercent > 0) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (returnPercent === 0) return 'bg-[#131B2E] text-slate-500 border-transparent';
    if (returnPercent > -2) return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    if (returnPercent > -5) return 'bg-rose-500/20 text-rose-400 font-semibold border-rose-500/30';
    return 'bg-rose-500/35 text-rose-300 font-bold border-rose-500/50';
  };

  // SVG Bar Chart Dimensions for Monthly Progression
  const svgW = 860;
  const svgH = 200;
  const padL = 45;
  const padR = 25;
  const padT = 20;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const returns = monthlyReturns.map(m => m.returnPercent);
  const maxReturn = Math.max(...returns, 3);
  const minReturn = Math.min(...returns, -3);
  const absMax = Math.max(Math.abs(maxReturn), Math.abs(minReturn)) || 5;

  const zeroY = padT + (chartH / 2);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Monthly Returns Heatmap Table */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Monthly Performance Heatmap
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Net percentage returns grouped by calendar month and annual total
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/50" />
              <span>Positive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-rose-500/30 border border-rose-500/50" />
              <span>Negative</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-[#11192E] border-b border-[#1E293B] text-slate-400 font-semibold">
                <th className="py-2.5 px-3 text-left">Year</th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="py-2.5 px-2">{m}</th>
                ))}
                <th className="py-2.5 px-3 text-right bg-[#151F33]">Year Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {years.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-500">
                    No monthly performance data recorded in backtest result.
                  </td>
                </tr>
              ) : (
                years.map(yr => {
                  const yTotal = yearTotals.get(yr) || { returnPercent: 0, pnl: 0, trades: 0, winRate: 0 };
                  return (
                    <tr key={yr} className="hover:bg-[#131B2E] transition-colors">
                      {/* Year */}
                      <td className="py-2.5 px-3 text-left font-mono font-bold text-slate-200">
                        {yr}
                      </td>

                      {/* Jan - Dec */}
                      {MONTH_NAMES.map((_, mIdx) => {
                        const rec = monthMap.get(`${yr}_${mIdx}`);
                        if (!rec || rec.trades === 0) {
                          return (
                            <td key={mIdx} className="py-2.5 px-1.5 text-slate-600 font-mono text-[11px]">
                              -
                            </td>
                          );
                        }

                        return (
                          <td key={mIdx} className="py-2.5 px-1.5">
                            <div 
                              className={`py-1 px-1.5 rounded border text-[11px] font-mono transition-transform hover:scale-105 ${getCellColor(rec.returnPercent)}`}
                              title={`${MONTH_NAMES[mIdx]} ${yr}: ${rec.returnPercent >= 0 ? '+' : ''}${rec.returnPercent}% ($${rec.pnl.toLocaleString()}) | ${rec.trades} trades (${rec.winRate}% win rate)`}
                            >
                              {rec.returnPercent >= 0 ? '+' : ''}{rec.returnPercent}%
                            </div>
                          </td>
                        );
                      })}

                      {/* Year Total Column */}
                      <td className="py-2.5 px-3 text-right bg-[#151F33] font-mono">
                        <span className={`font-bold ${yTotal.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {yTotal.returnPercent >= 0 ? '+' : ''}{yTotal.returnPercent}%
                        </span>
                        <div className="text-[10px] text-slate-500">
                          {yTotal.trades} trades
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Monthly Returns Bar Chart */}
      {monthlyReturns.length > 0 && (
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Monthly Returns Distribution
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              Zero Baseline Comparison
            </span>
          </div>

          <div className="relative w-full overflow-hidden bg-[#090D18] rounded-lg border border-[#162033] p-2">
            <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible select-none">
              {/* Zero Center Line */}
              <line
                x1={padL}
                y1={zeroY}
                x2={padL + chartW}
                y2={zeroY}
                stroke="#334155"
                strokeWidth="1.5"
              />
              <text
                x={padL - 8}
                y={zeroY + 3}
                textAnchor="end"
                fill="#94A3B8"
                fontSize="9"
                fontFamily="monospace"
              >
                0.0%
              </text>

              {/* Grid Lines */}
              <line
                x1={padL}
                y1={padT}
                x2={padL + chartW}
                y2={padT}
                stroke="#1E293B"
                strokeDasharray="3,3"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={padT + 3}
                textAnchor="end"
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
              >
                +{absMax.toFixed(1)}%
              </text>

              <line
                x1={padL}
                y1={padT + chartH}
                x2={padL + chartW}
                y2={padT + chartH}
                stroke="#1E293B"
                strokeDasharray="3,3"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={padT + chartH + 3}
                textAnchor="end"
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
              >
                -{absMax.toFixed(1)}%
              </text>

              {/* Bars */}
              {monthlyReturns.map((m, idx) => {
                const barWidth = Math.max(12, Math.min(36, (chartW / monthlyReturns.length) * 0.7));
                const slotW = chartW / monthlyReturns.length;
                const x = padL + idx * slotW + (slotW - barWidth) / 2;

                const isPos = m.returnPercent >= 0;
                const barHeight = Math.abs(m.returnPercent / absMax) * (chartH / 2);
                const y = isPos ? zeroY - barHeight : zeroY;

                return (
                  <g key={`${m.year}_${m.month}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(2, barHeight)}
                      rx={2}
                      fill={isPos ? '#10b981' : '#f43f5e'}
                      className="opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <title>{`${MONTH_NAMES[m.month]} ${m.year}: ${isPos ? '+' : ''}${m.returnPercent}% ($${m.pnl})`}</title>
                    </rect>

                    {/* X-axis Month Label */}
                    <text
                      x={x + barWidth / 2}
                      y={padT + chartH + 18}
                      textAnchor="middle"
                      fill="#64748B"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {MONTH_NAMES[m.month]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
