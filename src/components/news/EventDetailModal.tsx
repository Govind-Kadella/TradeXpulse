import React, { useEffect } from 'react';
import { 
  X, 
  Clock, 
  Bell, 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Info
} from 'lucide-react';
import { EconomicEvent } from '../../types';
import { formatCountdown } from '../../utils/timeUtils';

interface EventDetailModalProps {
  event: EconomicEvent | null;
  onClose: () => void;
  onOpenAlertModal: (event: EconomicEvent) => void;
  hasAlert: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onOpenAlertModal,
  hasAlert,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const countdown = formatCountdown(event.timestamp);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#0D1424] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1B2537] bg-[#0A0F1D] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#141E34] border border-blue-500/30 flex items-center justify-center text-2xl shrink-0">
              {event.flag}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#152238] text-cyan-300 border border-cyan-500/30">
                  {event.currency}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                  event.impact === 'HIGH' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                    : event.impact === 'MEDIUM' 
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {event.impact} IMPACT
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 leading-tight">
                {event.event}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#152033] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Timing & Market Impact Score Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#090E1A] border border-[#1B2537]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Scheduled (UTC)</span>
              <div className="text-xs font-mono font-bold text-slate-100 mt-0.5">
                {event.date} {event.timeUtc}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Time Remaining</span>
              <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{countdown}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Impact Score</span>
              <div className="text-xs font-mono font-bold text-amber-400 mt-0.5">
                {event.marketImpactScore} / 100
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Volatility Expectation</span>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {event.expectedVolatility}
              </div>
            </div>
          </div>

          {/* Key Macro Release Figures */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              Release Metrics
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#111A2B] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 block">Actual</span>
                <span className="text-sm font-mono font-black text-slate-100 mt-0.5 block">
                  {event.actual || '--'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#111A2B] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 block">Forecast</span>
                <span className="text-sm font-mono font-black text-slate-300 mt-0.5 block">
                  {event.forecast || '--'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#111A2B] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 block">Previous</span>
                <span className="text-sm font-mono font-black text-slate-300 mt-0.5 block">
                  {event.previous || '--'}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Historical Importance */}
          <div className="space-y-3">
            <div>
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                Official Description
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed bg-[#0E1626] p-3 rounded-lg border border-[#1B2537]">
                {event.description}
              </p>
            </div>

            {event.historicalImportance && (
              <div>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 font-mono">
                  Historical Market Precedent
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed bg-[#0E1626] p-3 rounded-lg border border-[#1B2537]">
                  {event.historicalImportance}
                </p>
              </div>
            )}
          </div>

          {/* Affected TradeXpulse Instruments */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Affected TradeXpulse Instruments
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {event.affectedInstruments.map((inst) => (
                <div 
                  key={inst}
                  className="px-3 py-1.5 rounded-lg bg-[#111C30] border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{inst}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 italic">
              Potential transmission channels through currency valuation shifts. Not a guaranteed directional outcome.
            </p>
          </div>

          {/* AI Analysis (Strict Fact vs Interpretation vs Scenario Separation) */}
          {event.aiAnalysis && (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#0E182A] to-[#0A101C] border border-cyan-500/25 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <BarChart3 className="w-4 h-4" />
                <span>TradeXpulse AI Analysis</span>
              </div>

              {/* FACT */}
              <div className="text-xs">
                <span className="font-mono font-bold text-blue-400 uppercase text-[10px] tracking-wider block">
                  FACTUAL CONTEXT
                </span>
                <p className="text-slate-300 mt-0.5 text-xs leading-relaxed">{event.aiAnalysis.fact}</p>
              </div>

              {/* INTERPRETATION */}
              <div className="text-xs">
                <span className="font-mono font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                  ANALYST INTERPRETATION
                </span>
                <p className="text-slate-300 mt-0.5 text-xs leading-relaxed">{event.aiAnalysis.interpretation}</p>
              </div>

              {/* SCENARIOS */}
              <div className="pt-2 border-t border-[#1F2C40] space-y-2">
                <span className="font-mono font-bold text-slate-400 uppercase text-[10px] tracking-wider block">
                  POTENTIAL REACTION SCENARIOS (Non-Guaranteed)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                    <span className="font-bold flex items-center gap-1 text-[11px] mb-1">
                      <TrendingUp className="w-3 h-3" /> Bullish Scenario
                    </span>
                    <p className="text-[11px] text-slate-300 leading-normal">{event.aiAnalysis.bullishScenario}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-300">
                    <span className="font-bold flex items-center gap-1 text-[11px] mb-1">
                      <TrendingDown className="w-3 h-3" /> Bearish Scenario
                    </span>
                    <p className="text-[11px] text-slate-300 leading-normal">{event.aiAnalysis.bearishScenario}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 border-t border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between">
          <button
            onClick={() => onOpenAlertModal(event)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              hasAlert
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${hasAlert ? 'fill-amber-400' : ''}`} />
            <span>{hasAlert ? 'Alert Configured' : 'Set Event Alert'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#152033] hover:bg-[#1B2942] text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
