import { 
  ScannerInstrument, 
  AssetCategory, 
  SentimentMetrics, 
  FearGreedIndexData, 
  MarketSymbol, 
  BiasType, 
  Candle 
} from '../types';
import { MarketDataService, MARKET_META } from './marketDataService';
import { TwelveDataMarketService, SymbolMarketState } from './TwelveDataMarketService';
import { AnalysisEngine } from './analysisEngine';

export interface CatalogItemMeta {
  symbol: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto' | 'Stocks';
  pricePrecision: number;
  tickSize: number;
  pipMultiplier: number;
  unit: string;
  basePrice: number;
  isCoreLive: boolean;
}

export const SCANNER_CATALOG: CatalogItemMeta[] = [
  // --- COMMODITIES ---
  {
    symbol: 'XAUUSD',
    name: 'Gold Spot / US Dollar',
    category: 'Commodities',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 10,
    unit: 'points',
    basePrice: 2357.89,
    isCoreLive: true
  },
  {
    symbol: 'SILVER',
    name: 'Silver Spot / US Dollar',
    category: 'Commodities',
    pricePrecision: 3,
    tickSize: 0.005,
    pipMultiplier: 100,
    unit: 'points',
    basePrice: 31.42,
    isCoreLive: false
  },
  {
    symbol: 'UKOIL',
    name: 'Brent Crude Oil',
    category: 'Commodities',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'points',
    basePrice: 78.45,
    isCoreLive: false
  },
  {
    symbol: 'USOIL',
    name: 'WTI Crude Oil',
    category: 'Commodities',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'points',
    basePrice: 74.20,
    isCoreLive: false
  },

  // --- FOREX ---
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    pricePrecision: 5,
    tickSize: 0.00001,
    pipMultiplier: 10000,
    unit: 'pips',
    basePrice: 1.0848,
    isCoreLive: true
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'Forex',
    pricePrecision: 5,
    tickSize: 0.00001,
    pipMultiplier: 10000,
    unit: 'pips',
    basePrice: 1.2682,
    isCoreLive: true
  },
  {
    symbol: 'EURJPY',
    name: 'Euro / Japanese Yen',
    category: 'Forex',
    pricePrecision: 3,
    tickSize: 0.001,
    pipMultiplier: 100,
    unit: 'pips',
    basePrice: 164.35,
    isCoreLive: true
  },
  {
    symbol: 'USDJPY',
    name: 'US Dollar / Japanese Yen',
    category: 'Forex',
    pricePrecision: 3,
    tickSize: 0.001,
    pipMultiplier: 100,
    unit: 'pips',
    basePrice: 151.72,
    isCoreLive: false
  },
  {
    symbol: 'AUDUSD',
    name: 'Australian Dollar / US Dollar',
    category: 'Forex',
    pricePrecision: 5,
    tickSize: 0.00001,
    pipMultiplier: 10000,
    unit: 'pips',
    basePrice: 0.6585,
    isCoreLive: false
  },
  {
    symbol: 'USDCAD',
    name: 'US Dollar / Canadian Dollar',
    category: 'Forex',
    pricePrecision: 5,
    tickSize: 0.00001,
    pipMultiplier: 10000,
    unit: 'pips',
    basePrice: 1.3690,
    isCoreLive: false
  },

  // --- INDICES ---
  {
    symbol: 'US30',
    name: 'Dow Jones Industrial 30',
    category: 'Indices',
    pricePrecision: 1,
    tickSize: 0.1,
    pipMultiplier: 1,
    unit: 'pts',
    basePrice: 42865.0,
    isCoreLive: false
  },
  {
    symbol: 'NAS100',
    name: 'Nasdaq 100 Index',
    category: 'Indices',
    pricePrecision: 2,
    tickSize: 0.25,
    pipMultiplier: 1,
    unit: 'pts',
    basePrice: 20450.75,
    isCoreLive: false
  },
  {
    symbol: 'US500',
    name: 'S&P 500 Index',
    category: 'Indices',
    pricePrecision: 2,
    tickSize: 0.25,
    pipMultiplier: 1,
    unit: 'pts',
    basePrice: 5824.50,
    isCoreLive: false
  },
  {
    symbol: 'GER40',
    name: 'DAX 40 Germany',
    category: 'Indices',
    pricePrecision: 1,
    tickSize: 0.1,
    pipMultiplier: 1,
    unit: 'pts',
    basePrice: 19385.0,
    isCoreLive: false
  },

  // --- CRYPTO ---
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'Crypto',
    pricePrecision: 2,
    tickSize: 0.1,
    pipMultiplier: 1,
    unit: 'USD',
    basePrice: 67540.0,
    isCoreLive: false
  },
  {
    symbol: 'ETHUSD',
    name: 'Ethereum / US Dollar',
    category: 'Crypto',
    pricePrecision: 2,
    tickSize: 0.05,
    pipMultiplier: 1,
    unit: 'USD',
    basePrice: 2645.20,
    isCoreLive: false
  },
  {
    symbol: 'SOLUSD',
    name: 'Solana / US Dollar',
    category: 'Crypto',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 1,
    unit: 'USD',
    basePrice: 154.60,
    isCoreLive: false
  },

  // --- STOCKS ---
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Stocks',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'USD',
    basePrice: 228.45,
    isCoreLive: false
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Stocks',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'USD',
    basePrice: 138.65,
    isCoreLive: false
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    category: 'Stocks',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'USD',
    basePrice: 219.20,
    isCoreLive: false
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Stocks',
    pricePrecision: 2,
    tickSize: 0.01,
    pipMultiplier: 100,
    unit: 'USD',
    basePrice: 423.10,
    isCoreLive: false
  }
];

export class MarketScannerService {
  private static syntheticCandleCache: Map<string, Candle[]> = new Map();

  /**
   * Generates deterministic high-resolution historical candles for any catalog item
   */
  public static getInstrumentCandles(item: CatalogItemMeta, count: number = 60): Candle[] {
    if (item.isCoreLive && (item.symbol as MarketSymbol in MARKET_META)) {
      return MarketDataService.getHistoricalCandles(item.symbol as MarketSymbol, 'M5', count);
    }

    const cacheKey = `${item.symbol}_${count}`;
    if (this.syntheticCandleCache.has(cacheKey)) {
      return this.syntheticCandleCache.get(cacheKey)!;
    }

    const stepMs = 5 * 60 * 1000;
    const now = Date.now();
    const startTime = Math.floor(now / stepMs) * stepMs - count * stepMs;
    const digits = item.pricePrecision;
    const currentRealPrice = item.basePrice;
    const step = item.tickSize * 4;

    const prices: number[] = new Array(count);
    prices[count - 1] = currentRealPrice;

    for (let i = count - 2; i >= 0; i--) {
      const wave = Math.sin(i * 0.22) * 0.85 + Math.cos(i * 0.06) * 0.45;
      const prev = prices[i + 1] - wave * step;
      prices[i] = Number(Math.max(item.tickSize * 10, prev).toFixed(digits));
    }

    const candles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      const time = startTime + i * stepMs;
      const open = prices[i];
      const close = i === count - 1 ? currentRealPrice : prices[i + 1] || open;
      const high = Number((Math.max(open, close) + step * 0.35).toFixed(digits));
      const low = Number((Math.min(open, close) - step * 0.35).toFixed(digits));
      const volume = Math.floor(1000 + Math.sin(i) * 350);

      candles.push({ time, open, high, low, close, volume });
    }

    this.syntheticCandleCache.set(cacheKey, candles);
    return candles;
  }

  /**
   * Compiles the full canonical scanner instruments dataset from live states and analysis engine
   */
  public static scanAllInstruments(
    activeSymbol: MarketSymbol,
    activeLivePrice: number,
    liveStates: Record<MarketSymbol, SymbolMarketState>
  ): ScannerInstrument[] {
    const nowUtc = new Date();
    const formattedUtcTime = nowUtc.toISOString().slice(11, 19) + ' UTC';

    return SCANNER_CATALOG.map(meta => {
      let currentPrice = meta.basePrice;

      if (meta.isCoreLive) {
        const coreSym = meta.symbol as MarketSymbol;
        if (coreSym === activeSymbol && activeLivePrice > 0) {
          currentPrice = activeLivePrice;
        } else if (liveStates[coreSym]?.price) {
          currentPrice = liveStates[coreSym].price;
        } else {
          const svcPrice = TwelveDataMarketService.getInstance().getLatestPrice(coreSym);
          if (svcPrice > 0) currentPrice = svcPrice;
        }
      }

      const candles = this.getInstrumentCandles(meta, 50);
      const firstCandle = candles[0];
      const lastCandle = candles[candles.length - 1];
      const baselinePrice = firstCandle ? firstCandle.open : currentPrice;
      
      const change24h = Number((currentPrice - baselinePrice).toFixed(meta.pricePrecision));
      const changePercent24h = Number(((change24h / (baselinePrice || 1)) * 100).toFixed(2));

      // Calculate 14-period ATR
      const atrSlice = candles.slice(-15);
      let trSum = 0;
      for (let i = 1; i < atrSlice.length; i++) {
        const prev = atrSlice[i - 1];
        const curr = atrSlice[i];
        const tr = Math.max(
          curr.high - curr.low,
          Math.abs(curr.high - prev.close),
          Math.abs(curr.low - prev.close)
        );
        trSum += tr;
      }
      const atr14 = atrSlice.length > 1 
        ? Number((trSum / (atrSlice.length - 1)).toFixed(meta.pricePrecision)) 
        : Number((meta.tickSize * 20).toFixed(meta.pricePrecision));

      // Volatility Classification
      const atrRatio = atr14 / (currentPrice || 1);
      let volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'MEDIUM';
      if (atrRatio < 0.0015) volatility = 'LOW';
      else if (atrRatio < 0.0045) volatility = 'MEDIUM';
      else if (atrRatio < 0.012) volatility = 'HIGH';
      else volatility = 'EXTREME';

      // Perform canonical structure and direction prediction
      const dummySym: MarketSymbol = meta.isCoreLive ? (meta.symbol as MarketSymbol) : 'XAUUSD';
      const pred = AnalysisEngine.generatePrediction(
        dummySym,
        currentPrice,
        undefined,
        candles,
        'M5'
      );

      // Determine Multi-Timeframe Trend alignment
      let trendH1: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      let trendH4: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
      if (changePercent24h > 0.4) {
        trendH1 = 'BULLISH';
        trendH4 = 'BULLISH';
      } else if (changePercent24h > 0.1) {
        trendH1 = 'BULLISH';
        trendH4 = 'NEUTRAL';
      } else if (changePercent24h < -0.4) {
        trendH1 = 'BEARISH';
        trendH4 = 'BEARISH';
      } else if (changePercent24h < -0.1) {
        trendH1 = 'BEARISH';
        trendH4 = 'NEUTRAL';
      }

      // Calculate Opportunity Score (0-100)
      // Transparent composite of:
      // 1. AI Confidence (0-40)
      // 2. Trend Alignment (0-25)
      // 3. Volatility Suitability (0-15)
      // 4. Structure Clarity (0-20)
      let trendScore = 0;
      if (pred.direction === 'BULLISH') {
        if (trendH1 === 'BULLISH' && trendH4 === 'BULLISH') trendScore = 25;
        else if (trendH1 === 'BULLISH' || trendH4 === 'BULLISH') trendScore = 15;
        else trendScore = 5;
      } else if (pred.direction === 'BEARISH') {
        if (trendH1 === 'BEARISH' && trendH4 === 'BEARISH') trendScore = 25;
        else if (trendH1 === 'BEARISH' || trendH4 === 'BEARISH') trendScore = 15;
        else trendScore = 5;
      } else {
        trendScore = 5;
      }

      let volScore = 12;
      if (volatility === 'MEDIUM' || volatility === 'HIGH') volScore = 15;
      else if (volatility === 'LOW') volScore = 8;
      else if (volatility === 'EXTREME') volScore = 10;

      let structureScore = (pred.structureEvents && pred.structureEvents.length > 0) ? 20 : 12;
      if (pred.direction === 'NO TRADE') structureScore = 4;

      const rawOppScore = (pred.confidence * 0.4) + trendScore + volScore + structureScore;
      const opportunityScore = Math.min(99, Math.max(15, Math.round(rawOppScore)));

      // Sparkline: extract last 18 candle closes
      const sparkline = candles.slice(-18).map(c => c.close);

      return {
        symbol: meta.symbol,
        name: meta.name,
        category: meta.category,
        price: currentPrice,
        change24h,
        changePercent24h,
        direction: pred.direction,
        confidence: pred.confidence,
        trendH1,
        trendH4,
        volatility,
        atr14,
        opportunityScore,
        setupSummary: `${pred.orderType} • ${pred.marketCondition}`,
        support: pred.support,
        resistance: pred.resistance,
        digits: meta.pricePrecision,
        sparkline,
        lastUpdate: formattedUtcTime,
        isCoreLive: meta.isCoreLive
      };
    });
  }

  /**
   * Computes Market Sentiment distribution (Bullish %, Bearish %, Neutral %)
   */
  public static calculateSentiment(instruments: ScannerInstrument[]): SentimentMetrics {
    const total = instruments.length;
    if (total === 0) {
      return {
        bullishCount: 0,
        bearishCount: 0,
        neutralCount: 0,
        total: 0,
        bullishPercent: 0,
        bearishPercent: 0,
        neutralPercent: 0
      };
    }

    const bullishCount = instruments.filter(i => i.direction === 'BULLISH').length;
    const bearishCount = instruments.filter(i => i.direction === 'BEARISH').length;
    const neutralCount = instruments.filter(i => i.direction === 'NO TRADE').length;

    const bullishPercent = Math.round((bullishCount / total) * 100);
    const bearishPercent = Math.round((bearishCount / total) * 100);
    const neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);

    return {
      bullishCount,
      bearishCount,
      neutralCount,
      total,
      bullishPercent,
      bearishPercent,
      neutralPercent
    };
  }

  /**
   * Computes TradeXpulse Market Sentiment Index (Fear & Greed Index)
   */
  public static calculateFearGreed(instruments: ScannerInstrument[]): FearGreedIndexData {
    if (instruments.length === 0) {
      return {
        score: 50,
        zone: 'Neutral',
        breadthScore: 50,
        momentumScore: 50,
        volatilityScore: 50,
        confluenceScore: 50,
        lastUpdated: new Date().toISOString().slice(11, 19) + ' UTC'
      };
    }

    const bullishCount = instruments.filter(i => i.direction === 'BULLISH').length;
    const bearishCount = instruments.filter(i => i.direction === 'BEARISH').length;
    const breadthScore = Math.round((bullishCount / (bullishCount + bearishCount || 1)) * 100);

    const posMomentumCount = instruments.filter(i => i.changePercent24h > 0).length;
    const momentumScore = Math.round((posMomentumCount / instruments.length) * 100);

    const normalVolCount = instruments.filter(i => i.volatility === 'MEDIUM' || i.volatility === 'LOW').length;
    const volatilityScore = Math.round((normalVolCount / instruments.length) * 100);

    const highConfidenceCount = instruments.filter(i => i.confidence >= 75 && i.direction !== 'NO TRADE').length;
    const confluenceScore = Math.round((highConfidenceCount / instruments.length) * 100);

    // Weighted Fear & Greed formula:
    // Breadth (40%) + Momentum (25%) + Volatility Health (20%) + Confluence (15%)
    const rawScore = (breadthScore * 0.40) + (momentumScore * 0.25) + (volatilityScore * 0.20) + (confluenceScore * 0.15);
    const score = Math.min(99, Math.max(1, Math.round(rawScore)));

    let zone: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed' = 'Neutral';
    if (score <= 25) zone = 'Extreme Fear';
    else if (score <= 45) zone = 'Fear';
    else if (score <= 55) zone = 'Neutral';
    else if (score <= 75) zone = 'Greed';
    else zone = 'Extreme Greed';

    return {
      score,
      zone,
      breadthScore,
      momentumScore,
      volatilityScore,
      confluenceScore,
      lastUpdated: new Date().toISOString().slice(11, 19) + ' UTC'
    };
  }

  /**
   * Sorts and extracts the Top Opportunities
   */
  public static getTopOpportunities(instruments: ScannerInstrument[], limit = 5): ScannerInstrument[] {
    return [...instruments]
      .filter(i => i.direction !== 'NO TRADE' && i.opportunityScore > 40)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, limit);
  }
}
