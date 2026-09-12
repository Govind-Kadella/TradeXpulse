import React, { useState } from 'react';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart2, 
  Clock, 
  Bell, 
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { EconomicEvent, MarketSymbol } from '../../types';
import { formatCountdown } from '../../utils/timeUtils';

interface EventAnalysisWorkspaceProps {
  events: EconomicEvent[];
  selectedEvent: EconomicEvent | null;
  onSelectEvent: (event: EconomicEvent) => void;
  onOpenAlertModal: (event: EconomicEvent) => void;
  hasAlert: boolean;
}

export const EventAnalysisWorkspace: React.FC<EventAnalysisWorkspaceProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onOpenAlertModal,
  hasAlert,
}) => {
  const currentEvent = selectedEvent || events[0];
  const [simulationScenario, setSimulationScenario] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('BULLISH');

  if (!currentEvent) {
    return (
      <div className="p-12 text-center text-slate-500 bg-[#0B101D] rounded-xl border border-[#1B2537]">
        No event available for analysis.
      </div>
    );
  }

  const countdown = formatCountdown(currentEvent.timestamp);

  // Volatility estimates based on impact
  const volatilityPips = currentEvent.impact === 'HIGH' 
    ? { immediate15m: '45-85 pips', extended4h: '90-160 pips', goldDollar: '$18.00 - $35.00' }
    : currentEvent.impact === 'MEDIUM'
    ? { immediate15m: '20-35 pips', extended4h: '35-65 pips', goldDollar: '$8.00 - $16.00' }
    : { immediate15m: '8-15 pips', extended4h: '15-25 pips', goldDollar: '$3.00 - $7.00' };

  return (
    <div className="flex flex-col gap-5">
      {/* Top Event Switcher Bar */}
      <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl shrink-0">
            {currentEvent.flag}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {currentEvent.currency}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold uppercase">
                {currentEvent.impact} IMPACT
              </span>
              <span className="text-xs font-mono text-slate-400">
                {currentEvent.date} {currentEvent.timeUtc} UTC
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
              {currentEvent.event}
            </h2>
          </div>
        </div>

        {/* Event Select Dropdown */}
        <div className="relative self-start sm:self-auto min-w-[240px]">
          <select
            value={currentEvent.id}
            onChange={(e) => {
              const found = events.find(ev => ev.id === e.target.value);
              if (found) onSelectEvent(found);
            }}
            className="w-full appearance-none bg-[#111A2B] hover:bg-[#152033] border border-[#1B2537] text-xs font-medium text-slate-200 pl-3 pr-8 py-2 rounded-lg cursor-pointer outline-none focus:border-cyan-500/50"
          >
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.flag} {evt.currency} - {evt.event}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* 2-Column Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Historical Volatility & Instrument Transmission */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Volatility Metrics Box */}
          <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Historical Volatility Transmission</span>
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 font-mono block">15m Window</span>
                <span className="text-sm font-mono font-bold text-cyan-300 mt-1 block">
                  {volatilityPips.immediate15m}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">FX Pairs</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 font-mono block">4-Hour Horizon</span>
                <span className="text-sm font-mono font-bold text-amber-300 mt-1 block">
                  {volatilityPips.extended4h}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Trend continuation</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537]">
                <span className="text-[10px] text-slate-400 font-mono block">Gold (XAUUSD)</span>
                <span className="text-sm font-mono font-bold text-emerald-400 mt-1 block">
                  {volatilityPips.goldDollar}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Expected range</span>
              </div>
            </div>

            {/* Affected TradeXpulse Instruments */}
            <div className="pt-2 border-t border-[#1B2537]/80">
              <h4 className="text-xs font-bold text-slate-300 mb-2">
                Monitored TradeXpulse Watchlist Pairs
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {currentEvent.affectedInstruments.map(inst => (
                  <div key={inst} className="p-2.5 rounded-lg bg-[#111C30] border border-cyan-500/25 flex flex-col">
                    <span className="text-xs font-mono font-black text-cyan-300">{inst}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Transmission: Direct</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Scenario Simulator */}
          <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Macro Reaction Scenario Simulator</span>
              </h3>
            </div>

            {/* Scenario Toggles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSimulationScenario('BULLISH')}
                className={`p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simulationScenario === 'BULLISH'
                    ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-[#0E1626] text-slate-400 hover:text-white border border-[#1B2537]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bullish {currentEvent.currency}</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulationScenario('BEARISH')}
                className={`p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simulationScenario === 'BEARISH'
                    ? 'bg-red-600/25 text-red-300 border border-red-500/50 shadow-sm'
                    : 'bg-[#0E1626] text-slate-400 hover:text-white border border-[#1B2537]'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <span>Bearish {currentEvent.currency}</span>
              </button>

              <button
                type="button"
                onClick={() => setSimulationScenario('NEUTRAL')}
                className={`p-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  simulationScenario === 'NEUTRAL'
                    ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50 shadow-sm'
                    : 'bg-[#0E1626] text-slate-400 hover:text-white border border-[#1B2537]'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-blue-400" />
                <span>Consensus / Neutral</span>
              </button>
            </div>

            {/* Scenario Output Card */}
            <div className="p-3.5 rounded-lg bg-[#0A101D] border border-[#1B2537] space-y-2">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Simulated Market Response Mechanics:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {simulationScenario === 'BULLISH'
                  ? currentEvent.aiAnalysis?.bullishScenario || `Upside surprise drives immediate capital allocation towards ${currentEvent.currency}, pressuring inversely correlated risk assets.`
                  : simulationScenario === 'BEARISH'
                  ? currentEvent.aiAnalysis?.bearishScenario || `Downside disappointment prompts prompt liquidation of ${currentEvent.currency} holdings, benefiting safe-havens like XAUUSD.`
                  : currentEvent.aiAnalysis?.neutralScenario || `Figures in-line with consensus expectations maintain current channel ranges with standard algorithmic mean-reversion.`}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): AI Intelligence & Event Blueprint */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* AI Analysis Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#0D1629] to-[#0A0F1D] border border-cyan-500/30 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>TradeXpulse AI Analysis Breakdown</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                Score: {currentEvent.marketImpactScore}/100
              </span>
            </div>

            {currentEvent.aiAnalysis && (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-mono font-bold text-blue-400 uppercase text-[10px] tracking-wider block">
                    1. Verified Historical Fact
                  </span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{currentEvent.aiAnalysis.fact}</p>
                </div>

                <div>
                  <span className="font-mono font-bold text-amber-400 uppercase text-[10px] tracking-wider block">
                    2. Institutional Interpretation
                  </span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{currentEvent.aiAnalysis.interpretation}</p>
                </div>
              </div>
            )}

            {/* Quick Set Alert Action */}
            <div className="pt-3 border-t border-[#1F2D44] flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                T-minus {countdown}
              </span>
              <button
                onClick={() => onOpenAlertModal(currentEvent)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  hasAlert
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'bg-blue-600/25 hover:bg-blue-600/35 text-cyan-300 border border-blue-500/40'
                }`}
              >
                <Bell className={`w-3 h-3 ${hasAlert ? 'fill-amber-400' : ''}`} />
                <span>{hasAlert ? 'Alert Active' : 'Set Notification'}</span>
              </button>
            </div>
          </div>

          {/* Description & Impact Rules */}
          <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Event Specification
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentEvent.description}
            </p>
            {currentEvent.historicalImportance && (
              <div className="p-2.5 rounded-lg bg-[#0E1626] border border-[#1B2537] text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-300 block mb-0.5">Precedent:</span>
                {currentEvent.historicalImportance}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
