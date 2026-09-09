import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  ZoomIn, 
  ZoomOut, 
  Crosshair, 
  RotateCcw, 
  Sparkles,
  History,
  Play,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers
} from 'lucide-react';
import { Candle } from '../types';

export const TradingChart: React.FC = () => {
  const {
    candles,
    marketOverview,
    prediction,
    activeBias,
    activeTimeframe,
    historicalAnalysis,
    connectionStatus,
    viewport,
    setViewport,
    loadMoreHistory,
    returnToLive,
    isHistoricalView,
    zoomIn,
    zoomOut,
    resetView,
    overlayConfig,
    toggleOverlay
  } = usePredictionState();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Dragging & Interaction State
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartFirstVisibleRef = useRef<number>(0);
  const lastClientXRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const dragVelocityRef = useRef<number>(0);
  const momentumRafRef = useRef<number | null>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredCandle, setHoveredCandle] = useState<Candle | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Touch tracking for pinch-to-zoom and gestures
  const touchDistanceRef = useRef<number | null>(null);
  const touchAnchorRatioRef = useRef<number>(0.5);

  // Responsive canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 520
  });

  // Track container resize smoothly with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Determine candle start and end index based on independent viewport
  const startBar = Math.max(0, Math.floor(viewport.firstVisibleIndex) - 2);
  const endBar = Math.min(candles.length - 1, Math.ceil(viewport.firstVisibleIndex + viewport.visibleBarCount) + 2);
  const visibleCandles = useMemo(() => candles.slice(startBar, endBar + 1), [candles, startBar, endBar]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvasDimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Padding for scales
    const paddingRight = 85; // price scale width
    const paddingBottom = 26; // time scale height
    const paddingTop = 32;
    const paddingLeft = 14;

    const plotWidth = width - paddingRight - paddingLeft;
    const plotHeight = height - paddingBottom - paddingTop;

    // Clear background with dark navy
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, width, height);

    if (visibleCandles.length === 0) return;

    // Unified Chart Viewport Coordinate Mapping
    const barSpacing = plotWidth / viewport.visibleBarCount;
    const candleWidth = Math.max(2, Math.min(22, barSpacing * 0.70));

    const candleToX = (globalIdx: number) => {
      return paddingLeft + (globalIdx - viewport.firstVisibleIndex) * barSpacing + barSpacing / 2;
    };

    const lastHistoricalCandleIndex = candles.length - 1;
    const liveFirstVisibleIndex = (lastHistoricalCandleIndex + viewport.rightOffsetBars) - viewport.visibleBarCount;
    const isAtLiveEdge = viewport.mode === 'LIVE' || (viewport.firstVisibleIndex >= liveFirstVisibleIndex - 1.2);

    const lastCandleX = candleToX(lastHistoricalCandleIndex);
    const liveCandle = candles[lastHistoricalCandleIndex];
    const liveClosePrice = liveCandle ? liveCandle.close : marketOverview.currentPrice;

    // Forecast region horizontal boundaries (starts strictly at latest candle, ends inside plot)
    const forecastStartX = lastCandleX + barSpacing * 0.5;
    const chartRightBoundary = paddingLeft + plotWidth;
    const forecastRightBoundary = Math.min(chartRightBoundary - 14, candleToX(lastHistoricalCandleIndex + viewport.rightOffsetBars));
    const actualForecastWidth = Math.max(10, forecastRightBoundary - forecastStartX);

    // Calculate Price Range from visible historical candles
    let minPrice = Math.min(...visibleCandles.map(c => c.low));
    let maxPrice = Math.max(...visibleCandles.map(c => c.high));

    // Include prediction levels in scale if viewing live edge or if forecast region is visible on screen
    if (isAtLiveEdge || (lastCandleX >= paddingLeft && lastCandleX <= chartRightBoundary)) {
      if (overlayConfig.showTargets && activeBias !== 'NO TRADE') {
        minPrice = Math.min(
          minPrice,
          prediction.stopLoss,
          prediction.tp1,
          prediction.tp2,
          prediction.tp3,
          prediction.entryZone.min,
          prediction.support
        );
        maxPrice = Math.max(
          maxPrice,
          prediction.stopLoss,
          prediction.tp1,
          prediction.tp2,
          prediction.tp3,
          prediction.entryZone.max,
          prediction.resistance
        );
      } else if (overlayConfig.showSupportResistance) {
        minPrice = Math.min(minPrice, prediction.support);
        maxPrice = Math.max(maxPrice, prediction.resistance);
      }
    }

    // Add 14% vertical padding so target labels, wicks, and arrowheads never touch canvas borders
    const priceRange = maxPrice - minPrice || 1;
    const paddedMin = minPrice - priceRange * 0.14;
    const paddedMax = maxPrice + priceRange * 0.14;
    const paddedRange = paddedMax - paddedMin;

    // Coordinate conversions
    const priceToY = (price: number) => {
      return paddingTop + plotHeight - ((price - paddedMin) / paddedRange) * plotHeight;
    };

    const yToPrice = (y: number) => {
      const fraction = (paddingTop + plotHeight - y) / plotHeight;
      return paddedMin + fraction * paddedRange;
    };

    // 1. Subtle Horizontal Price Grid Lines
    ctx.strokeStyle = 'rgba(31, 41, 55, 0.45)';
    ctx.lineWidth = 1;

    const horizontalDivisions = 7;
    for (let i = 0; i <= horizontalDivisions; i++) {
      const y = paddingTop + (plotHeight / horizontalDivisions) * i;
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(paddingLeft + plotWidth, y);
      ctx.stroke();

      // Price labels on right scale (outside plot area, non-colliding)
      const priceAtY = yToPrice(y);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceAtY.toFixed(marketOverview.digits), paddingLeft + plotWidth + 8, y + 3.5);
    }

    // Vertical Time Grid Lines
    const verticalDivisions = 6;
    for (let i = 0; i <= verticalDivisions; i++) {
      const x = paddingLeft + (plotWidth / verticalDivisions) * i;
      ctx.beginPath();
      ctx.moveTo(x, paddingTop);
      ctx.lineTo(x, paddingTop + plotHeight);
      ctx.stroke();
    }

    // 2. Region Distinction / Header Labels (Outside main clipped plot area)
    ctx.save();
    if (isAtLiveEdge) {
      // Historical label above chart
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.textAlign = 'left';
      ctx.fillText('◀ ACTUAL MARKET DATA (CANDLES)', paddingLeft + 6, paddingTop - 10);

      // Future Forecast Region header text
      if (overlayConfig.showForecastPath) {
        ctx.fillStyle = activeBias === 'BULLISH' ? '#34d399' : activeBias === 'BEARISH' ? '#f87171' : '#f59e0b';
        ctx.textAlign = 'right';
        ctx.fillText(`TRADEXPULSE FORECAST REGION (${activeBias}) ▶`, forecastRightBoundary, paddingTop - 10);
      }
    } else {
      // Historical replay banner
      const barsScrolled = Math.max(1, Math.round(liveFirstVisibleIndex - viewport.firstVisibleIndex));
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'left';
      ctx.fillText(`◀ HISTORICAL VIEW (Scrolled ${barsScrolled} bars back in time)`, paddingLeft + 6, paddingTop - 10);
    }
    ctx.restore();

    // =========================================================================
    // CHART PLOTTING AREA WITH STRICT BOUNDARY CLIPPING
    // Guarantees all candles, forecast regions, targets, and annotations NEVER
    // overflow outside [paddingLeft, paddingTop, plotWidth, plotHeight]
    // =========================================================================
    ctx.save();
    ctx.beginPath();
    ctx.rect(paddingLeft, paddingTop, plotWidth, plotHeight);
    ctx.clip();

    // 3. Draw Volume Bars at bottom
    if (overlayConfig.showVolume) {
      const maxVolume = Math.max(...visibleCandles.map(c => c.volume), 1);
      const maxVolHeight = plotHeight * 0.15;
      for (let i = startBar; i <= endBar; i++) {
        const c = candles[i];
        if (!c) continue;
        const x = candleToX(i);
        const isBull = c.close >= c.open;
        const volHeight = (c.volume / maxVolume) * maxVolHeight;
        ctx.fillStyle = isBull ? 'rgba(16, 185, 129, 0.16)' : 'rgba(239, 68, 68, 0.16)';
        ctx.fillRect(x - candleWidth / 2, paddingTop + plotHeight - volHeight, candleWidth, volHeight);
      }
    }

    // 4. Draw Historical Candlesticks (Historical market movement = actual candles)
    for (let i = startBar; i <= endBar; i++) {
      const candle = candles[i];
      if (!candle) continue;
      const x = candleToX(i);
      const isBull = candle.close >= candle.open;
      const openY = priceToY(candle.open);
      const closeY = priceToY(candle.close);
      const highY = priceToY(candle.high);
      const lowY = priceToY(candle.low);

      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.max(1.5, Math.abs(closeY - openY));

      // Wick
      ctx.strokeStyle = isBull ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Candle Body
      ctx.fillStyle = isBull ? '#10b981' : '#ef4444';
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);

      // Hover highlight ring
      if (hoveredIndex === i) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - candleWidth / 2 - 2, bodyTop - 2, candleWidth + 4, bodyHeight + 4);
      }
    }

    // 5. FORECAST VISUALIZATION (Begins ONLY from current/latest candle when viewing live edge)
    if (isAtLiveEdge && overlayConfig.showForecastPath) {
      // 5A. Vertical Divider Separator between Actual Market and Future Forecast
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(forecastStartX, paddingTop);
      ctx.lineTo(forecastStartX, paddingTop + plotHeight);
      ctx.stroke();
      ctx.setLineDash([]);

      // Vertical dividing subtle gradient bar
      const divGrad = ctx.createLinearGradient(forecastStartX, paddingTop, forecastStartX + 14, paddingTop);
      divGrad.addColorStop(0, 'rgba(59, 130, 246, 0.14)');
      divGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      ctx.fillStyle = divGrad;
      ctx.fillRect(forecastStartX, paddingTop, 14, plotHeight);

      // 5B. Dedicated Future Forecast Shaded Region
      if (activeBias === 'BULLISH') {
        // Bullish Forecast Region (Translucent Green Shading towards TP3)
        const zoneTop = priceToY(prediction.tp3);
        const zoneBottom = priceToY(prediction.stopLoss);
        const topY = Math.min(zoneTop, zoneBottom);
        const heightY = Math.max(16, Math.abs(zoneBottom - zoneTop));

        const bullGrad = ctx.createLinearGradient(forecastStartX, topY, forecastRightBoundary, topY + heightY);
        bullGrad.addColorStop(0, 'rgba(16, 185, 129, 0.07)');
        bullGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.03)');
        bullGrad.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

        ctx.fillStyle = bullGrad;
        ctx.fillRect(forecastStartX, topY, actualForecastWidth, heightY);

        // Subtle boundary outline for the forecast region
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(forecastStartX, topY, actualForecastWidth, heightY);
        ctx.setLineDash([]);

        // Watermark label in background of forecast region
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
        ctx.textAlign = 'left';
        ctx.fillText('BULLISH PROJECTION ZONE', forecastStartX + 12, topY + 16);
        ctx.fillText(`CONFIDENCE: ${prediction.confidence}%`, forecastStartX + 12, topY + 28);
      } else if (activeBias === 'BEARISH') {
        // Bearish Forecast Region (Translucent Red Shading towards TP3)
        const zoneTop = priceToY(prediction.stopLoss);
        const zoneBottom = priceToY(prediction.tp3);
        const topY = Math.min(zoneTop, zoneBottom);
        const heightY = Math.max(16, Math.abs(zoneBottom - zoneTop));

        const bearGrad = ctx.createLinearGradient(forecastStartX, topY, forecastRightBoundary, topY + heightY);
        bearGrad.addColorStop(0, 'rgba(239, 68, 68, 0.07)');
        bearGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.03)');
        bearGrad.addColorStop(1, 'rgba(239, 68, 68, 0.01)');

        ctx.fillStyle = bearGrad;
        ctx.fillRect(forecastStartX, topY, actualForecastWidth, heightY);

        // Subtle boundary outline
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(forecastStartX, topY, actualForecastWidth, heightY);
        ctx.setLineDash([]);

        // Watermark label in background of forecast region
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.textAlign = 'left';
        ctx.fillText('BEARISH PROJECTION ZONE', forecastStartX + 12, topY + 16);
        ctx.fillText(`CONFIDENCE: ${prediction.confidence}%`, forecastStartX + 12, topY + 28);
      } else {
        // Neutral "NO TRADE / WAIT FOR CONFIRMATION" state
        const supY = priceToY(prediction.support);
        const resY = priceToY(prediction.resistance);
        const top = Math.min(supY, resY);
        const height = Math.abs(supY - resY) || 30;

        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.fillRect(forecastStartX, top, actualForecastWidth, height);

        ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(forecastStartX, top, actualForecastWidth, height);
        ctx.setLineDash([]);

        // Centered badge inside forecast region
        ctx.fillStyle = 'rgba(14, 20, 33, 0.9)';
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
        ctx.lineWidth = 1;
        const boxW = Math.min(220, actualForecastWidth - 16);
        const boxX = forecastStartX + 8;
        const boxY = top + height / 2 - 14;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, 28, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.fillText('NO TRADE / WAIT FOR CONFIRMATION', boxX + 8, boxY + 12);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px JetBrains Mono, monospace';
        ctx.fillText('EQUILIBRIUM COMPRESSION • NO EDGE', boxX + 8, boxY + 22);
      }

      // Safe vertical clamping helper to guarantee all elements stay inside the chart
      const clampY = (yVal: number) => Math.max(paddingTop + 14, Math.min(paddingTop + plotHeight - 14, yVal));

      // Calculate Target Badges Geometry (docked on the right side of forecast region)
      const badgeWidth = Math.min(94, Math.max(72, actualForecastWidth * 0.28));
      const badgeX = forecastRightBoundary - badgeWidth;

      // 5C. Entry Zone Horizontal Shaded Rectangle
      if (overlayConfig.showEntryZone && activeBias !== 'NO TRADE') {
        const entryMinY = priceToY(prediction.entryZone.min);
        const entryMaxY = priceToY(prediction.entryZone.max);
        const zoneTop = Math.min(entryMinY, entryMaxY);
        const zoneHeight = Math.max(8, Math.abs(entryMinY - entryMaxY));
        const isBuy = prediction.orderType === 'BUY LIMIT';

        // Horizontal shaded rectangle spanning the forecast area up to badges
        ctx.fillStyle = isBuy ? 'rgba(59, 130, 246, 0.10)' : 'rgba(239, 68, 68, 0.10)';
        ctx.fillRect(forecastStartX, zoneTop, badgeX - forecastStartX - 4, zoneHeight);

        // Dashed horizontal boundary borders
        ctx.strokeStyle = isBuy ? 'rgba(59, 130, 246, 0.65)' : 'rgba(239, 68, 68, 0.65)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(forecastStartX, zoneTop);
        ctx.lineTo(badgeX - 4, zoneTop);
        ctx.moveTo(forecastStartX, zoneTop + zoneHeight);
        ctx.lineTo(badgeX - 4, zoneTop + zoneHeight);
        ctx.stroke();
        ctx.setLineDash([]);

        // Entry zone label inside the zone (on the left of forecast window)
        const entryLabel = `${isBuy ? 'BUY LIMIT' : 'SELL LIMIT'} [${prediction.entryZone.min.toFixed(marketOverview.digits)} - ${prediction.entryZone.max.toFixed(marketOverview.digits)}]`;
        ctx.font = 'bold 8.5px JetBrains Mono, monospace';
        const entryTextWidth = ctx.measureText(entryLabel).width;
        const entryBadgeW = Math.min(entryTextWidth + 12, Math.max(50, actualForecastWidth * 0.45));

        ctx.fillStyle = 'rgba(14, 20, 33, 0.92)';
        ctx.strokeStyle = isBuy ? 'rgba(59, 130, 246, 0.6)' : 'rgba(239, 68, 68, 0.6)';
        ctx.lineWidth = 1;
        const entryBadgeY = zoneHeight >= 16 ? zoneTop + 2 : zoneTop - 14;
        ctx.beginPath();
        ctx.roundRect(forecastStartX + 8, entryBadgeY, entryBadgeW, 14, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isBuy ? '#60a5fa' : '#f87171';
        ctx.textAlign = 'left';
        ctx.fillText(entryLabel, forecastStartX + 12, entryBadgeY + 10);
      }

      // 5D. TRADEXPULSE DIRECTIONAL ANGULAR FORECAST ARROW
      // Straight technical-analysis projection segments with sharp corners at turning points.
      // NO CURVES / NO BEZIER / NO SPLINES: Connected straight line segments.
      // Progression: Current Price -> Entry Zone -> TP1 -> Retest -> TP2 -> TP3 (Arrowhead).
      if (activeBias !== 'NO TRADE') {
        const arrowStartX = forecastStartX;
        const arrowEndX = badgeX - 16;
        const arrowSpan = Math.max(30, arrowEndX - arrowStartX);

        const entryPrice = (prediction.entryZone.min + prediction.entryZone.max) / 2;
        const isBull = activeBias === 'BULLISH';

        // Intermediate Retest level for realistic market wave progression
        const retestPrice = isBull
          ? prediction.tp1 - (prediction.tp1 - entryPrice) * 0.32
          : prediction.tp1 + (entryPrice - prediction.tp1) * 0.32;

        interface Waypoint {
          x: number;
          y: number;
          label: string;
        }

        const waypoints: Waypoint[] = [
          { x: arrowStartX, y: clampY(priceToY(liveClosePrice)), label: '' },
          { x: arrowStartX + arrowSpan * 0.18, y: clampY(priceToY(entryPrice)), label: 'ENTRY' },
          { x: arrowStartX + arrowSpan * 0.42, y: clampY(priceToY(prediction.tp1)), label: 'TP1' },
          { x: arrowStartX + arrowSpan * 0.60, y: clampY(priceToY(retestPrice)), label: 'RETEST' },
          { x: arrowStartX + arrowSpan * 0.80, y: clampY(priceToY(prediction.tp2)), label: 'TP2' },
          { x: arrowEndX, y: clampY(priceToY(prediction.tp3)), label: 'TP3' }
        ];

        // Final vector calculation for sharp directional arrowhead pointing to TP3
        const p4 = waypoints[4];
        const p5 = waypoints[5];
        const dx = p5.x - p4.x;
        const dy = p5.y - p4.y;
        const angle = Math.atan2(dy, dx);
        const headLength = 12;
        const headSpread = Math.PI / 6.2; // ~29 degrees

        const tipX = p5.x;
        const tipY = p5.y;
        const leftX = tipX - headLength * Math.cos(angle - headSpread);
        const leftY = tipY - headLength * Math.sin(angle - headSpread);
        const rightX = tipX - headLength * Math.cos(angle + headSpread);
        const rightY = tipY - headLength * Math.sin(angle + headSpread);
        const notchX = tipX - headLength * 0.70 * Math.cos(angle);
        const notchY = tipY - headLength * 0.70 * Math.sin(angle);

        // 1. Subtle glowing underlay along straight angular segments
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.20)';
        ctx.lineWidth = 5;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 3;
        ctx.beginPath();
        ctx.moveTo(waypoints[0].x, waypoints[0].y);
        ctx.lineTo(waypoints[1].x, waypoints[1].y);
        ctx.lineTo(waypoints[2].x, waypoints[2].y);
        ctx.lineTo(waypoints[3].x, waypoints[3].y);
        ctx.lineTo(waypoints[4].x, waypoints[4].y);
        ctx.lineTo(notchX, notchY);
        ctx.stroke();

        // 2. Main technical projection path: Straight angular dashed segments with sharp corners
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2.2;
        ctx.lineJoin = 'miter';
        ctx.miterLimit = 3;
        ctx.setLineDash([7, 3]);
        ctx.beginPath();
        ctx.moveTo(waypoints[0].x, waypoints[0].y);
        ctx.lineTo(waypoints[1].x, waypoints[1].y);
        ctx.lineTo(waypoints[2].x, waypoints[2].y);
        ctx.lineTo(waypoints[3].x, waypoints[3].y);
        ctx.lineTo(waypoints[4].x, waypoints[4].y);
        ctx.lineTo(notchX, notchY);
        ctx.stroke();
        ctx.setLineDash([]);

        // 3. Crisp sharp Directional Arrowhead at TP3
        ctx.fillStyle = '#3B82F6';
        ctx.strokeStyle = '#93C5FD';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(leftX, leftY);
        ctx.lineTo(notchX, notchY);
        ctx.lineTo(rightX, rightY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 4. Waypoint corner markers and labels along the angular forecast path
        const intermediateWaypoints = [waypoints[1], waypoints[2], waypoints[3], waypoints[4]];
        intermediateWaypoints.forEach(pt => {
          // Circular waypoint ring at the corner
          ctx.fillStyle = '#0A0E17';
          ctx.strokeStyle = '#60A5FA';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Center bead
          ctx.fillStyle = '#93C5FD';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Waypoint text label
          if (pt.label && arrowSpan > 110) {
            ctx.font = 'bold 8px JetBrains Mono, monospace';
            ctx.fillStyle = '#93C5FD';
            ctx.textAlign = 'center';
            const labelY = (pt.label === 'ENTRY' || pt.label === 'RETEST')
              ? (isBull ? pt.y + 11 : pt.y - 7)
              : (isBull ? pt.y - 7 : pt.y + 11);
            ctx.fillText(pt.label, pt.x, labelY);
          }
        });
      }

      // 5E. Horizontal Target Levels (TP1, TP2, TP3, Stop Loss) with Anti-Collision Engine
      if (overlayConfig.showTargets && activeBias !== 'NO TRADE') {
        interface TargetBadgeItem {
          id: string;
          tag: string;
          price: number;
          actualY: number;
          renderedY: number;
          textColor: string;
          bgColor: string;
          borderColor: string;
        }

        const rawTargets: TargetBadgeItem[] = [
          {
            id: 'tp3',
            tag: 'TP3',
            price: prediction.tp3,
            actualY: priceToY(prediction.tp3),
            renderedY: priceToY(prediction.tp3),
            textColor: '#34d399',
            bgColor: '#064e3b',
            borderColor: '#10b981'
          },
          {
            id: 'tp2',
            tag: 'TP2',
            price: prediction.tp2,
            actualY: priceToY(prediction.tp2),
            renderedY: priceToY(prediction.tp2),
            textColor: '#34d399',
            bgColor: '#064e3b',
            borderColor: '#10b981'
          },
          {
            id: 'tp1',
            tag: 'TP1',
            price: prediction.tp1,
            actualY: priceToY(prediction.tp1),
            renderedY: priceToY(prediction.tp1),
            textColor: '#34d399',
            bgColor: '#064e3b',
            borderColor: '#10b981'
          },
          {
            id: 'sl',
            tag: 'STOP LOSS',
            price: prediction.stopLoss,
            actualY: priceToY(prediction.stopLoss),
            renderedY: priceToY(prediction.stopLoss),
            textColor: '#fca5a5',
            bgColor: '#450a0a',
            borderColor: '#ef4444'
          }
        ];

        // Draw horizontal dashed lines across the forecast region
        rawTargets.forEach(t => {
          // Subtle extension line into historical candles for context
          ctx.strokeStyle = t.id === 'sl' ? 'rgba(239, 68, 68, 0.14)' : 'rgba(16, 185, 129, 0.14)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(paddingLeft, t.actualY);
          ctx.lineTo(forecastStartX, t.actualY);
          ctx.stroke();

          // Prominent horizontal dashed line inside future forecast region up to badges
          ctx.strokeStyle = t.borderColor;
          ctx.lineWidth = t.id === 'tp3' ? 1.4 : 1.1;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(forecastStartX, t.actualY);
          ctx.lineTo(badgeX - 4, t.actualY);
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // ---------------------------------------------------------------------
        // AUTOMATIC LABEL COLLISION PREVENTION ENGINE
        // Guarantees labels never overlap each other, never exceed plot area,
        // and draw clean connector hairlines when shifted from close levels
        // ---------------------------------------------------------------------
        const sortedTargets = [...rawTargets].sort((a, b) => a.actualY - b.actualY);
        const minGap = 19; // 16px badge height + 3px gap

        // Downward pass to prevent vertical overlap
        for (let i = 1; i < sortedTargets.length; i++) {
          if (sortedTargets[i].renderedY - sortedTargets[i - 1].renderedY < minGap) {
            sortedTargets[i].renderedY = sortedTargets[i - 1].renderedY + minGap;
          }
        }

        // Upward clamp to guarantee bottom badge stays inside chart plot boundary
        const maxAllowedY = paddingTop + plotHeight - 14;
        if (sortedTargets[sortedTargets.length - 1].renderedY > maxAllowedY) {
          const shiftUp = sortedTargets[sortedTargets.length - 1].renderedY - maxAllowedY;
          for (let i = sortedTargets.length - 1; i >= 0; i--) {
            sortedTargets[i].renderedY -= shiftUp;
          }
        }

        // Clamp top badge to stay below top border
        const minAllowedY = paddingTop + 14;
        if (sortedTargets[0].renderedY < minAllowedY) {
          const shiftDown = minAllowedY - sortedTargets[0].renderedY;
          for (let i = 0; i < sortedTargets.length; i++) {
            sortedTargets[i].renderedY += shiftDown;
          }
        }

        // Render clean inside-chart badges on the right side of the forecast area
        sortedTargets.forEach(t => {
          const badgeY = t.renderedY - 8;

          // If label was shifted by anti-collision, draw subtle connecting hairline
          if (Math.abs(t.renderedY - t.actualY) > 3) {
            ctx.strokeStyle = t.borderColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 2]);
            ctx.beginPath();
            ctx.moveTo(badgeX - 4, t.actualY);
            ctx.lineTo(badgeX, t.renderedY);
            ctx.stroke();
            ctx.setLineDash([]);
          }

          // Badge pill container
          ctx.fillStyle = t.bgColor;
          ctx.strokeStyle = t.borderColor;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeWidth, 16, 3);
          ctx.fill();
          ctx.stroke();

          // Left tag (e.g. TP1, TP2, TP3, SL)
          ctx.fillStyle = t.textColor;
          ctx.font = 'bold 8.5px JetBrains Mono, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(t.tag, badgeX + 5, t.renderedY + 3.5);

          // Right price number
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8.5px JetBrains Mono, monospace';
          ctx.textAlign = 'right';
          ctx.fillText(t.price.toFixed(marketOverview.digits), badgeX + badgeWidth - 5, t.renderedY + 3.5);
        });
      }
    }

    // 5E. Support and Resistance Lines & Labels (Kept strictly inside the chart)
    if (overlayConfig.showSupportResistance) {
      // Resistance Line
      const resY = priceToY(prediction.resistance);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, resY);
      ctx.lineTo(paddingLeft + plotWidth, resY);
      ctx.stroke();

      // Support Line
      const supY = priceToY(prediction.support);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.65)';
      ctx.beginPath();
      ctx.moveTo(paddingLeft, supY);
      ctx.lineTo(paddingLeft + plotWidth, supY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Position Resistance and Support labels cleanly on the LEFT to prevent any collision with right TP labels
      const resLabel = `RESISTANCE ${prediction.resistance.toFixed(marketOverview.digits)}`;
      ctx.font = 'bold 8.5px JetBrains Mono, monospace';
      const resW = ctx.measureText(resLabel).width + 10;
      ctx.fillStyle = '#0E1421';
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(paddingLeft + 8, resY - 8, resW, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fca5a5';
      ctx.textAlign = 'left';
      ctx.fillText(resLabel, paddingLeft + 13, resY + 3.5);

      const supLabel = `STRONG SUPPORT ${prediction.support.toFixed(marketOverview.digits)}`;
      const supW = ctx.measureText(supLabel).width + 10;
      ctx.fillStyle = '#0E1421';
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(paddingLeft + 8, supY - 8, supW, 16, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'left';
      ctx.fillText(supLabel, paddingLeft + 13, supY + 3.5);
    }

    // 5F. Liquidity Pools (PDH, PDL, Session Extremes, EQH/EQL)
    if (prediction.liquidityLevels && prediction.liquidityLevels.length > 0 && overlayConfig.showHistoricalLevels) {
      prediction.liquidityLevels.slice(0, 5).forEach((liq, lIdx) => {
        const liqY = priceToY(liq.price);
        if (liqY >= paddingTop && liqY <= paddingTop + plotHeight) {
          ctx.strokeStyle = liq.swept 
            ? 'rgba(100, 116, 139, 0.35)' 
            : (liq.side === 'BUY_SIDE' ? 'rgba(245, 158, 11, 0.65)' : 'rgba(56, 189, 248, 0.65)');
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(paddingLeft, liqY);
          ctx.lineTo(paddingLeft + plotWidth, liqY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Label
          const labelText = `${liq.label} ${liq.swept ? '(SWEPT)' : ''}`;
          ctx.font = 'bold 8px JetBrains Mono, monospace';
          const lw = ctx.measureText(labelText).width + 8;
          ctx.fillStyle = '#0E1421';
          ctx.strokeStyle = liq.side === 'BUY_SIDE' ? '#f59e0b' : '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(paddingLeft + plotWidth - lw - 10, liqY - 7, lw, 14, 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = liq.side === 'BUY_SIDE' ? '#fcd34d' : '#7dd3fc';
          ctx.textAlign = 'right';
          ctx.fillText(labelText, paddingLeft + plotWidth - 14, liqY + 3);
        }
      });
    }

    // 6. Current Price Level Line and Live Beacon (Inside Plot Area)
    if (isAtLiveEdge) {
      const currentY = priceToY(liveClosePrice);
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, currentY);
      ctx.lineTo(paddingLeft + plotWidth, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing beacon at latest live candle node
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.arc(lastCandleX, currentY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Faint beacon ring
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lastCandleX, currentY, 6.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Off-screen historical reference line
      const histLastClose = visibleCandles[visibleCandles.length - 1]?.close || marketOverview.currentPrice;
      const histY = priceToY(histLastClose);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, histY);
      ctx.lineTo(paddingLeft + plotWidth, histY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Interactive Crosshair Lines (clipped inside plot)
    if (overlayConfig.showCrosshair && mousePos && mousePos.x >= paddingLeft && mousePos.x <= paddingLeft + plotWidth && mousePos.y >= paddingTop && mousePos.y <= paddingTop + plotHeight) {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical crosshair
      ctx.beginPath();
      ctx.moveTo(mousePos.x, paddingTop);
      ctx.lineTo(mousePos.x, paddingTop + plotHeight);
      ctx.stroke();

      // Horizontal crosshair
      ctx.beginPath();
      ctx.moveTo(paddingLeft, mousePos.y);
      ctx.lineTo(paddingLeft + plotWidth, mousePos.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // RESTORE CLIPPING CONTEXT — Return to full canvas
    ctx.restore();

    // =========================================================================
    // EXTERIOR SCALES & AXIS MARKERS (Drawn outside plot area)
    // =========================================================================

    // Current Price Marker Badge on the Right Price Axis (Dedicated space)
    if (isAtLiveEdge) {
      const currentY = priceToY(liveClosePrice);
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(paddingLeft + plotWidth + 2, currentY - 9, paddingRight - 8, 18, 3);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(liveClosePrice.toFixed(marketOverview.digits), paddingLeft + plotWidth + (paddingRight - 8) / 2 + 2, currentY + 3.5);
    } else {
      const histLastClose = candles[Math.min(candles.length - 1, endBar)]?.close || marketOverview.currentPrice;
      const histY = priceToY(histLastClose);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(paddingLeft + plotWidth + 2, histY - 8, paddingRight - 8, 16, 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(histLastClose.toFixed(marketOverview.digits), paddingLeft + plotWidth + (paddingRight - 8) / 2 + 2, histY + 3.5);
    }

    // Time Scale at Bottom
    ctx.fillStyle = '#64748b';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    const barInterval = Math.max(1, Math.round(viewport.visibleBarCount / 7));
    const firstLabeledBar = Math.floor(viewport.firstVisibleIndex / barInterval) * barInterval;
    const lastLabeledBar = Math.ceil((viewport.firstVisibleIndex + viewport.visibleBarCount) / barInterval) * barInterval;

    for (let b = firstLabeledBar; b <= lastLabeledBar; b += barInterval) {
      if (b >= 0 && b < candles.length) {
        const c = candles[b];
        const x = candleToX(b);
        if (x >= paddingLeft + 15 && x <= paddingLeft + plotWidth - 15) {
          const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          ctx.fillText(timeStr, x, height - 8);
        }
      }
    }
    if (isAtLiveEdge && overlayConfig.showForecastPath && actualForecastWidth > 50) {
      ctx.fillStyle = activeBias === 'BULLISH' ? '#10b981' : activeBias === 'BEARISH' ? '#ef4444' : '#f59e0b';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText('FUTURE FORECAST REGION', forecastStartX + actualForecastWidth / 2, height - 8);
    }

    // Floating Crosshair Tags on Axes
    if (overlayConfig.showCrosshair && mousePos && mousePos.x >= paddingLeft && mousePos.x <= paddingLeft + plotWidth && mousePos.y >= paddingTop && mousePos.y <= paddingTop + plotHeight) {
      // Floating price tag on right scale
      const hoveredPrice = yToPrice(mousePos.y);
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(paddingLeft + plotWidth + 2, mousePos.y - 8, paddingRight - 8, 16, 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f1f5f9';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hoveredPrice.toFixed(marketOverview.digits), paddingLeft + plotWidth + (paddingRight - 8) / 2 + 2, mousePos.y + 3.5);

      // Bottom floating time tag
      const hoveredBar = Math.floor(viewport.firstVisibleIndex + (mousePos.x - paddingLeft - barSpacing / 2) / barSpacing);
      if (hoveredBar >= 0 && hoveredBar < candles.length) {
        const c = candles[hoveredBar];
        const timeStr = new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mousePos.x - 26, height - 20, 52, 16, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, mousePos.x, height - 8);
      }
    }

  }, [
    canvasDimensions,
    visibleCandles,
    candles,
    marketOverview,
    prediction,
    activeBias,
    activeTimeframe,
    viewport,
    mousePos,
    hoveredIndex,
    overlayConfig
  ]);

  const stopMomentum = () => {
    if (momentumRafRef.current !== null) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
  };

  // Mouse pan & drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    stopMomentum();
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartFirstVisibleRef.current = viewport.firstVisibleIndex;
    lastClientXRef.current = e.clientX;
    lastDragTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const paddingLeft = 14;
    const paddingRight = 85;
    const plotWidth = canvasDimensions.width - paddingRight - paddingLeft;
    const barSpacing = plotWidth / viewport.visibleBarCount;

    // Detect hovered candle for OHLC inspection
    const hoveredBar = Math.floor(viewport.firstVisibleIndex + (x - paddingLeft) / barSpacing);
    if (hoveredBar >= 0 && hoveredBar < candles.length) {
      setHoveredCandle(candles[hoveredBar]);
      setHoveredIndex(hoveredBar);
    } else {
      setHoveredCandle(null);
      setHoveredIndex(null);
    }

    // Professional 1:1 direct pointer drag interaction:
    // Dragging RIGHT (e.clientX > dragStartX) -> moves candles right, revealing older history -> firstVisibleIndex decreases
    // Dragging LEFT (e.clientX < dragStartX) -> moves candles left, revealing newer candles -> firstVisibleIndex increases
    if (isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(1, now - lastDragTimeRef.current);
      const instantVelocity = (e.clientX - lastClientXRef.current) / dt;
      dragVelocityRef.current = instantVelocity * 0.7 + dragVelocityRef.current * 0.3;
      lastClientXRef.current = e.clientX;
      lastDragTimeRef.current = now;

      const totalDx = e.clientX - dragStartXRef.current;
      const barsMoved = totalDx / barSpacing;
      let targetFirst = dragStartFirstVisibleRef.current - barsMoved;

      const lastCandleIndex = candles.length - 1;
      const liveFirst = (lastCandleIndex + viewport.rightOffsetBars) - viewport.visibleBarCount;

      // Clean snap to live edge if dragged near the current live bar
      if (targetFirst >= liveFirst - 0.8) {
        setViewport(prev => ({
          ...prev,
          firstVisibleIndex: liveFirst,
          mode: 'LIVE',
          isFollowingLive: true
        }));
      } else {
        setViewport(prev => ({
          ...prev,
          firstVisibleIndex: targetFirst,
          mode: 'HISTORICAL',
          isFollowingLive: false
        }));

        // Seamlessly prepend older bars if scrolled near left edge
        if (targetFirst < 15) {
          loadMoreHistory();
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    isDraggingRef.current = false;

    // Smooth inertial momentum deceleration if flicked
    if (Math.abs(dragVelocityRef.current) > 0.25) {
      let vel = dragVelocityRef.current;
      let lastTime = performance.now();

      const runMomentum = (now: number) => {
        const dt = Math.min(32, now - lastTime);
        lastTime = now;
        vel *= 0.92;

        if (Math.abs(vel) > 0.04) {
          const paddingLeft = 14;
          const paddingRight = 85;
          const plotWidth = canvasDimensions.width - paddingRight - paddingLeft;
          const barSpacing = plotWidth / viewport.visibleBarCount;
          const barsShift = (vel * dt) / barSpacing;

          setViewport(prev => {
            const lastCandleIndex = candles.length - 1;
            const liveFirst = (lastCandleIndex + prev.rightOffsetBars) - prev.visibleBarCount;
            const nextFirst = prev.firstVisibleIndex - barsShift;

            if (nextFirst >= liveFirst - 0.8) {
              stopMomentum();
              return {
                ...prev,
                firstVisibleIndex: liveFirst,
                mode: 'LIVE',
                isFollowingLive: true
              };
            }

            if (nextFirst < 15) {
              loadMoreHistory();
            }

            return {
              ...prev,
              firstVisibleIndex: nextFirst,
              mode: 'HISTORICAL',
              isFollowingLive: false
            };
          });

          momentumRafRef.current = requestAnimationFrame(runMomentum);
        } else {
          stopMomentum();
        }
      };

      momentumRafRef.current = requestAnimationFrame(runMomentum);
    }
    dragVelocityRef.current = 0;
  };

  // Multi-touch gestures (1-finger pan, 2-finger anchor-centered pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    stopMomentum();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      isDraggingRef.current = true;
      dragStartXRef.current = t.clientX;
      dragStartFirstVisibleRef.current = viewport.firstVisibleIndex;
      lastClientXRef.current = t.clientX;
      lastDragTimeRef.current = performance.now();
      dragVelocityRef.current = 0;
      touchDistanceRef.current = null;
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      isDraggingRef.current = false;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      touchDistanceRef.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const midX = (t1.clientX + t2.clientX) / 2 - rect.left;
        const plotWidth = canvasDimensions.width - 85 - 14;
        touchAnchorRatioRef.current = Math.max(0.05, Math.min(0.95, (midX - 14) / plotWidth));
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const x = t.clientX - rect.left;
      const y = t.clientY - rect.top;
      setMousePos({ x, y });

      const paddingLeft = 14;
      const paddingRight = 85;
      const plotWidth = canvasDimensions.width - paddingRight - paddingLeft;
      const barSpacing = plotWidth / viewport.visibleBarCount;

      const hoveredBar = Math.floor(viewport.firstVisibleIndex + (x - paddingLeft) / barSpacing);
      if (hoveredBar >= 0 && hoveredBar < candles.length) {
        setHoveredCandle(candles[hoveredBar]);
        setHoveredIndex(hoveredBar);
      }

      if (isDraggingRef.current) {
        const totalDx = t.clientX - dragStartXRef.current;
        const barsMoved = totalDx / barSpacing;
        let targetFirst = dragStartFirstVisibleRef.current - barsMoved;

        const lastCandleIndex = candles.length - 1;
        const liveFirst = (lastCandleIndex + viewport.rightOffsetBars) - viewport.visibleBarCount;

        if (targetFirst >= liveFirst - 0.8) {
          setViewport(prev => ({
            ...prev,
            firstVisibleIndex: liveFirst,
            mode: 'LIVE',
            isFollowingLive: true
          }));
        } else {
          setViewport(prev => ({
            ...prev,
            firstVisibleIndex: targetFirst,
            mode: 'HISTORICAL',
            isFollowingLive: false
          }));

          if (targetFirst < 15) {
            loadMoreHistory();
          }
        }
      }
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = touchDistanceRef.current / dist;

      if (Math.abs(dist - touchDistanceRef.current) > 4) {
        const anchorRatio = touchAnchorRatioRef.current;
        setViewport(prev => {
          const newVisible = Math.max(16, Math.min(240, Math.round(prev.visibleBarCount * (ratio > 1 ? 1.05 : 0.95))));
          const anchorIndex = prev.firstVisibleIndex + anchorRatio * prev.visibleBarCount;
          let newFirst = anchorIndex - anchorRatio * newVisible;

          const lastCandleIndex = candles.length - 1;
          const liveFirst = (lastCandleIndex + prev.rightOffsetBars) - newVisible;

          if (prev.isFollowingLive || newFirst >= liveFirst - 1.0) {
            return {
              ...prev,
              visibleBarCount: newVisible,
              firstVisibleIndex: liveFirst,
              mode: 'LIVE',
              isFollowingLive: true
            };
          }

          return {
            ...prev,
            visibleBarCount: newVisible,
            firstVisibleIndex: newFirst,
            mode: 'HISTORICAL',
            isFollowingLive: false
          };
        });
        touchDistanceRef.current = dist;
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
  };

  // Mouse wheel: horizontal pan on deltaX / shiftKey; cursor-centered zoom on vertical wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopMomentum();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const paddingLeft = 14;
    const paddingRight = 85;
    const plotWidth = canvasDimensions.width - paddingRight - paddingLeft;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) {
      // Horizontal swipe pan
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      const barSpacing = plotWidth / viewport.visibleBarCount;
      const barsShift = (delta * 0.45) / barSpacing;

      setViewport(prev => {
        const lastCandleIndex = candles.length - 1;
        const liveFirst = (lastCandleIndex + prev.rightOffsetBars) - prev.visibleBarCount;
        const nextFirst = prev.firstVisibleIndex + barsShift;

        if (nextFirst >= liveFirst - 0.8) {
          return {
            ...prev,
            firstVisibleIndex: liveFirst,
            mode: 'LIVE',
            isFollowingLive: true
          };
        }
        if (nextFirst < 15) {
          loadMoreHistory();
        }
        return {
          ...prev,
          firstVisibleIndex: nextFirst,
          mode: 'HISTORICAL',
          isFollowingLive: false
        };
      });
    } else {
      // Cursor-anchored Zoom (the candle under the cursor stays fixed in place)
      const anchorRatio = Math.max(0.05, Math.min(0.95, (mouseX - paddingLeft) / plotWidth));
      const zoomFactor = e.deltaY > 0 ? 1.10 : 0.91;

      setViewport(prev => {
        const newVisible = Math.max(16, Math.min(240, Math.round(prev.visibleBarCount * zoomFactor)));
        const anchorIndex = prev.firstVisibleIndex + anchorRatio * prev.visibleBarCount;
        let newFirst = anchorIndex - anchorRatio * newVisible;

        const lastCandleIndex = candles.length - 1;
        const liveFirst = (lastCandleIndex + prev.rightOffsetBars) - newVisible;

        if (prev.isFollowingLive || newFirst >= liveFirst - 1.0) {
          return {
            ...prev,
            visibleBarCount: newVisible,
            firstVisibleIndex: liveFirst,
            mode: 'LIVE',
            isFollowingLive: true
          };
        }

        return {
          ...prev,
          visibleBarCount: newVisible,
          firstVisibleIndex: newFirst,
          mode: 'HISTORICAL',
          isFollowingLive: false
        };
      });
    }
  };

  // Active or hovered candle OHLC metrics & candle anatomy to display on the HUD
  const activeInspectionCandle = hoveredCandle || visibleCandles[visibleCandles.length - 1] || candles[candles.length - 1];
  const isInspectionBull = activeInspectionCandle ? activeInspectionCandle.close >= activeInspectionCandle.open : true;
  const candleChange = activeInspectionCandle ? Number((activeInspectionCandle.close - activeInspectionCandle.open).toFixed(marketOverview.digits)) : 0;
  const candleChangePercent = activeInspectionCandle && activeInspectionCandle.open > 0
    ? Number(((candleChange / activeInspectionCandle.open) * 100).toFixed(2))
    : 0;

  // Candle anatomy calculations
  const candleRange = activeInspectionCandle ? Number((activeInspectionCandle.high - activeInspectionCandle.low).toFixed(marketOverview.digits)) : 0;
  const candleBody = activeInspectionCandle ? Number(Math.abs(activeInspectionCandle.close - activeInspectionCandle.open).toFixed(marketOverview.digits)) : 0;
  const upperWick = activeInspectionCandle ? Number((activeInspectionCandle.high - Math.max(activeInspectionCandle.open, activeInspectionCandle.close)).toFixed(marketOverview.digits)) : 0;
  const lowerWick = activeInspectionCandle ? Number((Math.min(activeInspectionCandle.open, activeInspectionCandle.close) - activeInspectionCandle.low).toFixed(marketOverview.digits)) : 0;

  // Detect candlestick pattern
  const detectedPattern = useMemo(() => {
    if (!activeInspectionCandle || candleRange === 0) return null;
    if (candleBody / candleRange < 0.1) return 'Doji';
    if (lowerWick >= candleBody * 1.8 && upperWick < candleBody * 0.5) return isInspectionBull ? 'Hammer' : 'Bullish Pin Bar';
    if (upperWick >= candleBody * 1.8 && lowerWick < candleBody * 0.5) return isInspectionBull ? 'Inverted Hammer' : 'Shooting Star';
    return null;
  }, [activeInspectionCandle, candleRange, candleBody, upperWick, lowerWick, isInspectionBull]);

  // Technical Confluence Intelligence for Inspected Candle
  const candleConfluence = useMemo(() => {
    if (!activeInspectionCandle) return null;
    const time = activeInspectionCandle.time;
    const price = activeInspectionCandle.close;

    // Pattern
    const pat = prediction.patterns?.find(p => Math.abs(p.timestamp - time) < 1000 * 60 * 15) || 
      (detectedPattern ? { name: detectedPattern } : null);

    // BOS
    const bosEv = prediction.structureEvents?.find(e => e.type === 'BOS' && Math.abs(e.timestamp - time) < 1000 * 60 * 45);
    const bosLabel = bosEv 
      ? `${bosEv.direction === 'BULLISH' ? '+' : '-'}BOS` 
      : (historicalAnalysis?.lastBOS ? `${historicalAnalysis.lastBOS.type === 'BULLISH' ? '+' : '-'}BOS` : null);

    // CHoCH
    const chochEv = prediction.structureEvents?.find(e => e.type === 'CHoCH' && Math.abs(e.timestamp - time) < 1000 * 60 * 60);
    const chochLabel = chochEv ? `${chochEv.direction === 'BULLISH' ? '+' : '-'}CHoCH` : null;

    // FVG
    const fvg = prediction.fvgs?.find(f => activeInspectionCandle.low <= f.upperPrice && activeInspectionCandle.high >= f.lowerPrice);

    // Order Block
    const ob = prediction.orderBlocks?.find(o => activeInspectionCandle.low <= o.priceHigh && activeInspectionCandle.high >= o.priceLow);

    // Liquidity
    const liq = prediction.structureEvents?.find(e => (e.type === 'LIQUIDITY_SWEEP' || e.type === 'EQH' || e.type === 'EQL') && Math.abs(e.timestamp - time) < 1000 * 60 * 60);

    // S/R
    const sup = prediction.support;
    const res = prediction.resistance;

    return {
      pattern: pat?.name || null,
      bos: bosLabel,
      choch: chochLabel,
      fvg: fvg ? `${fvg.direction === 'BULLISH' ? 'Bull' : 'Bear'} FVG` : null,
      orderBlock: ob ? `${ob.direction === 'BULLISH' ? 'Demand' : 'Supply'} OB` : null,
      liquidity: liq ? (liq.type === 'LIQUIDITY_SWEEP' ? 'Liq Sweep' : liq.type) : null,
      nearestSR: Math.abs(price - sup) < Math.abs(price - res) ? `Sup ${sup.toFixed(marketOverview.digits)}` : `Res ${res.toFixed(marketOverview.digits)}`
    };
  }, [activeInspectionCandle, prediction, detectedPattern, marketOverview.digits, historicalAnalysis]);

  return (
    <div 
      ref={containerRef} 
      className="relative flex-1 w-full h-full min-h-[460px] bg-[#0A0E17] border-r border-[#1F2937] overflow-hidden flex flex-col font-sans select-none touch-none"
      id="main-trading-chart-container"
    >
      {/* 1. Top Chart Header & Live OHLC Inspection HUD Bar */}
      <div className="absolute top-2.5 left-3.5 z-20 flex flex-wrap items-center gap-2 select-none pointer-events-none">
        {/* Symbol & Price Badge */}
        <div className="flex items-center gap-2 bg-[#0E1421]/95 backdrop-blur-md border border-[#1F2937] px-3 py-1.5 rounded shadow-lg">
          <span className="font-black text-sm tracking-wider text-white">
            {marketOverview.symbol}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1D283D] text-blue-400 font-bold border border-blue-500/30">
            {activeTimeframe}
          </span>
          <div className="h-3 w-px bg-[#1F2937] mx-0.5" />
          <span className="text-xs font-mono font-bold text-blue-400">
            {marketOverview.currentPrice.toFixed(marketOverview.digits)}
          </span>
          <span className={`text-[11px] font-mono font-bold ${marketOverview.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {marketOverview.change >= 0 ? '+' : ''}{marketOverview.change} ({marketOverview.changePercent}%)
          </span>
        </div>

        {/* OHLC Candlestick Inspection Ribbon */}
        {activeInspectionCandle && (
          <div className="hidden md:flex items-center gap-2 bg-[#0E1421]/95 backdrop-blur-md border border-[#1F2937] px-3 py-1.5 rounded shadow-lg text-[10px] font-mono">
            <span className="text-slate-500 font-semibold">
              {hoveredCandle ? 'INSPECT' : 'LATEST'}:
            </span>
            <span className="text-slate-400">O: <strong className="text-slate-200">{activeInspectionCandle.open.toFixed(marketOverview.digits)}</strong></span>
            <span className="text-slate-400">H: <strong className="text-slate-200">{activeInspectionCandle.high.toFixed(marketOverview.digits)}</strong></span>
            <span className="text-slate-400">L: <strong className="text-slate-200">{activeInspectionCandle.low.toFixed(marketOverview.digits)}</strong></span>
            <span className="text-slate-400">C: <strong className={isInspectionBull ? 'text-emerald-400' : 'text-red-400'}>{activeInspectionCandle.close.toFixed(marketOverview.digits)}</strong></span>
            <span className={`font-bold ${isInspectionBull ? 'text-emerald-400' : 'text-red-400'}`}>
              ({candleChange >= 0 ? '+' : ''}{candleChangePercent}%)
            </span>
            <span className="text-slate-500">Vol: <strong className="text-slate-300">{activeInspectionCandle.volume.toLocaleString()}</strong></span>
          </div>
        )}

        {/* Extended Candle Anatomy HUD (When Hovering / Inspecting) */}
        {activeInspectionCandle && (
          <div className="hidden xl:flex items-center gap-2 bg-[#0E1421]/95 backdrop-blur-md border border-[#1F2937] px-2.5 py-1.5 rounded shadow-lg text-[10px] font-mono">
            <span className="text-slate-400">Range: <strong className="text-slate-200">{candleRange}</strong></span>
            <span className="text-slate-400">Body: <strong className="text-slate-200">{candleBody}</strong></span>
            <span className="text-slate-400">UW: <strong className="text-slate-200">{upperWick}</strong></span>
            <span className="text-slate-400">LW: <strong className="text-slate-200">{lowerWick}</strong></span>
          </div>
        )}

        {/* Technical Confluence HUD (Pattern, BOS, CHoCH, FVG, Liquidity, OB, S/R) */}
        {activeInspectionCandle && candleConfluence && (
          <div className="hidden 2xl:flex items-center gap-1.5 bg-[#0E1421]/95 backdrop-blur-md border border-[#1F2937] px-2.5 py-1.5 rounded shadow-lg text-[10px] font-mono">
            {candleConfluence.pattern && (
              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                {candleConfluence.pattern}
              </span>
            )}
            {candleConfluence.bos && (
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {candleConfluence.bos}
              </span>
            )}
            {candleConfluence.choch && (
              <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                {candleConfluence.choch}
              </span>
            )}
            {candleConfluence.fvg && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {candleConfluence.fvg}
              </span>
            )}
            {candleConfluence.orderBlock && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {candleConfluence.orderBlock}
              </span>
            )}
            {candleConfluence.liquidity && (
              <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                {candleConfluence.liquidity}
              </span>
            )}
            <span className="text-slate-400 border-l border-[#1F2937] pl-1.5 font-semibold text-slate-300">
              {candleConfluence.nearestSR}
            </span>
          </div>
        )}

        {/* Historical View vs Live State Indicator */}
        {isHistoricalView ? (
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 px-2.5 py-1.5 rounded text-[11px] font-mono text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">HISTORICAL VIEW</span>
            <span className="text-[9px] bg-amber-500/20 px-1 py-0.5 rounded text-amber-200 font-bold border border-amber-500/30">
              -{Math.max(1, Math.round(((candles.length - 1 + viewport.rightOffsetBars) - viewport.visibleBarCount) - viewport.firstVisibleIndex))} BARS
            </span>
          </div>
        ) : connectionStatus === 'LIVE' ? (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0E1421]/95 border border-emerald-500/40 px-2.5 py-1.5 rounded text-[11px] font-mono text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="font-bold">LIVE MARKET</span>
            <span className="text-[9px] text-emerald-400/70 font-semibold">(Follow Active)</span>
          </div>
        ) : connectionStatus === 'DEMO' ? (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0E1421]/95 border border-amber-500/40 px-2.5 py-1.5 rounded text-[11px] font-mono text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            <span className="font-bold">DEMO (SIMULATED)</span>
            <span className="text-[9px] text-amber-300/70 font-semibold">Feed Ready</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 bg-[#0E1421]/95 border border-blue-500/40 px-2.5 py-1.5 rounded text-[11px] font-mono text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            <span className="font-bold">{connectionStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Top Right Chart Action Controls */}
      <div className="absolute top-2.5 right-24 z-20 flex items-center gap-1 bg-[#0E1421]/95 backdrop-blur-md border border-[#1F2937] p-1 rounded-lg shadow-md">
        <button
          id="chart-zoom-in-btn"
          onClick={zoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-[#1D283D] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          id="chart-zoom-out-btn"
          onClick={zoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-[#1D283D] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          id="chart-crosshair-toggle-btn"
          onClick={() => toggleOverlay('showCrosshair')}
          title="Toggle Crosshair"
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            overlayConfig.showCrosshair ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
        </button>
        <button
          id="chart-reset-view-btn"
          onClick={resetView}
          title="Reset / Fit Chart"
          className="p-1.5 rounded hover:bg-[#1D283D] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 3. RETURN TO LIVE Floating Button (Shown when viewing historical candles) */}
      {isHistoricalView && (
        <div className="absolute bottom-10 right-28 z-30 animate-bounce">
          <button
            id="return-to-live-btn"
            onClick={returnToLive}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs px-3.5 py-2 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/40 cursor-pointer transition-all active:scale-95"
            title="Snap chart back to latest live price & TradeXpulse forecast"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>RETURN TO LIVE</span>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </button>
        </div>
      )}

      {/* 4. Canvas Element */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseLeave={() => {
          setIsDragging(false);
          setMousePos(null);
          setHoveredCandle(null);
          setHoveredIndex(null);
        }}
        onWheel={handleWheel}
        className={`w-full h-full block ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
      />

      {/* 5. Watermark Note */}
      <div className="absolute bottom-3 right-24 z-20 pointer-events-none flex flex-col items-end gap-0.5 opacity-50">
        <div className="text-[9px] text-slate-500 font-mono">
          TradeXpulse • Twelve Data Real-Time Stream • Drag to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
};
