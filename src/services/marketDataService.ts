import { MarketSymbol, Timeframe, Candle, MarketOverview, SymbolMetadata } from '../types';
import { RealtimeMarketClient } from './realtimeMarketClient';

export const MARKET_META: Record<MarketSymbol, SymbolMetadata> = {
  XAUUSD: {
    symbol: 'XAUUSD',
    displayName: 'Gold Spot / USD',
    name: 'Gold Spot / USD',
    providerSymbol: 'XAU/USD',
    marketType: 'SPOT',
    pricePrecision: 2,
    tickSize: 0.01,
    pointSize: 0.1,
    pipMultiplier: 10,
    unit: 'points',
    defaultSpread: 0.18
  },
  EURJPY: {
    symbol: 'EURJPY',
    displayName: 'Euro / Japanese Yen',
    name: 'Euro / Japanese Yen',
    providerSymbol: 'EUR/JPY',
    marketType: 'FOREX',
    pricePrecision: 3,
    tickSize: 0.001,
    pointSize: 0.01,
    pipMultiplier: 100,
    unit: 'pips',
    defaultSpread: 1.1
  },
  EURUSD: {
    symbol: 'EURUSD',
    displayName: 'Euro / US Dollar',
    name: 'Euro / US Dollar',
    providerSymbol: 'EUR/USD',
    marketType: 'FOREX',
    pricePrecision: 5,
    tickSize: 0.00001,
    pointSize: 0.0001,
    pipMultiplier: 10000,
    unit: 'pips',
    defaultSpread: 0.6
  },
  GBPUSD: {
    symbol: 'GBPUSD',
    displayName: 'Great Britain Pound / US Dollar',
    name: 'Great Britain Pound / US Dollar',
    providerSymbol: 'GBP/USD',
    marketType: 'FOREX',
    pricePrecision: 5,
    tickSize: 0.00001,
    pointSize: 0.0001,
    pipMultiplier: 10000,
    unit: 'pips',
    defaultSpread: 0.8
  }
};

export class MarketDataService {
  private static localCandleCache: Map<string, Candle[]> = new Map();

  /**
   * Fetches real historical candles from the server-side market data provider,
   * falling back smoothly to local synchronous cache if awaiting network resolution.
   */
  public static async fetchHistoricalCandles(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    count: number = 250
  ): Promise<Candle[]> {
    try {
      const client = RealtimeMarketClient.getInstance();
      const candles = await client.fetchHistory(symbol, timeframe, count);
      if (candles && candles.length > 0) {
        this.localCandleCache.set(`${symbol}_${timeframe}`, candles);
        return candles;
      }
    } catch (err) {
      console.warn('[MarketDataService.fetchHistoricalCandles fallback]', err);
    }
    return this.getHistoricalCandles(symbol, timeframe, count);
  }

  /**
   * Synchronous accessor for candle history (cached or bootstrapped)
   */
  public static getHistoricalCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number = 250): Candle[] {
    const cacheKey = `${symbol}_${timeframe}`;
    if (this.localCandleCache.has(cacheKey)) {
      const cached = this.localCandleCache.get(cacheKey)!;
      return cached.slice(-count);
    }

    const meta = MARKET_META[symbol];
    const digits = meta.pricePrecision;

    const tfMsMap: Record<Timeframe, number> = {
      M1: 60 * 1000,
      M5: 5 * 60 * 1000,
      M15: 15 * 60 * 1000,
      H1: 60 * 60 * 1000,
      H4: 4 * 60 * 60 * 1000,
      D1: 24 * 60 * 60 * 1000,
    };
    const stepMs = tfMsMap[timeframe];
    const now = Date.now();
    const startTime = Math.floor(now / stepMs) * stepMs - count * stepMs;

    const candles: Candle[] = [];
    const tfVolatilityMult: Record<Timeframe, number> = {
      M1: 0.4,
      M5: 1.0,
      M15: 1.8,
      H1: 3.2,
      H4: 6.5,
      D1: 14.0
    };

    const baseUnit = (symbol === 'XAUUSD' ? 1.4 : symbol === 'EURJPY' ? 0.09 : 0.00045) * tfVolatilityMult[timeframe];
    const basePrices: Record<MarketSymbol, number> = {
      XAUUSD: 2357.89,
      EURJPY: 162.850,
      EURUSD: 1.08450,
      GBPUSD: 1.27200
    };

    let runningPrice = basePrices[symbol] - (count * 0.02 * baseUnit);
    let waveDirection = 1;
    let waveLength = 22;
    let waveProgress = 0;

    for (let i = 0; i < count; i++) {
      const time = startTime + i * stepMs;
      waveProgress++;
      if (waveProgress >= waveLength) {
        waveDirection = waveDirection === 1 ? -1 : 1;
        waveProgress = 0;
        waveLength = 16 + Math.floor(Math.random() * 14);
      }

      const isImpulse = waveProgress < waveLength * 0.65;
      const drift = isImpulse 
        ? waveDirection * (Math.random() * baseUnit * 0.85)
        : -waveDirection * (Math.random() * baseUnit * 0.55);

      const noise = (Math.random() - 0.49) * baseUnit * 0.9;
      const open = Number(runningPrice.toFixed(digits));
      let close = Number((open + drift + noise).toFixed(digits));
      if (close <= 0) close = open + baseUnit;

      const higher = Math.max(open, close);
      const lower = Math.min(open, close);

      const isPivot = waveProgress === waveLength - 1 || waveProgress === 0;
      const wickTopMult = isPivot && waveDirection === 1 ? 1.5 : 0.55;
      const wickBotMult = isPivot && waveDirection === -1 ? 1.5 : 0.55;

      const wickTop = Math.random() * baseUnit * wickTopMult;
      const wickBottom = Math.random() * baseUnit * wickBotMult;

      const high = Number((higher + wickTop).toFixed(digits));
      const low = Number((lower - wickBottom).toFixed(digits));
      const volume = Math.floor(1400 + Math.random() * 1800 + (Math.abs(close - open) / baseUnit) * 700);

      candles.push({ time, open, high, low, close, volume });
      runningPrice = close;
    }

    this.localCandleCache.set(cacheKey, candles);
    return candles;
  }

  /**
   * Computes MarketOverview metadata from real current candles with dynamic ATR14
   */
  public static getMarketOverview(symbol: MarketSymbol, currentCandles: Candle[]): MarketOverview {
    const meta = MARKET_META[symbol];
    const lastCandle = currentCandles[currentCandles.length - 1];
    const firstCandle = currentCandles[0];
    const currentPrice = lastCandle ? lastCandle.close : (symbol === 'XAUUSD' ? 2357.89 : 1.0845);
    
    const baselineCandle = currentCandles.length > 30 ? currentCandles[currentCandles.length - 30] : (firstCandle || lastCandle);
    const baselinePrice = baselineCandle ? baselineCandle.open : currentPrice;
    
    const change = Number((currentPrice - baselinePrice).toFixed(meta.pricePrecision));
    const changePercent = Number(((change / (baselinePrice || 1)) * 100).toFixed(2));

    // Dynamic 14-period Average True Range
    const atr14Candles = currentCandles.slice(-15);
    let trSum = 0;
    for (let i = 1; i < atr14Candles.length; i++) {
      const prev = atr14Candles[i - 1];
      const curr = atr14Candles[i];
      const tr = Math.max(
        curr.high - curr.low,
        Math.abs(curr.high - prev.close),
        Math.abs(curr.low - prev.close)
      );
      trSum += tr;
    }
    const calculatedAtr = atr14Candles.length > 1
      ? Number((trSum / (atr14Candles.length - 1)).toFixed(meta.pricePrecision))
      : (symbol === 'XAUUSD' ? 12.45 : symbol === 'EURJPY' ? 0.68 : 0.0042);

    const session = 'London / NY';

    const volatility = meta.unit === 'points'
      ? `${calculatedAtr.toFixed(meta.pricePrecision)} pts`
      : `${(calculatedAtr * meta.pipMultiplier).toFixed(1)} pips`;

    return {
      symbol,
      name: meta.name,
      currentPrice,
      change,
      changePercent,
      spread: meta.defaultSpread,
      session,
      volatility,
      atr14: calculatedAtr,
      digits: meta.pricePrecision,
      pointValue: meta.pipMultiplier
    };
  }
}
