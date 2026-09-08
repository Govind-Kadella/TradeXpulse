import { Candle, NarrativeAnalysis, FVGZone, OrderBlockZone, CandlePattern, Timeframe } from '../types';
import { MarketStructureState } from './marketStructureEngine';

export class NarrativeEngine {
  /**
   * Generates a dynamic, chronological, factual narrative of "WHAT HAPPENED"
   * from the actual detected events in the market
   */
  public static generateNarrative(
    candles: Candle[],
    structure: MarketStructureState,
    patterns: CandlePattern[] = [],
    fvgs: FVGZone[] = [],
    orderBlocks: OrderBlockZone[] = [],
    digits: number = 2
  ): NarrativeAnalysis {
    if (candles.length < 5) {
      return {
        events: ['Market awaiting sufficient candle structure for chronological analysis.'],
        summary: 'Market data feed initializing.'
      };
    }

    const currentPrice = candles[candles.length - 1].close;
    const events: string[] = [];

    // 1. Liquidity Event
    if (structure.lastLiquiditySweep) {
      events.push(`Price swept the liquidity pool near ${structure.lastLiquiditySweep.price.toFixed(digits)}, rejecting aggressively.`);
    } else if (structure.equalHighs.length > 0) {
      const eqh = structure.equalHighs[structure.equalHighs.length - 1];
      events.push(`Equal highs liquidity pool established at ${eqh.price.toFixed(digits)}.`);
    } else if (structure.equalLows.length > 0) {
      const eql = structure.equalLows[structure.equalLows.length - 1];
      events.push(`Equal lows liquidity pool established at ${eql.price.toFixed(digits)}.`);
    }

    // 2. Pattern Reversal or Defense
    const recentPatterns = patterns.slice(-3);
    if (recentPatterns.length > 0) {
      const p = recentPatterns[recentPatterns.length - 1];
      events.push(`Candle structure formed a ${p.name} (${p.direction.toLowerCase()}) at ${p.price.toFixed(digits)} with ${p.confirmation.toLowerCase()}.`);
    }

    // 3. Displacement
    if (structure.recentDisplacements.length > 0) {
      const disp = structure.recentDisplacements[structure.recentDisplacements.length - 1];
      events.push(`An institutional ${disp.direction.toLowerCase()} displacement candle expanded price toward ${disp.price.toFixed(digits)}.`);
    }

    // 4. Structural Shift (BOS or CHoCH)
    if (structure.lastCHoCH) {
      events.push(`Structure shifted with a confirmed ${structure.lastCHoCH.direction} Change of Character (CHoCH) at ${structure.lastCHoCH.price.toFixed(digits)}.`);
    } else if (structure.lastBOS) {
      events.push(`Trend continuation confirmed via a ${structure.lastBOS.direction} Break of Structure (BOS) beyond ${structure.lastBOS.price.toFixed(digits)}.`);
    }

    // 5. Fair Value Gap Creation & Mitigation
    const activeFvg = fvgs.slice(-3).reverse().find(f => f.status !== 'INVALIDATED');
    if (activeFvg) {
      if (activeFvg.status === 'REJECTED' || activeFvg.status === 'PARTIALLY_FILLED') {
        events.push(`Price retraced into the ${activeFvg.type === 'BULLISH_FVG' ? 'bullish' : 'bearish'} Fair Value Gap (${activeFvg.lowerPrice.toFixed(digits)} - ${activeFvg.upperPrice.toFixed(digits)}), finding responsive rejection at the 50% CE level.`);
      } else if (activeFvg.status === 'UNTOUCHED') {
        events.push(`An unfilled ${activeFvg.type === 'BULLISH_FVG' ? 'bullish' : 'bearish'} Fair Value Gap remains open between ${activeFvg.lowerPrice.toFixed(digits)} and ${activeFvg.upperPrice.toFixed(digits)}.`);
      }
    }

    // 6. Order Block / Demand or Supply Zone Defense
    const activeOb = orderBlocks.slice(-3).reverse().find(o => o.status !== 'INVALIDATED');
    if (activeOb) {
      events.push(`Market participants defended the ${activeOb.direction === 'BULLISH' ? 'demand shelf' : 'supply ceiling'} between ${activeOb.priceLow.toFixed(digits)} and ${activeOb.priceHigh.toFixed(digits)}.`);
    }

    // 7. Current Action
    events.push(`Current price (${currentPrice.toFixed(digits)}) is consolidating in active structural equilibrium awaiting the next expansion.`);

    const summary = events.length > 2 
      ? events.slice(0, 3).join(' ') 
      : 'Market actively auctioning within current structural boundaries.';

    return {
      events,
      summary
    };
  }
}
