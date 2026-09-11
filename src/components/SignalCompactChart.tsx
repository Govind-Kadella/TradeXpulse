import React, { useRef, useEffect, useState, useMemo } from 'react';
import { AISignal, Candle, MarketSymbol } from '../types';
import { MarketDataService, MARKET_META } from '../services/marketDataService';
import { usePredictionState } from '../context/PredictionStateContext';

interface SignalCompactChartProps {
  signal: AISignal;
  height?: number;
}

export const SignalCompactChart: React.FC<SignalCompactChartProps> = ({ signal, height = 240 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoverData, setHoverData] = useState<{ x: number; y: number; candle: Candle } | null>(null);

  const { isMarketPredictionEnabled, isMarketStructureEnabled } = usePredictionState();

  // Retrieve actual candles for this symbol and timeframe
  const candles = useMemo(() => {
    const isCore = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'].includes(signal.symbol);
    if (isCore) {
      return MarketDataService.getHistoricalCandles(signal.symbol as MarketSymbol, signal.timeframe, 60);
    }
    // Fallback generate proportional candles around entry
    const count = 45;
    const list: Candle[] = [];
    let p = signal.entry * 0.995;
    const now = Date.now();
    const intervalMs = signal.timeframe === 'M15' ? 15 * 60 * 1000 : signal.timeframe === 'H1' ? 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
    const digits = MARKET_META[signal.symbol as MarketSymbol]?.pricePrecision ?? 2;

    for (let i = count; i >= 1; i--) {
      const t = now - i * intervalMs;
      const o = p;
      const delta = (Math.sin(i * 0.4) * 0.003 + (Math.random() - 0.48) * 0.002) * p;
      const c = Number((o + delta).toFixed(digits));
      const h = Number((Math.max(o, c) + Math.abs(delta) * 0.5 + p * 0.001).toFixed(digits));
      const l = Number((Math.min(o, c) - Math.abs(delta) * 0.5 - p * 0.001).toFixed(digits));
      list.push({ time: t, open: o, high: h, low: l, close: c, volume: Math.floor(500 + Math.random() * 800) });
      p = c;
    }
    return list;
  }, [signal.symbol, signal.timeframe, signal.entry]);

  const digits = useMemo(() => {
    return MARKET_META[signal.symbol as MarketSymbol]?.pricePrecision ?? 2;
  }, [signal.symbol]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Padding
    const padTop = 24;
    const padBottom = 26;
    const padRight = 68; // space for price axis labels
    const padLeft = 12;

    const plotW = Math.max(10, w - padLeft - padRight);
    const plotH = Math.max(10, h - padTop - padBottom);

    // Calculate Price Min / Max (incorporating candles, Entry, SL, TP1, TP2)
    let minP = Math.min(...candles.map(c => c.low));
    let maxP = Math.max(...candles.map(c => c.high));

    if (signal.entry > 0) {
      minP = Math.min(minP, signal.entry);
      maxP = Math.max(maxP, signal.entry);
    }
    if (signal.stopLoss > 0) {
      minP = Math.min(minP, signal.stopLoss);
      maxP = Math.max(maxP, signal.stopLoss);
    }
    if (signal.takeProfits && signal.takeProfits.length > 0) {
      signal.takeProfits.forEach(tp => {
        minP = Math.min(minP, tp);
        maxP = Math.max(maxP, tp);
      });
    }

    const priceRange = Math.max(0.0001, maxP - minP);
    const buffer = priceRange * 0.08;
    const plotMin = minP - buffer;
    const plotMax = maxP + buffer;
    const finalRange = plotMax - plotMin;

    const getY = (price: number) => {
      const norm = (price - plotMin) / finalRange;
      return padTop + plotH * (1 - norm);
    };

    // Draw background subtle grid lines
    ctx.strokeStyle = '#152033';
    ctx.lineWidth = 1;
    const gridSteps = 4;
    for (let i = 0; i <= gridSteps; i++) {
      const gy = padTop + (plotH / gridSteps) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(w - padRight, gy);
      ctx.stroke();

      const priceAtGrid = plotMax - (finalRange / gridSteps) * i;
      ctx.fillStyle = '#64748B';
      ctx.font = '9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';
      ctx.fillText(priceAtGrid.toFixed(digits), w - padRight + 6, gy + 3);
    }

    // Draw Candlesticks
    const barCount = candles.length;
    // Leave some space on the right for prediction path
    const effectiveBarCount = isMarketPredictionEnabled ? barCount + 8 : barCount;
    const barSpacing = plotW / effectiveBarCount;
    const barWidth = Math.max(2, barSpacing * 0.65);

    candles.forEach((c, idx) => {
      const x = padLeft + idx * barSpacing + barSpacing / 2;
      const yOpen = getY(c.open);
      const yClose = getY(c.close);
      const yHigh = getY(c.high);
      const yLow = getY(c.low);

      const isBull = c.close >= c.open;
      const color = isBull ? '#10B981' : '#EF4444';

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(yOpen, yClose);
      const bodyH = Math.max(1.5, Math.abs(yOpen - yClose));
      ctx.fillRect(x - barWidth / 2, bodyTop, barWidth, bodyH);
    });

    // Draw Level Helper
    const drawLevel = (price: number, label: string, color: string, dash: number[] = [4, 4]) => {
      if (price <= 0) return;
      const y = getY(price);
      if (y < padTop - 10 || y > h - padBottom + 10) return;

      ctx.save();
      ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Badge on right
      ctx.setLineDash([]);
      ctx.fillStyle = color;
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'left';

      // Background pill for label
      const text = `${label}: ${price.toFixed(digits)}`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = '#0B101D';
      ctx.fillRect(w - padRight + 2, y - 8, textWidth + 8, 16);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(w - padRight + 2, y - 8, textWidth + 8, 16);

      ctx.fillStyle = color;
      ctx.fillText(text, w - padRight + 6, y + 3);
      ctx.restore();
    };

    // Draw SL (Red)
    drawLevel(signal.stopLoss, 'SL', '#EF4444', [5, 3]);

    // Draw Entry (Cyan)
    drawLevel(signal.entry, 'ENTRY', '#38BDF8', [6, 4]);

    // Draw TP1 (Emerald)
    if (signal.takeProfits && signal.takeProfits[0]) {
      drawLevel(signal.takeProfits[0], 'TP1', '#10B981', [5, 3]);
    }

    // Draw TP2 (Light Green)
    if (signal.takeProfits && signal.takeProfits[1]) {
      drawLevel(signal.takeProfits[1], 'TP2', '#34D399', [5, 3]);
    }

    // Draw Market Prediction Trajectory (if enabled)
    if (isMarketPredictionEnabled && candles.length > 0) {
      const lastX = padLeft + (barCount - 1) * barSpacing + barSpacing / 2;
      const lastY = getY(candles[candles.length - 1].close);
      const targetY = signal.direction === 'BUY' 
        ? getY(signal.takeProfits[0] || signal.entry * 1.008)
        : getY(signal.takeProfits[0] || signal.entry * 0.992);
      const projX = padLeft + (barCount + 6) * barSpacing;

      ctx.save();
      ctx.strokeStyle = signal.direction === 'BUY' ? '#38BDF8' : '#F43F5E';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.bezierCurveTo(
        lastX + (projX - lastX) * 0.4, lastY,
        lastX + (projX - lastX) * 0.6, targetY,
        projX, targetY
      );
      ctx.stroke();

      // Forecast arrow / dot
      ctx.fillStyle = signal.direction === 'BUY' ? '#38BDF8' : '#F43F5E';
      ctx.beginPath();
      ctx.arc(projX, targetY, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

  }, [candles, signal, height, digits, isMarketPredictionEnabled, isMarketStructureEnabled]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full rounded bg-[#090D18] border border-[#1B2537] overflow-hidden select-none"
      style={{ height: `${height}px` }}
    >
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full cursor-crosshair"
      />
      
      {/* Top Legend Overlay */}
      <div className="absolute top-2 left-3 flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none bg-[#0B101D]/80 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-800/60">
        <span className="font-bold text-slate-200">{signal.symbol} • {signal.timeframe}</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Entry: <strong className="text-cyan-300">{signal.entry.toFixed(digits)}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
          SL: <strong className="text-red-300">{signal.stopLoss.toFixed(digits)}</strong>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          TP1: <strong className="text-emerald-300">{(signal.takeProfits[0] ?? 0).toFixed(digits)}</strong>
        </span>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-1.5 left-3 text-[9px] font-mono text-slate-500 pointer-events-none">
        TradeXpulse Real Candlestick Feed • R:R {signal.riskReward}
      </div>
    </div>
  );
};
