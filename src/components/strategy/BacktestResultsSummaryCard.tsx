import React from 'react';
import { BacktestResult } from '../../types';
import { Calendar, Play, AlertCircle } from 'lucide-react';

interface BacktestResultsSummaryCardProps {
  result: BacktestResult | null;
  isRunning: boolean;
  onRunBacktest: () => void;
  dateRangeText?: string;
}

export const BacktestResultsSummaryCard: React.FC<BacktestResultsSummaryCardProps> = ({
  result,
  isRunning,
  onRunBacktest,
  dateRangeText
}) => {
  const displayDateRange =
    dateRangeText ||
    (result
      ? `${result.assumptions.dateRange.start} - ${result.assumptions.dateRange.end}`
      : '1 Jan 2024 - 24 Aug 2026');

  if (!result) {
    return (
      <div
        id="backtest-results-card"
        className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 flex flex-col justify-between h-full min-h-[420px]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Backtest Results
          </h3>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <span>{displayDateRange}</span>
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
            <AlertCircle className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200">No backtest results yet.</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Configure your strategy rules above and click &ldquo;Run Backtest&rdquo; to simulate against historical market data with zero look-ahead bias.
            </p>
          </div>
          <button
            onClick={onRunBacktest}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md"
          >
            <Play className={`w-4 h-4 fill-white ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Simulating Historical Data...' : 'Run Backtest'}</span>
          </button>
        </div>
      </div>
    );
  }

  const { metrics, equityCurve } = result;

  // SVG dimensions for Mini Equity Curve
  const svgW = 420;
  const svgH = 150;
  const padL = 48;
  const padR = 20;
  const padT = 16;
  const padB = 26;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const equities = equityCurve.map(p => p.equity);
  const minEquity = Math.min(...equities, result.assumptions.startingCapital * 0.95);
  const maxEquity = Math.max(...equities, result.assumptions.startingCapital * 1.05);
  const range = maxEquity - minEquity || 1;

  const getX = (idx: number) => {
    return padL + (idx / Math.max(1, equityCurve.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    return padT + plotH - ((val - minEquity) / range) * plotH;
  };

  let linePath = '';
  let fillPath = '';

  equityCurve.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.equity);
    if (idx === 0) {
      linePath += `M ${x} ${y}`;
      fillPath += `M ${x} ${padT + plotH} L ${x} ${y}`;
    } else {
      linePath += ` L ${x} ${y}`;
      fillPath += ` L ${x} ${y}`;
    }
  });

  if (equityCurve.length > 0) {
    const lastX = getX(equityCurve.length - 1);
    fillPath += ` L ${lastX} ${padT + plotH} Z`;
  }

  // Y-axis grid values
  const yTicks = [
    maxEquity,
    minEquity + range * 0.75,
    minEquity + range * 0.5,
    minEquity + range * 0.25,
    minEquity
  ];

  // X-axis date labels derived from curve
  const xLabels = [];
  if (equityCurve.length >= 2) {
    const count = 4;
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i / (count - 1)) * (equityCurve.length - 1));
      const pt = equityCurve[idx];
      const d = new Date(pt.time);
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      xLabels.push({ x: getX(idx), label });
    }
  }

  const lastPt = equityCurve[equityCurve.length - 1];
  const lastX = lastPt ? getX(equityCurve.length - 1) : padL + plotW;
  const lastY = lastPt ? getY(lastPt.equity) : padT + plotH / 2;

  const isPositiveNet = metrics.netProfitUsd >= 0;
  const netProfitFormatted = `${isPositiveNet ? '+' : '-'}$${Math.abs(metrics.netProfitUsd).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  return (
    <div
      id="backtest-results-card"
      className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 flex flex-col justify-between h-full min-h-[420px]"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
        <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
          Backtest Results
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <span>{displayDateRange}</span>
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </div>

      {/* 8-Metric Grid (2 rows x 4 cols) */}
      <div className="grid grid-cols-4 gap-2 my-4">
        {/* Row 1 */}
        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Total Trades</div>
          <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            {metrics.totalTrades}
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Win Rate</div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              metrics.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {metrics.winRate.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Profit Factor</div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              metrics.profitFactor >= 1.5
                ? 'text-emerald-400'
                : metrics.profitFactor >= 1.0
                ? 'text-amber-400'
                : 'text-rose-400'
            }`}
          >
            {metrics.profitFactor.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Net Profit</div>
          <div
            className={`text-xs font-bold font-mono mt-1 ${
              isPositiveNet ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netProfitFormatted} <span className="text-[9px] text-slate-400 font-normal">USD</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Total Return</div>
          <div
            className={`text-sm font-bold font-mono mt-0.5 ${
              metrics.netProfitPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {metrics.netProfitPercent >= 0 ? '+' : ''}
            {metrics.netProfitPercent.toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Max Drawdown</div>
          <div className="text-sm font-bold text-rose-400 font-mono mt-0.5">
            -{Math.abs(metrics.maxDrawdownPercent).toFixed(1)}%
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Sharpe Ratio</div>
          <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            {metrics.sharpeRatio.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-slate-400 font-medium truncate">Avg. R/R</div>
          <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
            {metrics.riskRewardRatio.toFixed(1)} : 1
          </div>
        </div>
      </div>

      {/* Equity Curve Section */}
      <div className="pt-2 border-t border-[#1B2537]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-slate-200">Equity Curve</span>
          <span className="text-[10px] font-mono text-slate-400">
            Initial: ${result.assumptions.startingCapital.toLocaleString()}
          </span>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full h-[155px] bg-[#090E1A] rounded-lg border border-[#162036] p-1 overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqGreenGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines & Y labels */}
            {yTicks.map((val, i) => {
              const y = getY(val);
              return (
                <g key={`ygrid-${i}`}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 6}
                    y={y + 3}
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Gradient Fill under curve */}
            {fillPath && <path d={fillPath} fill="url(#eqGreenGradient)" />}

            {/* Ascending Green Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Final point circle */}
            <circle cx={lastX} cy={lastY} r="4" fill="#10B981" stroke="#064E3B" strokeWidth="2" />

            {/* X-axis date labels */}
            {xLabels.map((item, i) => (
              <text
                key={`xlabel-${i}`}
                x={item.x}
                y={padT + plotH + 16}
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {item.label}
              </text>
            ))}
          </svg>

          {/* Floating Final badge on upper right */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold shadow-sm">
            {netProfitFormatted}
          </div>
        </div>
      </div>
    </div>
  );
};
