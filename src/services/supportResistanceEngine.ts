import { Candle, SupportResistanceLevel, FVGZone, OrderBlockZone } from '../types';
import { MarketStructureState } from './marketStructureEngine';
import { CandleIntelligence } from './candleIntelligence';

export class SupportResistanceEngine {
  /**
   * Identifies robust, high-conviction support and resistance zones from structural swings,
   * break & retest levels, FVG boundaries, and order blocks
   */
  public static calculateLevels(
    candles: Candle[],
    structure: MarketStructureState,
    fvgs: FVGZone[] = [],
    orderBlocks: OrderBlockZone[] = [],
    digits: number = 2
  ): SupportResistanceLevel[] {
    if (candles.length < 5) return [];
    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const clusterTolerance = atr14 * 0.35;
    const currentPrice = candles[candles.length - 1].close;

    // Collect candidate levels from all structural sources
    const candidates: { price: number; source: string; weight: number }[] = [];

    // 1. Swing Highs and Lows
    structure.points.forEach(p => {
      candidates.push({
        price: p.price,
        source: p.type,
        weight: p.isInternal ? 1 : 2
      });
    });

    // 2. Break and Retest levels (BOS and CHoCH levels)
    structure.events.forEach(ev => {
      if (ev.type === 'BOS' || ev.type === 'CHoCH') {
        candidates.push({
          price: ev.price,
          source: `${ev.type} Break & Retest Level`,
          weight: 2.5
        });
      }
    });

    // 3. FVG boundaries and midpoints
    fvgs.filter(f => f.status !== 'INVALIDATED').forEach(f => {
      candidates.push({
        price: f.midPrice,
        source: `${f.type === 'BULLISH_FVG' ? 'Bullish' : 'Bearish'} FVG 50% CE`,
        weight: 1.8
      });
    });

    // 4. Active Order Block boundaries
    orderBlocks.filter(b => b.status !== 'INVALIDATED').forEach(b => {
      const zonePrice = b.direction === 'BULLISH' ? b.priceHigh : b.priceLow;
      candidates.push({
        price: zonePrice,
        source: `${b.direction === 'BULLISH' ? 'Demand' : 'Supply'} Zone Shelf`,
        weight: 2.2
      });
    });

    // Cluster candidates by proximity
    const clusters: { priceSum: number; count: number; totalWeight: number; sources: Set<string> }[] = [];

    candidates.forEach(cand => {
      let matchedCluster = clusters.find(c => Math.abs((c.priceSum / c.count) - cand.price) <= clusterTolerance);
      if (matchedCluster) {
        matchedCluster.priceSum += cand.price * cand.weight;
        matchedCluster.count += cand.weight;
        matchedCluster.totalWeight += cand.weight;
        matchedCluster.sources.add(cand.source);
      } else {
        clusters.push({
          priceSum: cand.price * cand.weight,
          count: cand.weight,
          totalWeight: cand.weight,
          sources: new Set([cand.source])
        });
      }
    });

    // Format and rank clusters into Support and Resistance levels
    const levels: SupportResistanceLevel[] = clusters.map(c => {
      const avgPrice = Number((c.priceSum / c.count).toFixed(digits));
      const isAbove = avgPrice > currentPrice;
      const type: 'SUPPORT' | 'RESISTANCE' | 'EQUILIBRIUM' = 
        Math.abs(avgPrice - currentPrice) < atr14 * 0.15 ? 'EQUILIBRIUM' : (isAbove ? 'RESISTANCE' : 'SUPPORT');
      
      let strength: 'MAJOR' | 'INTERMEDIATE' | 'MINOR' = 'INTERMEDIATE';
      if (c.totalWeight >= 5 || c.sources.size >= 3) {
        strength = 'MAJOR';
      } else if (c.totalWeight < 2.5) {
        strength = 'MINOR';
      }

      const sourcesList = Array.from(c.sources).slice(0, 2).join(' + ');

      return {
        price: avgPrice,
        type,
        strength,
        touches: Math.round(c.totalWeight),
        source: sourcesList || 'Structural Pivot'
      };
    });

    // Sort by price ascending and return top levels
    levels.sort((a, b) => a.price - b.price);
    return levels;
  }
}
