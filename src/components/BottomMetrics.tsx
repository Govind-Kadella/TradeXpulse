import React from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  Activity, 
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Gauge,
  BarChart2,
  BarChart3,
  TrendingUp,
  FlaskConical
} from 'lucide-react';

export const BottomMetrics: React.FC = () => {
  const {
    marketOverview,
    timeframeTrends,
    prediction,
    activeBias,
    connectionStatus,
    marketDataStatus
  } = usePredictionState();

  const isBull = marketOverview.change >= 0;
  const pb = {
    bullish: (prediction as any).bullishProbability ?? prediction.probabilityBreakdown?.bullish ?? (activeBias === 'BULLISH' ? prediction.confidence : 18),
    bearish: (prediction as any).bearishProbability ?? prediction.probabilityBreakdown?.bearish ?? (activeBias === 'BEARISH' ? prediction.confidence : 16),
    neutral: (prediction as any).neutralProbability ?? prediction.probabilityBreakdown?.neutral ?? (activeBias === 'NO TRADE' ? prediction.confidence : 0)
  };

  // Strength meter block segments helper (6 blocks total)
  const renderStrengthMeter = (strength: number, direction: 'Bullish' | 'Bearish' | 'Neutral') => {
    const totalBlocks = 6;
    const filledBlocks = Math.round((strength / 100) * totalBlocks);
    
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: totalBlocks }).map((_, i) => {
            const isFilled = i < filledBlocks;
            let bgClass = 'bg-[#1F2937]';
            if (isFilled) {
              if (direction === 'Bullish') bgClass = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
              else if (direction === 'Bearish') bgClass = 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]';
              else bgClass = 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
            }
            return (
              <div
                key={i}
                className={`w-2.5 h-3 rounded-[2px] transition-colors ${bgClass}`}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-300 min-w-[28px] text-right">
          {strength}%
        </span>
      </div>
    );
  };

  return (
    <footer 
      className="border-t border-[#1F2937] bg-[#0E1421] px-3 py-2 select-none font-sans"
      id="bottom-information-section"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-stretch max-w-[1920px] mx-auto">
        
        {/* ==================================================
            CARD 1 — MARKET OVERVIEW (COMPACT)
            Symbol, Current Price, Change, Spread, Session, Volatility (ATR 14)
           ================================================== */}
        <div 
          className="md:col-span-1 lg:col-span-3 bg-[#0c1322] border border-[#172338] rounded-xl p-2.5 flex flex-col justify-between shadow-sm"
          id="card-1-market-overview"
        >
          <div className="flex items-center justify-between border-b border-[#172338] pb-1.5 mb-1.5">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              MARKET OVERVIEW
            </span>
            <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
              connectionStatus === 'LIVE'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              {connectionStatus === 'LIVE' ? 'LIVE FEED • TWELVE DATA' : 'DEMO MODE • TWELVE DATA'}
            </span>
          </div>

          {/* Key-Value Pair Listing - Compact Rows */}
          <div className="space-y-1 text-[11px] font-mono flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between py-0.5 border-b border-[#172338]/40">
              <span className="text-slate-400">Symbol</span>
              <span className="font-bold text-white tracking-wider">{marketOverview.symbol}</span>
            </div>
            
            <div className="flex items-center justify-between py-0.5 border-b border-[#172338]/40">
              <span className="text-slate-400">Current Price</span>
              <span className="font-bold text-white text-xs">
                {marketOverview.currentPrice.toFixed(marketOverview.digits)}
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-[#172338]/40">
              <span className="text-slate-400">Change</span>
              <span className={`font-bold ${isBull ? 'text-emerald-400' : 'text-red-400'}`}>
                {isBull ? '+' : ''}{marketOverview.change} ({isBull ? '+' : ''}{marketOverview.changePercent}%)
              </span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-[#172338]/40">
              <span className="text-slate-400">Spread</span>
              <span className="font-bold text-slate-200">{marketOverview.spread}</span>
            </div>

            <div className="flex items-center justify-between py-0.5 border-b border-[#172338]/40">
              <span className="text-slate-400">Session</span>
              <span className="font-bold text-slate-200">{marketOverview.session}</span>
            </div>

            <div className="flex items-center justify-between py-0.5">
              <span className="text-slate-400">Volatility (ATR14)</span>
              <span className="font-bold text-blue-400">{marketOverview.atr14.toFixed(marketOverview.digits)}</span>
            </div>
          </div>

          <div className="text-[8.5px] text-slate-500 pt-1 mt-1 border-t border-[#172338] flex items-center justify-between">
            <span>Simulated demo market data</span>
            <span className="font-mono text-slate-400">Feed: ACTIVE</span>
          </div>
        </div>

        {/* ==================================================
            CARD 2 — TIMEFRAME TREND (COMPACT)
            Timeframe | Trend | Strength
            H4, H1, M15, M5
           ================================================== */}
        <div 
          className="md:col-span-1 lg:col-span-3 bg-[#0c1322] border border-[#172338] rounded-xl p-2.5 flex flex-col justify-between shadow-sm"
          id="card-2-timeframe-trend"
        >
          <div className="flex items-center justify-between border-b border-[#172338] pb-1.5 mb-1.5">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              TIMEFRAME TREND
            </span>
            <span className="text-[8.5px] text-slate-400 font-mono">
              Timeframe | Trend | Strength
            </span>
          </div>

          {/* Timeframe Rows: H4, H1, M15, M5 - Compact Layout */}
          <div className="space-y-1 flex-1 flex flex-col justify-center">
            {timeframeTrends.map((tf) => {
              const isTfBull = tf.direction === 'Bullish';
              const isTfBear = tf.direction === 'Bearish';
              return (
                <div 
                  key={tf.timeframe} 
                  className="flex items-center justify-between bg-[#080d18] border border-[#172338] px-2 py-0.5 rounded"
                >
                  {/* Timeframe Label */}
                  <span className="w-8 text-[11px] font-mono font-bold text-slate-300">
                    {tf.timeframe}
                  </span>

                  {/* Trend Indicator */}
                  <div className="flex items-center gap-1 w-20">
                    {isTfBull ? (
                      <ArrowUp className="w-3 h-3 text-emerald-400" />
                    ) : isTfBear ? (
                      <ArrowDown className="w-3 h-3 text-red-400" />
                    ) : (
                      <ArrowRight className="w-3 h-3 text-amber-400" />
                    )}
                    <span className={`text-[11px] font-bold font-mono ${
                      isTfBull ? 'text-emerald-400' : isTfBear ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {tf.direction}
                    </span>
                  </div>

                  {/* Visual Strength Meter */}
                  <div className="flex items-center justify-end">
                    {renderStrengthMeter(tf.strength, tf.direction)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[8.5px] text-slate-500 pt-1 mt-1 border-t border-[#172338] flex items-center justify-between">
            <span>Primary decision: <strong className="text-blue-400">M5</strong></span>
            <span className="text-slate-400">State: SYNCHRONIZED</span>
          </div>
        </div>

        {/* ==================================================
            CARD 3 — AI PREDICTION SUMMARY (MATCHING PHOTO)
            Zone 1 (Left): Semicircular Rainbow Probability Gauge
            Zone 2 (Middle): DIRECTION & CONFIDENCE + 10-Block Meter
            Zone 3 (Right): EXPECTED MOVEMENT & MARKET CONDITION
           ================================================== */}
        <div 
          className="md:col-span-2 lg:col-span-6 bg-[#0c1322] border border-[#172338] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm min-h-[175px]"
          id="card-3-ai-prediction-summary"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#172338] pb-2 mb-1.5 shrink-0">
            <span className="text-[14.5px] sm:text-[15.5px] font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Gauge className="w-5 h-5 text-[#38bdf8]" />
              AI PREDICTION SUMMARY
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-500/30 bg-[#0c1e36]/70 text-[#38bdf8] text-[10.5px] sm:text-[11px] font-mono font-bold tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>MODEL CONFIDENCE</span>
            </div>
          </div>

          {/* Main Content — 3 Zones side by side */}
          {(() => {
            // Semicircular Probability Gauge Calculations
            const cx = 80;
            const cy = 68;
            const radius = 54;

            let gaugeScore = 50; // 0 = Bearish, 50 = Neutral, 100 = Bullish
            let primaryPercent = prediction.confidence;
            let primaryLabel = 'Bullish Probability';
            let primaryColor = '#00e599';

            if (activeBias === 'BULLISH') {
              gaugeScore = prediction.confidence;
              primaryPercent = prediction.confidence;
              primaryLabel = 'Bullish Probability';
              primaryColor = '#00e599';
            } else if (activeBias === 'BEARISH') {
              gaugeScore = 100 - prediction.confidence;
              primaryPercent = prediction.confidence;
              primaryLabel = 'Bearish Probability';
              primaryColor = '#ef4444';
            } else {
              gaugeScore = 50;
              primaryPercent = 50;
              primaryLabel = 'Waiting for confirmation';
              primaryColor = '#eab308';
            }

            const progress = Math.max(0, Math.min(100, gaugeScore)) / 100;
            // 0% -> 180 deg (left, red), 50% -> 90 deg (top, yellow), 100% -> 0 deg (right, green)
            const angleDeg = 180 - progress * 180;
            const rad = (angleDeg * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            // Glowing Indicator ring centered directly on the rainbow arc
            const bx = cx + radius * cos;
            const by = cy - radius * sin;

            return (
              <div className="flex-1 flex flex-col sm:flex-row items-center justify-between min-h-0 py-1 gap-2 sm:gap-0">
                {/* LEFT: Semicircular Probability Gauge */}
                <div className="w-full sm:w-[38%] min-w-[140px] max-w-[170px] shrink-0 flex flex-col items-center justify-center pr-1 sm:pr-2">
                  <div className="relative w-[146px] h-[74px] flex items-center justify-center">
                    <svg 
                      viewBox="0 0 160 80" 
                      className="w-full h-full overflow-visible select-none"
                      aria-label="AI Probability Gauge"
                    >
                      <defs>
                        {/* Continuous smooth rainbow gradient matching photo */}
                        <linearGradient id="rainbowGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="22%" stopColor="#f97316" />
                          <stop offset="48%" stopColor="#eab308" />
                          <stop offset="72%" stopColor="#22c55e" />
                          <stop offset="100%" stopColor="#00e599" />
                        </linearGradient>

                        <filter id="gaugeRingGlow" x="-50%" y="-50%" width="200%" height="200%">
                          <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#ffffff" floodOpacity="0.8" />
                        </filter>
                      </defs>

                      {/* Dark background track */}
                      <path
                        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                        fill="none"
                        stroke="#162235"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />

                      {/* Rainbow gradient arc */}
                      <path
                        d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                        fill="none"
                        stroke="url(#rainbowGaugeGrad)"
                        strokeWidth="9"
                        strokeLinecap="round"
                      />

                      {/* Hollow White Ring indicator on arc matching photo */}
                      <circle
                        cx={bx}
                        cy={by}
                        r="4.8"
                        fill="#0c1322"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        filter="url(#gaugeRingGlow)"
                      />

                      {/* Gauge Centered Percentage */}
                      <text
                        x={cx}
                        y={cy - 20}
                        textAnchor="middle"
                        fill={primaryColor}
                        fontSize="28"
                        fontFamily="JetBrains Mono, monospace"
                        fontWeight="900"
                        letterSpacing="-0.5"
                      >
                        {primaryPercent}%
                      </text>

                      {/* Gauge Sub-label */}
                      <text
                        x={cx}
                        y={cy - 5}
                        textAnchor="middle"
                        fill="#f1f5f9"
                        fontSize="11"
                        fontFamily="sans-serif"
                        fontWeight="500"
                      >
                        {primaryLabel}
                      </text>
                    </svg>
                  </div>

                  {/* Secondary Distribution Readout at Bottom of Gauge: Bearish 16% | Neutral 0% */}
                  <div className="flex items-center justify-center gap-2 text-[11px] font-mono mt-1 leading-none select-none">
                    <span className="text-[#ef4444] font-semibold">Bearish {pb.bearish}%</span>
                    <span className="text-slate-600 font-normal">|</span>
                    <span className="text-slate-300 font-medium">Neutral <strong className="text-[#eab308] font-bold">{pb.neutral}%</strong></span>
                  </div>
                </div>

                {/* Vertical Divider between Left and Right */}
                <div className="hidden sm:block w-[1px] bg-[#172338] self-stretch mx-2 shrink-0" />

                {/* RIGHT: Prediction Details */}
                <div className="flex-1 min-w-0 w-full flex flex-col justify-center py-0.5 pl-1 sm:pl-3 space-y-2">
                  {/* DIRECTION & CONFIDENCE in a compact grid row */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* DIRECTION */}
                    <div>
                      <span className="text-[10.5px] sm:text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block leading-tight">
                        DIRECTION
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {activeBias === 'BULLISH' ? (
                          <>
                            <ArrowUp className="w-4 h-4 text-[#00e599] stroke-[2.5] shrink-0" />
                            <span className="font-mono font-bold text-[16px] sm:text-[18px] text-[#00e599] tracking-wide leading-tight">
                              BULLISH
                            </span>
                          </>
                        ) : activeBias === 'BEARISH' ? (
                          <>
                            <ArrowDown className="w-4 h-4 text-red-400 stroke-[2.5] shrink-0" />
                            <span className="font-mono font-bold text-[16px] sm:text-[18px] text-red-400 tracking-wide leading-tight">
                              BEARISH
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 text-amber-400 stroke-[2.5] shrink-0" />
                            <span className="font-mono font-bold text-[15px] sm:text-[17px] text-amber-400 tracking-wide leading-tight">
                              NO TRADE
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* CONFIDENCE */}
                    <div>
                      <span className="text-[10.5px] sm:text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block leading-tight">
                        CONFIDENCE
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-[16px] sm:text-[18px] text-white leading-tight">
                          {prediction.confidence}/100
                        </span>
                        {/* 10-Segmented Progress Meter Bar */}
                        <div className="hidden xl:flex items-center gap-0.5">
                          {Array.from({ length: 10 }).map((_, idx) => {
                            const fullThreshold = (idx + 1) * 10;
                            const isFull = prediction.confidence >= fullThreshold;
                            const isPartial = !isFull && prediction.confidence > idx * 10;
                            
                            let blockColor = 'bg-[#151f30]';
                            if (isFull) {
                              blockColor = activeBias === 'BEARISH'
                                ? 'bg-red-500'
                                : activeBias === 'NO TRADE'
                                ? 'bg-amber-400'
                                : 'bg-[#00e599]';
                            } else if (isPartial) {
                              blockColor = activeBias === 'BEARISH'
                                ? 'bg-red-900/80'
                                : activeBias === 'NO TRADE'
                                ? 'bg-amber-900/80'
                                : 'bg-[#065f46]';
                            }

                            return (
                              <div 
                                key={idx}
                                className={`w-1.5 h-2.5 rounded-[1px] transition-colors ${blockColor}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EXPECTED MOVEMENT - Full width of Right section */}
                  <div className="pt-1.5 border-t border-[#172338]/60">
                    <span className="text-[10.5px] sm:text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase block leading-tight">
                      EXPECTED MOVEMENT
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <TrendingUp className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#38bdf8] stroke-[2.5] shrink-0" />
                      <span className="font-mono font-bold text-[16px] sm:text-[17.5px] text-[#38bdf8] tracking-tight leading-tight whitespace-normal break-words">
                        {activeBias === 'NO TRADE' ? 'Range Bound' : prediction.expectedMovement}
                      </span>
                    </div>
                  </div>

                  {/* MARKET CONDITION - Full width of Right section */}
                  <div className="pt-1.5 border-t border-[#172338]/60">
                    <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-mono font-semibold tracking-wider text-slate-400 uppercase leading-tight">
                      <BarChart2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>MARKET CONDITION</span>
                    </div>
                    <span className="font-sans font-medium text-[13px] sm:text-[14px] text-slate-100 leading-snug block mt-0.5 whitespace-normal break-words">
                      {activeBias === 'NO TRADE' ? 'Waiting for confirmation' : prediction.marketCondition}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Footer matching photo: Simulated demo data | UI Testing Only */}
          <div className="text-[11px] sm:text-[11.5px] text-slate-400 pt-2 mt-1.5 border-t border-[#172338] flex items-center justify-between shrink-0 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e599] shadow-[0_0_8px_#00e599] inline-block shrink-0" />
              <span>Simulated demo data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-normal">|</span>
              <FlaskConical className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>UI Testing Only</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};
