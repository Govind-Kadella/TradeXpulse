import { Candle, MarketStructurePoint, MarketStructureEvent, Timeframe, BiasType } from '../types';
import { CandleIntelligence } from './candleIntelligence';

export interface MarketStructureState {
  points: MarketStructurePoint[];
  events: MarketStructureEvent[];
  trend: 'BULLISH STRUCTURE' | 'BEARISH STRUCTURE' | 'RANGE' | 'TRANSITION';
  bias: BiasType;
  lastBOS?: MarketStructureEvent;
  lastCHoCH?: MarketStructureEvent;
  lastLiquiditySweep?: MarketStructureEvent;
  recentDisplacements: MarketStructureEvent[];
  equalHighs: MarketStructureEvent[];
  equalLows: MarketStructureEvent[];
  externalSwingHigh?: MarketStructurePoint;
  externalSwingLow?: MarketStructurePoint;
}

export class MarketStructureEngine {
  /**
   * Analyzes candle series to calculate fractal swings, BOS, CHoCH, sweeps, displacement, and trends
   */
  public static analyzeStructure(
    candles: Candle[], 
    timeframe: Timeframe = 'M5',
    digits: number = 2
  ): MarketStructureState {
    if (candles.length < 8) {
      return {
        points: [],
        events: [],
        trend: 'RANGE',
        bias: 'NO TRADE',
        recentDisplacements: [],
        equalHighs: [],
        equalLows: []
      };
    }

    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const metrics = CandleIntelligence.calculateSeriesMetrics(candles);

    // 1. Detect Swing Highs and Swing Lows using fractal windows (2 left, 2 right for internal; 4 left, 4 right for external)
    const points: MarketStructurePoint[] = [];
    const window = 2; // Pivot confirmation window

    for (let i = window; i < candles.length - window; i++) {
      const c = candles[i];
      if (!c) continue;
      let isHigh = true;
      let isLow = true;

      for (let j = 1; j <= window; j++) {
        const left = candles[i - j];
        const right = candles[i + j];
        if (!left || !right) {
          isHigh = false;
          isLow = false;
          break;
        }
        if (left.high >= c.high || right.high > c.high) isHigh = false;
        if (left.low <= c.low || right.low < c.low) isLow = false;
      }

      // External check: 4-bar window
      const left3 = candles[i - 3];
      const left4 = candles[i - 4];
      const right3 = candles[i + 3];
      const right4 = candles[i + 4];
      const has4Bars = Boolean(left3 && left4 && right3 && right4);

      const isExternalHigh = has4Bars &&
        c.high > left3!.high && c.high > left4!.high &&
        c.high > right3!.high && c.high > right4!.high;

      const isExternalLow = has4Bars &&
        c.low < left3!.low && c.low < left4!.low &&
        c.low < right3!.low && c.low < right4!.low;

      if (isHigh) {
        points.push({
          index: i,
          time: c.time,
          price: c.high,
          type: 'SWING_HIGH',
          isInternal: !isExternalHigh
        });
      } else if (isLow) {
        points.push({
          index: i,
          time: c.time,
          price: c.low,
          type: 'SWING_LOW',
          isInternal: !isExternalLow
        });
      }
    }

    // 2. Classify points into Higher Highs, Higher Lows, Lower Highs, Lower Lows
    let lastHigh: MarketStructurePoint | null = null;
    let lastLow: MarketStructurePoint | null = null;

    points.forEach(p => {
      if (p.type === 'SWING_HIGH') {
        if (!lastHigh) {
          p.type = 'SWING_HIGH';
        } else if (p.price > lastHigh.price) {
          p.type = 'HH';
        } else {
          p.type = 'LH';
        }
        lastHigh = p;
      } else if (p.type === 'SWING_LOW') {
        if (!lastLow) {
          p.type = 'SWING_LOW';
        } else if (p.price > lastLow.price) {
          p.type = 'HL';
        } else {
          p.type = 'LL';
        }
        lastLow = p;
      }
    });

    // 3. Detect Structure Events: BOS, CHoCH, Liquidity Sweeps, Equal Highs/Lows, Displacements
    const events: MarketStructureEvent[] = [];
    const equalHighs: MarketStructureEvent[] = [];
    const equalLows: MarketStructureEvent[] = [];
    const recentDisplacements: MarketStructureEvent[] = [];

    // Track ongoing state for BOS and CHoCH detection
    let currentTrend: 'BULLISH' | 'BEARISH' | 'RANGE' = 'RANGE';
    let prevSwingHigh: MarketStructurePoint | null = null;
    let prevSwingLow: MarketStructurePoint | null = null;
    let lastBOS: MarketStructureEvent | undefined;
    let lastCHoCH: MarketStructureEvent | undefined;
    let lastLiquiditySweep: MarketStructureEvent | undefined;

    // A. Detect Equal Highs (EQH) and Equal Lows (EQL) among swing points
    const eqTolerance = atr14 * 0.12;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p1 = points[i];
        const p2 = points[j];
        if ((p1.type === 'HH' || p1.type === 'LH' || p1.type === 'SWING_HIGH') &&
            (p2.type === 'HH' || p2.type === 'LH' || p2.type === 'SWING_HIGH')) {
          if (Math.abs(p1.price - p2.price) <= eqTolerance && (p2.index - p1.index) >= 4) {
            const eqhEvent: MarketStructureEvent = {
              id: `eqh-${p2.index}`,
              type: 'EQH',
              direction: 'NEUTRAL',
              price: Number(p2.price.toFixed(digits)),
              timestamp: p2.time,
              candleIndex: p2.index,
              timeframe,
              strength: 'HIGH',
              description: `Equal Highs liquidity pool at ${p2.price.toFixed(digits)}`,
              confirmation: 'Multiple swing peaks resting at identical ceiling',
              invalidation: 'Liquidity sweep or clean breakout',
              isInternal: p2.isInternal
            };
            equalHighs.push(eqhEvent);
            events.push(eqhEvent);
          }
        } else if ((p1.type === 'HL' || p1.type === 'LL' || p1.type === 'SWING_LOW') &&
                   (p2.type === 'HL' || p2.type === 'LL' || p2.type === 'SWING_LOW')) {
          if (Math.abs(p1.price - p2.price) <= eqTolerance && (p2.index - p1.index) >= 4) {
            const eqlEvent: MarketStructureEvent = {
              id: `eql-${p2.index}`,
              type: 'EQL',
              direction: 'NEUTRAL',
              price: Number(p2.price.toFixed(digits)),
              timestamp: p2.time,
              candleIndex: p2.index,
              timeframe,
              strength: 'HIGH',
              description: `Equal Lows liquidity pool at ${p2.price.toFixed(digits)}`,
              confirmation: 'Multiple swing troughs resting at identical floor',
              invalidation: 'Liquidity sweep or clean breakdown',
              isInternal: p2.isInternal
            };
            equalLows.push(eqlEvent);
            events.push(eqlEvent);
          }
        }
      }
    }

    // B. Walk through candles to detect real-time BOS, CHoCH, Sweeps, Displacements
    let activeHighs: MarketStructurePoint[] = [];
    let activeLows: MarketStructurePoint[] = [];

    for (let i = 2; i < candles.length; i++) {
      const c = candles[i];
      const m = metrics[i];

      // Add newly confirmed swing points that occurred prior to candle i
      const newPoints = points.filter(p => p.index === i - window);
      newPoints.forEach(p => {
        if (p.type === 'HH' || p.type === 'LH' || p.type === 'SWING_HIGH') {
          activeHighs.push(p);
          prevSwingHigh = p;
        } else {
          activeLows.push(p);
          prevSwingLow = p;
        }
      });

      // Keep only most recent 6 swings for active checks
      if (activeHighs.length > 6) activeHighs = activeHighs.slice(-6);
      if (activeLows.length > 6) activeLows = activeLows.slice(-6);

      // Check 1: Displacement Candle (range > 1.7 * ATR, body > 75% of range)
      if (m.relativeRange >= 1.65 && m.bodyToRange >= 0.72) {
        const dispEvent: MarketStructureEvent = {
          id: `disp-${i}`,
          type: 'DISPLACEMENT',
          direction: m.bullish ? 'BULLISH' : 'BEARISH',
          price: Number(c.close.toFixed(digits)),
          timestamp: c.time,
          candleIndex: i,
          timeframe,
          strength: 'HIGH',
          description: `${m.bullish ? 'Bullish' : 'Bearish'} Displacement expansion (+${m.range} pts)`,
          confirmation: `Strong institutional candle (${m.bodyPercentage}% body, ${m.relativeRange}x ATR)`,
          invalidation: `Candle retracement beyond 50% midpoint`,
          isInternal: false
        };
        recentDisplacements.push(dispEvent);
        events.push(dispEvent);
      }

      // Check 2: Liquidity Sweeps
      // Price wick exceeds previous swing high/low, but candle CLOSES back inside!
      if (prevSwingHigh && c.high > prevSwingHigh.price && c.close < prevSwingHigh.price) {
        const sweepEvent: MarketStructureEvent = {
          id: `sweep-high-${i}`,
          type: 'LIQUIDITY_SWEEP',
          direction: 'BEARISH',
          price: Number(c.high.toFixed(digits)),
          timestamp: c.time,
          candleIndex: i,
          timeframe,
          strength: 'HIGH',
          description: `Buy-side liquidity sweep above ${prevSwingHigh.price.toFixed(digits)}`,
          confirmation: 'High penetrated swing high but closed back inside with wick rejection',
          invalidation: `Candle close above ${c.high.toFixed(digits)}`,
          isInternal: prevSwingHigh.isInternal
        };
        lastLiquiditySweep = sweepEvent;
        events.push(sweepEvent);
      } else if (prevSwingLow && c.low < prevSwingLow.price && c.close > prevSwingLow.price) {
        const sweepEvent: MarketStructureEvent = {
          id: `sweep-low-${i}`,
          type: 'LIQUIDITY_SWEEP',
          direction: 'BULLISH',
          price: Number(c.low.toFixed(digits)),
          timestamp: c.time,
          candleIndex: i,
          timeframe,
          strength: 'HIGH',
          description: `Sell-side liquidity sweep below ${prevSwingLow.price.toFixed(digits)}`,
          confirmation: 'Low penetrated swing low but closed back inside with wick rejection',
          invalidation: `Candle close below ${c.low.toFixed(digits)}`,
          isInternal: prevSwingLow.isInternal
        };
        lastLiquiditySweep = sweepEvent;
        events.push(sweepEvent);
      }

      // Check 3: Break of Structure (BOS) vs Change of Character (CHoCH)
      // Confirmed by candle CLOSE beyond the swing level
      if (prevSwingHigh && c.close > prevSwingHigh.price && candles[i - 1].close <= prevSwingHigh.price) {
        if (currentTrend === 'BULLISH') {
          // Trend continuation -> BOS
          const bosEvent: MarketStructureEvent = {
            id: `bos-${i}`,
            type: 'BOS',
            direction: 'BULLISH',
            price: Number(prevSwingHigh.price.toFixed(digits)),
            timestamp: c.time,
            candleIndex: i,
            originIndex: prevSwingHigh.index,
            originPrice: Number(prevSwingHigh.price.toFixed(digits)),
            timeframe,
            strength: 'HIGH',
            description: `Bullish Break of Structure (BOS) above ${prevSwingHigh.price.toFixed(digits)}`,
            confirmation: 'Candle closed cleanly above previous swing high',
            invalidation: `Failure to hold above broken level ${prevSwingHigh.price.toFixed(digits)}`,
            isInternal: prevSwingHigh.isInternal
          };
          lastBOS = bosEvent;
          events.push(bosEvent);
        } else {
          // Trend reversal -> CHoCH (Change of Character)
          currentTrend = 'BULLISH';
          const chochEvent: MarketStructureEvent = {
            id: `choch-${i}`,
            type: 'CHoCH',
            direction: 'BULLISH',
            price: Number(prevSwingHigh.price.toFixed(digits)),
            timestamp: c.time,
            candleIndex: i,
            originIndex: prevSwingHigh.index,
            originPrice: Number(prevSwingHigh.price.toFixed(digits)),
            timeframe,
            strength: 'HIGH',
            description: `Bullish Change of Character (CHoCH) shifting structure bullish`,
            confirmation: 'Market broke out of prior downtrend structure with confirmed close',
            invalidation: `Reversal below swing low ${prevSwingLow?.price.toFixed(digits) || 'recent low'}`,
            isInternal: prevSwingHigh.isInternal
          };
          lastCHoCH = chochEvent;
          events.push(chochEvent);
        }
      } else if (prevSwingLow && c.close < prevSwingLow.price && candles[i - 1].close >= prevSwingLow.price) {
        if (currentTrend === 'BEARISH') {
          // Trend continuation -> Bearish BOS
          const bosEvent: MarketStructureEvent = {
            id: `bos-${i}`,
            type: 'BOS',
            direction: 'BEARISH',
            price: Number(prevSwingLow.price.toFixed(digits)),
            timestamp: c.time,
            candleIndex: i,
            originIndex: prevSwingLow.index,
            originPrice: Number(prevSwingLow.price.toFixed(digits)),
            timeframe,
            strength: 'HIGH',
            description: `Bearish Break of Structure (BOS) below ${prevSwingLow.price.toFixed(digits)}`,
            confirmation: 'Candle closed cleanly below previous swing low',
            invalidation: `Failure to sustain below broken level ${prevSwingLow.price.toFixed(digits)}`,
            isInternal: prevSwingLow.isInternal
          };
          lastBOS = bosEvent;
          events.push(bosEvent);
        } else {
          // Trend reversal -> Bearish CHoCH
          currentTrend = 'BEARISH';
          const chochEvent: MarketStructureEvent = {
            id: `choch-${i}`,
            type: 'CHoCH',
            direction: 'BEARISH',
            price: Number(prevSwingLow.price.toFixed(digits)),
            timestamp: c.time,
            candleIndex: i,
            originIndex: prevSwingLow.index,
            originPrice: Number(prevSwingLow.price.toFixed(digits)),
            timeframe,
            strength: 'HIGH',
            description: `Bearish Change of Character (CHoCH) shifting structure bearish`,
            confirmation: 'Market broke down through prior uptrend higher low',
            invalidation: `Reversal above swing high ${prevSwingHigh?.price.toFixed(digits) || 'recent high'}`,
            isInternal: prevSwingLow.isInternal
          };
          lastCHoCH = chochEvent;
          events.push(chochEvent);
        }
      }
    }

    // 4. Overall Trend Assessment
    const recentSwings = points.slice(-5);
    const hhCount = recentSwings.filter(s => s.type === 'HH' || s.type === 'HL').length;
    const llCount = recentSwings.filter(s => s.type === 'LL' || s.type === 'LH').length;

    let overallTrend: 'BULLISH STRUCTURE' | 'BEARISH STRUCTURE' | 'RANGE' | 'TRANSITION' = 'RANGE';
    let bias: BiasType = 'NO TRADE';

    if (currentTrend === 'BULLISH' && hhCount >= 2) {
      overallTrend = 'BULLISH STRUCTURE';
      bias = 'BULLISH';
    } else if (currentTrend === 'BEARISH' && llCount >= 2) {
      overallTrend = 'BEARISH STRUCTURE';
      bias = 'BEARISH';
    } else if (lastCHoCH && (!lastBOS || lastCHoCH.candleIndex > lastBOS.candleIndex)) {
      overallTrend = 'TRANSITION';
      bias = lastCHoCH.direction === 'BULLISH' ? 'BULLISH' : 'BEARISH';
    } else {
      overallTrend = 'RANGE';
      bias = 'NO TRADE';
    }

    // External Swing points
    const externalHighs = points.filter(p => !p.isInternal && (p.type === 'HH' || p.type === 'LH' || p.type === 'SWING_HIGH'));
    const externalLows = points.filter(p => !p.isInternal && (p.type === 'HL' || p.type === 'LL' || p.type === 'SWING_LOW'));

    return {
      points,
      events,
      trend: overallTrend,
      bias,
      lastBOS,
      lastCHoCH,
      lastLiquiditySweep,
      recentDisplacements: recentDisplacements.slice(-4),
      equalHighs,
      equalLows,
      externalSwingHigh: externalHighs[externalHighs.length - 1],
      externalSwingLow: externalLows[externalLows.length - 1]
    };
  }
}
