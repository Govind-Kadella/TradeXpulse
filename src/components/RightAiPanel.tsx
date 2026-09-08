import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { BiasType } from '../types';
import { 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle, 
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  Gauge,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const RightAiPanel: React.FC = () => {
  const {
    activeSymbol,
    prediction,
    activeBias,
    setBias,
    isAnalyzing,
    triggerAiAnalysis,
    marketOverview,
    setView,
    stageTradeFromPrediction
  } = usePredictionState();

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopySetup = () => {
    const text = `TradeXpulse AI Market Analysis [${activeSymbol}]
Direction: ${prediction.direction}
Confidence: ${prediction.confidence}/100
Expected Movement: ${prediction.expectedMovement}
Setup: ${prediction.orderType}
Entry Zone: ${prediction.entryZone.text}
Stop Loss: ${prediction.stopLoss.toFixed(marketOverview.digits)}
TP1: ${prediction.tp1.toFixed(marketOverview.digits)} | TP2: ${prediction.tp2.toFixed(marketOverview.digits)} | TP3: ${prediction.tp3.toFixed(marketOverview.digits)}
Risk/Reward: ${prediction.riskReward}
Invalidation: ${prediction.invalidation}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isNoTrade = prediction.direction === 'NO TRADE';
  const isBullish = prediction.direction === 'BULLISH';
  const isBearish = prediction.direction === 'BEARISH';

  return (
    <aside 
      className="w-full bg-[#0E1421] border-l border-[#1F2937] flex flex-col h-full overflow-y-auto select-none font-sans"
      id="right-ai-panel"
    >
      {/* 1. Panel Header: TRADEXPULSE AI & Status: ● ONLINE */}
      <div className="p-3.5 border-b border-[#1F2937] flex items-center justify-between bg-[#121929] sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-400">
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-black tracking-wider text-white uppercase">
            TRADEXPULSE AI
          </span>
        </div>
        
        {/* Status: ● ONLINE and Copy Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#0A0E17] border border-[#1F2937] px-2 py-0.5 rounded-full text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-400 uppercase tracking-wider">ONLINE</span>
          </div>
          <button
            onClick={handleCopySetup}
            title="Copy structured setup to clipboard"
            className="p-1 rounded bg-[#1D283D] hover:bg-[#26354f] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5 flex-1">
        {/* Scenario Tester / Simulator Switcher */}
        <div className="bg-[#0A0E17] p-1 rounded-lg border border-[#1F2937]">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BULLISH')}
              className={`py-1.5 px-2 rounded text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'BULLISH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              BULLISH
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BEARISH')}
              className={`py-1.5 px-2 rounded text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'BEARISH'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              BEARISH
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'NO TRADE')}
              className={`py-1.5 px-2 rounded text-[11px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'NO TRADE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
              }`}
            >
              <MinusCircle className="w-3 h-3" />
              NO TRADE
            </button>
          </div>
        </div>

        {/* ==================================================
            SECTION 1: AI MARKET ANALYSIS
           ================================================== */}
        <div className="bg-[#121929] border border-[#1F2937] rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              AI MARKET ANALYSIS
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {prediction.symbol} • M5
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Direction */}
            <div className="bg-[#0A0E17] border border-[#1F2937] rounded p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Direction
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isBullish && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                {isBearish && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                {isNoTrade && <MinusCircle className="w-3.5 h-3.5 text-amber-400" />}
                <span className={`text-xs font-black font-mono tracking-wide ${
                  isBullish ? 'text-emerald-400' : isBearish ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {prediction.direction}
                </span>
              </div>
            </div>

            {/* Confidence */}
            <div className="bg-[#0A0E17] border border-[#1F2937] rounded p-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Confidence
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xs font-black font-mono text-white">
                  {prediction.confidence}/100
                </span>
                <span className={`text-[10px] font-bold ${
                  prediction.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {prediction.confidence >= 80 ? 'HIGH' : 'MODERATE'}
                </span>
              </div>
            </div>
          </div>

          {/* Expected Movement */}
          <div className="bg-[#0A0E17] border border-[#1F2937] rounded p-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
              Expected Movement
            </span>
            <span className={`text-xs font-mono font-bold ${
              isBullish ? 'text-emerald-400' : isBearish ? 'text-red-400' : 'text-slate-300'
            }`}>
              {prediction.expectedMovement}
            </span>
          </div>
        </div>

        {/* Evidence Scoring Section */}
        {prediction.evidenceScoring && (
          <div className="bg-[#121929] border border-[#1F2937] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#1F2937] pb-1.5">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
                EVIDENCE SCORING
              </span>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                prediction.evidenceScoring.confluenceMet
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {prediction.evidenceScoring.confluenceMet ? 'CONFLUENCE MET' : 'NO CONFLUENCE'}
              </span>
            </div>

            {/* Score Bars */}
            <div className="space-y-1.5 text-[11px] font-mono">
              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="text-emerald-400 font-bold">Bullish Evidence</span>
                  <span className="text-white">{prediction.evidenceScoring.bullishEvidenceScore}/100</span>
                </div>
                <div className="w-full bg-[#0A0E17] h-1.5 rounded-full overflow-hidden border border-[#1F2937]">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${prediction.evidenceScoring.bullishEvidenceScore}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-0.5">
                  <span className="text-rose-400 font-bold">Bearish Evidence</span>
                  <span className="text-white">{prediction.evidenceScoring.bearishEvidenceScore}/100</span>
                </div>
                <div className="w-full bg-[#0A0E17] h-1.5 rounded-full overflow-hidden border border-[#1F2937]">
                  <div 
                    className="bg-rose-500 h-full rounded-full transition-all"
                    style={{ width: `${prediction.evidenceScoring.bearishEvidenceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Conflict warning if present */}
            {prediction.evidenceScoring.conflictWarning && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{prediction.evidenceScoring.conflictWarning}</span>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            SECTION 2: PRIMARY SETUP (OR NO TRADE STATE)
           ================================================== */}
        <div className={`rounded-lg border p-3 space-y-2.5 ${
          isNoTrade 
            ? 'bg-amber-500/5 border-amber-500/20' 
            : isBullish
            ? 'bg-blue-500/5 border-blue-500/25'
            : 'bg-red-500/5 border-red-500/25'
        }`}>
          <div className="flex items-center justify-between border-b border-[#1F2937]/80 pb-1.5">
            <span className={`text-[10px] font-black tracking-widest uppercase ${
              isNoTrade ? 'text-amber-400' : isBullish ? 'text-blue-400' : 'text-red-400'
            }`}>
              PRIMARY SETUP
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              isNoTrade 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : isBullish 
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                : 'bg-red-500/20 text-red-300 border-red-500/30'
            }`}>
              {prediction.orderType}
            </span>
          </div>

          {!isNoTrade ? (
            <>
              {/* Entry Zone & Stop Loss */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#0A0E17]/80 p-2 rounded border border-[#1F2937]">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Entry Zone</div>
                  <div className="font-mono font-bold text-white text-xs mt-0.5">
                    {prediction.entryZone.text}
                  </div>
                </div>
                <div className="bg-[#0A0E17]/80 p-2 rounded border border-[#1F2937]">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Stop Loss</div>
                  <div className="font-mono font-bold text-red-400 text-xs mt-0.5">
                    {prediction.stopLoss.toFixed(marketOverview.digits)}
                  </div>
                </div>
              </div>

              {/* TP1, TP2, TP3 */}
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <div className="bg-[#0A0E17]/80 p-1.5 rounded border border-[#1F2937]">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">TP1</div>
                  <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                    {prediction.tp1.toFixed(marketOverview.digits)}
                  </div>
                </div>
                <div className="bg-[#0A0E17]/80 p-1.5 rounded border border-[#1F2937]">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">TP2</div>
                  <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                    {prediction.tp2.toFixed(marketOverview.digits)}
                  </div>
                </div>
                <div className="bg-[#0A0E17]/80 p-1.5 rounded border border-[#1F2937]">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">TP3</div>
                  <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                    {prediction.tp3.toFixed(marketOverview.digits)}
                  </div>
                </div>
              </div>

              {/* Risk / Reward */}
              <div className="flex items-center justify-between bg-[#0A0E17]/80 px-2.5 py-1.5 rounded border border-[#1F2937] text-xs">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Risk / Reward</span>
                <span className="font-mono font-black text-blue-400">
                  {prediction.riskReward}
                </span>
              </div>

              {/* Stage Trade in Execution Engine Action */}
              <button
                type="button"
                onClick={() => {
                  stageTradeFromPrediction();
                  setView('execution');
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(59,130,246,0.3)] cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Stage Setup in Execution Ticket
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </>
          ) : (
            /* Requirement 7: NO TRADE fully supported state */
            <div className="space-y-2 text-xs">
              <div className="bg-[#0A0E17]/80 p-2.5 rounded border border-amber-500/20 space-y-1">
                <div className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Reason for No Trade:
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {prediction.noTradeReason || 'Unclear market structure, equilibrium compression, and conflicting momentum across timeframes.'}
                </p>
              </div>
              <div className="bg-[#0A0E17]/80 p-2.5 rounded border border-[#1F2937] space-y-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-blue-400" />
                  Waiting Condition:
                </div>
                <p className="text-[11px] text-slate-300 leading-snug font-mono">
                  {prediction.waitingCondition || 'Wait for decisive structural breakout beyond the 4-hour range boundaries with confirmed volume.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            SECTION 3: WHY THIS SETUP? (8 Structured Confluences)
           ================================================== */}
        <div className="bg-[#121929] border border-[#1F2937] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 border-b border-[#1F2937] pb-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
              WHY THIS SETUP?
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">H4 Context:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.h4Context}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">H1 Trend:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.h1Trend}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">M15 Structure:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.m15Structure}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">M5 Momentum:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.m5Momentum}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">Candle Pattern:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.candlePattern}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">Candle Sequence:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.candleSequence}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">Support/Resistance:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.supportResistance}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <span className="text-slate-400 font-semibold shrink-0">Volatility:</span>
              <span className="text-slate-300 leading-tight">{prediction.reasoning.volatility}</span>
            </div>
          </div>
        </div>

        {/* ==================================================
            SECTION 4: INVALIDATION
           ================================================== */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-black text-red-400 tracking-widest uppercase flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            INVALIDATION
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
            {prediction.invalidation}
          </p>
        </div>

        {/* ==================================================
            SECTION 5: ALTERNATIVE SCENARIO
           ================================================== */}
        <div className="bg-[#121929] border border-[#1F2937] rounded-lg p-3 space-y-1">
          <div className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
            ALTERNATIVE SCENARIO
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            {prediction.alternativeScenario}
          </p>
        </div>
      </div>

      {/* Footer Legal & Architecture Disclaimer */}
      <div className="p-3 border-t border-[#1F2937] bg-[#0A0E17] text-[10px] text-slate-500 flex flex-col gap-1 select-none shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
          <span>AI MARKET ANALYST • RESEARCH ONLY</span>
        </div>
        <span>
          TradeXpulse provides simulated AI market analyst visualizations for market research. Demo market data feed.
        </span>
      </div>
    </aside>
  );
};
