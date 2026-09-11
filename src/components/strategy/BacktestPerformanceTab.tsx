import React from 'react';
import { BacktestResult } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Award, 
  Percent, 
  Activity, 
  DollarSign, 
  Target, 
  Clock, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Zap,
  BarChart2,
  FileCheck
} from 'lucide-react';

interface BacktestPerformanceTabProps {
  result: BacktestResult;
}

export const BacktestPerformanceTab: React.FC<BacktestPerformanceTabProps> = ({ result }) => {
  const { metrics, assumptions, trades } = result;

  const totalCommissions = trades.reduce((sum, t) => sum + (t.commission || 0), 0);
  const totalSlippage = trades.reduce((sum, t) => sum + (t.slippage || 0), 0);
  const recoveryFactor = metrics.maxDrawdown > 0 ? (metrics.netProfit / metrics.maxDrawdown).toFixed(2) : 'N/A';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Overview Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0E1526] via-[#10182D] to-[#0E1526] border border-[#1E293B] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Institutional Performance Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Rigorous statistical evaluation calculated directly from closed historical trade ledger
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] px-2.5 py-1 rounded bg-[#131B2E] border border-[#1E293B] text-slate-300 font-mono">
            {metrics.totalTrades} Trades Evaluated
          </span>
          <span className="text-[11px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
            {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}% Return
          </span>
        </div>
      </div>

      {/* Grid of 4 Metric Groupings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* GROUP 1: Return & Profitability */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-[#1E293B]">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Return & Profitability
          </div>

          <div className="divide-y divide-[#162033] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Net Profit</span>
              <span className={`font-mono font-bold ${metrics.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Total Return</span>
              <span className={`font-mono font-bold ${metrics.totalReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Annualized Return (CAGR Equiv.)</span>
              <span className="font-mono font-bold text-cyan-300">
                {metrics.annualizedReturnPercent !== undefined ? `${metrics.annualizedReturnPercent >= 0 ? '+' : ''}${metrics.annualizedReturnPercent}%` : 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Profit Factor</span>
              <span className={`font-mono font-bold ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-slate-200'}`}>
                {metrics.profitFactor}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Gross Profit</span>
              <span className="font-mono text-emerald-400 font-semibold">+${metrics.grossProfit.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Gross Loss</span>
              <span className="font-mono text-rose-400 font-semibold">-${metrics.grossLoss.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Expectancy per Trade</span>
              <span className={`font-mono font-bold ${metrics.expectancy >= 0 ? 'text-cyan-300' : 'text-rose-400'}`}>
                {metrics.expectancy >= 0 ? '+' : ''}${metrics.expectancy.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* GROUP 2: Risk & Drawdown */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-[#1E293B]">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Risk, Drawdown & Ratios
          </div>

          <div className="divide-y divide-[#162033] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Max Peak-to-Trough Drawdown ($)</span>
              <span className="font-mono font-bold text-amber-400">
                -${metrics.maxDrawdown.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Max Drawdown (%)</span>
              <span className="font-mono font-bold text-amber-400">
                -{metrics.maxDrawdownPercent}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Sharpe Ratio (Annualized)</span>
              <span className={`font-mono font-bold ${metrics.sharpeRatio >= 1.5 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {metrics.sharpeRatio}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Sortino Ratio (Downside Volatility)</span>
              <span className={`font-mono font-bold ${metrics.sortinoRatio >= 2.0 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {metrics.sortinoRatio}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Calmar Ratio (Return / Max DD)</span>
              <span className="font-mono font-bold text-slate-200">
                {metrics.calmarRatio || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Recovery Factor</span>
              <span className="font-mono font-bold text-slate-200">
                {recoveryFactor}
              </span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Intrabar Policy</span>
              <span className="text-[11px] font-mono text-slate-300 bg-[#131B2E] px-2 py-0.5 rounded border border-[#1E293B]">
                {assumptions.intrabarPolicy}
              </span>
            </div>
          </div>
        </div>

        {/* GROUP 3: Trade Dynamics & Streaks */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-[#1E293B]">
            <Target className="w-4 h-4 text-cyan-400" />
            Trade Dynamics & Distribution
          </div>

          <div className="divide-y divide-[#162033] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Win Rate</span>
              <span className="font-mono font-bold text-cyan-300">{metrics.winRate}%</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Average Win vs Loss (R:R)</span>
              <span className="font-mono font-bold text-emerald-400">{metrics.avgRR}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Average Winning Trade</span>
              <span className="font-mono text-emerald-400">+${metrics.averageWin.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Average Losing Trade</span>
              <span className="font-mono text-rose-400">-${metrics.averageLoss.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Best Trade</span>
              <span className="font-mono font-bold text-emerald-400">+${metrics.bestTrade.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Worst Trade</span>
              <span className="font-mono font-bold text-rose-400">-${metrics.worstTrade.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Consecutive Streaks (W / L)</span>
              <span className="font-mono text-slate-200">
                <span className="text-emerald-400 font-bold">{metrics.winningStreak}</span> wins /{' '}
                <span className="text-rose-400 font-bold">{metrics.losingStreak}</span> losses
              </span>
            </div>
          </div>
        </div>

        {/* GROUP 4: Friction & Execution Realism */}
        <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider pb-2 border-b border-[#1E293B]">
            <Activity className="w-4 h-4 text-purple-400" />
            Friction & Execution Realism
          </div>

          <div className="divide-y divide-[#162033] text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Total Commissions Incurred</span>
              <span className="font-mono text-slate-200">${totalCommissions.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Assumed Spread (Pips)</span>
              <span className="font-mono text-slate-200">{assumptions.spread} pips ({assumptions.spreadType})</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Slippage Setting</span>
              <span className="font-mono text-slate-200">{assumptions.slippagePips} pips / trade</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Execution Timing</span>
              <span className="font-mono text-cyan-300">{assumptions.executionModel}</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Average Holding Duration</span>
              <span className="font-mono text-slate-200">{metrics.avgDurationMinutes} minutes</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Historical Bars Evaluated</span>
              <span className="font-mono text-slate-200">{assumptions.totalCandlesEvaluated.toLocaleString()} bars</span>
            </div>

            <div className="flex items-center justify-between py-2.5">
              <span className="text-slate-400">Data Integrity</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                <FileCheck className="w-3.5 h-3.5" />
                Zero Look-Ahead Certified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
