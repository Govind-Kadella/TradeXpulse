import React from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ShieldAlert, 
  Gauge, 
  PieChart, 
  Compass,
  Activity,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { AiInsightsService } from '../../services/aiInsightsService';

export const AiInsightsWorkspace: React.FC = () => {
  const insightsService = AiInsightsService.getInstance();
  const contextList = insightsService.getMarketContext();
  const macroDrivers = insightsService.getMacroDrivers();
  const upcomingRisks = insightsService.getUpcomingRisks();

  const getBiasBadge = (bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    switch (bias) {
      case 'BULLISH':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3 h-3" /> Bullish
          </span>
        );
      case 'BEARISH':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <TrendingDown className="w-3 h-3" /> Bearish
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-500/20 text-slate-300 border border-slate-500/30">
            <Minus className="w-3 h-3" /> Neutral
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0C1425] via-[#0F1B33] to-[#0A1120] border border-cyan-500/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              TradeXpulse AI Macro Insights
            </h2>
            <p className="text-xs text-slate-400">
              Cross-asset macro synthesis, central bank policy divergence, and tactical systemic risk matrices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/30">
            Engine: Institutional Macro LLM
          </span>
        </div>
      </div>

      {/* 1. Market Context By Asset / Currency */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Macro Context by Currency / Asset</span>
          </h3>
          <span className="text-[11px] text-slate-500 italic">Updated continuously from news and calendar feeds</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {contextList.map((ctx) => (
            <div
              key={ctx.currency}
              className="p-4 rounded-xl bg-[#0B101D] hover:bg-[#0E1526] border border-[#1B2537] hover:border-cyan-500/40 transition-all flex flex-col justify-between gap-3 shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black font-mono text-white tracking-wide">
                      {ctx.currency}
                    </span>
                    {ctx.symbol && (
                      <span className="text-xs font-mono text-cyan-400 bg-blue-600/20 px-1.5 py-0.2 rounded border border-blue-500/30">
                        {ctx.symbol}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getBiasBadge(ctx.bias)}
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans mb-3">
                  {ctx.catalystSummary}
                </p>

                {/* Key Drivers */}
                <div className="space-y-1.5 pt-2 border-t border-[#1B2537]">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                    Key Drivers:
                  </span>
                  {ctx.keyDrivers.slice(0, 2).map((drv, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-cyan-400 shrink-0">•</span>
                      <span className="truncate">{drv}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer: Transmission instruments */}
              <div className="pt-2 border-t border-[#1B2537] flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">Confidence: {ctx.confidence}%</span>
                <div className="flex items-center gap-1">
                  {ctx.affectedInstruments.map((inst) => (
                    <span key={inst} className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#131E35] text-cyan-300">
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Macro Drivers & Systemic Risks Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Macro Drivers (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <PieChart className="w-3.5 h-3.5 text-cyan-400" />
            <span>Core Macro Drivers & Weightings</span>
          </h3>

          <div className="space-y-3">
            {macroDrivers.map((item) => (
              <div key={item.id} className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{item.driver}</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">{item.weightPercent}% weight</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[#1A263D] overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${item.weightPercent}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-400 leading-normal">
                  {item.impacts}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Systemic Risks (6 cols) */}
        <div className="lg:col-span-6 p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Upcoming Macro Risk Events</span>
          </h3>

          <div className="space-y-3">
            {upcomingRisks.map((risk) => (
              <div key={risk.id} className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{risk.title}</span>
                  <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border uppercase ${
                    risk.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {risk.severity} RISK
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal">
                  {risk.description}
                </p>

                <div className="pt-1.5 border-t border-[#1B2537]/60 flex items-start gap-1 text-[11px] text-cyan-300">
                  <span className="font-bold font-mono text-[10px] text-slate-400 shrink-0 uppercase">Mitigation:</span>
                  <span>{risk.tacticalMitigation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
