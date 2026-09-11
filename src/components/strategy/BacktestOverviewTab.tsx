import React, { useState, useMemo } from 'react';
import { BacktestResult, BacktestTrade, EquityPoint } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  BarChart3, 
  ShieldAlert, 
  Target, 
  Clock, 
  Award, 
  AlertOctagon,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info
} from 'lucide-react';

interface BacktestOverviewTabProps {
  result: BacktestResult;
  onViewTradeList?: () => void;
  onViewPerformance?: () => void;
}

export const BacktestOverviewTab: React.FC<BacktestOverviewTabProps> = ({
  result,
  onViewTradeList,
  onViewPerformance
}) => {
  const { metrics, trades, equityCurve, assumptions } = result;

  // Chart toggles
  const [showDrawdown, setShowDrawdown] = useState<boolean>(true);
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [showTradeMarkers, setShowTradeMarkers] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ point: EquityPoint; x: number; y: number; trade?: BacktestTrade } | null>(null);

  // SVG Chart Geometry
  const svgWidth = 900;
  const svgHeight = 280;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  // Benchmark: Buy & hold asset curve normalized to initial capital
  const benchmarkCurve = useMemo(() => {
    if (trades.length === 0 || equityCurve.length === 0) return [];
    const firstPrice = trades[0]?.entryPrice || 1;
    const initialCap = assumptions.startingCapital;
    return equityCurve.map((pt) => {
      // Find matching trade exit or entry price
      const tr = trades[pt.tradeIndex - 1] || trades[0];
      const currentPrice = tr ? tr.exitPrice : firstPrice;
      const benchmarkVal = initialCap * (currentPrice / firstPrice);
      return { time: pt.time, value: benchmarkVal };
    });
  }, [trades, equityCurve, assumptions.startingCapital]);

  // Scales
  const allEquities = equityCurve.map(p => p.equity);
  if (showBenchmark && benchmarkCurve.length > 0) {
    benchmarkCurve.forEach(b => allEquities.push(b.value));
  }
  const minEq = Math.min(...allEquities, assumptions.startingCapital * 0.98);
  const maxEq = Math.max(...allEquities, assumptions.startingCapital * 1.02);
  const eqRange = maxEq - minEq || 1;

  const maxDrawdownVal = Math.max(...equityCurve.map(p => p.drawdown), 10);

  const getX = (idx: number) => {
    if (equityCurve.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (equityCurve.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padTop + chartH - ((val - minEq) / eqRange) * chartH;
  };

  const getDdY = (dd: number) => {
    // Drawdown curve drawn from top of bottom third or overlaid
    const ddMaxH = chartH * 0.35;
    const base = padTop + chartH;
    return base - (dd / maxDrawdownVal) * ddMaxH;
  };

  // Paths
  const { eqPath, eqFillPath, ddPath, ddFillPath, benchPath } = useMemo(() => {
    if (equityCurve.length === 0) {
      return { eqPath: '', eqFillPath: '', ddPath: '', ddFillPath: '', benchPath: '' };
    }

    let ep = '';
    let ef = '';
    let dp = '';
    let df = '';
    let bp = '';

    const baseY = padTop + chartH;

    equityCurve.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.equity);
      const ddy = getDdY(pt.drawdown);

      if (idx === 0) {
        ep += `M ${x} ${y}`;
        ef += `M ${x} ${baseY} L ${x} ${y}`;
        dp += `M ${x} ${ddy}`;
        df += `M ${x} ${baseY} L ${x} ${ddy}`;
      } else {
        ep += ` L ${x} ${y}`;
        ef += ` L ${x} ${y}`;
        dp += ` L ${x} ${ddy}`;
        df += ` L ${x} ${ddy}`;
      }
    });

    if (equityCurve.length > 0) {
      const lastX = getX(equityCurve.length - 1);
      ef += ` L ${lastX} ${baseY} Z`;
      df += ` L ${lastX} ${baseY} Z`;
    }

    // Benchmark line
    if (benchmarkCurve.length > 0) {
      benchmarkCurve.forEach((b, idx) => {
        const x = getX(idx);
        const y = getY(b.value);
        if (idx === 0) bp += `M ${x} ${y}`;
        else bp += ` L ${x} ${y}`;
      });
    }

    return { eqPath: ep, eqFillPath: ef, ddPath: dp, ddFillPath: df, benchPath: bp };
  }, [equityCurve, benchmarkCurve, minEq, maxEq, maxDrawdownVal]);

  // Donut chart calculations
  const winPercent = metrics.totalTrades > 0 ? (metrics.winningTrades / metrics.totalTrades) * 100 : 0;
  const lossPercent = metrics.totalTrades > 0 ? (metrics.losingTrades / metrics.totalTrades) * 100 : 0;
  const bePercent = metrics.totalTrades > 0 ? (metrics.breakevenTrades / metrics.totalTrades) * 100 : 0;

  const donutR = 54;
  const donutCirc = 2 * Math.PI * donutR;
  const winOffset = 0;
  const winLength = (winPercent / 100) * donutCirc;
  const lossLength = (lossPercent / 100) * donutCirc;
  const beLength = (bePercent / 100) * donutCirc;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. KEY PERFORMANCE INDICATOR CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Net Profit */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Net Profit</span>
            <div className={`p-1.5 rounded-md ${metrics.netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {metrics.netProfit >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-xl font-bold font-mono tracking-tight ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <span className={`text-xs font-semibold ${metrics.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Starting: ${assumptions.startingCapital.toLocaleString()}</span>
            <span className="text-slate-300 font-mono">End: ${(assumptions.startingCapital + metrics.netProfit).toLocaleString()}</span>
          </div>
        </div>

        {/* Win Rate */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Win Rate</span>
            <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold font-mono text-cyan-300 tracking-tight">
              {metrics.winRate}%
            </div>
            <span className="text-xs text-slate-400">
              ({metrics.winningTrades}W / {metrics.losingTrades}L)
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2.5 overflow-hidden flex">
            <div style={{ width: `${winPercent}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${lossPercent}%` }} className="bg-rose-500 h-full" />
            <div style={{ width: `${bePercent}%` }} className="bg-slate-500 h-full" />
          </div>
        </div>

        {/* Profit Factor */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Profit Factor</span>
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400">
              <BarChart3 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-xl font-bold font-mono tracking-tight ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : metrics.profitFactor >= 1.0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {metrics.profitFactor}
            </div>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#131B2E] text-slate-300 border border-[#1E293B]">
              {metrics.profitFactor >= 2.0 ? 'Exceptional' : metrics.profitFactor >= 1.5 ? 'Strong' : metrics.profitFactor >= 1.0 ? 'Marginal' : 'Negative'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Gross Profit: ${metrics.grossProfit.toLocaleString()}</span>
            <span>Loss: ${metrics.grossLoss.toLocaleString()}</span>
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Max Drawdown</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl font-bold font-mono text-amber-400 tracking-tight">
              -{metrics.maxDrawdownPercent}%
            </div>
            <span className="text-xs text-slate-400 font-mono">
              (-${metrics.maxDrawdown.toLocaleString()})
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Peak to trough</span>
            <span className="text-slate-300 font-mono">Calmar: {metrics.calmarRatio || 'N/A'}</span>
          </div>
        </div>

        {/* Total Trades */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Total Trades</span>
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-slate-100 tracking-tight">
            {metrics.totalTrades}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span className="text-emerald-400">{metrics.winningTrades} Wins</span>
            <span className="text-rose-400">{metrics.losingTrades} Losses</span>
            <span className="text-slate-400">{metrics.breakevenTrades} BE</span>
          </div>
        </div>

        {/* Sharpe Ratio */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Sharpe Ratio</span>
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className={`text-xl font-bold font-mono tracking-tight ${metrics.sharpeRatio >= 1.5 ? 'text-emerald-400' : metrics.sharpeRatio >= 1.0 ? 'text-cyan-300' : 'text-slate-300'}`}>
              {metrics.sharpeRatio}
            </div>
            <span className="text-xs text-slate-400">
              Sortino: {metrics.sortinoRatio}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Risk-adjusted annualized performance
          </div>
        </div>

        {/* Average R:R Ratio */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Average R:R</span>
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
              <Target className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 tracking-tight">
            {metrics.avgRR}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Avg Win: +${metrics.averageWin}</span>
            <span>Avg Loss: -${metrics.averageLoss}</span>
          </div>
        </div>

        {/* Trade Expectancy */}
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
            <span className="font-medium">Expectancy / Trade</span>
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl font-bold font-mono tracking-tight ${metrics.expectancy >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
            {metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Avg Duration: {metrics.avgDurationMinutes}m</span>
            <span>Streaks: {metrics.winningStreak}W / {metrics.losingStreak}L</span>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE EQUITY & DRAWDOWN CHART */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-md space-y-4">
        {/* Chart Top Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Equity Curve & Drawdown Analysis
              <span className="text-[10px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                {equityCurve.length} Points
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative account equity over time with peak-to-trough drawdown visualization
            </p>
          </div>

          {/* Curve Toggles */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              onClick={() => setShowDrawdown(!showDrawdown)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                showDrawdown
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-medium'
                  : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              Drawdown Underwater
            </button>

            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                showBenchmark
                  ? 'bg-slate-700/50 border-slate-500 text-slate-200 font-medium'
                  : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-slate-400" />
              Benchmark (Buy & Hold)
            </button>

            <button
              onClick={() => setShowTradeMarkers(!showTradeMarkers)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                showTradeMarkers
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-medium'
                  : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              Trade Markers
            </button>
          </div>
        </div>

        {/* SVG Equity Chart Container */}
        <div className="relative w-full overflow-hidden bg-[#090D18] rounded-lg border border-[#162033] p-2">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              {/* Equity gradient fill */}
              <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>

              {/* Drawdown gradient fill */}
              <linearGradient id="ddGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const y = padTop + chartH * ratio;
              const val = maxEq - ratio * eqRange;
              return (
                <g key={ratio}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={padLeft + chartW}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    ${Math.round(val).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {/* Initial Capital Baseline */}
            <line
              x1={padLeft}
              y1={getY(assumptions.startingCapital)}
              x2={padLeft + chartW}
              y2={getY(assumptions.startingCapital)}
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4,4"
            />

            {/* Benchmark Curve */}
            {showBenchmark && benchPath && (
              <path
                d={benchPath}
                fill="none"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                opacity="0.85"
              />
            )}

            {/* Drawdown Area & Line */}
            {showDrawdown && ddFillPath && (
              <path d={ddFillPath} fill="url(#ddGradient)" />
            )}
            {showDrawdown && ddPath && (
              <path
                d={ddPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.5"
                opacity="0.85"
              />
            )}

            {/* Strategy Equity Area & Line */}
            {eqFillPath && <path d={eqFillPath} fill="url(#eqGradient)" />}
            {eqPath && (
              <path
                d={eqPath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Trade Markers on Equity Curve */}
            {showTradeMarkers && equityCurve.map((pt, idx) => {
              const tr = trades[pt.tradeIndex - 1];
              if (!tr) return null;
              const x = getX(idx);
              const y = getY(pt.equity);
              const isWin = tr.pnl >= 0;

              return (
                <circle
                  key={idx}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill={isWin ? '#10b981' : '#f43f5e'}
                  stroke="#0E1526"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:scale-150 transition-transform"
                  onMouseEnter={() => setHoveredPoint({ point: pt, x, y, trade: tr })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              );
            })}

            {/* Active Hover Crosshair Line */}
            {hoveredPoint && (
              <g>
                <line
                  x1={hoveredPoint.x}
                  y1={padTop}
                  x2={hoveredPoint.x}
                  y2={padTop + chartH}
                  stroke="#38bdf8"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                />
                <circle
                  cx={hoveredPoint.x}
                  cy={hoveredPoint.y}
                  r={5}
                  fill="#38bdf8"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute z-20 pointer-events-none p-3 rounded-lg bg-[#0B101D] border border-cyan-500/40 text-xs shadow-xl min-w-[200px]"
              style={{
                left: `${Math.min(Math.max(10, (hoveredPoint.x / svgWidth) * 100), 75)}%`,
                top: '15px'
              }}
            >
              <div className="flex items-center justify-between text-slate-400 pb-1.5 mb-1.5 border-b border-[#1E293B]">
                <span className="font-semibold text-cyan-300">
                  {hoveredPoint.trade ? `Trade #${hoveredPoint.trade.tradeNumber}` : 'Equity Point'}
                </span>
                <span className="font-mono text-[10px]">
                  {new Date(hoveredPoint.point.time).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Equity:</span>
                  <span className="text-white font-bold">${hoveredPoint.point.equity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Drawdown:</span>
                  <span className="text-amber-400">-{hoveredPoint.point.drawdown}%</span>
                </div>
                {hoveredPoint.trade && (
                  <>
                    <div className="flex justify-between pt-1 border-t border-[#1E293B]">
                      <span className="text-slate-400">P/L:</span>
                      <span className={hoveredPoint.trade.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {hoveredPoint.trade.pnl >= 0 ? '+' : ''}${hoveredPoint.trade.pnl} ({hoveredPoint.trade.rMultiple}R)
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Reason:</span>
                      <span className="truncate max-w-[120px]">{hoveredPoint.trade.exitReason}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-cyan-400 rounded-full" />
            <span>Strategy Equity</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-slate-400 border-t border-dashed" />
              <span>Benchmark (Buy & Hold)</span>
            </div>
          )}
          {showDrawdown && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-amber-400 rounded-full" />
              <span>Drawdown Episode</span>
            </div>
          )}
          {showTradeMarkers && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Win / </span>
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Loss Trade</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. TRADE DISTRIBUTION & DETAILED INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trade Outcome Donut Visualization */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Trade Distribution</h4>
            <span className="text-xs text-slate-400">{metrics.totalTrades} Executed</span>
          </div>

          <div className="flex items-center justify-center py-2 relative">
            <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={donutR}
                fill="none"
                stroke="#1E293B"
                strokeWidth="14"
              />
              {/* Win slice */}
              {winLength > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={donutR}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${winLength} ${donutCirc - winLength}`}
                  strokeDashoffset={0}
                />
              )}
              {/* Loss slice */}
              {lossLength > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={donutR}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="14"
                  strokeDasharray={`${lossLength} ${donutCirc - lossLength}`}
                  strokeDashoffset={-winLength}
                />
              )}
              {/* Breakeven slice */}
              {beLength > 0 && (
                <circle
                  cx="70"
                  cy="70"
                  r={donutR}
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="14"
                  strokeDasharray={`${beLength} ${donutCirc - beLength}`}
                  strokeDashoffset={-(winLength + lossLength)}
                />
              )}
            </svg>

            {/* Center Donut Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-white">{metrics.winRate}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Win Rate</span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Winning Trades</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-emerald-400 font-semibold">{metrics.winningTrades}</span>
                <span className="text-slate-400 text-[11px]">({winPercent.toFixed(1)}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-slate-300">Losing Trades</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-rose-400 font-semibold">{metrics.losingTrades}</span>
                <span className="text-slate-400 text-[11px]">({lossPercent.toFixed(1)}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#131B2E] border border-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="text-slate-300">Breakeven</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-300 font-semibold">{metrics.breakevenTrades}</span>
                <span className="text-slate-400 text-[11px]">({bePercent.toFixed(1)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk / Reward & Extreme Trades */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Trade Performance Insights</h4>
            {onViewPerformance && (
              <button
                onClick={onViewPerformance}
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                View Full Metrics &rarr;
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Best Trade */}
            <div className="p-3.5 rounded-lg bg-[#131B2E] border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  Best Single Trade
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                  +{((metrics.bestTrade / assumptions.startingCapital) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                +${metrics.bestTrade.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                Highest profit excursion achieved on single execution.
              </p>
            </div>

            {/* Worst Trade */}
            <div className="p-3.5 rounded-lg bg-[#131B2E] border border-rose-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                  Worst Single Trade
                </span>
                <span className="text-[10px] bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                  {((metrics.worstTrade / assumptions.startingCapital) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-rose-400">
                ${metrics.worstTrade.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400">
                Maximum risk contained by stop loss parameters.
              </p>
            </div>
          </div>

          {/* Average Win vs Average Loss Visual Comparison */}
          <div className="p-4 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Average Win vs Average Loss</span>
              <span className="text-cyan-400 font-mono">Ratio {metrics.avgRR}</span>
            </div>

            <div className="space-y-2">
              {/* Avg Win Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-400">Avg Win</span>
                  <span className="font-mono text-emerald-400 font-semibold">+${metrics.averageWin.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, (metrics.averageWin / (metrics.averageWin + metrics.averageLoss || 1)) * 100)}%` }} 
                    className="bg-emerald-500 h-full rounded-full" 
                  />
                </div>
              </div>

              {/* Avg Loss Bar */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-rose-400">Avg Loss</span>
                  <span className="font-mono text-rose-400 font-semibold">-${metrics.averageLoss.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div 
                    style={{ width: `${Math.min(100, (metrics.averageLoss / (metrics.averageWin + metrics.averageLoss || 1)) * 100)}%` }} 
                    className="bg-rose-500 h-full rounded-full" 
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-[#1E293B]">
              <span>Max Consecutive Wins: <strong className="text-emerald-400 font-mono">{metrics.winningStreak}</strong></span>
              <span>Max Consecutive Losses: <strong className="text-rose-400 font-mono">{metrics.losingStreak}</strong></span>
              <span>Avg Duration: <strong className="text-slate-200 font-mono">{metrics.avgDurationMinutes}m</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
