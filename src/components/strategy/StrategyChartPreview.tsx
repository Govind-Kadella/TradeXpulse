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

  return (
    <div
      ref={containerRef}
      id="strategy-chart-preview-card"
      className={`bg-[#0E1526] border border-[#1B2537] rounded-xl overflow-hidden flex flex-col transition-all duration-200 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full'
      }`}
    >
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-[#1B2537] flex items-center justify-between bg-[#111A30]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-200 tracking-wide uppercase">
              Strategy Chart Preview
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
              {symbol}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {timeframe}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              {signalMarkers.length} Strategy Trigger{signalMarkers.length === 1 ? '' : 's'} Detected
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#162036] rounded-lg p-0.5 border border-[#24334D]">
            <button
              onClick={() => setVisibleBars(prev => Math.min(180, prev + 20))}
              title="Zoom out (more bars)"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] text-slate-400 font-mono">
              {visibleBars} bars
            </span>
            <button
              onClick={() => setVisibleBars(prev => Math.max(30, prev - 20))}
              title="Zoom in (fewer bars)"
              className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onRunBacktest && (
            <button
              onClick={onRunBacktest}
              disabled={isRunningBacktest}
              id="preview-run-backtest-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningBacktest ? 'animate-spin' : ''}`} />
              <span>{isRunningBacktest ? 'Simulating...' : 'Run Backtest'}</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Legend & Indicator Pills */}
      <div className="px-4 py-2 border-b border-[#162036] bg-[#0C1221] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>BUY Signal</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>SELL Signal</span>
          </div>
          {hasEma50 && (
            <div className="flex items-center gap-1.5 text-amber-400 font-mono">
              <span className="w-3 h-0.5 bg-amber-400" />
              <span>EMA 50</span>
            </div>
          )}
          {hasEma200 && (
            <div className="flex items-center gap-1.5 text-blue-400 font-mono">
              <span className="w-3 h-0.5 bg-blue-400" />
              <span>EMA 200</span>
            </div>
          )}
          {hasEma20 && (
            <div className="flex items-center gap-1.5 text-purple-400 font-mono">
              <span className="w-3 h-0.5 bg-purple-400" />
              <span>EMA 20</span>
            </div>
          )}
        </div>

        <div className="text-slate-400 flex items-center gap-2">
          <span>{strategy.conditionGroupLogic === 'ALL' ? 'ALL conditions must match' : 'ANY condition triggers'}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-400 font-mono">
            {visibleSignals.length} in view
          </span>
        </div>
      </div>

      {/* SVG Canvas Chart Area */}
      <div className="relative flex-1 min-h-[360px] bg-[#090E1A] overflow-hidden select-none">
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
                    x1={30}
                    y1={y}
                    x2={svgWidth - 55}
                    y2={y}
                    stroke="#162238"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={svgWidth - 50}
                    y={y + 4}
                    fill="#64748B"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {priceAtY.toFixed(meta.pricePrecision)}
                  </text>
                </g>
              );
            })}

            {/* EMA Line Overlays */}
            {hasEma200 && (
              <path
                d={getEmaPath(200)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.85"
              />
            )}
            {hasEma50 && (
              <path
                d={getEmaPath(50)}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.9"
              />
            )}
            {hasEma20 && (
              <path
                d={getEmaPath(20)}
                fill="none"
                stroke="#A855F7"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.8"
              />
            )}

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
                  {/* High - Low wick */}
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

            {/* Signal Markers & Badges */}
            {visibleSignals.map((sig, sIdx) => {
              const localIdx = sig.index - startIndex;
              const x = getX(localIdx);
              const isBuy = sig.type === 'BUY';
              const yAnchor = isBuy ? getY(sig.candle.low) + 16 : getY(sig.candle.high) - 16;
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
                  {/* Vertical highlight line on trigger bar */}
                  <line
                    x1={x}
                    y1={15}
                    x2={x}
                    y2={chartHeight}
                    stroke={isBuy ? '#10B981' : '#F43F5E'}
                    strokeWidth={isHovered ? '2' : '1'}
                    strokeDasharray="2 2"
                    opacity={isHovered ? '0.8' : '0.35'}
                  />

                  {/* Signal Icon & Pill */}
                  <g transform={`translate(${x}, ${yAnchor})`}>
                    {/* Pulsing ring on hover */}
                    {isHovered && (
                      <circle
                        r="18"
                        fill={isBuy ? '#10B981' : '#F43F5E'}
                        opacity="0.2"
                        className="animate-ping"
                      />
                    )}
                    {/* Main badge */}
                    <circle
                      r="12"
                      fill={isBuy ? '#064E3B' : '#881337'}
                      stroke={isBuy ? '#10B981' : '#F43F5E'}
                      strokeWidth="2"
                    />
                    <path
                      d={
                        isBuy
                          ? 'M -4 2 L 0 -3 L 4 2 Z'
                          : 'M -4 -2 L 0 3 L 4 -2 Z'
                      }
                      fill={isBuy ? '#10B981' : '#F43F5E'}
                    />
                  </g>

                  {/* Entry Price Tag */}
                  <text
                    x={x}
                    y={isBuy ? yAnchor + 22 : yAnchor - 14}
                    fill={isBuy ? '#34D399' : '#FB7185'}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {isBuy ? 'BUY' : 'SELL'} @ {sig.price.toFixed(meta.pricePrecision)}
                  </text>
                </g>
              );
            })}

            {/* Time labels on bottom axis */}
            {windowCandles.map((c, idx) => {
              if (idx % Math.max(5, Math.floor(windowCandles.length / 8)) !== 0) return null;
              const x = getX(idx);
              const date = new Date(c.time);
              const label = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              return (
                <text
                  key={`time-${idx}`}
                  x={x}
                  y={chartHeight + 20}
                  fill="#64748B"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {label}
                </text>
              );
            })}
          </svg>
        )}

        {/* Empty range notification */}
        {windowCandles.length > 0 && visibleSignals.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/60 text-slate-400 text-xs flex items-center gap-2 backdrop-blur-sm shadow-md">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>No strategy signals in visible range. Modify conditions or zoom out.</span>
          </div>
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

            {/* Condition checklist */}
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

            {/* Outcome if trade closed in backtest */}
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

      {/* Bottom Summary Bar */}
      <div className="px-4 py-2 border-t border-[#1B2537] bg-[#0E1526] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Strategy: <strong className="text-slate-200">{strategy.name}</strong>
          </span>
          <span className="text-slate-600">|</span>
          <span>
            Direction: <strong className="text-slate-200">{strategy.direction.replace(/_/g, ' ')}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-500">Execution:</span>
          <span className="text-slate-300 font-mono">Bar Close Confirmed → Next Bar Open</span>
        </div>
      </div>
    </div>
  );
};
