import { Candle, LiquidityPool, Timeframe, MarketSymbol } from '../types';
import { CandleIntelligence } from './candleIntelligence';

export interface SessionLiquidity {
  asiaHigh?: number;
  asiaLow?: number;
  londonHigh?: number;
  londonLow?: number;
  nyHigh?: number;
  nyLow?: number;
}

export interface MacroLiquidityLevels {
  pdh?: number;
  pdl?: number;
  pwh?: number;
  pwl?: number;
  session: SessionLiquidity;
  pools: LiquidityPool[];
}

export class LiquidityEngine {
  /**
   * Computes institutional liquidity pools, session levels, PDH/PDL, and sweep events
   */
  public static detectLiquidity(
    candles: Candle[], 
    symbol: MarketSymbol, 
    timeframe: Timeframe = 'M5',
    digits: number = 2
  ): MacroLiquidityLevels {
    if (candles.length < 5) {
      return {
        session: {},
        pools: []
      };
    }

    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const pools: LiquidityPool[] = [];
    const latestPrice = candles[candles.length - 1].close;

    // 1. Group candles by UTC calendar day to compute PDH / PDL
    const dayBuckets: Map<string, Candle[]> = new Map();
    candles.forEach(c => {
      const dateKey = new Date(c.time).toISOString().slice(0, 10);
      const list = dayBuckets.get(dateKey) || [];
      list.push(c);
      dayBuckets.set(dateKey, list);
    });

    const sortedDates = Array.from(dayBuckets.keys()).sort();
    let pdh: number | undefined;
    let pdl: number | undefined;

    if (sortedDates.length >= 2) {
      // Prior complete day is the second to last date
      const prevDate = sortedDates[sortedDates.length - 2];
      const prevCandles = dayBuckets.get(prevDate)!;
      pdh = Number(Math.max(...prevCandles.map(c => c.high)).toFixed(digits));
      pdl = Number(Math.min(...prevCandles.map(c => c.low)).toFixed(digits));

      // Check if current day candles have swept PDH or PDL
      const todayCandles = dayBuckets.get(sortedDates[sortedDates.length - 1]) || [];
      const sweptPDH = todayCandles.some(c => c.high > pdh!);
      const sweptPDL = todayCandles.some(c => c.low < pdl!);

      pools.push({
        id: `pdh-${prevDate}`,
        type: 'PDH',
        price: pdh,
        timeframe: 'D1',
        createdAt: prevCandles[prevCandles.length - 1].time,
        isSwept: sweptPDH,
        strength: 'HIGH',
        description: `Previous Day High (PDH) at ${pdh}`
      });

      pools.push({
        id: `pdl-${prevDate}`,
        type: 'PDL',
        price: pdl,
        timeframe: 'D1',
        createdAt: prevCandles[prevCandles.length - 1].time,
        isSwept: sweptPDL,
        strength: 'HIGH',
        description: `Previous Day Low (PDL) at ${pdl}`
      });
    }

    // 2. Session Liquidity (Asia: 00:00 - 08:00 UTC, London: 08:00 - 16:00 UTC, NY: 13:00 - 21:00 UTC)
    const session: SessionLiquidity = {};
    const recent24hCandles = candles.slice(-72); // Last ~6 hours in M5 or rolling window
    
    let asiaCandles: Candle[] = [];
    let londonCandles: Candle[] = [];
    let nyCandles: Candle[] = [];

    recent24hCandles.forEach(c => {
      const hours = new Date(c.time).getUTCHours();
      if (hours >= 0 && hours < 8) asiaCandles.push(c);
      if (hours >= 8 && hours < 16) londonCandles.push(c);
      if (hours >= 13 && hours < 21) nyCandles.push(c);
    });

    if (asiaCandles.length > 0) {
      session.asiaHigh = Number(Math.max(...asiaCandles.map(c => c.high)).toFixed(digits));
      session.asiaLow = Number(Math.min(...asiaCandles.map(c => c.low)).toFixed(digits));

      pools.push({
        id: 'asia-high',
        type: 'SESSION_HIGH',
        price: session.asiaHigh,
        timeframe,
        createdAt: asiaCandles[asiaCandles.length - 1].time,
        isSwept: latestPrice > session.asiaHigh,
        strength: 'MEDIUM',
        description: `Asian Session High liquidity at ${session.asiaHigh}`
      });

      pools.push({
        id: 'asia-low',
        type: 'SESSION_LOW',
        price: session.asiaLow,
        timeframe,
        createdAt: asiaCandles[asiaCandles.length - 1].time,
        isSwept: latestPrice < session.asiaLow,
        strength: 'MEDIUM',
        description: `Asian Session Low liquidity at ${session.asiaLow}`
      });
    }

    if (londonCandles.length > 0) {
      session.londonHigh = Number(Math.max(...londonCandles.map(c => c.high)).toFixed(digits));
      session.londonLow = Number(Math.min(...londonCandles.map(c => c.low)).toFixed(digits));

      pools.push({
        id: 'london-high',
        type: 'SESSION_HIGH',
        price: session.londonHigh,
        timeframe,
        createdAt: londonCandles[londonCandles.length - 1].time,
        isSwept: latestPrice > session.londonHigh,
        strength: 'HIGH',
        description: `London Session High liquidity at ${session.londonHigh}`
      });

      pools.push({
        id: 'london-low',
        type: 'SESSION_LOW',
        price: session.londonLow,
        timeframe,
        createdAt: londonCandles[londonCandles.length - 1].time,
        isSwept: latestPrice < session.londonLow,
        strength: 'HIGH',
        description: `London Session Low liquidity at ${session.londonLow}`
      });
    }

    if (nyCandles.length > 0) {
      session.nyHigh = Number(Math.max(...nyCandles.map(c => c.high)).toFixed(digits));
      session.nyLow = Number(Math.min(...nyCandles.map(c => c.low)).toFixed(digits));
    }

    // 3. Rolling Swing EQH / EQL Liquidity Detection
    const tolerance = atr14 * 0.10;
    for (let i = 4; i < candles.length - 2; i++) {
      for (let j = i + 3; j < candles.length; j++) {
        const c1 = candles[i];
        const c2 = candles[j];

        // Equal Highs
        if (Math.abs(c1.high - c2.high) <= tolerance && c1.high > latestPrice) {
          const eqhPrice = Number(((c1.high + c2.high) / 2).toFixed(digits));
          if (!pools.some(p => p.type === 'EQH' && Math.abs(p.price - eqhPrice) < tolerance)) {
            pools.push({
              id: `pool-eqh-${j}`,
              type: 'EQH',
              price: eqhPrice,
              timeframe,
              createdAt: c2.time,
              isSwept: latestPrice >= eqhPrice,
              strength: 'HIGH',
              description: `Equal Highs Buy-Side Liquidity pool at ${eqhPrice}`
            });
          }
        }

        // Equal Lows
        if (Math.abs(c1.low - c2.low) <= tolerance && c1.low < latestPrice) {
          const eqlPrice = Number(((c1.low + c2.low) / 2).toFixed(digits));
          if (!pools.some(p => p.type === 'EQL' && Math.abs(p.price - eqlPrice) < tolerance)) {
            pools.push({
              id: `pool-eql-${j}`,
              type: 'EQL',
              price: eqlPrice,
              timeframe,
              createdAt: c2.time,
              isSwept: latestPrice <= eqlPrice,
              strength: 'HIGH',
              description: `Equal Lows Sell-Side Liquidity pool at ${eqlPrice}`
            });
          }
        }
      }
    }

    return {
      pdh,
      pdl,
      session,
      pools: pools.slice(-8)
    };
  }
}
