import { Candle, CandlePattern, Timeframe } from '../types';
import { CandleIntelligence } from './candleIntelligence';

export class CandlePatternDetector {
  /**
   * Scans a series of candles and returns all detected patterns with context
   */
  public static detectPatterns(candles: Candle[], timeframe: Timeframe = 'M5'): CandlePattern[] {
    if (candles.length < 3) return [];
    const patterns: CandlePattern[] = [];
    const atr14 = CandleIntelligence.calculateAtr14(candles);
    const metrics = CandleIntelligence.calculateSeriesMetrics(candles);

    for (let i = 1; i < candles.length; i++) {
      const c = candles[i];
      const m = metrics[i];
      const prev = candles[i - 1];
      const prevM = metrics[i - 1];
      const prev2 = i >= 2 ? candles[i - 2] : undefined;
      const prev2M = i >= 2 ? metrics[i - 2] : undefined;
      const prev3 = i >= 3 ? candles[i - 3] : undefined;
      const prev4 = i >= 4 ? candles[i - 4] : undefined;

      // -------------------------------------------------------------
      // 1. SINGLE CANDLE PATTERNS
      // -------------------------------------------------------------
      
      // Doji variants
      if (m.bodyToRange < 0.08) {
        if (m.lowerWickPercentage > 58 && m.upperWickPercentage < 15) {
          patterns.push({
            name: 'Dragonfly Doji',
            type: 'SINGLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Demand liquidity rejection',
            strength: 'HIGH',
            confirmation: 'Long lower wick rejecting lower prices',
            invalidation: `Break below low at ${c.low.toFixed(2)}`
          });
        } else if (m.upperWickPercentage > 58 && m.lowerWickPercentage < 15) {
          patterns.push({
            name: 'Gravestone Doji',
            type: 'SINGLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Supply liquidity rejection',
            strength: 'HIGH',
            confirmation: 'Long upper wick rejecting higher prices',
            invalidation: `Break above high at ${c.high.toFixed(2)}`
          });
        } else {
          patterns.push({
            name: 'Neutral Doji',
            type: 'SINGLE',
            direction: 'NEUTRAL',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Market equilibrium / indecision',
            strength: 'MEDIUM',
            confirmation: 'Equilibrium compression between buyers and sellers',
            invalidation: 'Breakout above high or below low'
          });
        }
      }

      // Hammer / Hanging Man (long lower wick >= 2x body, tiny upper wick)
      if (m.lowerWick >= 2 * m.body && m.upperWick <= 0.25 * m.body && m.bodyToRange >= 0.08) {
        const isDowntrend = prev.close < (prev2 ? prev2.close : prev.close);
        patterns.push({
          name: isDowntrend ? 'Hammer Reversal' : 'Hanging Man Warning',
          type: 'SINGLE',
          direction: isDowntrend ? 'BULLISH' : 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: isDowntrend ? 'Oversold structural swing low' : 'Overextended swing high',
          strength: 'HIGH',
          confirmation: `${m.lowerWickPercentage}% lower wick absorption`,
          invalidation: `Close below ${c.low.toFixed(2)}`
        });
      }

      // Inverted Hammer / Shooting Star (long upper wick >= 2x body, tiny lower wick)
      if (m.upperWick >= 2 * m.body && m.lowerWick <= 0.25 * m.body && m.bodyToRange >= 0.08) {
        const isUptrend = prev.close > (prev2 ? prev2.close : prev.close);
        patterns.push({
          name: isUptrend ? 'Shooting Star' : 'Inverted Hammer',
          type: 'SINGLE',
          direction: isUptrend ? 'BEARISH' : 'BULLISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: isUptrend ? 'Premium supply zone' : 'Discount demand test',
          strength: 'HIGH',
          confirmation: `${m.upperWickPercentage}% upper wick rejection`,
          invalidation: `Close above ${c.high.toFixed(2)}`
        });
      }

      // Pin Bar (distinctive long wick >= 65% of entire range)
      if (m.lowerWickPercentage >= 65 && m.bodyPercentage < 30) {
        patterns.push({
          name: 'Bullish Pin Bar',
          type: 'SINGLE',
          direction: 'BULLISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Key support level rejection',
          strength: 'HIGH',
          confirmation: 'Aggressive buyer intervention off lows',
          invalidation: `Breach of pin low ${c.low.toFixed(2)}`
        });
      } else if (m.upperWickPercentage >= 65 && m.bodyPercentage < 30) {
        patterns.push({
          name: 'Bearish Pin Bar',
          type: 'SINGLE',
          direction: 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Key resistance level rejection',
          strength: 'HIGH',
          confirmation: 'Aggressive seller defense at highs',
          invalidation: `Breach of pin high ${c.high.toFixed(2)}`
        });
      }

      // Marubozu (strong directional expansion with body >= 85% of range)
      if (m.bodyToRange >= 0.82 && m.relativeRange >= 1.1) {
        patterns.push({
          name: m.bullish ? 'Bullish Marubozu Expansion' : 'Bearish Marubozu Expansion',
          type: 'SINGLE',
          direction: m.bullish ? 'BULLISH' : 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Displacement initiative move',
          strength: 'HIGH',
          confirmation: `${m.bodyPercentage}% solid directional displacement`,
          invalidation: `Retracement beyond 50% of candle body at ${((c.open + c.close) / 2).toFixed(2)}`
        });
      }

      // Spinning Top (small body with balanced upper & lower wicks)
      if (m.bodyToRange >= 0.12 && m.bodyToRange <= 0.35 && m.upperWickPercentage > 25 && m.lowerWickPercentage > 25) {
        patterns.push({
          name: 'Spinning Top',
          type: 'SINGLE',
          direction: 'NEUTRAL',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Trend pause / volatility compression',
          strength: 'MEDIUM',
          confirmation: 'Balanced two-way liquidation before expansion',
          invalidation: 'Decisive close outside high/low range'
        });
      }

      // -------------------------------------------------------------
      // 2. TWO-CANDLE PATTERNS
      // -------------------------------------------------------------

      // Bullish Engulfing: previous bearish, current bullish body engulfs previous body
      if (prevM.bearish && m.bullish && c.close >= prev.open && c.open <= prev.close && m.body > prevM.body * 1.1) {
        patterns.push({
          name: 'Bullish Engulfing',
          type: 'TWO_CANDLE',
          direction: 'BULLISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Demand origin / Swing low reversal',
          strength: 'HIGH',
          confirmation: 'Complete absorption of prior selling momentum',
          invalidation: `Close below engulfing low ${Math.min(c.low, prev.low).toFixed(2)}`
        });
      }

      // Bearish Engulfing: previous bullish, current bearish body engulfs previous body
      if (prevM.bullish && m.bearish && c.close <= prev.open && c.open >= prev.close && m.body > prevM.body * 1.1) {
        patterns.push({
          name: 'Bearish Engulfing',
          type: 'TWO_CANDLE',
          direction: 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Supply origin / Swing high reversal',
          strength: 'HIGH',
          confirmation: 'Complete absorption of prior buying momentum',
          invalidation: `Close above engulfing high ${Math.max(c.high, prev.high).toFixed(2)}`
        });
      }

      // Harami (inside body pattern)
      if (prevM.body > 0 && m.body < prevM.body * 0.6) {
        if (prevM.bearish && m.bullish && c.open >= prev.close && c.close <= prev.open) {
          patterns.push({
            name: 'Bullish Harami',
            type: 'TWO_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Selling exhaustion inside prior range',
            strength: 'MEDIUM',
            confirmation: 'Contained body signalling impending reversal',
            invalidation: `Break below mother candle low ${prev.low.toFixed(2)}`
          });
        } else if (prevM.bullish && m.bearish && c.open <= prev.close && c.close >= prev.open) {
          patterns.push({
            name: 'Bearish Harami',
            type: 'TWO_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Buying exhaustion inside prior range',
            strength: 'MEDIUM',
            confirmation: 'Contained body signalling impending reversal',
            invalidation: `Break above mother candle high ${prev.high.toFixed(2)}`
          });
        }
      }

      // Piercing Pattern (bullish opens below prev low and closes > 50% into prev bearish body)
      if (prevM.bearish && m.bullish && c.open < prev.low && c.close > (prev.open + prev.close) / 2 && c.close < prev.open) {
        patterns.push({
          name: 'Piercing Pattern',
          type: 'TWO_CANDLE',
          direction: 'BULLISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Discount demand displacement',
          strength: 'HIGH',
          confirmation: 'Deep penetration into prior bearish body',
          invalidation: `Close below low ${c.low.toFixed(2)}`
        });
      }

      // Dark Cloud Cover (bearish opens above prev high and closes > 50% into prev bullish body)
      if (prevM.bullish && m.bearish && c.open > prev.high && c.close < (prev.open + prev.close) / 2 && c.close > prev.open) {
        patterns.push({
          name: 'Dark Cloud Cover',
          type: 'TWO_CANDLE',
          direction: 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Premium supply displacement',
          strength: 'HIGH',
          confirmation: 'Deep penetration into prior bullish body',
          invalidation: `Close above high ${c.high.toFixed(2)}`
        });
      }

      // Tweezer Top / Tweezer Bottom (matching highs/lows within 0.08 * ATR)
      const diffTolerance = atr14 * 0.08;
      if (Math.abs(c.high - prev.high) <= diffTolerance && m.upperWickPercentage > 30 && prevM.upperWickPercentage > 30) {
        patterns.push({
          name: 'Tweezer Top Rejection',
          type: 'TWO_CANDLE',
          direction: 'BEARISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Double high liquidity test',
          strength: 'HIGH',
          confirmation: 'Consecutive wick rejections at identical ceiling',
          invalidation: `Close above tweezer high ${c.high.toFixed(2)}`
        });
      } else if (Math.abs(c.low - prev.low) <= diffTolerance && m.lowerWickPercentage > 30 && prevM.lowerWickPercentage > 30) {
        patterns.push({
          name: 'Tweezer Bottom Defense',
          type: 'TWO_CANDLE',
          direction: 'BULLISH',
          timeframe,
          candleIndex: i,
          timestamp: c.time,
          price: c.close,
          location: 'Double low liquidity sweep',
          strength: 'HIGH',
          confirmation: 'Consecutive wick defenses at identical floor',
          invalidation: `Close below tweezer low ${c.low.toFixed(2)}`
        });
      }

      // -------------------------------------------------------------
      // 3. MULTI-CANDLE PATTERNS (3+ Candles)
      // -------------------------------------------------------------
      if (prev2 && prev2M) {
        // Morning Star: Candle 1 bearish, Candle 2 small star at low, Candle 3 bullish closing > 50% into candle 1
        if (prev2M.bearish && prevM.bodyToRange < 0.35 && m.bullish && c.close > (prev2.open + prev2.close) / 2) {
          patterns.push({
            name: 'Morning Star',
            type: 'MULTI_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Macro structural turn / Key pivot bottom',
            strength: 'HIGH',
            confirmation: 'Three-stage accumulation and bullish breakout',
            invalidation: `Break below star low ${Math.min(c.low, prev.low, prev2.low).toFixed(2)}`
          });
        }

        // Evening Star: Candle 1 bullish, Candle 2 small star at high, Candle 3 bearish closing > 50% into candle 1
        if (prev2M.bullish && prevM.bodyToRange < 0.35 && m.bearish && c.close < (prev2.open + prev2.close) / 2) {
          patterns.push({
            name: 'Evening Star',
            type: 'MULTI_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Macro structural turn / Key pivot top',
            strength: 'HIGH',
            confirmation: 'Three-stage distribution and bearish breakdown',
            invalidation: `Break above star high ${Math.max(c.high, prev.high, prev2.high).toFixed(2)}`
          });
        }

        // Three White Soldiers: 3 consecutive long bullish candles closing near highs
        if (
          m.bullish && prevM.bullish && prev2M.bullish &&
          c.close > prev.close && prev.close > prev2.close &&
          m.bodyToRange > 0.65 && prevM.bodyToRange > 0.65 && prev2M.bodyToRange > 0.65
        ) {
          patterns.push({
            name: 'Three White Soldiers',
            type: 'MULTI_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Sustained institutional trend continuation',
            strength: 'HIGH',
            confirmation: 'Unbroken consecutive bullish closes with expanding volume',
            invalidation: `Loss of 1st soldier low at ${prev2.low.toFixed(2)}`
          });
        }

        // Three Black Crows: 3 consecutive long bearish candles closing near lows
        if (
          m.bearish && prevM.bearish && prev2M.bearish &&
          c.close < prev.close && prev.close < prev2.close &&
          m.bodyToRange > 0.65 && prevM.bodyToRange > 0.65 && prev2M.bodyToRange > 0.65
        ) {
          patterns.push({
            name: 'Three Black Crows',
            type: 'MULTI_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Sustained institutional markdown continuation',
            strength: 'HIGH',
            confirmation: 'Unbroken consecutive bearish closes with expanding volume',
            invalidation: `Loss of 1st crow high at ${prev2.high.toFixed(2)}`
          });
        }

        // Three Inside Up: Bearish, Bullish Harami, then 3rd candle closes above 1st candle's high
        if (prev2M.bearish && prevM.bullish && prev.close < prev2.open && m.bullish && c.close > prev2.high) {
          patterns.push({
            name: 'Three Inside Up',
            type: 'MULTI_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Harami confirmation breakout',
            strength: 'HIGH',
            confirmation: 'Decisive breakout above mother candle high',
            invalidation: `Close below harami low ${prev.low.toFixed(2)}`
          });
        }

        // Three Inside Down: Bullish, Bearish Harami, then 3rd candle closes below 1st candle's low
        if (prev2M.bullish && prevM.bearish && prev.close > prev2.open && m.bearish && c.close < prev2.low) {
          patterns.push({
            name: 'Three Inside Down',
            type: 'MULTI_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Harami confirmation breakdown',
            strength: 'HIGH',
            confirmation: 'Decisive breakdown below mother candle low',
            invalidation: `Close above harami high ${prev.high.toFixed(2)}`
          });
        }

        // Three Outside Up: Bearish candle 1, Bullish Engulfing candle 2, followed by Bullish candle 3 closing higher
        if (prev2M.bearish && prevM.bullish && prev.close >= prev2.open && prev.open <= prev2.close && m.bullish && c.close > prev.close) {
          patterns.push({
            name: 'Three Outside Up',
            type: 'MULTI_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Engulfing momentum follow-through / Demand expansion',
            strength: 'HIGH',
            confirmation: 'Follow-through close exceeding bullish engulfing candle',
            invalidation: `Close below pattern low ${Math.min(c.low, prev.low, prev2.low).toFixed(2)}`
          });
        }

        // Three Outside Down: Bullish candle 1, Bearish Engulfing candle 2, followed by Bearish candle 3 closing lower
        if (prev2M.bullish && prevM.bearish && prev.close <= prev2.open && prev.open >= prev2.close && m.bearish && c.close < prev.close) {
          patterns.push({
            name: 'Three Outside Down',
            type: 'MULTI_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Engulfing momentum follow-through / Supply expansion',
            strength: 'HIGH',
            confirmation: 'Follow-through close exceeding bearish engulfing candle',
            invalidation: `Close above pattern high ${Math.max(c.high, prev.high, prev2.high).toFixed(2)}`
          });
        }
      }

      // Rising Three Methods / Falling Three Methods (5 candles)
      if (prev4 && prev3 && prev2 && prev2M && prevM) {
        // Rising Three: Candle 1 strong bull, candles 2,3,4 small pullbacks inside candle 1 range, candle 5 strong bull closing above candle 1 high
        const c1 = prev4;
        const c1M = metrics[i - 4];
        if (
          c1M?.bullish && c1M.bodyToRange > 0.65 &&
          prev3.close < c1.high && prev3.close > c1.low &&
          prev2.close < c1.high && prev2.close > c1.low &&
          prev.close < c1.high && prev.close > c1.low &&
          m.bullish && c.close > c1.high
        ) {
          patterns.push({
            name: 'Rising Three Methods',
            type: 'MULTI_CANDLE',
            direction: 'BULLISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Trend continuation after shallow compression',
            strength: 'HIGH',
            confirmation: 'Expansion break after 3-candle healthy pullback',
            invalidation: `Breach of pattern support ${c1.low.toFixed(2)}`
          });
        }

        // Falling Three: Candle 1 strong bear, candles 2,3,4 small counter rallies inside candle 1 range, candle 5 strong bear closing below candle 1 low
        if (
          c1M?.bearish && c1M.bodyToRange > 0.65 &&
          prev3.close > c1.low && prev3.close < c1.high &&
          prev2.close > c1.low && prev2.close < c1.high &&
          prev.close > c1.low && prev.close < c1.high &&
          m.bearish && c.close < c1.low
        ) {
          patterns.push({
            name: 'Falling Three Methods',
            type: 'MULTI_CANDLE',
            direction: 'BEARISH',
            timeframe,
            candleIndex: i,
            timestamp: c.time,
            price: c.close,
            location: 'Trend markdown continuation after shallow relief rally',
            strength: 'HIGH',
            confirmation: 'Expansion breakdown after 3-candle compression',
            invalidation: `Breach of pattern resistance ${c1.high.toFixed(2)}`
          });
        }
      }
    }

    return patterns;
  }
}
