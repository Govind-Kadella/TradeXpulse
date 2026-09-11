import React, { useState } from 'react';
import {
  BacktestResult,
  BacktestTrade,
  MonthlyReturn,
  BlockedSignalRecord
} from '../../types';
import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  Calendar,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  DollarSign,
  Percent,
  Activity
} from 'lucide-react';

interface BacktestResultsViewProps {
  result: BacktestResult;
  onRerun?: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const BacktestResultsView: React.FC<BacktestResultsViewProps> = ({ result, onRerun }) => {
  const [selectedTab, setSelectedTab] = useState<'trades' | 'monthly' | 'blocked' | 'assumptions'>('trades');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN'>('ALL');

  const { metrics, trades, equityCurve, monthlyReturns, assumptions, blockedSignalsLog } = result;

  const filteredTrades = trades.filter(t => {
    if (tradeFilter === 'ALL') return true;
    return t.outcome === tradeFilter;
  });

  // Unique years in monthly returns
  const years = Array.from(new Set(monthlyReturns.map(m => m.year))).sort((a: number, b: number) => b - a);

  // SVG dimensions for Equity Curve
  const svgW = 860;
  const svgH = 220;
  const equities = equityCurve.map(p => p.equity);
  const minEquity = Math.min(...equities, assumptions.startingCapital * 0.95);
  const maxEquity = Math.max(...equities, assumptions.startingCapital * 1.05);
  const eqRange = maxEquity - minEquity || 1;

  const getEqX = (idx: number) => {
    return 45 + (idx / Math.max(1, equityCurve.length - 1)) * (svgW - 75);
  };
  const getEqY = (val: number) => {
    return svgH - 30 - ((val - minEquity) / eqRange) * (svgH - 60);
  };

  // Build SVG Path
  let curvePath = '';
  let fillPath = '';
  equityCurve.forEach((pt, idx) => {
    const x = getEqX(idx);
    const y = getEqY(pt.equity);
    if (idx === 0) {
      curvePath += `M ${x} ${y}`;
      fillPath += `M ${x} ${svgH - 25} L ${x} ${y}`;
    } else {
      curvePath += ` L ${x} ${y}`;
      fillPath += ` L ${x} ${y}`;
    }
  });
  if (equityCurve.length > 0) {
    fillPath += ` L ${getEqX(equityCurve.length - 1)} ${svgH - 25} Z`;
  }

  const baselineY = getEqY(assumptions.startingCapital);

  return (
    <div id="backtest-results-container" className="space-y-6">
      {/* Top Headline / Summary Banner */}
      <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              Backtest Simulation Results: {result.strategyName}
            </h3>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-mono">
              {result.symbol} • {result.timeframe}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Executed across {assumptions.totalCandlesEvaluated} candles from {assumptions.dateRange.start} to {assumptions.dateRange.end}. Strictly zero look-ahead bias.
          </p>
        </div>

        {onRerun && (
          <button
            onClick={onRerun}
            className="px-4 py-2 bg-[#1B2537] hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            Re-run Simulation
          </button>
        )}
      </div>

      {/* Top 8 Key Performance Indicator Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Total Trades */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Trades</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {metrics.totalTrades}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {metrics.winningTrades}W / {metrics.losingTrades}L / {metrics.breakevenTrades}BE
          </span>
        </div>

        {/* 2. Win Rate */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Win Rate</span>
          <div className={`text-xl font-bold font-mono mt-1 ${metrics.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.winRate}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Expectancy: ${metrics.expectancy}
          </span>
        </div>

        {/* 3. Profit Factor */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Profit Factor</span>
          <div className={`text-xl font-bold font-mono mt-1 ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : metrics.profitFactor >= 1.0 ? 'text-cyan-400' : 'text-rose-400'}`}>
            {metrics.profitFactor}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Gross W/L Ratio
          </span>
        </div>

        {/* 4. Net Profit */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Net Profit</span>
          <div className={`text-xl font-bold font-mono mt-1 ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit}
          </div>
          <span className={`text-[10px] font-mono mt-0.5 ${metrics.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}% Return
          </span>
        </div>

        {/* 5. Max Drawdown */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Max Drawdown</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            -{metrics.maxDrawdownPercent}%
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            -${metrics.maxDrawdown}
          </span>
        </div>

        {/* 6. Sharpe Ratio */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Sharpe Ratio</span>
          <div className={`text-xl font-bold font-mono mt-1 ${metrics.sharpeRatio >= 1.5 ? 'text-emerald-400' : metrics.sharpeRatio >= 1.0 ? 'text-cyan-400' : 'text-slate-300'}`}>
            {metrics.sharpeRatio}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Sortino: {metrics.sortinoRatio}
          </span>
        </div>

        {/* 7. Average R:R */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Reward:Risk</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            {metrics.avgRR}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Avg Win ${metrics.averageWin}
          </span>
        </div>

        {/* 8. Streaks */}
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Win / Loss Streaks</span>
          <div className="text-xl font-bold font-mono text-slate-100 mt-1">
            <span className="text-emerald-400">{metrics.winningStreak}</span>
            <span className="text-slate-600 mx-1">/</span>
            <span className="text-rose-400">{metrics.losingStreak}</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            Avg Dur: {metrics.avgDurationMinutes}m
          </span>
        </div>
      </div>

      {/* Equity Curve Chart */}
      <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
              Trade-By-Trade Equity Curve
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-slate-400">
              Start: <strong className="text-slate-200">${assumptions.startingCapital.toLocaleString()}</strong>
            </span>
            <span className="text-slate-400">
              Final: <strong className={metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                ${(assumptions.startingCapital + metrics.netProfit).toLocaleString()}
              </strong>
            </span>
          </div>
        </div>

        {/* SVG Curve */}
        <div className="relative w-full h-[220px] bg-[#090E1A] rounded-lg overflow-hidden border border-[#162036]">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Baseline starting capital */}
            <line
              x1={45}
              y1={baselineY}
              x2={svgW - 30}
              y2={baselineY}
              stroke="#334155"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <text x={svgW - 25} y={baselineY + 3} fill="#64748B" fontSize="9" fontFamily="monospace">
              $10k
            </text>

            {/* Shaded Area */}
            {fillPath && <path d={fillPath} fill="url(#eqGradient)" />}

            {/* Equity Curve Line */}
            {curvePath && (
              <path
                d={curvePath}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Trade dots */}
            {equityCurve.map((pt, idx) => {
              if (idx === 0) return null;
              const x = getEqX(idx);
              const y = getEqY(pt.equity);
              return (
                <circle
                  key={`pt-${idx}`}
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#06B6D4"
                  stroke="#090E1A"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tabs navigation for granular views */}
      <div className="border-b border-[#1B2537] flex items-center gap-2">
        <button
          onClick={() => setSelectedTab('trades')}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            selectedTab === 'trades'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Trade Ledger ({trades.length})
        </button>
        <button
          onClick={() => setSelectedTab('monthly')}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            selectedTab === 'monthly'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Monthly Returns Heatmap
        </button>
        <button
          onClick={() => setSelectedTab('blocked')}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            selectedTab === 'blocked'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Blocked Signals Log ({blockedSignalsLog.length})
        </button>
        <button
          onClick={() => setSelectedTab('assumptions')}
          className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all ${
            selectedTab === 'assumptions'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Backtest Assumptions & Audit
        </button>
      </div>

      {/* TAB 1: TRADES LIST */}
      {selectedTab === 'trades' && (
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl overflow-hidden">
          {/* Filter Bar */}
          <div className="px-4 py-3 border-b border-[#1B2537] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Filter Trades:</span>
              {(['ALL', 'WIN', 'LOSS', 'BREAKEVEN'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTradeFilter(f)}
                  className={`px-2.5 py-1 text-xs rounded font-mono ${
                    tradeFilter === f
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Showing {filteredTrades.length} of {trades.length} trades
            </span>
          </div>

          {/* Table */}
          {filteredTrades.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No trades match this filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111A30] text-slate-400 font-semibold border-b border-[#1B2537]">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Date & Time</th>
                    <th className="px-3 py-2.5">Direction</th>
                    <th className="px-3 py-2.5">Entry Price</th>
                    <th className="px-3 py-2.5">Exit Price</th>
                    <th className="px-3 py-2.5">P/L ($)</th>
                    <th className="px-3 py-2.5">R Multiple</th>
                    <th className="px-3 py-2.5">Duration</th>
                    <th className="px-3 py-2.5">Exit Reason</th>
                    <th className="px-3 py-2.5">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162036] font-mono">
                  {filteredTrades.map(trade => {
                    const isExpanded = expandedTradeId === trade.id;
                    const isWin = trade.outcome === 'WIN';
                    const isLoss = trade.outcome === 'LOSS';
                    return (
                      <React.Fragment key={trade.id}>
                        <tr
                          onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                          className={`hover:bg-[#131E38] cursor-pointer transition-colors ${
                            isExpanded ? 'bg-[#131E38]' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5 text-slate-500">{trade.tradeNumber}</td>
                          <td className="px-3 py-2.5 text-slate-300">
                            {new Date(trade.entryTime).toISOString().slice(5, 16).replace('T', ' ')}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                trade.direction === 'BUY'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {trade.direction}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-200">{trade.entryPrice}</td>
                          <td className="px-3 py-2.5 text-slate-200">{trade.exitPrice}</td>
                          <td
                            className={`px-3 py-2.5 font-bold ${
                              isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-300'
                            }`}
                          >
                            {trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                          </td>
                          <td className="px-3 py-2.5 text-slate-300">
                            {trade.rMultiple > 0 ? '+' : ''}{trade.rMultiple}R
                          </td>
                          <td className="px-3 py-2.5 text-slate-400">{trade.durationMinutes}m</td>
                          <td className="px-3 py-2.5 text-slate-400 font-sans text-[11px]">
                            {trade.exitReason.replace(/_/g, ' ')}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWin
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : isLoss
                                  ? 'bg-rose-500/20 text-rose-400'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              {trade.outcome}
                            </span>
                          </td>
                        </tr>

                        {/* Collapsible Details Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#0B101D]">
                            <td colSpan={10} className="p-4 border-t border-b border-[#1B2537]">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                                <div>
                                  <div className="text-slate-400 font-semibold mb-1">Execution Metrics</div>
                                  <div className="space-y-1 font-mono text-slate-300">
                                    <div>Initial Stop Loss: {trade.stopLoss}</div>
                                    <div>Initial Take Profit: {trade.takeProfit}</div>
                                    <div>Position Size: {trade.lots} lots</div>
                                    <div>Spread: {trade.spread} pts | Slip: {trade.slippage} pts</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-400 font-semibold mb-1">Excursion & Timing</div>
                                  <div className="space-y-1 font-mono text-slate-300">
                                    <div>Max Favorable (MFE): +{trade.mfe} pts</div>
                                    <div>Max Adverse (MAE): -{trade.mae} pts</div>
                                    <div>Entry: {new Date(trade.entryTime).toUTCString()}</div>
                                    <div>Exit: {new Date(trade.exitTime).toUTCString()}</div>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-400 font-semibold mb-1">Strategy Rationale</div>
                                  <div className="space-y-1 text-slate-300 text-[11px]">
                                    <div>
                                      <strong>Trigger Conditions:</strong> {trade.entryConditionsMet.join(', ')}
                                    </div>
                                    <div>
                                      <strong>Exit Rationale:</strong> Triggered by {trade.exitReason.replace(/_/g, ' ')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONTHLY RETURNS HEATMAP */}
      {selectedTab === 'monthly' && (
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-4">
            Monthly Performance Breakdown (% Return)
          </h4>

          {years.length === 0 ? (
            <div className="text-xs text-slate-500 py-6 text-center">
              Insufficient trading duration to plot monthly return buckets.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="border-b border-[#1B2537] text-slate-400 font-mono">
                    <th className="text-left py-2 px-3 font-sans">Year</th>
                    {MONTH_NAMES.map(m => (
                      <th key={m} className="py-2 px-2">{m}</th>
                    ))}
                    <th className="py-2 px-3 text-right font-sans">YTD Net</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {years.map(yr => {
                    const yearRecords = monthlyReturns.filter(m => m.year === yr);
                    const ytdPnl = yearRecords.reduce((sum, r) => sum + r.pnl, 0);
                    const ytdPercent = Number(((ytdPnl / assumptions.startingCapital) * 100).toFixed(2));

                    return (
                      <tr key={yr} className="border-b border-[#162036]">
                        <td className="text-left py-3 px-3 text-slate-200 font-bold">{yr}</td>
                        {MONTH_NAMES.map((_, mIdx) => {
                          const record = yearRecords.find(r => r.month === mIdx);
                          if (!record) {
                            return (
                              <td key={mIdx} className="py-3 px-2 text-slate-600">
                                -
                              </td>
                            );
                          }
                          const isPos = record.pnl >= 0;
                          return (
                            <td key={mIdx} className="py-3 px-2">
                              <div
                                className={`rounded px-1 py-1 text-[11px] font-bold ${
                                  isPos
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {isPos ? '+' : ''}{record.returnPercent}%
                              </div>
                            </td>
                          );
                        })}
                        <td
                          className={`text-right py-3 px-3 font-bold ${
                            ytdPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {ytdPercent >= 0 ? '+' : ''}{ytdPercent}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BLOCKED SIGNALS LOG */}
      {selectedTab === 'blocked' && (
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                Blocked Signals Audit Log
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Full transparency ledger: shows technical signals that triggered but were safely vetoed by AI Market Bias, session hours, or news blackout filters.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">
              {blockedSignalsLog.length} Vetoed Setups
            </span>
          </div>

          {blockedSignalsLog.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No signals were blocked by active filters during this backtest window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#111A30] text-slate-400 font-semibold border-b border-[#1B2537]">
                  <tr>
                    <th className="px-3 py-2.5">Time (UTC)</th>
                    <th className="px-3 py-2.5">Direction</th>
                    <th className="px-3 py-2.5">Price</th>
                    <th className="px-3 py-2.5">Veto Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162036] font-mono">
                  {blockedSignalsLog.map((log, idx) => (
                    <tr key={`log-${idx}`} className="hover:bg-[#131E38]">
                      <td className="px-3 py-2 text-slate-400">{log.timeFormatted}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.direction === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {log.direction}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-200">{log.price}</td>
                      <td className="px-3 py-2 font-sans text-amber-300 text-[11px] flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{log.reason}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BACKTEST ASSUMPTIONS */}
      {selectedTab === 'assumptions' && (
        <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5">
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">
            Simulation Specifications & Assumptions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2.5 bg-[#090E1A] p-4 rounded-lg border border-[#162036]">
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Data Feed Source:</span>
                <span className="text-slate-200 font-mono">{assumptions.dataSource}</span>
              </div>
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Execution Policy:</span>
                <span className="text-slate-200 font-mono">{assumptions.executionModel}</span>
              </div>
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Intrabar Conflict Policy:</span>
                <span className="text-slate-200 font-mono">{assumptions.intrabarPolicy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Evaluated Candle Count:</span>
                <span className="text-slate-200 font-mono">{assumptions.totalCandlesEvaluated} bars</span>
              </div>
            </div>

            <div className="space-y-2.5 bg-[#090E1A] p-4 rounded-lg border border-[#162036]">
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Starting Equity:</span>
                <span className="text-slate-200 font-mono">${assumptions.startingCapital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Simulated Spread:</span>
                <span className="text-slate-200 font-mono">{assumptions.spread} points ({assumptions.spreadType})</span>
              </div>
              <div className="flex justify-between border-b border-[#162036] pb-1.5">
                <span className="text-slate-400">Simulated Slippage:</span>
                <span className="text-slate-200 font-mono">{assumptions.slippagePips} pips</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Model:</span>
                <span className="text-slate-200 font-mono">{assumptions.riskPerTrade}% equity per trade</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200/90 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Disclaimer:</strong> Simulated backtest results have inherent limitations. Unlike real-time execution, historical simulations do not reflect potential liquidity droughts or unexpected latency. Past performance is never a guarantee of future returns.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
