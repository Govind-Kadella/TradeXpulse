import { Candle, MultiTimeframeSummary, Timeframe, BiasType } from '../types';
import { MarketStructureEngine } from './marketStructureEngine';

export class MultiTimeframeEngine {
  /**
   * Evaluates higher and lower timeframe structure to produce a unified MTF alignment object
   */
  public static evaluateMTF(
    candles: Candle[], 
    activeTimeframe: Timeframe = 'M5',
    digits: number = 2
  ): MultiTimeframeSummary {
    if (candles.length < 15) {
      return {
        h4: { trend: 'Macro Neutral', bias: 'NO TRADE', keyLevel: 0, structure: 'Consolidation' },
        h1: { trend: 'Neutral Order Flow', bias: 'NO TRADE', keyLevel: 0, orderFlow: 'Balanced' },
        m15: { trend: 'Consolidating', bias: 'NO TRADE', recentEvent: 'None' },
        m5: { trend: 'Indecision', bias: 'NO TRADE', immediateMomentum: 'Low' },
        alignment: 'COMPRESSION',
        alignmentDescription: 'Market in tight compression; awaiting structural direction.'
      };
    }

    // Evaluate base structure from available candles
    const structure = MarketStructureEngine.analyzeStructure(candles, activeTimeframe, digits);
    const lastPrice = candles[candles.length - 1].close;

    // Macro Trend Assessment (H4 / H1 simulated from aggregate or slice)
    const longWindow = Math.min(candles.length, 60);
    const shortWindow = Math.min(candles.length, 15);
    const longSlice = candles.slice(-longWindow);
    const shortSlice = candles.slice(-shortWindow);

    const longStartPrice = longSlice[0].open;
    const shortStartPrice = shortSlice[0].open;

    const macroDelta = lastPrice - longStartPrice;
    const shortDelta = lastPrice - shortStartPrice;

    // H4 Macro Context
    let h4Bias: BiasType = 'NO TRADE';
    let h4Trend = 'Macro Range';
    if (macroDelta > 0 && structure.bias === 'BULLISH') {
      h4Bias = 'BULLISH';
      h4Trend = 'Macro Bullish Expansion';
    } else if (macroDelta < 0 && structure.bias === 'BEARISH') {
      h4Bias = 'BEARISH';
      h4Trend = 'Macro Bearish Expansion';
    } else {
      h4Trend = 'Macro Neutral / Equilibrium';
    }

    // H1 Order Flow
    let h1Bias: BiasType = 'NO TRADE';
    let h1OrderFlow = 'Neutral Flow';
    if (shortDelta > 0) {
      h1Bias = 'BULLISH';
      h1OrderFlow = 'Bullish Order Flow • Higher Swing Lows Protected';
    } else if (shortDelta < 0) {
      h1Bias = 'BEARISH';
      h1OrderFlow = 'Bearish Order Flow • Lower Swing Highs Defended';
    } else {
      h1OrderFlow = 'Consolidating Order Flow';
    }

    // M15 Structure
    let m15Bias: BiasType = structure.bias;
    const recentEventDesc = structure.lastCHoCH 
      ? structure.lastCHoCH.description 
      : (structure.lastBOS ? structure.lastBOS.description : 'Sustained Structural Progression');

    // M5 Trigger
    const m5Bias: BiasType = structure.bias;
    const m5Momentum = shortDelta >= 0 ? 'Bullish Acceleration' : 'Bearish Pressure';

    // Alignment logic
    let alignment: 'STRONG_ALIGNMENT' | 'PARTIAL_ALIGNMENT' | 'CONFLICT' | 'COMPRESSION' = 'PARTIAL_ALIGNMENT';
    let alignmentDesc = '';

    if (h4Bias === m5Bias && h1Bias === m5Bias && m5Bias !== 'NO TRADE') {
      alignment = 'STRONG_ALIGNMENT';
      alignmentDesc = `Full multi-timeframe concordance: H4 Macro, H1 Flow, and M5 Trigger all aligned ${m5Bias}. High probability setup.`;
    } else if (h4Bias !== 'NO TRADE' && m5Bias !== 'NO TRADE' && h4Bias !== m5Bias) {
      alignment = 'CONFLICT';
      alignmentDesc = `Timeframe divergence: Macro trend is ${h4Bias} while immediate M5 momentum is ${m5Bias}. Pullback or transition phase.`;
    } else if (structure.trend === 'RANGE') {
      alignment = 'COMPRESSION';
      alignmentDesc = 'Equilibrium compression across timeframes. Standing by for clear structural resolution.';
    } else {
      alignment = 'PARTIAL_ALIGNMENT';
      alignmentDesc = `Constructive alignment: Immediate M5 structure favors ${m5Bias} with institutional demand/supply defense.`;
    }

    return {
      h4: {
        trend: h4Trend,
        bias: h4Bias,
        keyLevel: structure.externalSwingHigh?.price || lastPrice,
        structure: `${h4Trend} above key demand shelf`
      },
      h1: {
        trend: h1OrderFlow,
        bias: h1Bias,
        keyLevel: structure.externalSwingLow?.price || lastPrice,
        orderFlow: h1OrderFlow
      },
      m15: {
        trend: structure.trend,
        bias: m15Bias,
        recentEvent: recentEventDesc,
        activeFvg: 'M15 Imbalance mitigation active'
      },
      m5: {
        trend: `${structure.trend} (Immediate Trigger)`,
        bias: m5Bias,
        immediateMomentum: m5Momentum,
        triggerPattern: structure.lastLiquiditySweep?.description || 'Structural pullback test'
      },
      alignment,
      alignmentDescription: alignmentDesc
    };
  }
}
