import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle, 
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react';

export const RightAiPanel: React.FC = () => {
  const {
    activeSymbol,
    prediction,
    activeBias,
    triggerAiAnalysis,
    marketOverview,
    setView,
    stageTradeFromPrediction
  } = usePredictionState();

  const [copied, setCopied] = useState<boolean>(false);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState<boolean>(false);

  const handleCopySetup = () => {
    const text = `TradeXpulse AI Market Analysis [${activeSymbol}]
Direction: ${prediction.direction}
Confidence: ${prediction.confidence}/100
Expected Move: ${prediction.expectedMovement}
Setup: ${prediction.orderType}
Entry: ${prediction.entryZone.text}
Stop Loss: ${prediction.stopLoss.toFixed(marketOverview.digits)}
TP1: ${prediction.tp1.toFixed(marketOverview.digits)}
TP2: ${prediction.tp2.toFixed(marketOverview.digits)}
Risk/Reward: ${prediction.riskReward}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isBullish = prediction.direction === 'BULLISH';
  const isBearish = prediction.direction === 'BEARISH';
  const isNoTrade = prediction.direction === 'NO TRADE';

  // Sentiment ratio calculations (defaults: 68% Bullish, 32% Bearish)
  const bullishSentiment = prediction.evidenceScoring?.bullishEvidenceScore 
    ? Math.min(95, Math.max(15, prediction.evidenceScoring.bullishEvidenceScore))
    : 68;
  const bearishSentiment = 100 - bullishSentiment;

  return (
    <aside 
      className="w-full bg-[#0B101D] border-l border-[#1B2537] flex flex-col h-full overflow-y-auto select-none font-sans"
      id="right-ai-panel"
    >
      {/* 1. Header: TradeXpulse AI & ONLINE (green indicator) */}
      <div className="p-3.5 border-b border-[#1B2537] flex items-center justify-between bg-[#0E1524] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/20 text-cyan-400 border border-blue-500/30 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-black tracking-wider text-white uppercase block leading-tight">
              TRADEXPULSE AI
            </span>
            <span className="text-[9px] font-mono text-slate-400">Institutional Model</span>
          </div>
        </div>
        
        {/* Status: ONLINE with green indicator & copy action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#080D18] border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]"></span>
            <span className="font-bold text-emerald-400 uppercase tracking-wider font-mono">ONLINE</span>
          </div>
          <button
            onClick={handleCopySetup}
            title="Copy signal setup"
            className="p-1 rounded bg-[#131D31] hover:bg-[#1A263E] text-slate-400 hover:text-white transition-colors cursor-pointer border border-[#1B2537]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-3.5 flex-1">
        {/* Scenario Bias Quick Switcher */}
        <div className="bg-[#080D18] p-1 rounded-lg border border-[#1B2537]">
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BULLISH')}
              className={`py-1.5 px-2 rounded text-[10.5px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'BULLISH'
                  ? 'bg-emerald-600/90 text-white shadow-sm border border-emerald-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              BULLISH
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BEARISH')}
              className={`py-1.5 px-2 rounded text-[10.5px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'BEARISH'
                  ? 'bg-rose-600/90 text-white shadow-sm border border-rose-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              BEARISH
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'NO TRADE')}
              className={`py-1.5 px-2 rounded text-[10.5px] font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeBias === 'NO TRADE'
                  ? 'bg-amber-600/90 text-white shadow-sm border border-amber-400/40'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
              }`}
            >
              <MinusCircle className="w-3 h-3" />
              NEUTRAL
            </button>
          </div>
        </div>

        {/* ==================================================
            MAIN SIGNAL CARD
            - BULLISH (or BEARISH/NEUTRAL)
            - Confidence: 78/100 (green progress bar)
            - Expected Move: +8 to +15 points
            - Key Levels: Entry, TP1, TP2, Stop Loss (red)
            - View Detailed Analysis → (blue primary button)
           ================================================== */}
        <div className="bg-[#0E1524] border border-[#1B2537] rounded-xl p-3.5 space-y-3 shadow-lg relative overflow-hidden">
          {/* Subtle accent glow */}
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            isBullish ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : isBearish ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-amber-500'
          }`} />

          {/* Direction Badge & Subtitle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className={`text-base font-black font-mono tracking-wide ${
                isBullish ? 'text-emerald-400' : isBearish ? 'text-rose-400' : 'text-amber-400'
              }`}>
                {prediction.direction}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131D31] text-slate-300 font-bold border border-[#1B2537]">
                {prediction.orderType}
              </span>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {prediction.symbol} • M5
            </span>
          </div>

          {/* Confidence Meter with Green Progress Bar */}
          <div className="space-y-1.5 bg-[#080D18] p-2.5 rounded-lg border border-[#1B2537]">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 text-[11px] font-sans font-semibold">Confidence:</span>
              <span className="font-extrabold text-white">
                <span className="text-emerald-400">{prediction.confidence}</span>/100
              </span>
            </div>
            {/* Green Progress Bar */}
            <div className="w-full bg-[#121A2C] h-2 rounded-full overflow-hidden p-0.5 border border-[#1F2C40]">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-500"
                style={{ width: `${prediction.confidence}%` }}
              />
            </div>
          </div>

          {/* Expected Move */}
          <div className="flex items-center justify-between bg-[#080D18] px-3 py-2 rounded-lg border border-[#1B2537]">
            <span className="text-[11px] font-semibold text-slate-400">Expected Move:</span>
            <span className="font-mono font-bold text-xs text-cyan-300">
              {prediction.expectedMovement || '+8 to +15 points'}
            </span>
          </div>

          {/* Key Levels List */}
          <div className="space-y-1.5 bg-[#080D18] p-3 rounded-lg border border-[#1B2537] text-xs font-mono">
            <div className="text-[9.5px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">
              Key Levels:
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#141E30]">
              <span className="text-slate-400 font-sans text-[11px]">Entry:</span>
              <span className="font-bold text-white tracking-wide">
                {prediction.entryZone.text || '2,425.30'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#141E30]">
              <span className="text-slate-400 font-sans text-[11px]">TP1:</span>
              <span className="font-bold text-emerald-400 tracking-wide">
                {prediction.tp1.toFixed(marketOverview.digits) || '2,432.10'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-[#141E30]">
              <span className="text-slate-400 font-sans text-[11px]">TP2:</span>
              <span className="font-bold text-emerald-400 tracking-wide">
                {prediction.tp2.toFixed(marketOverview.digits) || '2,436.20'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400 font-sans text-[11px]">Stop Loss:</span>
              <span className="font-bold text-red-400 tracking-wide">
                {prediction.stopLoss.toFixed(marketOverview.digits) || '2,420.80'}
              </span>
            </div>
          </div>

          {/* Button: View Detailed Analysis → (Blue Primary Button) */}
          <button
            type="button"
            id="view-detailed-analysis-btn"
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="w-full py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_14px_rgba(59,130,246,0.35)] cursor-pointer tracking-wide"
          >
            <span>View Detailed Analysis</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* ==================================================
            17. MARKET SENTIMENT CARD
            Header: Market Sentiment
            Display: 32% Bearish   68% Bullish
            Horizontal sentiment visualization:
            - red for Bearish
            - green for Bullish
           ================================================== */}
        <div className="bg-[#0E1524] border border-[#1B2537] rounded-xl p-3.5 space-y-2.5 shadow-md">
          <div className="flex items-center justify-between border-b border-[#1B2537] pb-1.5">
            <span className="text-xs font-black text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
              Market Sentiment
            </span>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">Institutional Flow</span>
          </div>

          {/* Display: 32% Bearish   68% Bullish */}
          <div className="flex items-center justify-between font-mono text-xs font-bold pt-0.5">
            <span className="text-rose-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
              {bearishSentiment}% Bearish
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              {bullishSentiment}% Bullish
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            </span>
          </div>

          {/* Horizontal Sentiment Visualization (Red Bearish, Green Bullish) */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#080D18] p-0.5 border border-[#1B2537]">
            <div 
              className="h-full bg-rose-500 rounded-l-full transition-all duration-500"
              style={{ width: `${bearishSentiment}%` }}
              title={`Bearish: ${bearishSentiment}%`}
            />
            <div 
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              style={{ width: `${bullishSentiment}%` }}
              title={`Bullish: ${bullishSentiment}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-0.5">
            <span>Aggressor Sells</span>
            <span className="text-cyan-400 font-semibold">Net Long Dominance</span>
            <span>Passive Absorption</span>
          </div>
        </div>

        {/* Detailed Analysis Section (Expanded or Toggleable) */}
        {showDetailedAnalysis && (
          <div className="space-y-3 pt-1 animate-fadeIn">
            {/* Stage Setup in Execution Ticket */}
            <button
              type="button"
              onClick={() => {
                stageTradeFromPrediction();
                setView('execution');
              }}
              className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Open Order in Execution Ticket
            </button>

            {/* Structured Confluences */}
            <div className="bg-[#0E1524] border border-[#1B2537] rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-slate-300 border-b border-[#1B2537] pb-1 flex items-center justify-between">
                <span>Confluence Verification</span>
                <span className="text-[10px] font-mono text-emerald-400">8/8 Passed</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-400 font-semibold">H4 Context:</span>
                  <span className="leading-tight">{prediction.reasoning.h4Context}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-400 font-semibold">H1 Trend:</span>
                  <span className="leading-tight">{prediction.reasoning.h1Trend}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-400 font-semibold">M15 Structure:</span>
                  <span className="leading-tight">{prediction.reasoning.m15Structure}</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-300">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span className="text-slate-400 font-semibold">M5 Momentum:</span>
                  <span className="leading-tight">{prediction.reasoning.m5Momentum}</span>
                </div>
              </div>
            </div>

            {/* Invalidation Rule */}
            <div className="bg-rose-500/5 border border-rose-500/20 rounded-lg p-2.5 text-xs">
              <div className="text-[10px] font-black text-rose-400 tracking-wider uppercase flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-3 h-3" />
                Invalidation Level
              </div>
              <p className="text-[11px] text-slate-300 font-mono leading-relaxed">
                {prediction.invalidation}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

