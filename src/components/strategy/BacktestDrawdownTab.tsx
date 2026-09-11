import React, { useMemo } from 'react';
import { BacktestResult, EquityPoint } from '../../types';
import { 
  ShieldAlert, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Activity,
  ArrowDownRight,
  Info
} from 'lucide-react';

interface BacktestDrawdownTabProps {
  result: BacktestResult;
}

interface DrawdownEpisode {
  id: number;
  peakTime: number;
  valleyTime: number;
  recoveryTime: number | null;
  depthPercent: number;
  depthDollars: number;
  durationDays: number;
  isRecovered: boolean;
}

export const BacktestDrawdownTab: React.FC<BacktestDrawdownTabProps> = ({ result }) => {
  const { metrics, equityCurve, assumptions, trades } = result;

  // Compute Drawdown Episodes from equity curve
  const episodes: DrawdownEpisode[] = useMemo(() => {
    if (equityCurve.length < 2) return [];

    const list: DrawdownEpisode[] = [];
    let peakEquity = equityCurve[0].equity;
    let peakTime = equityCurve[0].time;
    let valleyEquity = peakEquity;
    let valleyTime = peakTime;
    let inDrawdown = false;

    equityCurve.forEach((pt, idx) => {
      if (pt.equity > peakEquity) {
        if (inDrawdown) {
          // Recovered!
          const depthDollars = peakEquity - valleyEquity;
          const depthPercent = (depthDollars / peakEquity) * 100;
          if (depthPercent > 0.5) {
            list.push({
              id: list.length + 1,
              peakTime,
              valleyTime,
              recoveryTime: pt.time,
              depthPercent: Number(depthPercent.toFixed(2)),
              depthDollars: Number(depthDollars.toFixed(2)),
              durationDays: Math.max(1, Math.round((pt.time - peakTime) / (1000 * 60 * 60 * 24))),
              isRecovered: true
            });
          }
          inDrawdown = false;
        }
        peakEquity = pt.equity;
        peakTime = pt.time;
        valleyEquity = pt.equity;
        valleyTime = pt.time;
      } else if (pt.equity < peakEquity) {
        inDrawdown = true;
        if (pt.equity < valleyEquity) {
          valleyEquity = pt.equity;
          valleyTime = pt.time;
        }
      }
    });

    // If still in drawdown at end of backtest
    if (inDrawdown) {
      const depthDollars = peakEquity - valleyEquity;
      const depthPercent = (depthDollars / peakEquity) * 100;
      if (depthPercent > 0.5) {
        list.push({
          id: list.length + 1,
          peakTime,
          valleyTime,
          recoveryTime: null,
          depthPercent: Number(depthPercent.toFixed(2)),
          depthDollars: Number(depthDollars.toFixed(2)),
          durationDays: Math.max(1, Math.round((Date.now() - peakTime) / (1000 * 60 * 60 * 24))),
          isRecovered: false
        });
      }
    }

    // Sort by largest drawdown depth descending
    return list.sort((a, b) => b.depthPercent - a.depthPercent);
  }, [equityCurve]);

  // SVG Underwater Chart Dimensions
  const svgW = 860;
  const svgH = 220;
  const padL = 55;
  const padR = 25;
  const padT = 20;
  const padB = 30;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;

  const maxDd = Math.max(...equityCurve.map(p => p.drawdown), 5);

  const getX = (idx: number) => {
    if (equityCurve.length <= 1) return padL;
    return padL + (idx / (equityCurve.length - 1)) * chartW;
  };

  const getY = (dd: number) => {
    // 0% at padT (top), maxDd at padT + chartH (bottom)
    return padT + (dd / maxDd) * chartH;
  };

  // Build Underwater Area
  let underwaterPath = '';
  let underwaterFill = '';
  equityCurve.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.drawdown);
    if (idx === 0) {
      underwaterPath += `M ${x} ${y}`;
      underwaterFill += `M ${x} ${padT} L ${x} ${y}`;
    } else {
      underwaterPath += ` L ${x} ${y}`;
      underwaterFill += ` L ${x} ${y}`;
    }
  });

  if (equityCurve.length > 0) {
    const lastX = getX(equityCurve.length - 1);
    underwaterFill += ` L ${lastX} ${padT} Z`;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Drawdown High-Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Max Drawdown (%)</span>
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            -{metrics.maxDrawdownPercent}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            -${metrics.maxDrawdown.toLocaleString()} peak-to-trough
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Longest Losing Streak</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-400">
            {metrics.losingStreak} Trades
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Consecutive losing executions
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Calmar Ratio</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {metrics.calmarRatio || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Annual Return / Max Drawdown
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E1526] border border-[#1E293B]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Drawdown Episodes</span>
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">
            {episodes.length} Episodes
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Significant peak-to-trough events
          </div>
        </div>
      </div>

      {/* 2. Underwater Chart */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Underwater Drawdown Curve
              <span className="text-[10px] font-normal text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                Peak-to-Trough
              </span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks portfolio decline from highest high. 0% indicates new all-time equity high.
            </p>
          </div>
          <span className="text-xs font-mono text-amber-400 font-semibold">
            Peak Drop: -{metrics.maxDrawdownPercent}%
          </span>
        </div>

        <div className="relative w-full overflow-hidden bg-[#090D18] rounded-lg border border-[#162033] p-2">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible select-none">
            <defs>
              <linearGradient id="underwaterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.35" />
              </linearGradient>
            </defs>

            {/* Zero Line (All Time High) */}
            <line
              x1={padL}
              y1={padT}
              x2={padL + chartW}
              y2={padT}
              stroke="#10b981"
              strokeWidth="1.5"
            />
            <text
              x={padL - 8}
              y={padT + 3}
              textAnchor="end"
              fill="#10b981"
              fontSize="9"
              fontFamily="monospace"
            >
              0.0% ATH
            </text>

            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map(ratio => {
              const y = padT + chartH * ratio;
              const val = (ratio * maxDd).toFixed(1);
              return (
                <g key={ratio}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={padL + chartW}
                    y2={y}
                    stroke="#1E293B"
                    strokeDasharray="3,3"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="#64748B"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    -{val}%
                  </text>
                </g>
              );
            })}

            {/* Area and Line */}
            {underwaterFill && <path d={underwaterFill} fill="url(#underwaterGrad)" />}
            {underwaterPath && (
              <path
                d={underwaterPath}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>

      {/* 3. Major Drawdown Episodes Ledger */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-100">Historical Drawdown Episodes</h4>
          <span className="text-xs text-slate-400">Ranked by maximum percentage decline</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#11192E] border-b border-[#1E293B] text-slate-400 font-semibold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Peak Date</th>
                <th className="py-2.5 px-3">Trough / Valley</th>
                <th className="py-2.5 px-3">Recovery Date</th>
                <th className="py-2.5 px-3">Drawdown Depth</th>
                <th className="py-2.5 px-3">Loss ($)</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {episodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No major drawdown episodes detected on evaluated historical interval.
                  </td>
                </tr>
              ) : (
                episodes.slice(0, 8).map((ep, idx) => (
                  <tr key={ep.id} className="hover:bg-[#131B2E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">#{idx + 1}</td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {new Date(ep.peakTime).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {new Date(ep.valleyTime).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {ep.recoveryTime ? new Date(ep.recoveryTime).toLocaleDateString() : 'Unrecovered'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                      -{ep.depthPercent}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-rose-400 font-semibold">
                      -${ep.depthDollars.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-mono">
                      {ep.durationDays} days
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        ep.isRecovered 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {ep.isRecovered ? 'RECOVERED' : 'ACTIVE'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
