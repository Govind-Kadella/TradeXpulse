import { Candle, CandleMetrics } from '../types';

export class CandleIntelligence {
  /**
   * Calculates detailed structural metrics for a single candle
   */
  public static calculateMetrics(
    candle: Candle, 
    prevCandle?: Candle, 
    atr14: number = 0
  ): CandleMetrics {
    const range = Math.max(0.00001, Number((candle.high - candle.low).toFixed(5)));
    const body = Number(Math.abs(candle.close - candle.open).toFixed(5));
    const upperWick = Number((candle.high - Math.max(candle.open, candle.close)).toFixed(5));
    const lowerWick = Number((Math.min(candle.open, candle.close) - candle.low).toFixed(5));
    const bodyToRange = Number((body / range).toFixed(4));
    
    const isBull = candle.close > candle.open;
    const isBear = candle.close < candle.open;
    const direction: 'BULLISH' | 'BEARISH' | 'DOJI' = 
      bodyToRange < 0.08 ? 'DOJI' : (isBull ? 'BULLISH' : 'BEARISH');

    const bodyPercentage = Number(((body / range) * 100).toFixed(1));
    const upperWickPercentage = Number(((upperWick / range) * 100).toFixed(1));
    const lowerWickPercentage = Number(((lowerWick / range) * 100).toFixed(1));

    // True Range
    let trueRange = range;
    if (prevCandle) {
      trueRange = Math.max(
        range,
        Math.abs(candle.high - prevCandle.close),
        Math.abs(candle.low - prevCandle.close)
      );
    }
    trueRange = Number(trueRange.toFixed(5));

    // Relative Range to ATR
    const relativeRange = atr14 > 0 ? Number((range / atr14).toFixed(2)) : 1.0;
    const momentum = Number((candle.close - candle.open).toFixed(5));

    // Categorized Volatility
    let volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPANSION' = 'MEDIUM';
    if (relativeRange < 0.6) {
      volatility = 'LOW';
    } else if (relativeRange > 1.8) {
      volatility = 'EXPANSION';
    } else if (relativeRange > 1.25) {
      volatility = 'HIGH';
    }

    return {
      range,
      body,
      upperWick,
      lowerWick,
      bodyToRange,
      direction,
      bullish: isBull,
      bearish: isBear,
      bodyPercentage,
      upperWickPercentage,
      lowerWickPercentage,
      trueRange,
      atr14,
      relativeRange,
      momentum,
      volatility
    };
  }

  /**
   * Calculates ATR(14) for a candle array
   */
  public static calculateAtr14(candles: Candle[]): number {
    if (candles.length < 2) return 1.0;
    const period = Math.min(14, candles.length - 1);
    let trSum = 0;
    
    for (let i = candles.length - period; i < candles.length; i++) {
      const c = candles[i];
      const prev = candles[i - 1];
      const tr = Math.max(
        c.high - c.low,
        Math.abs(c.high - prev.close),
        Math.abs(c.low - prev.close)
      );
      trSum += tr;
    }
    
    return Number((trSum / period).toFixed(5));
  }

  /**
   * Enriches all candles with metrics in sequence
   */
  public static calculateSeriesMetrics(candles: Candle[]): CandleMetrics[] {
    if (candles.length === 0) return [];
    const atr14 = this.calculateAtr14(candles);
    const results: CandleMetrics[] = [];
    
    for (let i = 0; i < candles.length; i++) {
      const prev = i > 0 ? candles[i - 1] : undefined;
      results.push(this.calculateMetrics(candles[i], prev, atr14));
    }
    
    return results;
  }
}
