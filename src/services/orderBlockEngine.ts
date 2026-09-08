import { Candle, OrderBlockZone, Timeframe } from '../types';
import { CandleIntelligence } from './candleIntelligence';
import { MarketStructureState } from './marketStructureEngine';

export class OrderBlockEngine {
  /**
   * Identifies valid institutional Order Blocks / Supply & Demand zones
   * Requires: clear origin candle, strong displacement, and structural breakout (BOS/CHoCH)
   */
  public static detectOrderBlocks(
    candles: Candle[], 
    structure: MarketStructureState,
    timeframe: Timeframe = 'M5',
    digits: number = 2
  ): OrderBlockZone[] {
    if (candles.length < 5) return [];
    const zones: OrderBlockZone[] = [];
    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const metrics = CandleIntelligence.calculateSeriesMetrics(candles);

    // Scan for BOS and CHoCH events in structure to find the displacement origin
    const breakoutEvents = structure.events.filter(e => e.type === 'BOS' || e.type === 'CHoCH' || e.type === 'DISPLACEMENT');

    breakoutEvents.forEach(ev => {
      const breakIdx = ev.candleIndex;
      if (breakIdx < 2 || breakIdx >= candles.length) return;

      // Look back 1-4 candles to find the origin opposing candle before the displacement
      if (ev.direction === 'BULLISH') {
        // Bullish Order Block / Demand Zone: last bearish candle before the rally
        let originIdx = breakIdx - 1;
        for (let k = breakIdx - 1; k >= Math.max(0, breakIdx - 4); k--) {
          if (metrics[k].bearish || metrics[k].direction === 'BEARISH') {
            originIdx = k;
            break;
          }
        }

        const oc = candles[originIdx];
        if (oc) {
          const zoneHigh = Number(oc.high.toFixed(digits));
          const zoneLow = Number(oc.low.toFixed(digits));
          const hasSweep = structure.events.some(e => e.type === 'LIQUIDITY_SWEEP' && Math.abs(e.candleIndex - originIdx) <= 2);

          const zone: OrderBlockZone = {
            id: `ob-bull-${originIdx}`,
            type: 'ORDER_BLOCK_BULLISH',
            priceHigh: zoneHigh,
            priceLow: zoneLow,
            timeframe,
            direction: 'BULLISH',
            strength: hasSweep ? 'HIGH' : 'MEDIUM',
            createdAt: oc.time,
            candleIndex: originIdx,
            status: 'UNMITIGATED',
            contextDetails: `Demand origin preceding ${ev.type} at ${ev.price.toFixed(digits)}${hasSweep ? ' with prior liquidity sweep' : ''}`
          };

          this.trackZoneMitigation(zone, candles.slice(breakIdx));
          // Deduplicate overlapping zones
          if (!zones.some(z => Math.abs(z.priceLow - zone.priceLow) < atr14 * 0.2)) {
            zones.push(zone);
          }
        }
      } else if (ev.direction === 'BEARISH') {
        // Bearish Order Block / Supply Zone: last bullish candle before the drop
        let originIdx = breakIdx - 1;
        for (let k = breakIdx - 1; k >= Math.max(0, breakIdx - 4); k--) {
          if (metrics[k].bullish || metrics[k].direction === 'BULLISH') {
            originIdx = k;
            break;
          }
        }

        const oc = candles[originIdx];
        if (oc) {
          const zoneHigh = Number(oc.high.toFixed(digits));
          const zoneLow = Number(oc.low.toFixed(digits));
          const hasSweep = structure.events.some(e => e.type === 'LIQUIDITY_SWEEP' && Math.abs(e.candleIndex - originIdx) <= 2);

          const zone: OrderBlockZone = {
            id: `ob-bear-${originIdx}`,
            type: 'ORDER_BLOCK_BEARISH',
            priceHigh: zoneHigh,
            priceLow: zoneLow,
            timeframe,
            direction: 'BEARISH',
            strength: hasSweep ? 'HIGH' : 'MEDIUM',
            createdAt: oc.time,
            candleIndex: originIdx,
            status: 'UNMITIGATED',
            contextDetails: `Supply origin preceding ${ev.type} at ${ev.price.toFixed(digits)}${hasSweep ? ' with prior liquidity sweep' : ''}`
          };

          this.trackZoneMitigation(zone, candles.slice(breakIdx));
          if (!zones.some(z => Math.abs(z.priceHigh - zone.priceHigh) < atr14 * 0.2)) {
            zones.push(zone);
          }
        }
      }
    });

    return zones;
  }

  private static trackZoneMitigation(zone: OrderBlockZone, subsequentCandles: Candle[]): void {
    if (subsequentCandles.length === 0) return;

    for (const c of subsequentCandles) {
      if (zone.direction === 'BULLISH') {
        if (c.close < zone.priceLow) {
          zone.status = 'INVALIDATED';
          break;
        } else if (c.low <= zone.priceLow) {
          zone.status = 'BREACHED';
        } else if (c.low <= zone.priceHigh) {
          zone.status = 'TESTED';
        }
      } else {
        if (c.close > zone.priceHigh) {
          zone.status = 'INVALIDATED';
          break;
        } else if (c.high >= zone.priceHigh) {
          zone.status = 'BREACHED';
        } else if (c.high >= zone.priceLow) {
          zone.status = 'TESTED';
        }
      }
    }
  }
}
