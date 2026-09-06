import WebSocket from 'ws';
import { 
  MarketSymbol, 
  Timeframe, 
  Candle, 
  PriceTick, 
  ConnectionStatus, 
  SymbolMetadata, 
  MultiTimeframeCandles,
  LiveDiagnostics
} from '../src/types';

export const SYMBOL_METADATA: Record<MarketSymbol, SymbolMetadata> = {
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

export const TIMEFRAME_MS: Record<Timeframe, number> = {
  M1: 60 * 1000,
  M5: 5 * 60 * 1000,
  M15: 15 * 60 * 1000,
  H1: 60 * 60 * 1000,
  H4: 4 * 60 * 60 * 1000,
  D1: 24 * 60 * 60 * 1000
};

export interface MarketDataProvider {
  readonly name: string;
  readonly isLiveMode: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(symbol: MarketSymbol): void;
  unsubscribe(symbol: MarketSymbol): void;
  getHistoricalCandles(symbol: MarketSymbol, timeframe: Timeframe, count?: number): Promise<Candle[]>;
  getLatestPrice(symbol: MarketSymbol): number;
  onPriceUpdate(cb: (tick: PriceTick) => void): () => void;
  onStatusChange(cb: (status: any) => void): () => void;
  getStatus(): {
    status: ConnectionStatus;
    provider: string;
    isRealtime: boolean;
    lastTickTime: number;
    statusDetails?: string;
  };
  getDiagnostics(symbol: MarketSymbol): LiveDiagnostics;
  candleBuilder: RealtimeCandleBuilder;
}

/**
 * Real-time Candle Builder
 * Conforms to Requirement 5:
 * For each timeframe (M1, M5, M15, H1, H4):
 * - close = latest real price
 * - high = max(previous high, latest price)
 * - low = min(previous low, latest price)
 * - open remains the first price of that candle
 * When timeframe expires: freeze completed candle, create next candle with open = previous close.
 */
export class RealtimeCandleBuilder {
  private candlesBySymbol: Map<MarketSymbol, Map<Timeframe, Candle[]>> = new Map();
  private lastPrices: Map<MarketSymbol, number> = new Map();

  constructor() {
    const symbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
    const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4'];

    symbols.forEach(sym => {
      const tfMap = new Map<Timeframe, Candle[]>();
      timeframes.forEach(tf => {
        tfMap.set(tf, []);
      });
      this.candlesBySymbol.set(sym, tfMap);
    });
  }

  public setCandles(symbol: MarketSymbol, timeframe: Timeframe, candles: Candle[]): void {
    const tfMap = this.candlesBySymbol.get(symbol);
    if (tfMap && candles.length > 0) {
      tfMap.set(timeframe, [...candles]);
      const last = candles[candles.length - 1];
      if (last) {
        this.lastPrices.set(symbol, last.close);
      }
    }
  }

  public ingestTick(tick: PriceTick): { symbol: MarketSymbol; closedCandles: { timeframe: Timeframe; candle: Candle }[] } {
    const symbol = tick.symbol;
    this.lastPrices.set(symbol, tick.price);
    const tfMap = this.candlesBySymbol.get(symbol);
    if (!tfMap) return { symbol, closedCandles: [] };

    const closedCandles: { timeframe: Timeframe; candle: Candle }[] = [];
    const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4'];
    const now = tick.timestamp;
    const digits = SYMBOL_METADATA[symbol].pricePrecision;
    const price = Number(tick.price.toFixed(digits));

    timeframes.forEach(tf => {
      let candles = tfMap.get(tf);
      if (!candles) {
        candles = [];
        tfMap.set(tf, candles);
      }

      const intervalMs = TIMEFRAME_MS[tf];
      const candleStartTime = Math.floor(now / intervalMs) * intervalMs;

      if (candles.length === 0) {
        // Initialize first forming candle
        candles.push({
          time: candleStartTime,
          open: price,
          high: price,
          low: price,
          close: price,
          volume: tick.volume || 1
        });
        return;
      }

      const activeCandle = candles[candles.length - 1];

      // Timeframe boundary expiration check
      if (candleStartTime > activeCandle.time) {
        // Freeze completed candle
        closedCandles.push({ timeframe: tf, candle: { ...activeCandle } });

        // Create new active candle with open = previous close
        const newCandle: Candle = {
          time: candleStartTime,
          open: activeCandle.close,
          high: Math.max(activeCandle.close, price),
          low: Math.min(activeCandle.close, price),
          close: price,
          volume: tick.volume || 1
        };

        candles.push(newCandle);
        if (candles.length > 300) {
          candles.shift();
        }
      } else {
        // Update active candle in real-time
        activeCandle.high = Number(Math.max(activeCandle.high, price).toFixed(digits));
        activeCandle.low = Number(Math.min(activeCandle.low, price).toFixed(digits));
        activeCandle.close = price;
        activeCandle.volume += (tick.volume || 1);
      }
    });

    return { symbol, closedCandles };
  }

  public getCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number = 250): Candle[] {
    const tfMap = this.candlesBySymbol.get(symbol);
    if (!tfMap) return [];
    const candles = tfMap.get(timeframe) || [];
    return candles.slice(-count);
  }

  public getMultiTimeframeCandles(symbol: MarketSymbol): MultiTimeframeCandles {
    return {
      M1: this.getCandles(symbol, 'M1', 120),
      M5: this.getCandles(symbol, 'M5', 250),
      M15: this.getCandles(symbol, 'M15', 180),
      H1: this.getCandles(symbol, 'H1', 150),
      H4: this.getCandles(symbol, 'H4', 100),
    };
  }

  public getLatestPrice(symbol: MarketSymbol): number {
    const price = this.lastPrices.get(symbol);
    if (price !== undefined) return price;
    const m5 = this.getCandles(symbol, 'M5', 1);
    if (m5.length > 0) return m5[m5.length - 1].close;
    return SYMBOL_METADATA[symbol].tickSize * 1000;
  }

  public getM5Countdown(symbol: MarketSymbol): { remainingSeconds: number; countdownText: string } {
    const m5Candles = this.getCandles(symbol, 'M5', 1);
    const now = Date.now();
    let candleTime: number;

    if (m5Candles.length > 0) {
      candleTime = m5Candles[m5Candles.length - 1].time;
    } else {
      candleTime = Math.floor(now / TIMEFRAME_MS.M5) * TIMEFRAME_MS.M5;
    }

    const closeTime = candleTime + TIMEFRAME_MS.M5;
    const remainingMs = Math.max(0, closeTime - now);
    const totalSec = Math.floor(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return {
      remainingSeconds: totalSec,
      countdownText: `M5 closes in ${formatted}`
    };
  }
}

/**
 * ==================================================
 * LIVE DATA PROVIDER (Twelve Data)
 * ==================================================
 * - Connects to Twelve Data REST API for genuine historical candles
 * - Connects to Twelve Data WebSocket (wss://ws.twelvedata.com/v1/quotes/price)
 * - NEVER generates random prices
 * - NEVER uses setInterval to invent prices
 * - Sets STATUS: LIVE ONLY after the first verified live tick arrives
 */
export class LiveTwelveDataProvider implements MarketDataProvider {
  public readonly name = 'Twelve Data';
  public readonly isLiveMode = true;
  public candleBuilder: RealtimeCandleBuilder;

  private apiKey: string;
  private ws: WebSocket | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private activeSubscriptions: Set<MarketSymbol> = new Set(['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD']);
  private listeners: Set<(tick: PriceTick) => void> = new Set();
  private statusListeners: Set<(status: any) => void> = new Set();

  private status: ConnectionStatus = 'OFFLINE';
  private statusDetails: string = 'Initializing connection to Twelve Data...';
  private lastTickTime: number = 0;
  private lastPrice: number = 0;
  private ticksReceived: number = 0;
  private historicalCandlesCount: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private staleCheckInterval: NodeJS.Timeout | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
    this.candleBuilder = new RealtimeCandleBuilder();
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.updateStatus('CONNECTING', 'Connecting to Twelve Data WebSocket stream...');

    // 1. Fetch initial real historical candles for all active symbols
    await this.fetchInitialHistory();

    // 2. Connect to Twelve Data authenticated WebSocket
    try {
      const wsUrl = `wss://ws.twelvedata.com/v1/quotes/price?apikey=${this.apiKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.isConnected = true;
        this.isConnecting = false;
        // Notice: Do NOT set to LIVE yet! Rule 7: "LIVE requires actual incoming real-time price updates."
        this.updateStatus(
          'CONNECTING',
          'WebSocket authenticated. Subscribed to market feeds, waiting for first verified live tick...'
        );

        // Subscribe to supported symbols
        const symbolsList = Array.from(this.activeSubscriptions)
          .map(sym => SYMBOL_METADATA[sym].providerSymbol)
          .join(',');

        this.ws?.send(JSON.stringify({
          action: 'subscribe',
          params: { symbols: symbolsList }
        }));
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const parsed = JSON.parse(data.toString());

          // Handle Twelve Data subscription confirmation or errors
          if (parsed.event === 'subscribe-status') {
            if (parsed.status === 'ok') {
              console.log('[TwelveData WS] Subscription confirmed:', parsed.success);
            } else if (parsed.status === 'error') {
              console.error('[TwelveData WS Subscription Error]', parsed.message);
              this.statusDetails = `Twelve Data Subscription Error: ${parsed.message || 'Symbol not allowed on current plan'}`;
            }
          }

          // Handle real incoming price tick
          if (parsed.event === 'price' && parsed.symbol && parsed.price) {
            const rawSymbol = parsed.symbol;
            const matchedKey = (Object.keys(SYMBOL_METADATA) as MarketSymbol[]).find(
              k => SYMBOL_METADATA[k].providerSymbol === rawSymbol || k === rawSymbol
            );

            if (matchedKey) {
              const tickPrice = Number(parsed.price);
              const tickTime = parsed.timestamp ? Number(parsed.timestamp) * 1000 : Date.now();

              this.ticksReceived++;
              this.lastTickTime = tickTime;
              this.lastPrice = tickPrice;

              const tick: PriceTick = {
                symbol: matchedKey,
                price: tickPrice,
                timestamp: tickTime
              };

              // Ingest tick into real-time candle builder
              this.candleBuilder.ingestTick(tick);

              // Rule 7 & 8: Transition to LIVE ONLY after the first verified live tick is received!
              if (this.status !== 'LIVE') {
                this.updateStatus(
                  'LIVE',
                  `Live market stream active. Verified real-time quotes flowing (${this.ticksReceived} ticks).`
                );
              }

              // Notify listeners
              this.listeners.forEach(cb => cb(tick));
            }
          }
        } catch (err) {
          console.error('[TwelveData WS Message Error]', err);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[TwelveData WS Error]', err.message);
        this.handleDisconnect('RECONNECTING', `Twelve Data WebSocket connection error: ${err.message}`);
      });

      this.ws.on('close', (code, reason) => {
        console.warn(`[TwelveData WS Closed] code: ${code}, reason: ${reason}`);
        this.handleDisconnect('RECONNECTING', `Twelve Data WebSocket closed (${code}). Reconnecting...`);
      });

      // Start stale feed monitoring
      if (this.staleCheckInterval) clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = setInterval(() => {
        if (this.status === 'LIVE' && Date.now() - this.lastTickTime > 25000) {
          this.updateStatus('STALE', 'No live market ticks received for >25s. Feed stale.');
        }
      }, 5000);

    } catch (err: any) {
      console.error('[TwelveData Connect Exception]', err);
      this.handleDisconnect('OFFLINE', `Failed to initialize connection: ${err.message}`);
    }
  }

  private async fetchInitialHistory(): Promise<void> {
    const symbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
    const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4'];

    for (const sym of symbols) {
      for (const tf of timeframes) {
        try {
          const candles = await this.fetchRestCandles(sym, tf, 200);
          if (candles && candles.length > 0) {
            this.candleBuilder.setCandles(sym, tf, candles);
            this.historicalCandlesCount += candles.length;
          }
        } catch (err) {
          console.warn(`[TwelveData REST fetch initial failed for ${sym} ${tf}]`, err);
        }
      }
    }
  }

  private async fetchRestCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number): Promise<Candle[]> {
    const meta = SYMBOL_METADATA[symbol];
    const intervalMap: Record<Timeframe, string> = {
      M1: '1min',
      M5: '5min',
      M15: '15min',
      H1: '1h',
      H4: '4h',
      D1: '1day'
    };
    const interval = intervalMap[timeframe] || '5min';
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(meta.providerSymbol)}&interval=${interval}&outputsize=${count}&apikey=${this.apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Twelve Data REST HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (data.status === 'error') {
      throw new Error(data.message || 'Twelve Data REST API error');
    }
    if (!data.values || !Array.isArray(data.values)) {
      return [];
    }

    // Convert provider timestamps
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

  private handleDisconnect(targetStatus: ConnectionStatus, details: string): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.updateStatus(targetStatus, details);

    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 6000);
  }

  private updateStatus(status: ConnectionStatus, details?: string): void {
    this.status = status;
    if (details) this.statusDetails = details;
    const payload = this.getStatus();
    this.statusListeners.forEach(cb => cb(payload));
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.staleCheckInterval) clearInterval(this.staleCheckInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.updateStatus('OFFLINE', 'Market data provider manually disconnected.');
  }

  public subscribe(symbol: MarketSymbol): void {
    this.activeSubscriptions.add(symbol);
    if (this.ws && this.isConnected) {
      const providerSym = SYMBOL_METADATA[symbol].providerSymbol;
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        params: { symbols: providerSym }
      }));
    }
  }

  public unsubscribe(symbol: MarketSymbol): void {
    this.activeSubscriptions.delete(symbol);
    if (this.ws && this.isConnected) {
      const providerSym = SYMBOL_METADATA[symbol].providerSymbol;
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        params: { symbols: providerSym }
      }));
    }
  }

  public async getHistoricalCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number = 250): Promise<Candle[]> {
    try {
      const apiCandles = await this.fetchRestCandles(symbol, timeframe, count);
      if (apiCandles.length > 0) {
        this.candleBuilder.setCandles(symbol, timeframe, apiCandles);
        return apiCandles;
      }
    } catch (err: any) {
      console.warn(`[getHistoricalCandles API fetch error for ${symbol}]`, err.message);
    }
    return this.candleBuilder.getCandles(symbol, timeframe, count);
  }

  public getLatestPrice(symbol: MarketSymbol): number {
    return this.candleBuilder.getLatestPrice(symbol);
  }

  public onPriceUpdate(cb: (tick: PriceTick) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onStatusChange(cb: (status: any) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public getStatus() {
    return {
      status: this.status,
      provider: 'Twelve Data',
      isRealtime: this.status === 'LIVE',
      lastTickTime: this.lastTickTime,
      statusDetails: this.statusDetails
    };
  }

  public getDiagnostics(symbol: MarketSymbol): LiveDiagnostics {
    const meta = SYMBOL_METADATA[symbol];
    const m5Candles = this.candleBuilder.getCandles(symbol, 'M5', 1);
    const lastCandle = m5Candles.length > 0 ? m5Candles[m5Candles.length - 1] : null;

    return {
      provider: 'Twelve Data',
      symbol,
      providerSymbol: meta.providerSymbol,
      connection: this.isConnected ? 'CONNECTED' : (this.isConnecting ? 'CONNECTING' : 'DISCONNECTED'),
      lastTickTimestamp: this.lastTickTime,
      lastTickFormatted: this.lastTickTime ? new Date(this.lastTickTime).toISOString().replace('T', ' ').slice(0, 19) : 'None',
      lastPrice: this.getLatestPrice(symbol),
      lastCandleTimestamp: lastCandle ? lastCandle.time : 0,
      lastCandleFormatted: lastCandle ? new Date(lastCandle.time).toISOString().replace('T', ' ').slice(0, 19) : 'None',
      ticksReceived: this.ticksReceived,
      historicalCandlesCount: this.historicalCandlesCount,
      dataAgeMs: this.lastTickTime ? Math.max(0, Date.now() - this.lastTickTime) : 0,
      isRealtime: this.status === 'LIVE',
      status: this.status,
      statusDetails: this.statusDetails
    };
  }
}

/**
 * ==================================================
 * DEMO DATA PROVIDER
 * ==================================================
 * - Dedicated mock/test data provider
 * - Isolated from LIVE mode
 * - Strictly labels itself as DEMO (Never displays LIVE)
 */
export class DemoMarketDataProvider implements MarketDataProvider {
  public readonly name = 'Twelve Data (Demo Mode)';
  public readonly isLiveMode = false;
  public candleBuilder: RealtimeCandleBuilder;

  private tickInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(tick: PriceTick) => void> = new Set();
  private statusListeners: Set<(status: any) => void> = new Set();
  private lastTickTime: number = 0;
  private ticksReceived: number = 0;

  constructor() {
    this.candleBuilder = new RealtimeCandleBuilder();
    this.initializeDemoCandles();
  }

  private initializeDemoCandles(): void {
    const symbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
    const timeframes: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4'];

    symbols.forEach(sym => {
      timeframes.forEach(tf => {
        const candles = this.generateSyntheticCandles(sym, tf, 200);
        this.candleBuilder.setCandles(sym, tf, candles);
      });
    });
  }

  private generateSyntheticCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number): Candle[] {
    const meta = SYMBOL_METADATA[symbol];
    const digits = meta.pricePrecision;
    const intervalMs = TIMEFRAME_MS[timeframe];
    const now = Date.now();
    const currentCandleStart = Math.floor(now / intervalMs) * intervalMs;
    const startTime = currentCandleStart - (count - 1) * intervalMs;

    const basePrices: Record<MarketSymbol, number> = {
      XAUUSD: 2358.50,
      EURJPY: 162.90,
      EURUSD: 1.0848,
      GBPUSD: 1.2725
    };

    const volatilityMultiplier: Record<Timeframe, number> = {
      M1: 0.35,
      M5: 1.0,
      M15: 1.8,
      H1: 3.5,
      H4: 7.0,
      D1: 15.0
    };

    const unit = (symbol === 'XAUUSD' ? 1.2 : symbol === 'EURJPY' ? 0.08 : 0.0004) * volatilityMultiplier[timeframe];
    let price = basePrices[symbol] - (count * 0.015 * unit);

    const candles: Candle[] = [];
    let trend = 1;
    let waveLength = 20;

    for (let i = 0; i < count; i++) {
      const time = startTime + i * intervalMs;
      if (i % waveLength === 0) {
        trend = trend === 1 ? -1 : 1;
        waveLength = 15 + Math.floor(Math.random() * 15);
      }

      const open = Number(price.toFixed(digits));
      const drift = trend * (Math.random() * unit * 0.7);
      const noise = (Math.random() - 0.48) * unit * 0.8;
      const close = Number(Math.max(0.0001, open + drift + noise).toFixed(digits));
      
      const maxOC = Math.max(open, close);
      const minOC = Math.min(open, close);
      const high = Number((maxOC + Math.random() * unit * 0.6).toFixed(digits));
      const low = Number((minOC - Math.random() * unit * 0.6).toFixed(digits));
      const volume = Math.floor(1000 + Math.random() * 1500 + Math.abs(close - open) * 1000);

      candles.push({ time, open, high, low, close, volume });
      price = close;
    }

    return candles;
  }

  public async connect(): Promise<void> {
    if (this.tickInterval) return;

    this.tickInterval = setInterval(() => {
      const symbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
      symbols.forEach(sym => {
        const currentPrice = this.candleBuilder.getLatestPrice(sym);
        const meta = SYMBOL_METADATA[sym];
        const step = meta.tickSize;
        const drift = (Math.random() - 0.495) * step * 1.5;
        const newPrice = Number(Math.max(step * 10, currentPrice + drift).toFixed(meta.pricePrecision));

        this.ticksReceived++;
        this.lastTickTime = Date.now();

        const tick: PriceTick = {
          symbol: sym,
          price: newPrice,
          timestamp: this.lastTickTime,
          volume: Math.floor(1 + Math.random() * 5)
        };

        this.candleBuilder.ingestTick(tick);
        this.listeners.forEach(cb => cb(tick));
      });
    }, 1500);
  }

  public async disconnect(): Promise<void> {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  public subscribe(_symbol: MarketSymbol): void {}
  public unsubscribe(_symbol: MarketSymbol): void {}

  public async getHistoricalCandles(symbol: MarketSymbol, timeframe: Timeframe, count: number = 250): Promise<Candle[]> {
    return this.candleBuilder.getCandles(symbol, timeframe, count);
  }

  public getLatestPrice(symbol: MarketSymbol): number {
    return this.candleBuilder.getLatestPrice(symbol);
  }

  public onPriceUpdate(cb: (tick: PriceTick) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onStatusChange(cb: (status: any) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public getStatus() {
    return {
      status: 'DEMO' as ConnectionStatus,
      provider: 'Twelve Data (Demo Mode)',
      isRealtime: false,
      lastTickTime: this.lastTickTime,
      statusDetails: 'Running in simulated demonstration mode. No live stream active.'
    };
  }

  public getDiagnostics(symbol: MarketSymbol): LiveDiagnostics {
    const meta = SYMBOL_METADATA[symbol];
    const m5 = this.candleBuilder.getCandles(symbol, 'M5', 1);
    const lastCandle = m5.length > 0 ? m5[m5.length - 1] : null;

    return {
      provider: 'Twelve Data (Demo Mode)',
      symbol,
      providerSymbol: meta.providerSymbol,
      connection: 'DISCONNECTED',
      lastTickTimestamp: this.lastTickTime,
      lastTickFormatted: this.lastTickTime ? new Date(this.lastTickTime).toISOString().replace('T', ' ').slice(0, 19) : 'None',
      lastPrice: this.getLatestPrice(symbol),
      lastCandleTimestamp: lastCandle ? lastCandle.time : 0,
      lastCandleFormatted: lastCandle ? new Date(lastCandle.time).toISOString().replace('T', ' ').slice(0, 19) : 'None',
      ticksReceived: this.ticksReceived,
      historicalCandlesCount: 200,
      dataAgeMs: this.lastTickTime ? Math.max(0, Date.now() - this.lastTickTime) : 0,
      isRealtime: false,
      status: 'DEMO',
      statusDetails: 'Simulated testing feed. To activate LIVE stream, configure TWELVE_DATA_API_KEY.'
    };
  }
}

/**
 * ==================================================
 * MARKET DATA COORDINATOR
 * ==================================================
 * Manages the active provider (LIVE or DEMO) based on credentials.
 * Ensures LIVE mode never uses DEMO provider.
 */
export class MarketDataCoordinator {
  private activeProvider: MarketDataProvider;

  constructor(apiKey?: string) {
    const key = (apiKey || process.env.TWELVE_DATA_API_KEY || '').trim();

    if (key && key.length > 5) {
      console.log('[MarketDataCoordinator] Initializing LiveTwelveDataProvider with configured API key.');
      this.activeProvider = new LiveTwelveDataProvider(key);
    } else {
      console.log('[MarketDataCoordinator] No TWELVE_DATA_API_KEY found. Initializing DemoMarketDataProvider.');
      this.activeProvider = new DemoMarketDataProvider();
    }
  }

  public async start(): Promise<void> {
    await this.activeProvider.connect();
  }

  public getProvider(): MarketDataProvider {
    return this.activeProvider;
  }
}
