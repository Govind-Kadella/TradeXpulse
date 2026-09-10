import { Candle, FVGZone, Timeframe } from '../types';
import { CandleIntelligence } from './candleIntelligence';

export class FvgEngine {
  /**
   * Scans a candle series for Fair Value Gaps and tracks their subsequent interaction lifecycle
   */
  public static detectFvgs(candles: Candle[], timeframe: Timeframe = 'M5', digits: number = 2): FVGZone[] {
    if (candles.length < 3) return [];
    const fvgs: FVGZone[] = [];
    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const minGapThreshold = atr14 * 0.15; // Filter microscopic gaps

    for (let i = 2; i < candles.length; i++) {
      const c1 = candles[i - 2]; // Candle 1
      const c2 = candles[i - 1]; // Candle 2 (Displacement candle)
      const c3 = candles[i];     // Candle 3

      // 1. Bullish FVG: Candle 1 High < Candle 3 Low
      if (c3.low > c1.high) {
        const gapSize = c3.low - c1.high;
        if (gapSize >= minGapThreshold) {
          const lowerPrice = Number(c1.high.toFixed(digits));
          const upperPrice = Number(c3.low.toFixed(digits));
          const midPrice = Number(((lowerPrice + upperPrice) / 2).toFixed(digits));

          const fvg: FVGZone = {
            id: `bull-fvg-${i}`,
            type: 'BULLISH_FVG',
            direction: 'BULLISH',
            upperPrice,
            lowerPrice,
            midPrice,
            candleIndex: i - 1,
            createdAt: c2.time,
            timeframe,
            status: 'UNTOUCHED',
            fillPercentage: 0,
            strength: gapSize > atr14 * 0.5 ? 'HIGH' : 'MEDIUM'
          };

          // Track interaction across subsequent candles (i + 1 to end)
          this.trackFvgLifecycle(fvg, candles, i + 1);
          fvgs.push(fvg);
        }
      }

      // 2. Bearish FVG: Candle 1 Low > Candle 3 High
      if (c1.low > c3.high) {
        const gapSize = c1.low - c3.high;
        if (gapSize >= minGapThreshold) {
          const upperPrice = Number(c1.low.toFixed(digits));
          const lowerPrice = Number(c3.high.toFixed(digits));
          const midPrice = Number(((lowerPrice + upperPrice) / 2).toFixed(digits));

          const fvg: FVGZone = {
            id: `bear-fvg-${i}`,
            type: 'BEARISH_FVG',
            direction: 'BEARISH',
            upperPrice,
            lowerPrice,
            midPrice,
            candleIndex: i - 1,
            createdAt: c2.time,
            timeframe,
            status: 'UNTOUCHED',
            fillPercentage: 0,
            strength: gapSize > atr14 * 0.5 ? 'HIGH' : 'MEDIUM'
          };

          // Track interaction across subsequent candles (i + 1 to end)
          this.trackFvgLifecycle(fvg, candles, i + 1);
          fvgs.push(fvg);
        }
      }
    }

    return fvgs;
  }

  /**
   * Simulates future candles entering or validating the FVG zone
   */
  private static trackFvgLifecycle(fvg: FVGZone, allCandles: Candle[], startIndex: number): void {
    if (startIndex >= allCandles.length) return;

    const gapHeight = Math.max(0.0001, fvg.upperPrice - fvg.lowerPrice);

    for (let i = startIndex; i < allCandles.length; i++) {
      const c = allCandles[i];

      if (fvg.type === 'BULLISH_FVG') {
        // Price pulls back into bullish FVG from above
        if (c.low <= fvg.upperPrice) {
          // Penetration depth into the gap
          const penetration = Math.max(0, fvg.upperPrice - Math.max(c.low, fvg.lowerPrice));
          const currentFillPct = Math.min(100, Math.round((penetration / gapHeight) * 100));
          fvg.fillPercentage = Math.max(fvg.fillPercentage, currentFillPct);

          if (c.close < fvg.lowerPrice) {
            // Decisive close through the bottom -> Invalidated
            fvg.status = 'INVALIDATED';
            fvg.fillPercentage = 100;
            fvg.mitigatedIndex = i;
            break;
          } else if (c.low <= fvg.lowerPrice) {
            fvg.status = 'FULLY_FILLED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          } else if (c.low <= fvg.midPrice && c.close > fvg.midPrice) {
            // Mitigated consequent encroachment with clean wick rejection!
            fvg.status = 'REJECTED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          } else {
            fvg.status = 'PARTIALLY_FILLED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          }
        }
      } else {
        // Bearish FVG: Price pulls up into gap from below
        if (c.high >= fvg.lowerPrice) {
          const penetration = Math.max(0, Math.min(c.high, fvg.upperPrice) - fvg.lowerPrice);
          const currentFillPct = Math.min(100, Math.round((penetration / gapHeight) * 100));
          fvg.fillPercentage = Math.max(fvg.fillPercentage, currentFillPct);

          if (c.close > fvg.upperPrice) {
            // Decisive close through the top -> Invalidated
            fvg.status = 'INVALIDATED';
            fvg.fillPercentage = 100;
            fvg.mitigatedIndex = i;
            break;
          } else if (c.high >= fvg.upperPrice) {
            fvg.status = 'FULLY_FILLED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          } else if (c.high >= fvg.midPrice && c.close < fvg.midPrice) {
            // Mitigated 50% midpoint with strong bearish wick rejection!
            fvg.status = 'REJECTED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          } else {
            fvg.status = 'PARTIALLY_FILLED';
            if (!fvg.mitigatedIndex) fvg.mitigatedIndex = i;
          }
        }
      }
    }
  }
}
