import { MarketSymbol, PriceTick, ConnectionStatus, Timeframe } from '../types';
import { RealtimeMarketClient } from './realtimeMarketClient';

export interface SymbolMarketState {
  symbol: MarketSymbol;
  price: number;
  bid?: number;
  ask?: number;
  volume: number;
  timestamp: number;
  change24h?: number;
  changePercent24h?: number;
}

export type TickListener = (tick: PriceTick) => void;
export type MultiTickListener = (state: Record<MarketSymbol, SymbolMarketState>) => void;
export type ConnectionListener = (status: ConnectionStatus, isRealtime: boolean, provider: string) => void;

/**
 * TwelveDataMarketService
 * 
 * Manages the persistent real-time streaming pipeline for TradeXpulse's
 * four canonical markets: XAUUSD, EURUSD, GBPUSD, and EURJPY.
 * 
 * Pipes incoming tick data directly into the shared MarketState context
 * while maintaining multi-market snapshot states for the Market Map overview.
 */
export class TwelveDataMarketService {
  private static instance: TwelveDataMarketService | null = null;
  
  public static readonly SUPPORTED_SYMBOLS: MarketSymbol[] = [
    'XAUUSD',
    'EURUSD',
    'GBPUSD',
    'EURJPY'
  ];

  private client: RealtimeMarketClient;
  private tickListeners: Set<TickListener> = new Set();
  private multiTickListeners: Set<MultiTickListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();

  private marketStates: Record<MarketSymbol, SymbolMarketState> = {
    XAUUSD: { symbol: 'XAUUSD', price: 2357.89, volume: 1420, timestamp: Date.now() },
    EURUSD: { symbol: 'EURUSD', price: 1.0845, volume: 890, timestamp: Date.now() },
    GBPUSD: { symbol: 'GBPUSD', price: 1.2678, volume: 760, timestamp: Date.now() },
    EURJPY: { symbol: 'EURJPY', price: 164.32, volume: 910, timestamp: Date.now() }
  };

  private currentStatus: ConnectionStatus = 'CONNECTING';
  private providerName: string = 'Twelve Data';
  private isRealtimeStream: boolean = false;
  private lastTickReceivedTime: number = 0;

  private constructor() {
    this.client = RealtimeMarketClient.getInstance();
    this.setupListeners();
    this.subscribeAllMarkets();
  }

  public static getInstance(): TwelveDataMarketService {
    if (!TwelveDataMarketService.instance) {
      TwelveDataMarketService.instance = new TwelveDataMarketService();
    }
    return TwelveDataMarketService.instance;
  }

  /**
   * Subscribes to all four core markets across the persistent stream
   */
  public subscribeAllMarkets(): void {
    TwelveDataMarketService.SUPPORTED_SYMBOLS.forEach(symbol => {
      this.client.subscribeSymbol(symbol);
    });
  }

  private setupListeners(): void {
    // 1. Connection status propagation
    this.client.onStatusChange(statusInfo => {
      this.currentStatus = statusInfo.status;
      this.providerName = statusInfo.provider;
      this.isRealtimeStream = statusInfo.isRealtime;
      if (statusInfo.lastTickTime) {
        this.lastTickReceivedTime = statusInfo.lastTickTime;
      }
      this.notifyStatusListeners();
    });

    // 2. Incoming tick ingestion & multi-market state distribution
    this.client.onTick(tick => {
      this.lastTickReceivedTime = tick.timestamp;
      const sym = tick.symbol;

      if (TwelveDataMarketService.SUPPORTED_SYMBOLS.includes(sym)) {
        this.marketStates[sym] = {
          symbol: sym,
          price: tick.price,
          volume: tick.volume || 1,
          timestamp: tick.timestamp
        };

        // Notify individual tick listeners
        this.tickListeners.forEach(listener => {
          try {
            listener(tick);
          } catch (err) {
            console.error('[TwelveDataMarketService] Error in tick listener:', err);
          }
        });

        // Notify multi-market state listeners
        this.multiTickListeners.forEach(listener => {
          try {
            listener({ ...this.marketStates });
          } catch (err) {
            console.error('[TwelveDataMarketService] Error in multiTick listener:', err);
          }
        });
      }
    });
  }

  /**
   * Subscribe to ticks for any market
   */
  public onTick(listener: TickListener): () => void {
    this.tickListeners.add(listener);
    return () => this.tickListeners.delete(listener);
  }

  /**
   * Subscribe to all 4-market updates simultaneously
   */
  public onMultiMarketUpdate(listener: MultiTickListener): () => void {
    this.multiTickListeners.add(listener);
    // Emit current state immediately to new subscriber
    listener({ ...this.marketStates });
    return () => this.multiTickListeners.delete(listener);
  }

  /**
   * Subscribe to connection status transitions
   */
  public onStatusChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.currentStatus, this.isRealtimeStream, this.providerName);
    return () => this.connectionListeners.delete(listener);
  }

  private notifyStatusListeners(): void {
    this.connectionListeners.forEach(listener => {
      try {
        listener(this.currentStatus, this.isRealtimeStream, this.providerName);
      } catch (err) {
        console.error('[TwelveDataMarketService] Error in status listener:', err);
      }
    });
  }

  /**
   * Ingest a manual price tick into the stream
   */
  public pipeTick(tick: PriceTick): void {
    if (TwelveDataMarketService.SUPPORTED_SYMBOLS.includes(tick.symbol)) {
      this.marketStates[tick.symbol] = {
        symbol: tick.symbol,
        price: tick.price,
        volume: tick.volume || 1,
        timestamp: tick.timestamp
      };
      this.tickListeners.forEach(cb => cb(tick));
      this.multiTickListeners.forEach(cb => cb({ ...this.marketStates }));
    }
  }

  /**
   * Get latest known price for a market
   */
  public getLatestPrice(symbol: MarketSymbol): number {
    return this.marketStates[symbol]?.price || 0;
  }

  /**
   * Get the multi-market state snapshot
   */
  public getAllMarketStates(): Record<MarketSymbol, SymbolMarketState> {
    return { ...this.marketStates };
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.currentStatus;
  }

  /**
   * Get provider information
   */
  public getProviderInfo(): { provider: string; isRealtime: boolean; lastTickTime: number } {
    return {
      provider: this.providerName,
      isRealtime: this.isRealtimeStream,
      lastTickTime: this.lastTickReceivedTime
    };
  }
}
