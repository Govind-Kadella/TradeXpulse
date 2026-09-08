import React, { useRef, useEffect, useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle, 
  Sparkles,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';

export const MarketMapView: React.FC = () => {
  const {
    activeSymbol,
    setSymbol,
    activeTimeframe,
    activeBias,
    candles,
    marketOverview,
    prediction,
    triggerAiAnalysis,
    marketMapItems,
    setView
  } = usePredictionState();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 900, height: 420 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setDimensions({
            width: Math.floor(entry.contentRect.width),
            height: Math.max(360, Math.floor(entry.contentRect.height))
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute SVG plot points for the Market Map
  const recentCandles = candles.slice(-28);
  const prices = recentCandles.map(c => c.close);
  
  // Include all key analytical levels
  const allLevels = [
    ...prices,
    prediction.support,
    prediction.resistance,
    prediction.stopLoss,
    prediction.tp1,
    prediction.tp2,
    prediction.tp3,
    prediction.entryZone.min,
    prediction.entryZone.max,
    ...prediction.forecastPath.map(p => p.price)
  ];

  const minP = Math.min(...allLevels);
  const maxP = Math.max(...allLevels);
  const range = maxP - minP || 1;
  const padMin = minP - range * 0.08;
  const padMax = maxP + range * 0.08;
  const padRange = padMax - padMin;

  const w = dimensions.width;
  const h = dimensions.height;
  const leftPad = 60;
  const rightPad = 130;
  const topPad = 35;
  const botPad = 40;
  const plotW = w - leftPad - rightPad;
  const plotH = h - topPad - botPad;

  const py = (price: number) => topPad + plotH - ((price - padMin) / padRange) * plotH;

  // Actual market movement path points (historical)
  const actualStepW = (plotW * 0.55) / (recentCandles.length - 1);
  const actualPoints = recentCandles.map((c, i) => ({
    x: leftPad + i * actualStepW,
    y: py(c.close),
    price: c.close,
    time: c.time
  }));

  const actualPathD = actualPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // TradeXpulse Forecast pathway points (future projection)
  const forecastStartX = actualPoints[actualPoints.length - 1]?.x || leftPad + plotW * 0.55;
  const forecastWidth = plotW * 0.45;
  const fpPoints = prediction.forecastPath;
  const maxStep = Math.max(...fpPoints.map(p => p.xStep), 1);

  const forecastPoints = fpPoints.map(fp => {
    const x = forecastStartX + (fp.xStep / maxStep) * forecastWidth;
    const y = py(fp.price);
    return { x, y, price: fp.price, label: fp.label };
  });

  const forecastPathD = forecastPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Area under historical price curve
  const areaD = `${actualPathD} L ${actualPoints[actualPoints.length - 1]?.x || 0} ${topPad + plotH} L ${leftPad} ${topPad + plotH} Z`;

  return (
    <div className="flex-1 flex flex-col bg-[#0A0E17] overflow-y-auto select-none font-sans" id="market-map-view">
      {/* View Header Bar */}
      <div className="bg-[#0E1421] border-b border-[#1F2937] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">
                TRADEXPULSE MARKET MAP
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1D283D] text-slate-300 font-semibold border border-[#1F2937]">
                SHARED PREDICTION STATE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-level visual roadmap of price trajectory and analytical forecast levels.
            </p>
          </div>
        </div>

        {/* Quick Market & Bias Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0A0E17] p-1 rounded-lg border border-[#1F2937]">
            {(['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'] as const).map(sym => (
              <button
                key={sym}
                onClick={() => setSymbol(sym)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeSymbol === sym
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-[#0A0E17] p-1 rounded-lg border border-[#1F2937]">
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BULLISH')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeBias === 'BULLISH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <TrendingUp className="w-3 h-3" /> Bull
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'BEARISH')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeBias === 'BEARISH'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-red-400'
              }`}
            >
              <TrendingDown className="w-3 h-3" /> Bear
            </button>
            <button
              onClick={() => triggerAiAnalysis(undefined, 'NO TRADE')}
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeBias === 'NO TRADE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-amber-400'
              }`}
            >
              <MinusCircle className="w-3 h-3" /> No Trade
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Content Area */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Authoritative 4-Market Cross-Asset Intelligence Grid */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                4-Market Cross-Asset Intelligence Overview
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Canonical analysis engine across all 4 instruments • Click any card to inspect on Dashboard
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {marketMapItems.map(item => {
              const isSelected = item.symbol === activeSymbol;
              const isBull = item.direction === 'BULLISH';
              const isBear = item.direction === 'BEARISH';

              return (
                <div
                  key={item.symbol}
                  id={`market-map-card-${item.symbol}`}
                  onClick={() => setSymbol(item.symbol)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#131B2D] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'bg-[#0E1421] border-[#1F2937] hover:border-slate-600 hover:bg-[#111827]'
                  }`}
                >
                  {/* Symbol, Name & Live Price */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-base text-white">
                          {item.symbol}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-sm text-white">
                        {item.currentPrice.toFixed(item.digits)}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        item.signalStatus === 'ACTIVE'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {item.signalStatus}
                      </span>
                    </div>
                  </div>

                  {/* Direction & Confidence */}
                  <div className="bg-[#0A0E17] p-2.5 rounded-lg border border-[#1F2937]/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isBull ? (
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                      ) : isBear ? (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      ) : (
                        <MinusCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className={`font-mono text-xs font-bold ${
                        isBull ? 'text-emerald-400' : isBear ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {item.direction}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-slate-400">Confidence:</span>
                      <span className="text-xs font-mono font-bold text-white">{item.confidence}%</span>
                    </div>
                  </div>

                  {/* Trend, Structure, Market Condition */}
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Trend:</span>
                      <span className="font-semibold text-right truncate max-w-[160px]">{item.trend}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Structure:</span>
                      <span className="font-semibold text-right truncate max-w-[160px]">{item.structure}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500">Condition:</span>
                      <span className="font-semibold text-blue-400 text-right">{item.classification.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Setup & Target Move */}
                  <div className="p-2 rounded bg-[#0A0E17] border border-[#1F2937]/80 text-[11px] font-mono space-y-1">
                    <div className="text-slate-400 truncate">
                      <strong className="text-slate-300">Setup: </strong>{item.m5Setup}
                    </div>
                    <div className="text-slate-400 truncate">
                      <strong className="text-slate-300">Move: </strong>{item.expectedMovement}
                    </div>
                  </div>

                  {/* Action Button: Open Terminal */}
                  <button
                    id={`open-terminal-btn-${item.symbol}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSymbol(item.symbol);
                      setView('dashboard');
                    }}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-[#1D283D] hover:bg-blue-600 text-white font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Analyze on Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Market Status Highlights Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400">Current Market</span>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              {marketOverview.symbol} ({marketOverview.currentPrice.toFixed(marketOverview.digits)})
            </div>
          </div>
          <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400">Forecast Bias</span>
            <div className={`text-base font-bold font-mono mt-0.5 ${
              activeBias === 'BULLISH' ? 'text-emerald-400' : activeBias === 'BEARISH' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {activeBias} ({prediction.confidence}%)
            </div>
          </div>
          <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400">Primary Setup</span>
            <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
              {prediction.orderType}
            </div>
          </div>
          <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
            <span className="text-[10px] font-mono uppercase text-slate-400">Risk/Reward Profile</span>
            <div className="text-base font-bold font-mono text-blue-400 mt-0.5">
              {prediction.riskReward}
            </div>
          </div>
        </div>

        {/* Central Map SVG Graphic */}
        <div 
          ref={containerRef}
          className="relative bg-[#0E1421] border border-[#1F2937] rounded-lg p-4 shadow-xl overflow-hidden min-h-[420px]"
          id="market-map-canvas-card"
        >
          {/* Watermark Label */}
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
            <span className="font-bold text-sm tracking-wider text-slate-300">
              TRADEXPULSE FORECAST ROADMAP
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-[#1D283D] text-blue-400 border border-blue-500/20">
              DEMO VISUALIZATION
            </span>
          </div>

          <svg 
            width={w} 
            height={h} 
            className="w-full h-full block"
          >
            <defs>
              {/* Plot area clip path */}
              <clipPath id="mapPlotClip">
                <rect x={leftPad} y={topPad} width={plotW} height={plotH} />
              </clipPath>

              {/* Gradient for historical price area */}
              <linearGradient id="actualAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
              </linearGradient>

              {/* Glow filter for forecast line */}
              <filter id="forecastGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Grid Lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const y = topPad + plotH * ratio;
              return (
                <line
                  key={idx}
                  x1={leftPad}
                  y1={y}
                  x2={leftPad + plotW}
                  y2={y}
                  stroke="#151D2D"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Support Level Line */}
            <g>
              <line
                x1={leftPad}
                y1={py(prediction.support)}
                x2={leftPad + plotW}
                y2={py(prediction.support)}
                stroke="#10B981"
                strokeWidth="1.5"
                strokeDasharray="5,5"
              />
              <rect
                x={leftPad + plotW + 8}
                y={py(prediction.support) - 10}
                width="110"
                height="20"
                rx="3"
                fill="#0E1421"
                stroke="#10B981"
                strokeWidth="1"
              />
              <text
                x={leftPad + plotW + 14}
                y={py(prediction.support) + 4}
                fill="#10B981"
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
              >
                SUP: {prediction.support.toFixed(marketOverview.digits)}
              </text>
            </g>

            {/* Resistance Level Line */}
            <g>
              <line
                x1={leftPad}
                y1={py(prediction.resistance)}
                x2={leftPad + plotW}
                y2={py(prediction.resistance)}
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="5,5"
              />
              <rect
                x={leftPad + plotW + 8}
                y={py(prediction.resistance) - 10}
                width="110"
                height="20"
                rx="3"
                fill="#0E1421"
                stroke="#EF4444"
                strokeWidth="1"
              />
              <text
                x={leftPad + plotW + 14}
                y={py(prediction.resistance) + 4}
                fill="#EF4444"
                fontSize="10"
                fontFamily="JetBrains Mono"
                fontWeight="bold"
              >
                RES: {prediction.resistance.toFixed(marketOverview.digits)}
              </text>
            </g>

            {/* Entry Limit Zone (Corridor) */}
            {activeBias !== 'NO TRADE' && (
              <g>
                <rect
                  x={forecastStartX}
                  y={Math.min(py(prediction.entryZone.min), py(prediction.entryZone.max))}
                  width={forecastWidth}
                  height={Math.max(6, Math.abs(py(prediction.entryZone.min) - py(prediction.entryZone.max)))}
                  fill={prediction.orderType === 'BUY LIMIT' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(239, 68, 68, 0.08)'}
                  stroke={prediction.orderType === 'BUY LIMIT' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <rect
                  x={leftPad + plotW + 8}
                  y={py((prediction.entryZone.min + prediction.entryZone.max) / 2) - 10}
                  width="115"
                  height="20"
                  rx="3"
                  fill="#0E1421"
                  stroke="#3B82F6"
                  strokeWidth="1"
                />
                <text
                  x={leftPad + plotW + 14}
                  y={py((prediction.entryZone.min + prediction.entryZone.max) / 2) + 4}
                  fill="#60A5FA"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  {prediction.orderType}
                </text>
              </g>
            )}

            {/* Stop Loss Line */}
            {activeBias !== 'NO TRADE' && (
              <g>
                <line
                  x1={forecastStartX}
                  y1={py(prediction.stopLoss)}
                  x2={leftPad + plotW}
                  y2={py(prediction.stopLoss)}
                  stroke="#EF4444"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                />
                <rect
                  x={leftPad + plotW + 8}
                  y={py(prediction.stopLoss) - 10}
                  width="110"
                  height="20"
                  rx="3"
                  fill="#0E1421"
                  stroke="#EF4444"
                  strokeWidth="1"
                />
                <text
                  x={leftPad + plotW + 14}
                  y={py(prediction.stopLoss) + 4}
                  fill="#EF4444"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  SL: {prediction.stopLoss.toFixed(marketOverview.digits)}
                </text>
              </g>
            )}

            {/* Take Profits: TP1, TP2, TP3 */}
            {activeBias !== 'NO TRADE' && (
              <>
                {/* TP 1 */}
                <g>
                  <line
                    x1={forecastStartX}
                    y1={py(prediction.tp1)}
                    x2={leftPad + plotW}
                    y2={py(prediction.tp1)}
                    stroke="#10B981"
                    strokeWidth="1.2"
                    strokeDasharray="4,3"
                  />
                  <rect
                    x={leftPad + plotW + 8}
                    y={py(prediction.tp1) - 10}
                    width="110"
                    height="20"
                    rx="3"
                    fill="#0E1421"
                    stroke="#10B981"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPad + plotW + 14}
                    y={py(prediction.tp1) + 4}
                    fill="#10B981"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    TP1: {prediction.tp1.toFixed(marketOverview.digits)}
                  </text>
                </g>

                {/* TP 2 */}
                <g>
                  <line
                    x1={forecastStartX}
                    y1={py(prediction.tp2)}
                    x2={leftPad + plotW}
                    y2={py(prediction.tp2)}
                    stroke="#10B981"
                    strokeWidth="1.2"
                    strokeDasharray="4,3"
                  />
                  <rect
                    x={leftPad + plotW + 8}
                    y={py(prediction.tp2) - 10}
                    width="110"
                    height="20"
                    rx="3"
                    fill="#0E1421"
                    stroke="#10B981"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPad + plotW + 14}
                    y={py(prediction.tp2) + 4}
                    fill="#10B981"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    TP2: {prediction.tp2.toFixed(marketOverview.digits)}
                  </text>
                </g>

                {/* TP 3 Target */}
                <g>
                  <line
                    x1={forecastStartX}
                    y1={py(prediction.tp3)}
                    x2={leftPad + plotW}
                    y2={py(prediction.tp3)}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4,3"
                  />
                  <rect
                    x={leftPad + plotW + 8}
                    y={py(prediction.tp3) - 10}
                    width="110"
                    height="20"
                    rx="3"
                    fill="#0E1421"
                    stroke="#10B981"
                    strokeWidth="1"
                  />
                  <text
                    x={leftPad + plotW + 14}
                    y={py(prediction.tp3) + 4}
                    fill="#10B981"
                    fontSize="10"
                    fontFamily="JetBrains Mono"
                    fontWeight="bold"
                  >
                    TP3: {prediction.tp3.toFixed(marketOverview.digits)}
                  </text>
                </g>
              </>
            )}

            {/* 1. ACTUAL MARKET MOVEMENT */}
            <path d={areaD} fill="url(#actualAreaGrad)" />
            <path d={actualPathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" />

            {/* Current Price Junction Node */}
            <circle
              cx={actualPoints[actualPoints.length - 1]?.x}
              cy={actualPoints[actualPoints.length - 1]?.y}
              r="5"
              fill="#3B82F6"
              stroke="#ffffff"
              strokeWidth="2"
            />

            {/* Divider line between actual and forecast */}
            <line
              x1={forecastStartX}
              y1={topPad}
              x2={forecastStartX}
              y2={topPad + plotH}
              stroke="#1F2937"
              strokeWidth="1.5"
              strokeDasharray="3,3"
            />
            <text
              x={forecastStartX - 8}
              y={topPad + 14}
              textAnchor="end"
              fill="#64748b"
              fontSize="9"
              fontFamily="JetBrains Mono"
            >
              ACTUAL MOVEMENT
            </text>
            <text
              x={forecastStartX + 8}
              y={topPad + 14}
              textAnchor="start"
              fill="#3B82F6"
              fontSize="9"
              fontFamily="JetBrains Mono"
              fontWeight="bold"
            >
              TRADEXPULSE FORECAST →
            </text>

            {/* 2. FUTURE FORECAST SHADED REGION (Behind targets, no diagonal zigzag line) */}
            {activeBias === 'BULLISH' ? (
              <g>
                <rect
                  x={forecastStartX}
                  y={Math.min(py(prediction.tp3), py(prediction.stopLoss))}
                  width={forecastWidth}
                  height={Math.max(16, Math.abs(py(prediction.tp3) - py(prediction.stopLoss)))}
                  fill="rgba(16, 185, 129, 0.06)"
                  stroke="rgba(16, 185, 129, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  rx="4"
                />
                <text
                  x={forecastStartX + 12}
                  y={Math.min(py(prediction.tp3), py(prediction.stopLoss)) + 18}
                  fill="rgba(16, 185, 129, 0.5)"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  BULLISH FORECAST REGION (TP1 → TP2 → TP3)
                </text>
              </g>
            ) : activeBias === 'BEARISH' ? (
              <g>
                <rect
                  x={forecastStartX}
                  y={Math.min(py(prediction.stopLoss), py(prediction.tp3))}
                  width={forecastWidth}
                  height={Math.max(16, Math.abs(py(prediction.stopLoss) - py(prediction.tp3)))}
                  fill="rgba(239, 68, 68, 0.06)"
                  stroke="rgba(239, 68, 68, 0.25)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  rx="4"
                />
                <text
                  x={forecastStartX + 12}
                  y={Math.min(py(prediction.stopLoss), py(prediction.tp3)) + 18}
                  fill="rgba(239, 68, 68, 0.5)"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  BEARISH FORECAST REGION (TP1 → TP2 → TP3)
                </text>
              </g>
            ) : (
              <g>
                <rect
                  x={forecastStartX}
                  y={Math.min(py(prediction.support), py(prediction.resistance))}
                  width={forecastWidth}
                  height={Math.max(16, Math.abs(py(prediction.support) - py(prediction.resistance)))}
                  fill="rgba(245, 158, 11, 0.04)"
                  stroke="rgba(245, 158, 11, 0.3)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  rx="4"
                />
                <text
                  x={forecastStartX + 12}
                  y={Math.min(py(prediction.support), py(prediction.resistance)) + 20}
                  fill="#f59e0b"
                  fontSize="9.5"
                  fontFamily="JetBrains Mono"
                  fontWeight="bold"
                >
                  NO TRADE / WAIT FOR CONFIRMATION
                </text>
              </g>
            )}

            {/* 3. TRADEXPULSE DIRECTIONAL ANGULAR FORECAST ARROW */}
            {activeBias !== 'NO TRADE' && (() => {
              const arrowStartX = forecastStartX;
              const arrowEndX = leftPad + plotW - 28;
              const arrowSpan = Math.max(30, arrowEndX - arrowStartX);

              const entryPrice = (prediction.entryZone.min + prediction.entryZone.max) / 2;
              const isBull = activeBias === 'BULLISH';
              const retestPrice = isBull
                ? prediction.tp1 - (prediction.tp1 - entryPrice) * 0.32
                : prediction.tp1 + (entryPrice - prediction.tp1) * 0.32;

              const waypoints = [
                { x: arrowStartX, y: py(recentCandles[recentCandles.length - 1]?.close || marketOverview.currentPrice), label: '' },
                { x: arrowStartX + arrowSpan * 0.18, y: py(entryPrice), label: 'ENTRY' },
                { x: arrowStartX + arrowSpan * 0.42, y: py(prediction.tp1), label: 'TP1' },
                { x: arrowStartX + arrowSpan * 0.60, y: py(retestPrice), label: 'RETEST' },
                { x: arrowStartX + arrowSpan * 0.80, y: py(prediction.tp2), label: 'TP2' },
                { x: arrowEndX, y: py(prediction.tp3), label: 'TP3' }
              ];

              const p4 = waypoints[4];
              const p5 = waypoints[5];
              const dx = p5.x - p4.x;
              const dy = p5.y - p4.y;
              const angle = Math.atan2(dy, dx);
              const headLen = 12;
              const spread = Math.PI / 6.2;

              const tipX = p5.x;
              const tipY = p5.y;
              const lx = tipX - headLen * Math.cos(angle - spread);
              const ly = tipY - headLen * Math.sin(angle - spread);
              const rx = tipX - headLen * Math.cos(angle + spread);
              const ry = tipY - headLen * Math.sin(angle + spread);
              const nx = tipX - headLen * 0.70 * Math.cos(angle);
              const ny = tipY - headLen * 0.70 * Math.sin(angle);

              // Angular straight line segments (NO CURVES)
              const pathStr = `M ${waypoints[0].x} ${waypoints[0].y} L ${waypoints[1].x} ${waypoints[1].y} L ${waypoints[2].x} ${waypoints[2].y} L ${waypoints[3].x} ${waypoints[3].y} L ${waypoints[4].x} ${waypoints[4].y} L ${nx} ${ny}`;

              return (
                <g clipPath="url(#mapPlotClip)">
                  {/* Glowing underlay along straight segments */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="rgba(59, 130, 246, 0.20)"
                    strokeWidth="5"
                    strokeLinejoin="miter"
                  />
                  {/* Directional arrow dashed angular path */}
                  <path
                    d={pathStr}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2.2"
                    strokeDasharray="7,3"
                    strokeLinejoin="miter"
                  />
                  {/* Sharp Arrowhead */}
                  <polygon
                    points={`${tipX},${tipY} ${lx},${ly} ${nx},${ny} ${rx},${ry}`}
                    fill="#3B82F6"
                    stroke="#93C5FD"
                    strokeWidth="1.3"
                  />
                  {/* Waypoint markers */}
                  {waypoints.slice(1, 5).map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="3.5" fill="#0A0E17" stroke="#60A5FA" strokeWidth="1.5" />
                      <circle cx={pt.x} cy={pt.y} r="1.5" fill="#93C5FD" />
                      {arrowSpan > 110 && (
                        <text
                          x={pt.x}
                          y={(pt.label === 'ENTRY' || pt.label === 'RETEST') ? (isBull ? pt.y + 11 : pt.y - 7) : (isBull ? pt.y - 7 : pt.y + 11)}
                          textAnchor="middle"
                          fill="#93C5FD"
                          fontSize="8"
                          fontFamily="JetBrains Mono"
                          fontWeight="bold"
                        >
                          {pt.label}
                        </text>
                      )}
                    </g>
                  ))}
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Synchronized Analytical Levels Table */}
        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F2937] pb-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              SYNCHRONIZED ANALYTICAL LEVELS TABLE
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Shared State: {marketOverview.symbol} / {activeTimeframe}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
            {/* Support */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block">SUPPORT</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                {prediction.support.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* Stop Loss */}
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <span className="text-[10px] font-mono text-red-400 font-semibold block">STOP LOSS</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                {prediction.stopLoss.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* Entry Zone */}
            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono text-blue-400 font-semibold block">
                {prediction.orderType}
              </span>
              <span className="text-xs font-bold font-mono text-white mt-1 block">
                {prediction.entryZone.min.toFixed(marketOverview.digits)} - {prediction.entryZone.max.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* TP 1 */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block">TP 1</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                {prediction.tp1.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* TP 2 */}
            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
              <span className="text-[10px] font-mono text-emerald-400 font-semibold block">TP 2</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                {prediction.tp2.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* TP 3 */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-[10px] font-mono text-emerald-400 font-bold block">TP 3 TARGET</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-1 block">
                {prediction.tp3.toFixed(marketOverview.digits)}
              </span>
            </div>

            {/* Resistance */}
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <span className="text-[10px] font-mono text-red-400 font-semibold block">RESISTANCE</span>
              <span className="text-sm font-bold font-mono text-white mt-1 block">
                {prediction.resistance.toFixed(marketOverview.digits)}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#1D283D]/40 border border-[#1F2937] flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Forecast Path Invalidation:</span>
              <span className="text-slate-300 font-mono font-medium">{prediction.invalidation}</span>
            </div>
            <div className="font-mono text-blue-400 font-bold">
              R:R {prediction.riskReward}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
