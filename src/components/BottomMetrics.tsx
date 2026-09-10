import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  Activity, 
  Layers,
  Gauge,
  BarChart3,
  Wallet,
  DollarSign,
  Percent,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const BottomMetrics: React.FC = () => {
  const {
    marketOverview,
    timeframeTrends,
    prediction,
    connectionStatus,
  } = usePredictionState();

  const [showDeepAnalytics, setShowDeepAnalytics] = useState<boolean>(false);

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
                className={`w-2 h-2.5 rounded-[1px] transition-colors ${bgClass}`}
              />
            );
          })}
        </div>
        <span className="text-[10px] font-mono font-bold text-slate-300 min-w-[26px] text-right">
          {strength}%
        </span>
      </div>
    );
  };

  return (
    <footer 
      className="border-t border-[#1B2537] bg-[#0A0F1D] px-3.5 py-2.5 select-none font-sans"
      id="bottom-metrics-bar"
    >
      <div className="max-w-[1920px] mx-auto space-y-2">
        {/* ==================================================
            18. BOTTOM METRICS BAR (5 Institutional Metric Cards)
            1. Account Balance: $124,580.00 | +$1,240 (today)
            2. Open P&L: +$420.50 | 2 active positions
            3. Win Rate: 68.4% | Last 30 trades
            4. Market Status: NYSE OPEN | Closes in 4h 12m
            5. Risk Exposure: 1.8% | Max allowed: 3.0%
           ================================================== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 items-stretch">
          
          {/* Card 1: Account Balance */}
          <div 
            className="bg-[#0E1524] border border-[#1B2537] hover:border-cyan-500/30 transition-all rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
            id="metric-account-balance"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-cyan-400" />
                Account Balance
              </span>
              <span className="text-[10px] font-mono bg-[#131D31] text-slate-400 px-1.5 py-0.5 rounded border border-[#1B2537]">USD</span>
            </div>
            <div className="font-mono text-lg font-black text-white tracking-tight my-0.5">
              $124,580.00
            </div>
            <div className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
              <span>+$1,240</span>
              <span className="text-slate-400 font-sans font-normal text-[10px]">(today)</span>
            </div>
          </div>

          {/* Card 2: Open P&L */}
          <div 
            className="bg-[#0E1524] border border-[#1B2537] hover:border-cyan-500/30 transition-all rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
            id="metric-open-pnl"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Open P&L
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">+2.4%</span>
            </div>
            <div className="font-mono text-lg font-black text-emerald-400 tracking-tight my-0.5">
              +$420.50
            </div>
            <div className="text-[11px] font-mono text-slate-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />
              <span>2 active positions</span>
            </div>
          </div>

          {/* Card 3: Win Rate */}
          <div 
            className="bg-[#0E1524] border border-[#1B2537] hover:border-cyan-500/30 transition-all rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
            id="metric-win-rate"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-cyan-400" />
                Win Rate
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">TOP 5%</span>
            </div>
            <div className="font-mono text-lg font-black text-white tracking-tight my-0.5">
              68.4%
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Last 30 trades
            </div>
          </div>

          {/* Card 4: Market Status */}
          <div 
            className="bg-[#0E1524] border border-[#1B2537] hover:border-cyan-500/30 transition-all rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
            id="metric-market-status"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Market Status
              </span>
              <span className="flex items-center gap-1 text-[9.5px] font-mono bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>
            <div className="font-mono text-lg font-black text-emerald-400 tracking-tight my-0.5 flex items-center gap-1.5">
              NYSE OPEN
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              Closes in 4h 12m
            </div>
          </div>

          {/* Card 5: Risk Exposure */}
          <div 
            className="col-span-2 md:col-span-1 lg:col-span-1 bg-[#0E1524] border border-[#1B2537] hover:border-cyan-500/30 transition-all rounded-xl p-3 flex flex-col justify-between shadow-sm relative overflow-hidden"
            id="metric-risk-exposure"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span className="font-semibold tracking-wide flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Risk Exposure
              </span>
              <button
                type="button"
                onClick={() => setShowDeepAnalytics(!showDeepAnalytics)}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 font-mono cursor-pointer"
                title="Toggle deep analytical feeds"
              >
                <span>Analytics</span>
                {showDeepAnalytics ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="font-mono text-lg font-black text-white tracking-tight my-0.5">
                1.8%
              </div>
              <div className="w-20 bg-[#131D31] h-1.5 rounded-full overflow-hidden border border-[#1B2537]">
                <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${(1.8 / 3.0) * 100}%` }} />
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Max allowed: <strong className="text-slate-300">3.0%</strong>
            </div>
          </div>

        </div>

        {/* ==================================================
            OPTIONAL EXPANDABLE DEEP ANALYTICS SECTION
           ================================================== */}
        {showDeepAnalytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-2.5 items-stretch pt-1 animate-fadeIn">
            {/* Market Overview */}
            <div className="md:col-span-1 lg:col-span-4 bg-[#0E1524] border border-[#1B2537] rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1B2537] pb-1.5 mb-1.5">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  MARKET OVERVIEW
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {connectionStatus === 'LIVE' ? 'LIVE FEED' : 'DEMO FEED'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between py-0.5 border-b border-[#141E30]">
                  <span className="text-slate-400">Symbol:</span>
                  <span className="font-bold text-white">{marketOverview.symbol}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[#141E30]">
                  <span className="text-slate-400">Price:</span>
                  <span className="font-bold text-white">{marketOverview.currentPrice.toFixed(marketOverview.digits)}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[#141E30]">
                  <span className="text-slate-400">Spread:</span>
                  <span className="font-bold text-slate-200">{marketOverview.spread}</span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-[#141E30]">
                  <span className="text-slate-400">Session:</span>
                  <span className="font-bold text-slate-200">{marketOverview.session}</span>
                </div>
              </div>
            </div>

            {/* Timeframe Trends */}
            <div className="md:col-span-1 lg:col-span-4 bg-[#0E1524] border border-[#1B2537] rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#1B2537] pb-1.5 mb-1.5">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  TIMEFRAME TREND
                </span>
                <span className="text-[9px] text-slate-400 font-mono">Sync: H4 to M5</span>
              </div>
              <div className="space-y-1">
                {timeframeTrends.map((tf) => (
                  <div key={tf.timeframe} className="flex items-center justify-between bg-[#080D18] px-2 py-0.5 rounded border border-[#1B2537] text-xs">
                    <span className="w-8 font-mono font-bold text-slate-300">{tf.timeframe}</span>
                    <span className={`font-mono font-bold text-[11px] ${tf.direction === 'Bullish' ? 'text-emerald-400' : tf.direction === 'Bearish' ? 'text-rose-400' : 'text-amber-400'}`}>
                      {tf.direction}
                    </span>
                    {renderStrengthMeter(tf.strength, tf.direction)}
                  </div>
                ))}
              </div>
            </div>

            {/* Prediction Model Summary */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-[#0E1524] border border-[#1B2537] rounded-xl p-3 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1B2537] pb-1.5 mb-1.5">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  AI PREDICTION SUMMARY
                </span>
                <span className="text-[9px] font-mono text-cyan-400 font-bold">{prediction.orderType}</span>
              </div>
              <div className="flex items-center justify-between py-1 text-xs font-mono">
                <span className="text-slate-400">Direction:</span>
                <span className={`font-black ${prediction.direction === 'BULLISH' ? 'text-emerald-400' : prediction.direction === 'BEARISH' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {prediction.direction} ({prediction.confidence}%)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 text-xs font-mono">
                <span className="text-slate-400">Condition:</span>
                <span className="text-slate-200">{prediction.marketCondition}</span>
              </div>
              <div className="text-[9px] text-slate-500 pt-1 border-t border-[#141E30] flex items-center justify-between">
                <span>Model v4.2 Institutional</span>
                <span className="text-emerald-400">Validated</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
