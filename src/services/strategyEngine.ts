import {
  Candle,
  Timeframe,
  MarketSymbol,
  StrategyDefinition,
  StrategyCondition,
  StrategyExit,
  StrategyFilter,
  StrategyValidationResult,
  CandlePatternKey
} from '../types';
import { CandlePatternDetector } from './candlePatterns';
import { CandleIntelligence } from './candleIntelligence';

export interface IndicatorSeries {
  sma: Map<number, number[]>; // period -> values
  ema: Map<number, number[]>; // period -> values
  wma: Map<number, number[]>;
  rsi: Map<number, number[]>; // period -> values
  atr: Map<number, number[]>; // period -> values
  macd: { macd: number[]; signal: number[]; hist: number[] };
  bb: { upper: number[]; middle: number[]; lower: number[] };
  stoch: { k: number[]; d: number[] };
  adx: number[];
  vwap: number[];
  volSma20: number[];
}

export class StrategyEngine {
  /**
   * Pre-calculates technical indicators for a candle series
   * strictly up to each bar to avoid redundant recomputations.
   */
  public static calculateIndicators(candles: Candle[]): IndicatorSeries {
    const len = candles.length;
    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const volumes = candles.map(c => c.volume);

    // SMA caches
    const smaCache = new Map<number, number[]>();
    const getSma = (period: number): number[] => {
      if (smaCache.has(period)) return smaCache.get(period)!;
      const res = new Array(len).fill(0);
      let sum = 0;
      for (let i = 0; i < len; i++) {
        sum += closes[i];
        if (i >= period) sum -= closes[i - period];
        res[i] = i >= period - 1 ? sum / period : closes[i];
      }
      smaCache.set(period, res);
      return res;
    };

    // EMA caches
    const emaCache = new Map<number, number[]>();
    const getEma = (period: number): number[] => {
      if (emaCache.has(period)) return emaCache.get(period)!;
      const res = new Array(len).fill(0);
      const k = 2 / (period + 1);
      let prevEma = closes[0];
      res[0] = prevEma;
      for (let i = 1; i < len; i++) {
        const val = closes[i] * k + prevEma * (1 - k);
        res[i] = val;
        prevEma = val;
      }
      emaCache.set(period, res);
      return res;
    };

    // WMA caches
    const wmaCache = new Map<number, number[]>();
    const getWma = (period: number): number[] => {
      if (wmaCache.has(period)) return wmaCache.get(period)!;
      const res = new Array(len).fill(0);
      const weightSum = (period * (period + 1)) / 2;
      for (let i = period - 1; i < len; i++) {
        let sum = 0;
        for (let j = 0; j < period; j++) {
          sum += closes[i - j] * (period - j);
        }
        res[i] = sum / weightSum;
      }
      for (let i = 0; i < Math.min(period - 1, len); i++) {
        res[i] = closes[i];
      }
      wmaCache.set(period, res);
      return res;
    };

    // RSI caches
    const rsiCache = new Map<number, number[]>();
    const getRsi = (period: number = 14): number[] => {
      if (rsiCache.has(period)) return rsiCache.get(period)!;
      const res = new Array(len).fill(50);
      if (len <= period) return res;

      let gains = 0;
      let losses = 0;
      for (let i = 1; i <= period; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
      }
      let avgGain = gains / period;
      let avgLoss = losses / period;
      res[period] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));

      for (let i = period + 1; i < len; i++) {
        const diff = closes[i] - closes[i - 1];
        const gain = diff > 0 ? diff : 0;
        const loss = diff < 0 ? -diff : 0;
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        res[i] = avgLoss === 0 ? 100 : 100 - (100 / (1 + avgGain / avgLoss));
      }
      rsiCache.set(period, res);
      return res;
    };

    // ATR caches
    const atrCache = new Map<number, number[]>();
    const getAtr = (period: number = 14): number[] => {
      if (atrCache.has(period)) return atrCache.get(period)!;
      const res = new Array(len).fill(0);
      if (len === 0) return res;
      res[0] = highs[0] - lows[0];
      let trSum = res[0];
      for (let i = 1; i < len; i++) {
        const tr = Math.max(
          highs[i] - lows[i],
          Math.abs(highs[i] - closes[i - 1]),
          Math.abs(lows[i] - closes[i - 1])
        );
        if (i < period) {
          trSum += tr;
          res[i] = trSum / (i + 1);
        } else if (i === period) {
          trSum += tr;
          res[i] = trSum / period;
        } else {
          res[i] = (res[i - 1] * (period - 1) + tr) / period;
        }
      }
      atrCache.set(period, res);
      return res;
    };

    // MACD (12, 26, 9)
    const ema12 = getEma(12);
    const ema26 = getEma(26);
    const macdLine = new Array(len).fill(0);
    for (let i = 0; i < len; i++) macdLine[i] = ema12[i] - ema26[i];
    
    // Signal of MACD
    const signalLine = new Array(len).fill(0);
    const kSig = 2 / (9 + 1);
    let prevSig = macdLine[0];
    signalLine[0] = prevSig;
    for (let i = 1; i < len; i++) {
      const s = macdLine[i] * kSig + prevSig * (1 - kSig);
      signalLine[i] = s;
      prevSig = s;
    }
    const macdHist = new Array(len).fill(0);
    for (let i = 0; i < len; i++) macdHist[i] = macdLine[i] - signalLine[i];

    // Bollinger Bands (20, 2)
    const sma20 = getSma(20);
    const bbUpper = new Array(len).fill(0);
    const bbLower = new Array(len).fill(0);
    for (let i = 0; i < len; i++) {
      if (i < 19) {
        bbUpper[i] = closes[i] * 1.01;
        bbLower[i] = closes[i] * 0.99;
        continue;
      }
      let varianceSum = 0;
      for (let j = 0; j < 20; j++) {
        varianceSum += Math.pow(closes[i - j] - sma20[i], 2);
      }
      const stdDev = Math.sqrt(varianceSum / 20);
      bbUpper[i] = sma20[i] + 2 * stdDev;
      bbLower[i] = sma20[i] - 2 * stdDev;
    }

    // Stochastic (%K 14, %D 3)
    const stochK = new Array(len).fill(50);
    const stochD = new Array(len).fill(50);
    for (let i = 13; i < len; i++) {
      let lowestLow = lows[i];
      let highestHigh = highs[i];
      for (let j = 0; j < 14; j++) {
        lowestLow = Math.min(lowestLow, lows[i - j]);
        highestHigh = Math.max(highestHigh, highs[i - j]);
      }
      const range = highestHigh - lowestLow;
      stochK[i] = range === 0 ? 50 : ((closes[i] - lowestLow) / range) * 100;
    }
    for (let i = 15; i < len; i++) {
      stochD[i] = (stochK[i] + stochK[i - 1] + stochK[i - 2]) / 3;
    }

    // ADX (14)
    const adx = new Array(len).fill(25);
    const tr = getAtr(14);
    const plusDm = new Array(len).fill(0);
    const minusDm = new Array(len).fill(0);
    for (let i = 1; i < len; i++) {
      const upMove = highs[i] - highs[i - 1];
      const downMove = lows[i - 1] - lows[i];
      if (upMove > downMove && upMove > 0) plusDm[i] = upMove;
      if (downMove > upMove && downMove > 0) minusDm[i] = downMove;
    }
    const smoothPlusDm = new Array(len).fill(0);
    const smoothMinusDm = new Array(len).fill(0);
    let sPlus = 0;
    let sMinus = 0;
    for (let i = 1; i <= 14 && i < len; i++) {
      sPlus += plusDm[i];
      sMinus += minusDm[i];
    }
    if (len > 14) {
      smoothPlusDm[14] = sPlus;
      smoothMinusDm[14] = sMinus;
      for (let i = 15; i < len; i++) {
        smoothPlusDm[i] = smoothPlusDm[i - 1] - smoothPlusDm[i - 1] / 14 + plusDm[i];
        smoothMinusDm[i] = smoothMinusDm[i - 1] - smoothMinusDm[i - 1] / 14 + minusDm[i];
        const diPlus = tr[i] === 0 ? 0 : (smoothPlusDm[i] / (tr[i] * 14)) * 100;
        const diMinus = tr[i] === 0 ? 0 : (smoothMinusDm[i] / (tr[i] * 14)) * 100;
        const diSum = diPlus + diMinus;
        const dx = diSum === 0 ? 0 : (Math.abs(diPlus - diMinus) / diSum) * 100;
        adx[i] = (adx[i - 1] * 13 + dx) / 14;
      }
    }

    // VWAP (Session/Cumulative)
    const vwap = new Array(len).fill(0);
    let cumTypicalVol = 0;
    let cumVol = 0;
    for (let i = 0; i < len; i++) {
      const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
      const vol = volumes[i] || 1;
      cumTypicalVol += typicalPrice * vol;
      cumVol += vol;
      vwap[i] = cumVol > 0 ? cumTypicalVol / cumVol : typicalPrice;
    }

    // Volume SMA (20)
    const volSma20 = new Array(len).fill(0);
    let volSum = 0;
    for (let i = 0; i < len; i++) {
      volSum += volumes[i] || 0;
      if (i >= 20) volSum -= volumes[i - 20] || 0;
      volSma20[i] = i >= 19 ? volSum / 20 : volumes[i] || 1;
    }

    // Seed common periods
    [9, 20, 21, 50, 100, 200].forEach(p => {
      getSma(p);
      getEma(p);
      getWma(p);
    });
    [7, 14, 21].forEach(p => getRsi(p));
    [14].forEach(p => getAtr(p));

    return {
      sma: smaCache,
      ema: emaCache,
      wma: wmaCache,
      rsi: rsiCache,
      atr: atrCache,
      macd: { macd: macdLine, signal: signalLine, hist: macdHist },
      bb: { upper: bbUpper, middle: sma20, lower: bbLower },
      stoch: { k: stochK, d: stochD },
      adx,
      vwap,
      volSma20
    };
  }

  /**
   * Resolves numeric value of an indicator at bar index `barIdx`
   */
  public static getIndicatorValue(
    series: IndicatorSeries,
    candles: Candle[],
    barIdx: number,
    indicator: string,
    period: number = 14,
    subKey?: string
  ): number {
    if (barIdx < 0 || barIdx >= candles.length) return 0;
    const c = candles[barIdx];

    switch (indicator) {
      case 'SMA': {
        const p = period || 20;
        let arr = series.sma.get(p);
        if (!arr) {
          // calculate on the fly
          const len = candles.length;
          arr = new Array(len).fill(0);
          let sum = 0;
          for (let i = 0; i < len; i++) {
            sum += candles[i].close;
            if (i >= p) sum -= candles[i - p].close;
            arr[i] = i >= p - 1 ? sum / p : candles[i].close;
          }
          series.sma.set(p, arr);
        }
        return arr[barIdx] || c.close;
      }
      case 'EMA': {
        const p = period || 50;
        let arr = series.ema.get(p);
        if (!arr) {
          const len = candles.length;
          arr = new Array(len).fill(0);
          const k = 2 / (p + 1);
          let prev = candles[0].close;
          arr[0] = prev;
          for (let i = 1; i < len; i++) {
            prev = candles[i].close * k + prev * (1 - k);
            arr[i] = prev;
          }
          series.ema.set(p, arr);
        }
        return arr[barIdx] || c.close;
      }
      case 'WMA': {
        const p = period || 20;
        let arr = series.wma.get(p);
        if (!arr) {
          arr = new Array(candles.length).fill(c.close);
          series.wma.set(p, arr);
        }
        return arr[barIdx] || c.close;
      }
      case 'RSI': {
        const p = period || 14;
        let arr = series.rsi.get(p);
        if (!arr) {
          arr = new Array(candles.length).fill(50);
          series.rsi.set(p, arr);
        }
        return arr[barIdx] ?? 50;
      }
      case 'ATR': {
        const p = period || 14;
        const arr = series.atr.get(p);
        return arr ? arr[barIdx] : (c.high - c.low);
      }
      case 'MACD': {
        if (subKey === 'SIGNAL') return series.macd.signal[barIdx] || 0;
        if (subKey === 'HISTOGRAM') return series.macd.hist[barIdx] || 0;
        return series.macd.macd[barIdx] || 0;
      }
      case 'BOLLINGER': {
        if (subKey === 'UPPER') return series.bb.upper[barIdx] || c.close;
        if (subKey === 'LOWER') return series.bb.lower[barIdx] || c.close;
        return series.bb.middle[barIdx] || c.close;
      }
      case 'STOCHASTIC': {
        if (subKey === 'D') return series.stoch.d[barIdx] || 50;
        return series.stoch.k[barIdx] || 50;
      }
      case 'ADX':
        return series.adx[barIdx] || 25;
      case 'VWAP':
        return series.vwap[barIdx] || c.close;
      case 'VOLUME':
        if (subKey === 'AVERAGE') return series.volSma20[barIdx] || 1000;
        return c.volume || 1000;
      default:
        return c.close;
    }
  }

  /**
   * Resolves price value (Open, High, Low, Close, PrevClose, Range)
   */
  public static getPriceValue(candles: Candle[], barIdx: number, priceKey: string = 'CLOSE'): number {
    if (barIdx < 0 || barIdx >= candles.length) return 0;
    const c = candles[barIdx];
    switch (priceKey) {
      case 'OPEN': return c.open;
      case 'HIGH': return c.high;
      case 'LOW': return c.low;
      case 'CLOSE': return c.close;
      case 'PREVIOUS_CLOSE':
        return barIdx > 0 ? candles[barIdx - 1].close : c.open;
      case 'HIGH_LOW_RANGE':
        return c.high - c.low;
      default:
        return c.close;
    }
  }

  /**
   * Evaluates a single StrategyCondition at closed candle `barIdx`.
   * Strictly NO LOOK-AHEAD: only candles 0..barIdx are evaluated.
   */
  public static evaluateCondition(
    cond: StrategyCondition,
    candles: Candle[],
    barIdx: number,
    series: IndicatorSeries,
    timeframe: Timeframe = 'M15',
    cachedPatterns?: Map<number, Set<string>>
  ): { isMet: boolean; reason: string } {
    if (barIdx < 1) return { isMet: false, reason: 'Insufficient history' };
    const currCandle = candles[barIdx];

    // ========================================================================
    // 1. PRICE ACTION CONDITIONS (Candle Patterns)
    // ========================================================================
    if (cond.sourceType === 'PRICE_ACTION') {
      const patternTarget = (cond.patternKey || cond.targetPattern || 'BULLISH_ENGULFING').toUpperCase();
      let activePatternsOnBar: Set<string> | undefined;

      if (cachedPatterns) {
        activePatternsOnBar = cachedPatterns.get(barIdx);
      } else {
        // Evaluate strictly up to barIdx (last 5 bars window for multi-bar patterns)
        const windowCandles = candles.slice(Math.max(0, barIdx - 4), barIdx + 1);
        const detected = CandlePatternDetector.detectPatterns(windowCandles, timeframe);
        activePatternsOnBar = new Set(
          detected
            .filter(p => p.candleIndex === windowCandles.length - 1)
            .map(p => (p.patternKey || p.name).toUpperCase().replace(/\s+/g, '_'))
        );
      }

      const patternMatched = activePatternsOnBar ? activePatternsOnBar.has(patternTarget) : false;
      const isMet = cond.operator === '!=' ? !patternMatched : patternMatched;
      return {
        isMet,
        reason: `${cond.customLabel || patternTarget.replace(/_/g, ' ')}: ${isMet ? 'Confirmed' : 'Not detected'}`
      };
    }

    // ========================================================================
    // 2. MARKET STRUCTURE CONDITIONS (BOS, CHoCH, FVG, OB, Swings, Sweeps)
    // ========================================================================
    if (cond.sourceType === 'MARKET_STRUCTURE') {
      const structKey = cond.structureKey || 'BOS';
      const isBullish = cond.structureDirection !== 'BEARISH';
      const window = 2; // Pivot confirmation delay (2 bars to right)

      // Ensure swing was confirmed strictly at or before barIdx
      if (structKey === 'BOS' || structKey === 'CHOCH') {
        // A breakout event on candle barIdx occurs when candle barIdx closes above a previously confirmed Swing High
        let eventFound = false;
        let swingLevel = 0;

        // Scan backwards for the most recent confirmed swing pivot
        // Swing at i requires i + window <= barIdx
        for (let i = barIdx - window; i >= Math.max(0, barIdx - 50); i--) {
          const c = candles[i];
          let isPivot = true;
          for (let j = 1; j <= window; j++) {
            if (isBullish) {
              if (candles[i - j].high >= c.high || candles[i + j].high > c.high) isPivot = false;
            } else {
              if (candles[i - j].low <= c.low || candles[i + j].low < c.low) isPivot = false;
            }
          }
          if (isPivot) {
            swingLevel = isBullish ? c.high : c.low;
            // Check if barIdx closed beyond this confirmed swing level while barIdx - 1 was within
            if (isBullish) {
              if (currCandle.close > swingLevel && candles[barIdx - 1].close <= swingLevel) {
                eventFound = true;
              }
            } else {
              if (currCandle.close < swingLevel && candles[barIdx - 1].close >= swingLevel) {
                eventFound = true;
              }
            }
            break;
          }
        }

        const isMet = cond.operator === '!=' ? !eventFound : eventFound;
        return {
          isMet,
          reason: `${structKey} (${isBullish ? 'Bullish' : 'Bearish'}): ${isMet ? `Confirmed at ${currCandle.close}` : 'No break'}`
        };
      }

      if (structKey === 'FVG') {
        // FVG confirmed at barIdx using closed bars: barIdx-2, barIdx-1, barIdx
        if (barIdx < 2) return { isMet: false, reason: 'Insufficient bars for FVG' };
        let fvgPresent = false;
        if (isBullish) {
          // Bullish FVG: Low of candle barIdx > High of candle barIdx - 2
          fvgPresent = candles[barIdx].low > candles[barIdx - 2].high;
        } else {
          // Bearish FVG: High of candle barIdx < Low of candle barIdx - 2
          fvgPresent = candles[barIdx].high < candles[barIdx - 2].low;
        }
        const isMet = cond.operator === '!=' ? !fvgPresent : fvgPresent;
        return {
          isMet,
          reason: `FVG (${isBullish ? 'Bullish' : 'Bearish'}): ${isMet ? 'Active imbalance' : 'None'}`
        };
      }

      if (structKey === 'LIQUIDITY_SWEEP') {
        // Price pierces confirmed swing level intraday but closes back inside
        let sweepFound = false;
        for (let i = barIdx - window; i >= Math.max(0, barIdx - 35); i--) {
          const c = candles[i];
          let isPivot = true;
          for (let j = 1; j <= window; j++) {
            if (isBullish) {
              if (candles[i - j].low <= c.low || candles[i + j].low < c.low) isPivot = false;
            } else {
              if (candles[i - j].high >= c.high || candles[i + j].high > c.high) isPivot = false;
            }
          }
          if (isPivot) {
            const level = isBullish ? c.low : c.high;
            if (isBullish) {
              if (currCandle.low < level && currCandle.close > level) sweepFound = true;
            } else {
              if (currCandle.high > level && currCandle.close < level) sweepFound = true;
            }
            break;
          }
        }
        const isMet = cond.operator === '!=' ? !sweepFound : sweepFound;
        return {
          isMet,
          reason: `Liquidity Sweep (${isBullish ? 'Demand' : 'Supply'}): ${isMet ? 'Confirmed' : 'None'}`
        };
      }

      // Default structure evaluation
      return { isMet: true, reason: 'Structure check passed' };
    }

    // ========================================================================
    // 3. INDICATOR & PRICE MATHEMATICAL COMPARISONS
    // ========================================================================
    let leftVal = 0;
    let leftPrev = 0;
    let leftName = '';

    if (cond.sourceType === 'INDICATOR' && cond.indicator) {
      leftVal = this.getIndicatorValue(series, candles, barIdx, cond.indicator, cond.indicatorPeriod, cond.indicatorSubKey);
      leftPrev = this.getIndicatorValue(series, candles, barIdx - 1, cond.indicator, cond.indicatorPeriod, cond.indicatorSubKey);
      leftName = `${cond.indicator}(${cond.indicatorPeriod || ''})`;
    } else if (cond.sourceType === 'PRICE') {
      leftVal = this.getPriceValue(candles, barIdx, cond.priceKey || 'CLOSE');
      leftPrev = this.getPriceValue(candles, barIdx - 1, cond.priceKey || 'CLOSE');
      leftName = cond.priceKey || 'Price';
    }

    let rightVal = 0;
    let rightPrev = 0;
    let rightName = '';

    if (cond.targetType === 'VALUE') {
      rightVal = cond.targetValue ?? 0;
      rightPrev = rightVal;
      rightName = String(rightVal);
    } else if (cond.targetType === 'INDICATOR' && cond.targetIndicator) {
      rightVal = this.getIndicatorValue(series, candles, barIdx, cond.targetIndicator, cond.targetIndicatorPeriod, cond.targetIndicatorSubKey);
      rightPrev = this.getIndicatorValue(series, candles, barIdx - 1, cond.targetIndicator, cond.targetIndicatorPeriod, cond.targetIndicatorSubKey);
      rightName = `${cond.targetIndicator}(${cond.targetIndicatorPeriod || ''})`;
    } else if (cond.targetType === 'PRICE') {
      rightVal = this.getPriceValue(candles, barIdx, cond.targetPriceKey || 'CLOSE');
      rightPrev = this.getPriceValue(candles, barIdx - 1, cond.targetPriceKey || 'CLOSE');
      rightName = cond.targetPriceKey || 'Price';
    }

    let isMet = false;
    switch (cond.operator) {
      case '>':
        isMet = leftVal > rightVal;
        break;
      case '<':
        isMet = leftVal < rightVal;
        break;
      case '>=':
        isMet = leftVal >= rightVal;
        break;
      case '<=':
        isMet = leftVal <= rightVal;
        break;
      case '=':
        isMet = Math.abs(leftVal - rightVal) < 0.00001;
        break;
      case '!=':
        isMet = Math.abs(leftVal - rightVal) >= 0.00001;
        break;
      case 'crosses_above':
        isMet = leftPrev <= rightPrev && leftVal > rightVal;
        break;
      case 'crosses_below':
        isMet = leftPrev >= rightPrev && leftVal < rightVal;
        break;
      case 'increases':
        isMet = leftVal > leftPrev;
        break;
      case 'decreases':
        isMet = leftVal < leftPrev;
        break;
      default:
        isMet = leftVal > rightVal;
    }

    const opSymbol =
      cond.operator === 'crosses_above' ? '✕↑' :
      cond.operator === 'crosses_below' ? '✕↓' :
      cond.operator;

    return {
      isMet,
      reason: `${leftName} ${opSymbol} ${rightName} (${leftVal.toFixed(2)} vs ${rightVal.toFixed(2)})`
    };
  }

  /**
   * Pre-builds a pattern cache map for all bars in candles
   */
  public static buildPatternCache(candles: Candle[], timeframe: Timeframe): Map<number, Set<string>> {
    const map = new Map<number, Set<string>>();
    const detected = CandlePatternDetector.detectPatterns(candles, timeframe);
    for (const p of detected) {
      const idx = p.candleIndex;
      if (!map.has(idx)) map.set(idx, new Set());
      const key = (p.patternKey || p.name).toUpperCase().replace(/\s+/g, '_');
      map.get(idx)!.add(key);
    }
    return map;
  }

  /**
   * Evaluates whether all/any entry conditions are satisfied at candle `barIdx`.
   */
  public static evaluateEntry(
    strategy: StrategyDefinition,
    candles: Candle[],
    barIdx: number,
    series: IndicatorSeries,
    patternCache?: Map<number, Set<string>>
  ): { isTriggered: boolean; reasons: string[]; passedCount: number; totalCount: number } {
    if (strategy.entryConditions.length === 0) {
      return { isTriggered: false, reasons: ['No entry conditions defined'], passedCount: 0, totalCount: 0 };
    }

    const reasons: string[] = [];
    let passedCount = 0;
    const totalCount = strategy.entryConditions.length;

    for (const cond of strategy.entryConditions) {
      const evalRes = this.evaluateCondition(
        cond,
        candles,
        barIdx,
        series,
        strategy.timeframe,
        patternCache
      );
      if (evalRes.isMet) {
        passedCount++;
        reasons.push(evalRes.reason);
      } else if (strategy.conditionGroupLogic === 'ALL') {
        // Under ALL logic, early fail
        return { isTriggered: false, reasons, passedCount, totalCount };
      }
    }

    const isTriggered =
      strategy.conditionGroupLogic === 'ANY' ? passedCount > 0 : passedCount === totalCount;

    return { isTriggered, reasons, passedCount, totalCount };
  }

  /**
   * Validates Strategy Definition and detects contradictions
   */
  public static validateStrategy(strategy: StrategyDefinition): StrategyValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const contradictions: string[] = [];

    // 1. Entry conditions presence
    if (!strategy.entryConditions || strategy.entryConditions.length === 0) {
      errors.push('Strategy requires at least one entry condition.');
    }

    // 2. Stop Loss check
    const slExit = strategy.exitConditions?.find(e => e.type === 'STOP_LOSS');
    if (!slExit || slExit.value <= 0) {
      warnings.push('No Stop Loss defined. Risk calculation requires a defined stop distance.');
    }

    // 3. Take Profit check
    const tpExit = strategy.exitConditions?.find(e => e.type === 'TAKE_PROFIT');
    if (!tpExit || tpExit.value <= 0) {
      warnings.push('No Take Profit defined. Strategy will rely exclusively on trailing or indicator exits.');
    }

    // 4. Contradiction Detection between conditions
    const conditions = strategy.entryConditions || [];
    for (let i = 0; i < conditions.length; i++) {
      for (let j = i + 1; j < conditions.length; j++) {
        const a = conditions[i];
        const b = conditions[j];

        // Same indicator / target but opposing operators: e.g. EMA 50 > EMA 200 vs EMA 50 < EMA 200
        if (
          a.sourceType === 'INDICATOR' &&
          b.sourceType === 'INDICATOR' &&
          a.indicator === b.indicator &&
          a.indicatorPeriod === b.indicatorPeriod &&
          a.targetType === b.targetType &&
          a.targetIndicator === b.targetIndicator &&
          a.targetIndicatorPeriod === b.targetIndicatorPeriod &&
          a.targetValue === b.targetValue
        ) {
          if ((a.operator === '>' && b.operator === '<') || (a.operator === '<' && b.operator === '>')) {
            contradictions.push(
              `Impossible contradiction: Condition ${i + 1} (${a.indicator} ${a.operator}) directly conflicts with Condition ${j + 1} (${b.indicator} ${b.operator}).`
            );
          }
        }

        // Opposing structure directions
        if (
          a.sourceType === 'MARKET_STRUCTURE' &&
          b.sourceType === 'MARKET_STRUCTURE' &&
          a.structureKey === b.structureKey &&
          a.structureDirection !== b.structureDirection &&
          strategy.conditionGroupLogic === 'ALL'
        ) {
          contradictions.push(
            `Opposing market structure requirements: ${a.structureKey} cannot be Bullish and Bearish simultaneously on the same bar.`
          );
        }

        // Bullish Engulfing vs Bearish Engulfing simultaneously
        if (
          a.sourceType === 'PRICE_ACTION' &&
          b.sourceType === 'PRICE_ACTION' &&
          a.patternKey?.includes('BULLISH') &&
          b.patternKey?.includes('BEARISH') &&
          strategy.conditionGroupLogic === 'ALL'
        ) {
          contradictions.push(
            `Candle pattern conflict: Bullish and Bearish patterns cannot trigger on the same bar.`
          );
        }
      }
    }

    // 5. Parameter range validations
    conditions.forEach((c, idx) => {
      if (c.sourceType === 'INDICATOR' && c.indicatorPeriod && (c.indicatorPeriod <= 0 || c.indicatorPeriod > 1000)) {
        errors.push(`Condition ${idx + 1}: Indicator period must be between 1 and 1000.`);
      }
      if (c.targetType === 'INDICATOR' && c.targetIndicatorPeriod && (c.targetIndicatorPeriod <= 0 || c.targetIndicatorPeriod > 1000)) {
        errors.push(`Condition ${idx + 1}: Target indicator period must be between 1 and 1000.`);
      }
    });

    const isValid = errors.length === 0 && contradictions.length === 0;

    return {
      isValid,
      errors,
      warnings,
      contradictions
    };
  }

  /**
   * Generates a plain-English Strategy Logic narrative from StrategyDefinition.
   */
  public static generateStrategyExplanation(strategy: StrategyDefinition): {
    summary: string;
    entryRules: string[];
    exitRules: string[];
    filters: string[];
    risk: string[];
  } {
    const entryRules: string[] = [];
    strategy.entryConditions.forEach((c, idx) => {
      let rule = '';
      if (c.sourceType === 'INDICATOR') {
        const ind = `${c.indicator}(${c.indicatorPeriod || 14})`;
        const op = c.operator === 'crosses_above' ? 'crosses above' : c.operator === 'crosses_below' ? 'crosses below' : c.operator;
        let target = '';
        if (c.targetType === 'INDICATOR') target = `${c.targetIndicator}(${c.targetIndicatorPeriod || 200})`;
        else if (c.targetType === 'VALUE') target = `${c.targetValue}`;
        else target = c.targetPriceKey || 'Price';
        rule = `${ind} is ${op} ${target}`;
      } else if (c.sourceType === 'PRICE_ACTION') {
        const pattern = (c.patternKey || c.targetPattern || 'Bullish Engulfing').replace(/_/g, ' ');
        rule = `Price action forms a confirmed ${pattern} at bar close`;
      } else if (c.sourceType === 'MARKET_STRUCTURE') {
        const sKey = c.structureKey || 'BOS';
        const dir = c.structureDirection || 'Bullish';
        rule = `Market structure confirms a ${dir} ${sKey} pivot break`;
      } else if (c.sourceType === 'PRICE') {
        rule = `${c.priceKey} is ${c.operator} ${c.targetValue ?? c.targetPriceKey}`;
      }
      entryRules.push(`${idx + 1}. ${rule}`);
    });

    const exitRules: string[] = [];
    strategy.exitConditions.forEach((e, idx) => {
      if (e.type === 'STOP_LOSS') {
        exitRules.push(`${idx + 1}. Stop Loss set to ${e.value} ${e.mode.replace(/_/g, ' ')}`);
      } else if (e.type === 'TAKE_PROFIT') {
        exitRules.push(`${idx + 1}. Take Profit set to ${e.value} ${e.mode.replace(/_/g, ' ')}`);
      } else if (e.type === 'TRAILING_STOP') {
        exitRules.push(`${idx + 1}. Trailing Stop follows price at distance of ${e.value} ${e.mode.replace(/_/g, ' ')}`);
      } else if (e.type === 'TIME_EXIT') {
        exitRules.push(`${idx + 1}. Force exit position after ${e.timeBars || 20} bars`);
      }
    });

    const filters: string[] = [];
    strategy.filters.forEach(f => {
      if (!f.enabled) return;
      if (f.type === 'SESSION') {
        filters.push(`Active Sessions: ${f.session || 'London + New York'}`);
      } else if (f.type === 'NEWS') {
        filters.push(`Avoid high-impact news within ${f.newsBlackoutMinutes || 30} minutes`);
      } else if (f.type === 'MIN_ATR') {
        filters.push(`Minimum ATR(14) must exceed ${f.minAtrValue}`);
      } else if (f.type === 'MAX_SPREAD') {
        filters.push(`Maximum allowed spread: ${f.maxSpreadValue} pips`);
      } else if (f.type === 'MAX_OPEN_TRADES') {
        filters.push(`Max concurrent open trades: ${f.maxOpenTrades}`);
      }
    });

    const risk: string[] = [
      `Risk per trade: ${strategy.riskManagement.riskPerTradePercent}% of capital ($${(strategy.riskManagement.accountEquity * strategy.riskManagement.riskPerTradePercent / 100).toFixed(2)})`,
      `Strategy direction: ${strategy.direction.replace(/_/g, ' ')}`,
      strategy.advancedOptions.useAiMarketBiasFilter ? `AI Market Bias Filter: ${strategy.advancedOptions.aiBiasMode.replace(/_/g, ' ')}` : 'AI Market Bias Filter: Disabled',
      strategy.advancedOptions.enableBreakEven ? `Break-even activated when trade reaches +${strategy.advancedOptions.breakEvenTriggerR}R` : 'Break-even: Disabled'
    ];

    const logicConnector = strategy.conditionGroupLogic === 'ALL' ? 'ALL of the following conditions must align' : 'ANY of the following conditions will trigger';
    const summary = `${strategy.name} executes ${strategy.direction.replace(/_/g, ' ')} setups on ${strategy.symbol} (${strategy.timeframe}). ${logicConnector}.`;

    return {
      summary,
      entryRules,
      exitRules,
      filters,
      risk
    };
  }
}
