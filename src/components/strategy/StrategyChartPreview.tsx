import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Candle,
  StrategyDefinition,
  BacktestResult,
  MarketSymbol,
  Timeframe
} from '../../types';
import { StrategyEngine } from '../../services/strategyEngine';
import { MARKET_META } from '../../services/marketDataService';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Info,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface StrategyChartPreviewProps {
  candles: Candle[];
  strategy: StrategyDefinition;
  backtestResult?: BacktestResult | null;
  symbol: MarketSymbol;
  timeframe: Timeframe;
  onRunBacktest?: () => void;
  isRunningBacktest?: boolean;
}

interface SignalMarker {
  index: number;
  candle: Candle;
  type: 'BUY' | 'SELL';
  reasons: string[];
  passedCount: number;
  totalCount: number;
  price: number;
  exitTrade?: {
    exitPrice: number;
    exitTime: number;
    outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
    pnl: number;
    rMultiple: number;
    exitReason: string;
  };
}

export const StrategyChartPreview: React.FC<StrategyChartPreviewProps> = ({
  candles,
  strategy,
  backtestResult,
  symbol,
  timeframe,
  onRunBacktest,
  isRunningBacktest
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredSignal, setHoveredSignal] = useState<SignalMarker | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [visibleBars, setVisibleBars] = useState<number>(60);

  const meta = MARKET_META[symbol] || { pricePrecision: 2 };

  // Calculate indicator overlays according to strategy definition
  const indicatorSeries = useMemo(() => {
    if (candles.length === 0) return null;
    return StrategyEngine.calculateIndicators(candles);
  }, [candles]);

  const patternCache = useMemo(() => {
    if (candles.length === 0) return null;
    return StrategyEngine.buildPatternCache(candles, timeframe);
  }, [candles, timeframe]);

  // Find all signals on historical candles
  const signalMarkers = useMemo<SignalMarker[]>(() => {
    if (!indicatorSeries || candles.length < 15) return [];

    const signals: SignalMarker[] = [];
    for (let i = 15; i < candles.length; i++) {
      const evalBarIdx = i - 1;
      const res = StrategyEngine.evaluateEntry(strategy, candles, evalBarIdx, indicatorSeries, patternCache || undefined);

      if (res.isTriggered) {
        let dir: 'BUY' | 'SELL' = 'BUY';
        if (strategy.direction === 'LONG_ONLY') dir = 'BUY';
        else if (strategy.direction === 'SHORT_ONLY') dir = 'SELL';
        else {
          const rsiVal = StrategyEngine.getIndicatorValue(indicatorSeries, candles, evalBarIdx, 'RSI', 14);
          dir = rsiVal >= 50 ? 'BUY' : 'SELL';
        }

        // Link with backtest trade exit if available
        const matchedTrade = backtestResult?.trades.find(
          t => Math.abs(t.entryTime - candles[i].time) < 60000 || t.entryPrice === candles[i].open
        );

        signals.push({
          index: i,
          candle: candles[i],
          type: dir,
          reasons: res.reasons,
          passedCount: res.passedCount,
          totalCount: res.totalCount,
          price: candles[i].open,
          exitTrade: matchedTrade
            ? {
                exitPrice: matchedTrade.exitPrice,
                exitTime: matchedTrade.exitTime,
                outcome: matchedTrade.outcome,
                pnl: matchedTrade.pnl,
                rMultiple: matchedTrade.rMultiple,
                exitReason: matchedTrade.exitReason
              }
            : undefined
        });
      }
    }
    return signals;
  }, [candles, strategy, indicatorSeries, patternCache, backtestResult]);

  // Slicing visible window
  const windowCandles = useMemo(() => {
    if (candles.length <= visibleBars) return candles;
    return candles.slice(candles.length - visibleBars);
  }, [candles, visibleBars]);

  const startIndex = Math.max(0, candles.length - visibleBars);

  // Filter signals in visible window
  const visibleSignals = useMemo(() => {
    return signalMarkers.filter(s => s.index >= startIndex);
  }, [signalMarkers, startIndex]);

  // Min / Max price scaling
  const { minPrice, maxPrice, priceRange } = useMemo(() => {
    if (windowCandles.length === 0) return { minPrice: 1, maxPrice: 2, priceRange: 1 };
    let min = Infinity;
    let max = -Infinity;
    windowCandles.forEach(c => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
    });

    const padding = (max - min) * 0.12 || 1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      priceRange: (max + padding) - (min - padding)
    };
  }, [windowCandles]);

  // Indicators to draw
  const hasEma50 = strategy.entryConditions.some(c => c.indicator === 'EMA' && c.indicatorPeriod === 50 || c.targetIndicator === 'EMA' && c.targetIndicatorPeriod === 50);
  const hasEma200 = strategy.entryConditions.some(c => c.indicator === 'EMA' && c.indicatorPeriod === 200 || c.targetIndicator === 'EMA' && c.targetIndicatorPeriod === 200);
  const hasEma20 = strategy.entryConditions.some(c => c.indicator === 'EMA' && c.indicatorPeriod === 20 || c.targetIndicator === 'EMA' && c.targetIndicatorPeriod === 20);

  // SVG dimensions
  const svgWidth = 900;
  const svgHeight = 420;
  const chartHeight = 340;
  const barWidth = Math.max(4, Math.min(22, (svgWidth - 90) / windowCandles.length - 2));

  const getY = (val: number) => {
    return chartHeight - ((val - minPrice) / (priceRange || 1)) * (chartHeight - 30) - 15;
  };

  const getX = (localIdx: number) => {
    const total = windowCandles.length;
    const spacing = (svgWidth - 90) / Math.max(1, total);
    return 40 + localIdx * spacing + spacing / 2;
  };

  // Build EMA line paths
  const getEmaPath = (period: number) => {
    if (!indicatorSeries) return '';
    let path = '';
    windowCandles.forEach((_, idx) => {
      const globalIdx = startIndex + idx;
      const val = StrategyEngine.getIndicatorValue(indicatorSeries, candles, globalIdx, 'EMA', period);
      const x = getX(idx);
      const y = getY(val);
      if (idx === 0) path += `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  };

  const latestCandle = windowCandles[windowCandles.length - 1] || candles[candles.length - 1];
  const prevCandle = windowCandles.length > 1 ? windowCandles[windowCandles.length - 2] : candles[candles.length - 2];
  const priceChange = latestCandle && prevCandle ? latestCandle.close - prevCandle.close : 0;
  const priceChangePct = prevCandle && prevCandle.close ? (priceChange / prevCandle.close) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <div
      ref={containerRef}
      id="strategy-chart-preview-card"
      className={`bg-[#0E1526] border border-[#1B2537] rounded-xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* Top Header bar with Legend on the right matching STRATEGY BUILDER.png */}
      <div className="px-4 py-3 border-b border-[#1B2537] flex items-center justify-between bg-[#111A30]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-bold text-slate-100 tracking-wide">
            Strategy Chart Preview
          </h3>
        </div>

        {/* Legend right aligned */}
        <div className="flex items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Buy Signal</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Sell Signal</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-3.5 h-0.5 bg-cyan-400" />
            <span>EMA 50</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <span className="w-3.5 h-0.5 bg-amber-400" />
            <span>EMA 200</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-slate-700">
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1 text-slate-400 hover:text-slate-200 rounded"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Subheader bar matching STRATEGY BUILDER.png */}
      <div className="px-4 py-2 border-b border-[#162036] bg-[#0A101D] flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="font-bold text-slate-100">{symbol}</span>
          <span className="text-slate-500">·</span>
          <span>{timeframe.replace('M', '')}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">TradeXpulse</span>
        </div>

        {latestCandle && (
          <div className="flex items-center gap-3 text-slate-400">
            <span>O <strong className="text-slate-200 font-normal">{latestCandle.open.toFixed(meta.pricePrecision)}</strong></span>
            <span>H <strong className="text-slate-200 font-normal">{latestCandle.high.toFixed(meta.pricePrecision)}</strong></span>
            <span>L <strong className="text-slate-200 font-normal">{latestCandle.low.toFixed(meta.pricePrecision)}</strong></span>
            <span>C <strong className="text-slate-200 font-normal">{latestCandle.close.toFixed(meta.pricePrecision)}</strong></span>
            <span className={isUp ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {isUp ? '+' : ''}{priceChange.toFixed(meta.pricePrecision)} ({isUp ? '+' : ''}{priceChangePct.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* SVG Canvas Chart Area */}
      <div className="relative flex-1 min-h-[340px] bg-[#070C16] overflow-hidden select-none">
        {windowCandles.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Loading historical chart data...
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const y = chartHeight * ratio;
              const priceAtY = maxPrice - ratio * priceRange;
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={20}
                    y1={y}
                    x2={svgWidth - 65}
                    y2={y}
                    stroke="#162238"
                    strokeDasharray="2 2"
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth - 60}
                    y={y + 3}
                    fill="#64748B"
                    fontSize="9.5"
                    fontFamily="monospace"
                  >
                    {priceAtY.toFixed(meta.pricePrecision)}
                  </text>
                </g>
              );
            })}

            {/* EMA Line Overlays matching STRATEGY BUILDER.png (Cyan 50, Amber 200) */}
            <path
              d={getEmaPath(50)}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.95"
            />
            <path
              d={getEmaPath(200)}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.95"
            />

            {/* Candlesticks */}
            {windowCandles.map((c, idx) => {
              const x = getX(idx);
              const isBull = c.close >= c.open;
              const candleColor = isBull ? '#10B981' : '#F43F5E';
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(2, Math.abs(yClose - yOpen));

              return (
                <g key={`candle-${idx}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  {/* Real Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={bodyTop}
                    width={barWidth}
                    height={bodyHeight}
                    fill={isBull ? '#064E3B' : '#881337'}
                    stroke={candleColor}
                    strokeWidth="1"
                    rx="1"
                  />
                </g>
              );
            })}

            {/* Highlighted current price tag on the y-axis right side */}
            {latestCandle && (
              <g transform={`translate(${svgWidth - 65}, ${getY(latestCandle.close)})`}>
                <line x1={- (svgWidth - 85)} y1={0} x2={0} y2={0} stroke="#10B981" strokeDasharray="3 3" strokeWidth="1" opacity="0.6" />
                <rect x={0} y={-9} width={62} height={18} fill="#10B981" rx={3} />
                <text x={31} y={3} fill="#000000" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {latestCandle.close.toFixed(meta.pricePrecision)}
                </text>
              </g>
            )}

            {/* Signal Markers & Badges (Buy below candle, Sell above candle) */}
            {visibleSignals.map((sig, sIdx) => {
              const localIdx = sig.index - startIndex;
              const x = getX(localIdx);
              const isBuy = sig.type === 'BUY';
              const yAnchor = isBuy ? getY(sig.candle.low) + 20 : getY(sig.candle.high) - 20;
              const isHovered = hoveredSignal?.index === sig.index;

              return (
                <g
                  key={`sig-${sIdx}`}
                  className="cursor-pointer transition-transform"
                  onMouseEnter={e => {
                    setHoveredSignal(sig);
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (rect) {
                      setHoverPosition({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredSignal(null)}
                >
                  {/* Signal Tag Pill */}
                  <g transform={`translate(${x}, ${yAnchor})`}>
                    <rect
                      x={-16}
                      y={-8}
                      width={32}
                      height={16}
                      rx={8}
                      fill={isBuy ? '#10B981' : '#F43F5E'}
                    />
                    <text
                      x={0}
                      y={3.5}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isBuy ? 'Buy' : 'Sell'}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* Time labels on bottom axis */}
            {windowCandles.map((c, idx) => {
              if (idx % Math.max(6, Math.floor(windowCandles.length / 7)) !== 0) return null;
              const x = getX(idx);
              const date = new Date(c.time);
              const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              return (
                <text
                  key={`time-${idx}`}
                  x={x}
                  y={chartHeight + 18}
                  fill="#64748B"
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip: Detailed Rule Evaluation Checklist */}
        {hoveredSignal && hoverPosition && (
          <div
            id="strategy-signal-hover-card"
            className="absolute z-40 w-72 bg-[#0C1222] border border-cyan-500/40 rounded-xl p-3.5 shadow-2xl backdrop-blur-md pointer-events-none transition-all duration-150"
            style={{
              left: Math.min(window.innerWidth - 320, Math.max(20, hoverPosition.x - 140)),
              top: Math.max(10, hoverPosition.y - 170)
            }}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1E293B]">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                    hoveredSignal.type === 'BUY'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {hoveredSignal.type} Signal Confirmed
                </span>
                <span className="text-xs font-mono font-bold text-slate-100">
                  {hoveredSignal.price.toFixed(meta.pricePrecision)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(hoveredSignal.candle.time).toISOString().slice(11, 16)} UTC
              </span>
            </div>

            <div className="space-y-1.5 mb-2.5">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Trigger Verification Checklist ({hoveredSignal.passedCount}/{hoveredSignal.totalCount} conditions)
              </div>
              {hoveredSignal.reasons.map((reason, rIdx) => (
                <div key={`chk-${rIdx}`} className="flex items-start gap-1.5 text-xs text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-mono text-[11px] leading-tight text-slate-300">{reason}</span>
                </div>
              ))}
              {strategy.advancedOptions.useAiMarketBiasFilter && (
                <div className="flex items-center gap-1.5 text-xs text-cyan-300 pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-mono text-[11px]">AI Market Bias: Aligned</span>
                </div>
              )}
            </div>

            {hoveredSignal.exitTrade && (
              <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between text-xs">
                <span className="text-slate-400">Trade Result:</span>
                <span
                  className={`font-mono font-bold ${
                    hoveredSignal.exitTrade.outcome === 'WIN'
                      ? 'text-emerald-400'
                      : hoveredSignal.exitTrade.outcome === 'LOSS'
                      ? 'text-rose-400'
                      : 'text-slate-300'
                  }`}
                >
                  {hoveredSignal.exitTrade.outcome} ({hoveredSignal.exitTrade.pnl > 0 ? '+' : ''}${hoveredSignal.exitTrade.pnl.toFixed(2)} | {hoveredSignal.exitTrade.rMultiple > 0 ? '+' : ''}{hoveredSignal.exitTrade.rMultiple}R)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Chart Controls Toolbar matching STRATEGY BUILDER.png */}
      <div className="px-4 py-2 border-t border-[#1B2537] bg-[#0A101D] flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono">
        {/* Left time range options */}
        <div className="flex items-center gap-2">
          {['1D', '5D', '1M', '3M', '6M', '1Y', 'All'].map(t => (
            <button
              key={t}
              onClick={() => {
                if (t === '1D') setVisibleBars(30);
                else if (t === '5D') setVisibleBars(60);
                else if (t === '1M') setVisibleBars(120);
                else setVisibleBars(180);
              }}
              className={`px-1.5 py-0.5 rounded text-[11px] hover:text-slate-100 transition-colors ${
                (t === '5D' && visibleBars === 60) || (t === '1D' && visibleBars === 30)
                  ? 'text-cyan-400 font-bold bg-slate-800/80'
                  : 'text-slate-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Middle UTC Time */}
        <div className="text-[11px] text-slate-400">
          {new Date().toISOString().slice(11, 19)} (UTC)
        </div>

        {/* Right % log auto */}
        <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
          <span className="hover:text-slate-200 cursor-pointer">%</span>
          <span className="hover:text-slate-200 cursor-pointer">log</span>
          <span className="text-cyan-400 font-bold cursor-pointer">auto</span>
        </div>
      </div>
    </div>
  );
};
