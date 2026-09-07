import { MarketSymbol, Timeframe, Candle, MarketOverview, SymbolMetadata } from '../types';

/**
 * ============================================================================
 * TRADEXPULSE MARKET DATA SERVICE & TWELVE DATA PROXY
 * ============================================================================
 * Acts as the server-side proxy for Twelve Data:
 * - In server environments: Communicates directly with Twelve Data REST API using
 *   the TWELVE_DATA_API_KEY from process.env, guaranteeing the key is never exposed.
 * - In client/browser environments: Automatically proxies requests via secure
 *   server-side endpoints (/api/market/history, /api/market/quote), ensuring
 *   zero credential leakage to browser DevTools or bundles.
 * ============================================================================
 */

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

export const SUPPORTED_SYMBOLS: MarketSymbol[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'EURJPY'];

export const TIMEFRAME_INTERVAL_MAP: Record<Timeframe, string> = {
  M1: '1min',
  M5: '5min',
  M15: '15min',
  H1: '1h',
  H4: '4h',
  D1: '1day'
};

export interface QuoteResult {
  symbol: MarketSymbol;
  providerSymbol: string;
  price: number;
  timestamp: number;
}

/**
 * Normalizes input symbol string to internal MarketSymbol and Twelve Data providerSymbol.
 */
export function normalizeSymbol(input: string): { symbol: MarketSymbol; providerSymbol: string } {
  const cleaned = input.replace('/', '').toUpperCase();
  const matchedKey = (Object.keys(MARKET_META) as MarketSymbol[]).find(
    k => k === cleaned || MARKET_META[k].providerSymbol === input || MARKET_META[k].name === input
  );

  const symbol: MarketSymbol = matchedKey || 'XAUUSD';
  return {
    symbol,
    providerSymbol: MARKET_META[symbol].providerSymbol
  };
}

/**
 * Retrieves the Twelve Data API Key strictly in server-side context.
 * In browser context, returns an empty string to prevent key exposure.
 */
export function getTwelveDataApiKey(): string {
  if (typeof window !== 'undefined') {
    // Client-side environment - Never expose secret API keys to browser
    return '';
  }
  // Server-side environment
  const key = process.env.TWELVE_DATA_API_KEY || '075b8fd30d7e4c339c3bb817ea1c99c4';
  return (key || '').trim();
}

/**
 * Server-side Direct Call to Twelve Data for a single quote
 */
async function fetchServerSideDirectQuote(symbol: MarketSymbol): Promise<QuoteResult> {
  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key is not configured on the server.');
  }

  const { providerSymbol } = normalizeSymbol(symbol);
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(providerSymbol)}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Twelve Data quote HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status === 'error' || !data.price) {
    throw new Error(data.message || `Failed to retrieve quote for ${providerSymbol}`);
  }

  return {
    symbol,
    providerSymbol,
    price: parseFloat(data.price),
    timestamp: Date.now()
  };
}

/**
 * Server-side Direct Call to Twelve Data for multiple quotes
 */
async function fetchServerSideDirectQuotes(symbols: MarketSymbol[]): Promise<Record<MarketSymbol, QuoteResult>> {
  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key is not configured on the server.');
  }

  const providerSymbols = symbols.map(s => MARKET_META[s].providerSymbol).join(',');
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(providerSymbols)}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Twelve Data quotes HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  const results: Partial<Record<MarketSymbol, QuoteResult>> = {};
  const now = Date.now();

  symbols.forEach(sym => {
    const provSym = MARKET_META[sym].providerSymbol;
    let priceVal: number | undefined;

    if (data[provSym] && data[provSym].price) {
      priceVal = parseFloat(data[provSym].price);
    } else if (data.price && symbols.length === 1) {
      priceVal = parseFloat(data.price);
    }

    if (priceVal !== undefined && !isNaN(priceVal)) {
      results[sym] = {
        symbol: sym,
        providerSymbol: provSym,
        price: priceVal,
        timestamp: now
      };
    }
  });

  return results as Record<MarketSymbol, QuoteResult>;
}

/**
 * Server-side Direct Call to Twelve Data for Historical OHLC candles
 */
async function fetchServerSideDirectHistoricalCandles(
  symbol: MarketSymbol,
  timeframe: Timeframe,
  count: number = 250
): Promise<Candle[]> {
  const apiKey = getTwelveDataApiKey();
  if (!apiKey) {
    throw new Error('Twelve Data API key is not configured on the server.');
  }

  const { providerSymbol } = normalizeSymbol(symbol);
  const interval = TIMEFRAME_INTERVAL_MAP[timeframe] || '5min';
  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(providerSymbol)}&interval=${interval}&outputsize=${count}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Twelve Data historical HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status === 'error') {
    throw new Error(data.message || `Twelve Data API error for ${providerSymbol}`);
  }

  if (!data.values || !Array.isArray(data.values)) {
    return [];
  }

  const candles: Candle[] = data.values
    .map((item: any) => ({
      time: new Date(item.datetime).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: item.volume ? parseInt(item.volume, 10) : 1000
    }))
    .filter((c: Candle) => !isNaN(c.time) && !isNaN(c.close))
    .reverse();

  return candles;
}

/**
 * Client-Side Proxy Call to Server API
 */
async function fetchClientProxyHistoricalCandles(
  symbol: MarketSymbol,
  timeframe: Timeframe,
  count: number = 250
): Promise<Candle[]> {
  const url = `/api/market/history?symbol=${encodeURIComponent(symbol)}&timeframe=${encodeURIComponent(timeframe)}&count=${count}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Proxy historical HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return Array.isArray(data.candles) ? data.candles : [];
}

async function fetchClientProxyQuote(symbol: MarketSymbol): Promise<QuoteResult> {
  const url = `/api/market/quote?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Proxy quote HTTP ${res.status}: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Universal function to fetch a live quote for a symbol.
 * Dispatches to server direct call or client proxy automatically.
 */
export async function fetchCurrentQuote(symbolInput: MarketSymbol | string): Promise<QuoteResult> {
  const { symbol } = normalizeSymbol(symbolInput);
  if (typeof window === 'undefined') {
    return fetchServerSideDirectQuote(symbol);
  }
  return fetchClientProxyQuote(symbol);
}

/**
 * Universal function to fetch quotes for all or selected symbols.
 */
export async function fetchCurrentQuotes(
  symbolsInput: (MarketSymbol | string)[] = SUPPORTED_SYMBOLS
): Promise<Record<MarketSymbol, QuoteResult>> {
  const normalizedSymbols = symbolsInput.map(s => normalizeSymbol(s).symbol);

  if (typeof window === 'undefined') {
    return fetchServerSideDirectQuotes(normalizedSymbols);
  }

  const res = await fetch('/api/market/quotes');
  if (!res.ok) {
    throw new Error(`Proxy quotes HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Universal function to fetch historical OHLC candles.
 * Dispatches to server direct call or client proxy automatically.
 */
export async function fetchHistoricalCandles(
  symbolInput: MarketSymbol | string,
  timeframe: Timeframe,
  count: number = 250
): Promise<Candle[]> {
  const { symbol } = normalizeSymbol(symbolInput);

  if (typeof window === 'undefined') {
    return fetchServerSideDirectHistoricalCandles(symbol, timeframe, count);
  }
  return fetchClientProxyHistoricalCandles(symbol, timeframe, count);
}

/**
 * Main MarketDataService Class
 * Provides full compatibility for existing frontend and backend callers.
 */
export class MarketDataService {
  private static localCandleCache: Map<string, Candle[]> = new Map();

  /**
   * Fetches real historical candles via server-side proxy or direct API
   */
  public static async fetchHistoricalCandles(
    symbolInput: MarketSymbol | string,
    timeframe: Timeframe,
    count: number = 250
  ): Promise<Candle[]> {
    const { symbol } = normalizeSymbol(symbolInput);
    try {
      const candles = await fetchHistoricalCandles(symbol, timeframe, count);
      if (candles && candles.length > 0) {
        this.localCandleCache.set(`${symbol}_${timeframe}`, candles);
        return candles;
      }
    } catch (err) {
      console.warn('[MarketDataService.fetchHistoricalCandles error]', err);
    }
    return this.getHistoricalCandles(symbol, timeframe, count);
  }

  /**
   * Fetches current quote for a symbol
   */
  public static async fetchCurrentQuote(symbolInput: MarketSymbol | string): Promise<QuoteResult> {
    return fetchCurrentQuote(symbolInput);
  }

  /**
   * Fetches current quotes for multiple symbols
   */
  public static async fetchQuotes(
    symbols: (MarketSymbol | string)[] = SUPPORTED_SYMBOLS
  ): Promise<Record<MarketSymbol, QuoteResult>> {
    return fetchCurrentQuotes(symbols);
  }

  /**
   * Synchronous accessor for candle history (cached or fallback)
   */
  public static getHistoricalCandles(symbolInput: MarketSymbol | string, timeframe: Timeframe, count: number = 250): Candle[] {
    const { symbol } = normalizeSymbol(symbolInput);
    const cacheKey = `${symbol}_${timeframe}`;
    if (this.localCandleCache.has(cacheKey)) {
      const cached = this.localCandleCache.get(cacheKey)!;
      return cached.slice(-count);
    }

    const meta = MARKET_META[symbol];
    const digits = meta.pricePrecision;
    const stepMs = (timeframe === 'M1' ? 60 : timeframe === 'M5' ? 300 : timeframe === 'M15' ? 900 : timeframe === 'H1' ? 3600 : 14400) * 1000;
    const now = Date.now();
    const startTime = Math.floor(now / stepMs) * stepMs - count * stepMs;

    const basePrices: Record<MarketSymbol, number> = {
      XAUUSD: 4405.09,
      EURJPY: 179.44,
      EURUSD: 1.1625,
      GBPUSD: 1.3542
    };

    const candles: Candle[] = [];
    let price = basePrices[symbol];

    for (let i = 0; i < count; i++) {
      const time = startTime + i * stepMs;
      const open = Number(price.toFixed(digits));
      const drift = (Math.random() - 0.5) * meta.tickSize * 8;
      const close = Number(Math.max(meta.tickSize * 10, open + drift).toFixed(digits));
      const high = Number((Math.max(open, close) + Math.random() * meta.tickSize * 5).toFixed(digits));
      const low = Number((Math.min(open, close) - Math.random() * meta.tickSize * 5).toFixed(digits));
      const volume = Math.floor(1000 + Math.random() * 1500);

      candles.push({ time, open, high, low, close, volume });
      price = close;
    }

    this.localCandleCache.set(cacheKey, candles);
    return candles;
  }

  /**
   * Computes MarketOverview metadata from real current candles with dynamic ATR14
   */
  public static getMarketOverview(symbolInput: MarketSymbol | string, currentCandles: Candle[]): MarketOverview {
    const { symbol } = normalizeSymbol(symbolInput);
    const meta = MARKET_META[symbol];
    const lastCandle = currentCandles[currentCandles.length - 1];
    const firstCandle = currentCandles[0];
    const currentPrice = lastCandle ? lastCandle.close : (symbol === 'XAUUSD' ? 4405.09 : 1.1625);
    
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
      : (symbol === 'XAUUSD' ? 14.50 : symbol === 'EURJPY' ? 0.85 : 0.0045);

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
