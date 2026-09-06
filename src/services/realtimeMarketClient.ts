import { MarketSymbol, Timeframe, Candle, PriceTick, ConnectionStatus, MultiTimeframeCandles } from '../types';

export interface MarketStreamEvent {
  type: 'PRICE_TICK' | 'MARKET_SNAPSHOT' | 'CONNECTION_STATUS';
  data: any;
}

export type TickCallback = (tick: PriceTick & { m5Countdown?: { remainingSeconds: number; countdownText: string } }) => void;
export type StatusCallback = (status: {
  status: ConnectionStatus;
  provider: string;
  isRealtime: boolean;
  lastTickTime: number;
  m5Countdown?: { remainingSeconds: number; countdownText: string };
}) => void;
export type SnapshotCallback = (data: {
  symbol: MarketSymbol;
  candles: MultiTimeframeCandles;
  latestPrice: number;
  m5Countdown: { remainingSeconds: number; countdownText: string };
  status: any;
}) => void;

export class RealtimeMarketClient {
  private static instance: RealtimeMarketClient | null = null;
  private ws: WebSocket | null = null;
  private activeSymbol: MarketSymbol = 'XAUUSD';
  private connectionStatus: ConnectionStatus = 'CONNECTING';
  private providerName: string = 'Twelve Data';
  private isRealtime: boolean = false;
  private lastTickTime: number = 0;
  private reconnectAttempts: number = 0;
  private reconnectTimer: any = null;
  private eventSource: EventSource | null = null;
  private isUsingSseFallback: boolean = false;

  private tickListeners: Set<TickCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private snapshotListeners: Set<SnapshotCallback> = new Set();

  public static getInstance(): RealtimeMarketClient {
    if (!RealtimeMarketClient.instance) {
      RealtimeMarketClient.instance = new RealtimeMarketClient();
    }
    return RealtimeMarketClient.instance;
  }

  private constructor() {
    this.initConnection();
  }

  public initConnection(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus('CONNECTING');

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/market`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.isUsingSseFallback = false;
        // Subscribe to currently active symbol
        this.ws?.send(JSON.stringify({
          type: 'SUBSCRIBE',
          symbol: this.activeSymbol
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const message: MarketStreamEvent = JSON.parse(event.data);
          this.handleStreamMessage(message);
        } catch (err) {
          console.error('[RealtimeClient WS Parse Error]', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[RealtimeClient WS Error, attempting SSE fallback]', err);
        this.handleWsFailure();
      };

      this.ws.onclose = () => {
        this.handleWsFailure();
      };
    } catch (err) {
      console.warn('[RealtimeClient WS Exception]', err);
      this.handleWsFailure();
    }
  }

  private handleWsFailure(): void {
    if (this.isUsingSseFallback) return;

    this.reconnectAttempts++;
    this.updateStatus('RECONNECTING');

    // Switch to SSE fallback for reliable streaming in iframe environments
    this.startSseFallback();

    // Also attempt WS reconnect after delay
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(10000, 2000 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectTimer = setTimeout(() => {
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.initConnection();
      }
    }, delay);
  }

  private startSseFallback(): void {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.isUsingSseFallback = true;
    try {
      this.eventSource = new EventSource(`/api/market/stream?symbol=${this.activeSymbol}`);

      this.eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'INITIAL_SNAPSHOT') {
            this.updateStatus(payload.data.status?.status || 'DEMO', payload.data.status?.provider);
          } else if (payload.type === 'PRICE_TICK') {
            this.handleStreamMessage(payload);
          }
        } catch (err) {
          console.error('[SSE Message Parse Error]', err);
        }
      };

      this.eventSource.onerror = () => {
        this.updateStatus('RECONNECTING');
      };
    } catch (err) {
      console.error('[SSE Setup Error]', err);
    }
  }

  private handleStreamMessage(message: MarketStreamEvent): void {
    if (message.type === 'CONNECTION_STATUS') {
      const data = message.data;
      this.updateStatus(data.status, data.provider, data.isRealtime);
      if (data.m5Countdown) {
        this.notifyStatusWithCountdown(data.m5Countdown);
      }
    } else if (message.type === 'MARKET_SNAPSHOT') {
      this.snapshotListeners.forEach(cb => cb(message.data));
      if (message.data.status) {
        this.updateStatus(
          message.data.status.status,
          message.data.status.provider,
          message.data.status.isRealtime
        );
      }
    } else if (message.type === 'PRICE_TICK') {
      const tick = message.data as PriceTick & { m5Countdown?: { remainingSeconds: number; countdownText: string } };
      this.lastTickTime = tick.timestamp;
      this.tickListeners.forEach(cb => cb(tick));
      if (tick.m5Countdown) {
        this.notifyStatusWithCountdown(tick.m5Countdown);
      }
    }
  }

  private updateStatus(status: ConnectionStatus, provider?: string, isRealtime?: boolean): void {
    this.connectionStatus = status;
    if (provider) this.providerName = provider;
    if (typeof isRealtime === 'boolean') this.isRealtime = isRealtime;

    this.statusListeners.forEach(cb => cb({
      status: this.connectionStatus,
      provider: this.providerName,
      isRealtime: this.isRealtime,
      lastTickTime: this.lastTickTime
    }));
  }

  private notifyStatusWithCountdown(countdown: { remainingSeconds: number; countdownText: string }): void {
    this.statusListeners.forEach(cb => cb({
      status: this.connectionStatus,
      provider: this.providerName,
      isRealtime: this.isRealtime,
      lastTickTime: this.lastTickTime,
      m5Countdown: countdown
    }));
  }

  public subscribeSymbol(symbol: MarketSymbol): void {
    this.activeSymbol = symbol;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'SUBSCRIBE',
        symbol
      }));
    } else if (this.isUsingSseFallback) {
      this.startSseFallback();
    }
  }

  public async fetchSnapshot(symbol: MarketSymbol): Promise<{
    symbol: MarketSymbol;
    candles: MultiTimeframeCandles;
    latestPrice: number;
    m5Countdown: { remainingSeconds: number; countdownText: string };
    status: { status: ConnectionStatus; provider: string; isRealtime: boolean; lastTickTime: number };
  }> {
    const res = await fetch(`/api/market/snapshot?symbol=${symbol}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch snapshot: ${res.statusText}`);
    }
    return res.json();
  }

  public async fetchHistory(symbol: MarketSymbol, timeframe: Timeframe, count: number = 250): Promise<Candle[]> {
    const res = await fetch(`/api/market/history?symbol=${symbol}&timeframe=${timeframe}&count=${count}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch history: ${res.statusText}`);
    }
    const data = await res.json();
    return data.candles || [];
  }

  public onTick(cb: TickCallback): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  public onStatusChange(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  public onSnapshot(cb: SnapshotCallback): () => void {
    this.snapshotListeners.add(cb);
    return () => this.snapshotListeners.delete(cb);
  }

  public getStatus() {
    return {
      status: this.connectionStatus,
      provider: this.providerName,
      isRealtime: this.isRealtime,
      lastTickTime: this.lastTickTime
    };
  }
}
