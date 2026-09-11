import React, { useState } from 'react';
import { BacktestResult } from '../../types';
import { 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  Copy, 
  Check, 
  Settings, 
  DollarSign, 
  Clock, 
  Layers, 
  Code
} from 'lucide-react';

interface BacktestAssumptionsTabProps {
  result: BacktestResult;
  onEditSettings?: () => void;
}

export const BacktestAssumptionsTab: React.FC<BacktestAssumptionsTabProps> = ({
  result,
  onEditSettings
}) => {
  const { assumptions, blockedSignalsLog, strategyName, symbol, timeframe } = result;
  const [copied, setCopied] = useState(false);

  const handleCopyAudit = () => {
    const auditData = {
      strategyName,
      symbol,
      timeframe,
      assumptions,
      metricsSummary: result.metrics
    };
    navigator.clipboard.writeText(JSON.stringify(auditData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Core Assumptions Disclosure */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E293B]">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Simulation Model & Methodology Assumptions
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Full disclosure of fill physics, slippage models, spread assumptions, and timing constraints
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onEditSettings && (
              <button
                onClick={onEditSettings}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400" />
                Edit Settings
              </button>
            )}
            <button
              onClick={handleCopyAudit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? 'Copied JSON' : 'Export Audit'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Item 1 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Data Source & Candlestick Feed</div>
            <div className="text-slate-100 font-semibold text-xs">{assumptions.dataSource}</div>
            <div className="text-[11px] text-slate-500 font-mono">
              {assumptions.totalCandlesEvaluated.toLocaleString()} bars ({assumptions.dateRange?.start} to {assumptions.dateRange?.end})
            </div>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Execution Timing Model</div>
            <div className="text-cyan-300 font-mono font-bold text-xs">{assumptions.executionModel}</div>
            <div className="text-[11px] text-slate-500">
              Evaluates condition on bar close [i-1], enters on next bar open [i].
            </div>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Intrabar Ambiguity Policy</div>
            <div className="text-amber-400 font-mono font-bold text-xs">{assumptions.intrabarPolicy}</div>
            <div className="text-[11px] text-slate-500">
              If both TP and SL are within candle range, assumes Stop Loss was hit first.
            </div>
          </div>

          {/* Item 4 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Spread & Slippage Models</div>
            <div className="text-slate-200 font-mono font-semibold text-xs">
              {assumptions.spread} pips ({assumptions.spreadType}) / {assumptions.slippagePips} pips slip
            </div>
            <div className="text-[11px] text-slate-500">
              Simulates realistic market order execution latency and bid/ask friction.
            </div>
          </div>

          {/* Item 5 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Commission Structure</div>
            <div className="text-slate-200 font-mono font-semibold text-xs">
              ${assumptions.commission} per trade ({assumptions.commissionType})
            </div>
            <div className="text-[11px] text-slate-500">
              Institutional broker fee deducted from net account balance at trade close.
            </div>
          </div>

          {/* Item 6 */}
          <div className="p-3.5 rounded-lg bg-[#131B2E] border border-[#1E293B] space-y-1">
            <div className="text-slate-400 font-medium">Risk & Capital Allocation</div>
            <div className="text-emerald-400 font-mono font-bold text-xs">
              ${assumptions.startingCapital.toLocaleString()} initial ({assumptions.riskPerTrade}% risk / trade)
            </div>
            <div className="text-[11px] text-slate-500">
              Lot size dynamically sized by stop loss distance relative to equity balance.
            </div>
          </div>
        </div>
      </div>

      {/* 2. Blocked Signals Log (News, Session & AI Filters) */}
      <div className="p-5 rounded-xl bg-[#0E1526] border border-[#1E293B] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Safety Filter Execution Log ({blockedSignalsLog.length} Blocked Signals)
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Trading signals that met technical triggers but were suppressed by active risk filters
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#11192E] border-b border-[#1E293B] text-slate-400 font-semibold">
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3">Trigger Price</th>
                <th className="py-2.5 px-3">Suppression Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {blockedSignalsLog.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    No signals were filtered out by active news, session, or AI bias constraints.
                  </td>
                </tr>
              ) : (
                blockedSignalsLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[#131B2E] transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {log.timeFormatted || new Date(log.time).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.direction === 'BUY'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}>
                        {log.direction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-200">
                      {log.price}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded text-[11px] border border-amber-500/20">
                        {log.reason}
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
