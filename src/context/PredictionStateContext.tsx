import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  MarketSymbol,
  Timeframe,
  BiasType,
  ActiveView,
  Candle,
  MarketOverview,
  Prediction,
  TimeframeTrendInfo,
  AiPredictionSummary,
  MarketDataStatusInfo,
  ChartOverlayConfig,
  ChartViewport,
  HistoricalStructureInfo,
  ConnectionStatus,
  PriceTick,
  MarketMapItem,
  AccountInfo,
  Position,
  Order,
  OrderRequest,
  OrderResult,
  RiskConfig,
  RiskEvaluationResult
} from '../types';
import { MarketDataService, MARKET_META } from '../services/marketDataService';
import { AnalysisEngine } from '../services/analysisEngine';
import { RealtimeMarketClient } from '../services/realtimeMarketClient';
import { TwelveDataMarketService, SymbolMarketState } from '../services/TwelveDataMarketService';
import { PaperExecutionAdapter, RiskEngine } from '../services/executionProvider';

interface PredictionStateContextType {
  // Navigation & Selections
  activeSymbol: MarketSymbol;
  setSymbol: (symbol: MarketSymbol) => void;
  activeTimeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  activeView: ActiveView;
  setView: (view: ActiveView) => void;
  
  // Shared Unified Prediction State
  prediction: Prediction;
  analyticalLevels: Prediction; // alias for backwards compatibility
  aiReport: Prediction; // alias for backwards compatibility

  activeBias: BiasType;
  setBias: (bias: BiasType) => void;
  isAnalyzing: boolean;
  triggerAiAnalysis: (customQuery?: string, forceBias?: BiasType) => void;
  
  // Data Layers
  candles: Candle[];
  marketOverview: MarketOverview;
  timeframeTrends: TimeframeTrendInfo[];
  predictionSummary: AiPredictionSummary;
  marketDataStatus: MarketDataStatusInfo;
  historicalAnalysis: HistoricalStructureInfo;
  marketMapItems: MarketMapItem[];

  // Real-time metadata
  connectionStatus: ConnectionStatus;
  m5CountdownText: string;
  isRealtime: boolean;

  // Chart Viewport Model (Professional TradingView-style viewport independent of candle array)
  viewport: ChartViewport;
  setViewport: React.Dispatch<React.SetStateAction<ChartViewport>>;
  loadMoreHistory: () => Promise<number>;

  // Chart Interactive Navigation (Panning, Zooming, Return to Live)
  panOffset: number; // 0 = at live latest candle; > 0 = scrolled back in time
  setPanOffset: React.Dispatch<React.SetStateAction<number>>;
  visibleCandleCount: number;
  setVisibleCandleCount: React.Dispatch<React.SetStateAction<number>>;
  returnToLive: () => void;
  isHistoricalView: boolean;
  zoomIn: (anchorRatio?: number) => void;
  zoomOut: (anchorRatio?: number) => void;
  resetView: () => void;
  
  // Chart Display Controls
  overlayConfig: ChartOverlayConfig;
  setOverlayConfig: React.Dispatch<React.SetStateAction<ChartOverlayConfig>>;
  toggleOverlay: (key: keyof ChartOverlayConfig) => void;

  // Execution & Risk Management
  account: AccountInfo;
  positions: Position[];
  orders: Order[];
  riskConfig: RiskConfig;
  placeOrder: (req: OrderRequest) => Promise<OrderResult>;
  cancelOrder: (orderId: string) => Promise<boolean>;
  closePosition: (positionId: string) => Promise<boolean>;
  modifyOrder: (orderId: string, updates: Partial<OrderRequest>) => Promise<boolean>;
  evaluateRisk: (req: OrderRequest) => RiskEvaluationResult;
  stagedOrder: OrderRequest | null;
  setStagedOrder: React.Dispatch<React.SetStateAction<OrderRequest | null>>;
  stageTradeFromPrediction: () => void;
}

const defaultOverlayConfig: ChartOverlayConfig = {
  showForecastPath: true,
  showEntryZone: true,
  showTargets: true,
  showSupportResistance: true,
  showVolume: true,
  showEMAs: true,
  showCrosshair: true,
  showHistoricalLevels: true,
  showMarketStructure: true,
  showFVG: true,
  showOrderBlocks: true,
};

const PredictionStateContext = createContext<PredictionStateContextType | null>(null);

export const PredictionStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSymbol, setActiveSymbol] = useState<MarketSymbol>('XAUUSD');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('M5');
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [activeBias, setActiveBias] = useState<BiasType>('BULLISH');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [overlayConfig, setOverlayConfig] = useState<ChartOverlayConfig>(defaultOverlayConfig);

  // Real-time connection & feed state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [providerName, setProviderName] = useState<string>('Twelve Data');
  const [isRealtime, setIsRealtime] = useState<boolean>(false);
  const [lastTickTimestamp, setLastTickTimestamp] = useState<number>(Date.now());
  const [m5CountdownText, setM5CountdownText] = useState<string>('M5 closes in 04:30');
  const [m5SecondsRemaining, setM5SecondsRemaining] = useState<number>(270);

  // Live candles array
  const [candles, setCandles] = useState<Candle[]>(() => {
    return MarketDataService.getHistoricalCandles('XAUUSD', 'M5', 250);
  });

  // Paper Execution and Risk Engines
  const executionAdapterRef = useRef<PaperExecutionAdapter>(new PaperExecutionAdapter(50000));
  const riskEngineRef = useRef<RiskEngine>(new RiskEngine());

  const [account, setAccount] = useState<AccountInfo>(() => executionAdapterRef.current.getAccount());
  const [positions, setPositions] = useState<Position[]>(() => executionAdapterRef.current.getPositions());
  const [orders, setOrders] = useState<Order[]>(() => executionAdapterRef.current.getOrders());
  const [riskConfig, setRiskConfig] = useState<RiskConfig>(() => riskEngineRef.current.getConfig());
  const [stagedOrder, setStagedOrder] = useState<OrderRequest | null>(null);

  useEffect(() => {
    const unsubAcc = executionAdapterRef.current.onAccountChange(setAccount);
    const unsubPos = executionAdapterRef.current.onPositionsChange(setPositions);
    const unsubOrd = executionAdapterRef.current.onOrdersChange(setOrders);
    return () => {
      unsubAcc();
      unsubPos();
      unsubOrd();
    };
  }, []);

  // Chart Viewport Model State (Independent of growing realtime candle datasets)
  const [viewport, setViewport] = useState<ChartViewport>(() => {
    const initialCount = 250;
    const visibleBarCount = 55;
    const rightOffsetBars = 14;
    const liveFirst = Math.max(0, (initialCount - 1 + rightOffsetBars) - visibleBarCount);
    return {
      firstVisibleIndex: liveFirst,
      visibleBarCount,
      rightOffsetBars,
      mode: 'LIVE',
      isFollowingLive: true,
      isDragging: false,
      isZooming: false
    };
  });

  const viewportRef = useRef<ChartViewport>(viewport);
  viewportRef.current = viewport;

  // Backwards-compatible panOffset & visibleCandleCount bridges
  const panOffset = useMemo(() => {
    if (viewport.mode === 'LIVE') return 0;
    const liveFirst = (candles.length - 1 + viewport.rightOffsetBars) - viewport.visibleBarCount;
    return Math.max(0, Math.round(liveFirst - viewport.firstVisibleIndex));
  }, [viewport, candles.length]);

  const setPanOffset = useCallback((action: React.SetStateAction<number>) => {
    setViewport(prev => {
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - prev.visibleBarCount;
      const currentOffset = Math.max(0, Math.round(liveFirst - prev.firstVisibleIndex));
      const nextOffset = typeof action === 'function' ? action(currentOffset) : action;
      if (nextOffset <= 0) {
        return {
          ...prev,
          firstVisibleIndex: liveFirst,
          mode: 'LIVE',
          isFollowingLive: true
        };
      }
      return {
        ...prev,
        firstVisibleIndex: Math.max(0, liveFirst - nextOffset),
        mode: 'HISTORICAL',
        isFollowingLive: false
      };
    });
  }, [candles.length]);

  const visibleCandleCount = viewport.visibleBarCount;
  const setVisibleCandleCount = useCallback((action: React.SetStateAction<number>) => {
    setViewport(prev => {
      const nextCount = typeof action === 'function' ? action(prev.visibleBarCount) : action;
      const clamped = Math.max(16, Math.min(250, nextCount));
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - clamped;
      if (prev.isFollowingLive) {
        return {
          ...prev,
          visibleBarCount: clamped,
          firstVisibleIndex: liveFirst
        };
      }
      return {
        ...prev,
        visibleBarCount: clamped
      };
    });
  }, [candles.length]);

  const activeSymbolRef = useRef<MarketSymbol>(activeSymbol);
  activeSymbolRef.current = activeSymbol;

  const activeTimeframeRef = useRef<Timeframe>(activeTimeframe);
  activeTimeframeRef.current = activeTimeframe;

  // Real-time client subscription
  useEffect(() => {
    const client = RealtimeMarketClient.getInstance();

    // 1. Listen for status changes
    const unsubStatus = client.onStatusChange(statusInfo => {
      setConnectionStatus(statusInfo.status);
      setProviderName(statusInfo.provider);
      setIsRealtime(statusInfo.isRealtime);
      if (statusInfo.lastTickTime) {
        setLastTickTimestamp(statusInfo.lastTickTime);
      }
      if (statusInfo.m5Countdown) {
        setM5CountdownText(statusInfo.m5Countdown.countdownText);
        setM5SecondsRemaining(statusInfo.m5Countdown.remainingSeconds);
      }
    });

    // 2. Listen for price ticks
    const unsubTick = client.onTick((tick: PriceTick & { m5Countdown?: { remainingSeconds: number; countdownText: string } }) => {
      // Feed execution adapter for simulated fill and mark-to-market valuation
      executionAdapterRef.current.handlePriceTick(tick.symbol, tick.price);

      if (tick.symbol !== activeSymbolRef.current) return;
      setLastTickTimestamp(tick.timestamp);

      if (tick.m5Countdown) {
        setM5CountdownText(tick.m5Countdown.countdownText);
        setM5SecondsRemaining(tick.m5Countdown.remainingSeconds);
      }

      // Update active forming candle in state
      setCandles(prevCandles => {
        if (prevCandles.length === 0) return prevCandles;
        const currentCandles = [...prevCandles];
        const lastIndex = currentCandles.length - 1;
        const activeCandle = { ...currentCandles[lastIndex] };
        
        const tf = activeTimeframeRef.current;
        const tfMs: Record<Timeframe, number> = {
          M1: 60 * 1000,
          M5: 5 * 60 * 1000,
          M15: 15 * 60 * 1000,
          H1: 60 * 60 * 1000,
          H4: 4 * 60 * 60 * 1000,
          D1: 24 * 60 * 60 * 1000
        };
        const intervalMs = tfMs[tf];
        const candleStart = Math.floor(tick.timestamp / intervalMs) * intervalMs;

        if (candleStart > activeCandle.time) {
          // Timeframe crossed: freeze old candle and create new one
          const newCandle: Candle = {
            time: candleStart,
            open: activeCandle.close,
            high: Math.max(activeCandle.close, tick.price),
            low: Math.min(activeCandle.close, tick.price),
            close: tick.price,
            volume: tick.volume || 1
          };
          const updated = [...currentCandles, newCandle];

          // LIVE MODE: automatically advance viewport to follow latest candle
          if (viewportRef.current.isFollowingLive) {
            setViewport(prev => {
              const liveFirst = (updated.length - 1 + prev.rightOffsetBars) - prev.visibleBarCount;
              return {
                ...prev,
                firstVisibleIndex: liveFirst,
                mode: 'LIVE',
                isFollowingLive: true
              };
            });
          }
          // HISTORICAL MODE: do NOT touch viewport! Viewport remains frozen on viewed bars.

          return updated.slice(-1000);
        } else {
          // Update current candle in real-time
          activeCandle.high = Math.max(activeCandle.high, tick.price);
          activeCandle.low = Math.min(activeCandle.low, tick.price);
          activeCandle.close = tick.price;
          activeCandle.volume += (tick.volume || 1);
          currentCandles[lastIndex] = activeCandle;
          return currentCandles;
        }
      });
    });

    // 3. Listen for full snapshots
    const unsubSnapshot = client.onSnapshot(snapshot => {
      if (snapshot.symbol === activeSymbolRef.current) {
        const tfCandles = snapshot.candles[activeTimeframeRef.current] || snapshot.candles.M5;
        if (tfCandles && tfCandles.length > 0) {
          setCandles(tfCandles);
          if (viewportRef.current.isFollowingLive) {
            const liveFirst = (tfCandles.length - 1 + viewportRef.current.rightOffsetBars) - viewportRef.current.visibleBarCount;
            setViewport(prev => ({
              ...prev,
              firstVisibleIndex: liveFirst,
              mode: 'LIVE',
              isFollowingLive: true
            }));
          }
        }
        if (snapshot.m5Countdown) {
          setM5CountdownText(snapshot.m5Countdown.countdownText);
          setM5SecondsRemaining(snapshot.m5Countdown.remainingSeconds);
        }
      }
    });

    // Initial subscribe
    client.subscribeSymbol(activeSymbol);

    // Initial snapshot fetch
    client.fetchSnapshot(activeSymbol).then(snapshot => {
      if (snapshot.symbol === activeSymbolRef.current) {
        const tfCandles = snapshot.candles[activeTimeframeRef.current] || snapshot.candles.M5;
        if (tfCandles && tfCandles.length > 0) {
          setCandles(tfCandles);
          if (viewportRef.current.isFollowingLive) {
            const liveFirst = (tfCandles.length - 1 + viewportRef.current.rightOffsetBars) - viewportRef.current.visibleBarCount;
            setViewport(prev => ({
              ...prev,
              firstVisibleIndex: liveFirst,
              mode: 'LIVE',
              isFollowingLive: true
            }));
          }
        }
        if (snapshot.status) {
          setConnectionStatus(snapshot.status.status);
          setProviderName(snapshot.status.provider);
          setIsRealtime(snapshot.status.isRealtime);
        }
        if (snapshot.m5Countdown) {
          setM5CountdownText(snapshot.m5Countdown.countdownText);
          setM5SecondsRemaining(snapshot.m5Countdown.remainingSeconds);
        }
      }
    }).catch(err => {
      console.warn('[Initial Snapshot Fetch Error]', err);
    });

    return () => {
      unsubStatus();
      unsubTick();
      unsubSnapshot();
    };
  }, []);

  // Fetch new candles when activeSymbol or activeTimeframe changes
  useEffect(() => {
    let isCancelled = false;
    const client = RealtimeMarketClient.getInstance();
    client.subscribeSymbol(activeSymbol);

    MarketDataService.fetchHistoricalCandles(activeSymbol, activeTimeframe, 250).then(fetchedCandles => {
      if (!isCancelled && fetchedCandles && fetchedCandles.length > 0) {
        setCandles(fetchedCandles);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeSymbol, activeTimeframe]);

  // Client-side 1-second countdown ticker for smooth M5 clock progression
  useEffect(() => {
    const timer = setInterval(() => {
      // Calculate countdown directly from latest candle or local time
      const now = Date.now();
      const m5Start = Math.floor(now / (5 * 60 * 1000)) * (5 * 60 * 1000);
      const m5End = m5Start + 5 * 60 * 1000;
      const remSec = Math.max(0, Math.floor((m5End - now) / 1000));
      const mins = Math.floor(remSec / 60);
      const secs = remSec % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      setM5SecondsRemaining(remSec);
      setM5CountdownText(`M5 closes in ${formatted}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Market overview metadata
  const marketOverview = useMemo(() => {
    return MarketDataService.getMarketOverview(activeSymbol, candles);
  }, [activeSymbol, candles]);

  // Historical market structure analysis (swings, ATR, volume, BOS)
  const historicalAnalysis = useMemo(() => {
    return AnalysisEngine.analyzeHistoricalStructure(candles, activeTimeframe, marketOverview.digits);
  }, [candles, activeTimeframe, marketOverview.digits]);

  // ONE SHARED PREDICTION STATE: Generated deterministically from live price, candles, and bias
  const [prediction, setPrediction] = useState<Prediction>(() => {
    return AnalysisEngine.generatePrediction('XAUUSD', 2357.89, 'BULLISH', candles, 'M5');
  });

  // Track state to only recalculate prediction on meaningful events (candle close, symbol/tf/bias switch, or setup invalidation)
  const lastAnalyzedRef = useRef<{
    symbol: MarketSymbol;
    timeframe: Timeframe;
    bias: BiasType;
    candleTime: number;
    candleCount: number;
  }>({
    symbol: activeSymbol,
    timeframe: activeTimeframe,
    bias: activeBias,
    candleTime: 0,
    candleCount: 0
  });

  // Keep shared prediction state updated with active symbol, price, bias, and candle structure
  useEffect(() => {
    const lastCandle = candles[candles.length - 1];
    const prevCandleTime = lastAnalyzedRef.current.candleTime;
    const isSymbolChanged = lastAnalyzedRef.current.symbol !== activeSymbol;
    const isTfChanged = lastAnalyzedRef.current.timeframe !== activeTimeframe;
    const isBiasChanged = lastAnalyzedRef.current.bias !== activeBias;
    const isNewCandleFormed = lastCandle && lastCandle.time !== prevCandleTime;
    const isCountChanged = Math.abs(candles.length - lastAnalyzedRef.current.candleCount) > 2;

    // Check invalidation: real market price broke structural invalidation / stop loss
    const currentPrice = marketOverview.currentPrice;
    let isInvalidationTriggered = false;
    if (prediction && currentPrice > 0) {
      if (prediction.direction === 'BULLISH' && currentPrice < prediction.stopLoss) {
        isInvalidationTriggered = true;
      } else if (prediction.direction === 'BEARISH' && currentPrice > prediction.stopLoss) {
        isInvalidationTriggered = true;
      }
    }

    if (
      isSymbolChanged ||
      isTfChanged ||
      isBiasChanged ||
      isNewCandleFormed ||
      isCountChanged ||
      isInvalidationTriggered
    ) {
      lastAnalyzedRef.current = {
        symbol: activeSymbol,
        timeframe: activeTimeframe,
        bias: activeBias,
        candleTime: lastCandle ? lastCandle.time : 0,
        candleCount: candles.length
      };

      const updated = AnalysisEngine.generatePrediction(activeSymbol, currentPrice, activeBias, candles, activeTimeframe);
      setPrediction(updated);
    }
  }, [activeSymbol, activeTimeframe, activeBias, candles, marketOverview.currentPrice, prediction]);

  // Multi-timeframe trend breakdown
  const timeframeTrends = useMemo(() => {
    return AnalysisEngine.getTimeframeTrends(activeSymbol, activeBias);
  }, [activeSymbol, activeBias]);

  // Prediction summary metrics
  const predictionSummary = useMemo(() => {
    return AnalysisEngine.getPredictionSummary(activeBias, prediction);
  }, [activeBias, prediction]);

  // Authoritative 4-Market Map Items derived strictly from canonical AnalysisEngine
  const marketMapItems: MarketMapItem[] = useMemo(() => {
    const symbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
    const service = TwelveDataMarketService.getInstance();
    const states = service.getAllMarketStates();

    return symbols.map(sym => {
      const isCurrent = sym === activeSymbol;
      const meta = MARKET_META[sym];
      const digits = meta.pricePrecision;
      const fallbackPrice = sym === 'XAUUSD' ? 2355.0 : sym === 'EURJPY' ? 164.5 : sym === 'EURUSD' ? 1.085 : 1.268;
      const currentPrice = isCurrent 
        ? marketOverview.currentPrice 
        : (states[sym]?.price || TwelveDataMarketService.getInstance().getLatestPrice(sym) || fallbackPrice);

      // Re-use current canonical prediction for the active symbol, or generate for others
      const pred = isCurrent 
        ? prediction 
        : AnalysisEngine.generatePrediction(sym, currentPrice, undefined, MarketDataService.getHistoricalCandles(sym, 'M5', 60), 'M5');

      const condition: 'TRENDING' | 'RANGING' | 'BEST_OPPORTUNITY' | 'AVOID' =
        pred.confidence >= 80 ? 'BEST_OPPORTUNITY' :
        pred.direction === 'NO TRADE' ? 'AVOID' :
        pred.marketCondition.toLowerCase().includes('range') ? 'RANGING' : 'TRENDING';

      return {
        symbol: sym,
        name: meta.name,
        currentPrice,
        direction: pred.direction,
        strength: pred.confidence,
        trend: pred.structure?.trend || (pred.direction === 'BULLISH' ? 'Bullish Flow' : pred.direction === 'BEARISH' ? 'Bearish Flow' : 'Equilibrium Consolidation'),
        structure: pred.structure?.lastBOS?.description || (pred.direction === 'BULLISH' ? 'Higher High Expansion' : pred.direction === 'BEARISH' ? 'Lower Low Expansion' : 'Neutral Range'),
        m5Setup: `${pred.orderType} (SL: ${pred.stopLoss.toFixed(digits)} / TP1: ${pred.tp1.toFixed(digits)})`,
        keySupport: pred.keyLevels?.nearestSupport?.price || pred.support,
        keyResistance: pred.keyLevels?.nearestResistance?.price || pred.resistance,
        expectedMovement: pred.expectedMovement,
        signalStatus: pred.direction !== 'NO TRADE' ? 'ACTIVE' : 'STANDBY',
        confidence: pred.confidence,
        classification: condition,
        digits
      };
    });
  }, [activeSymbol, marketOverview.currentPrice, prediction]);

  // Feed status metadata with connection state & data staleness protection
  const marketDataStatus: MarketDataStatusInfo = useMemo(() => {
    const now = Date.now();
    const isStale = now - lastTickTimestamp > 25000 && connectionStatus === 'LIVE';
    
    let statusLabel = 'Connecting...';
    if (connectionStatus === 'LIVE') {
      statusLabel = isStale ? 'Data Stale (Reconnecting)' : 'Twelve Data (Live Stream)';
    } else if (connectionStatus === 'DEMO') {
      statusLabel = 'Twelve Data (Demo Mode)';
    } else if (connectionStatus === 'RECONNECTING') {
      statusLabel = 'Reconnecting...';
    } else if (connectionStatus === 'OFFLINE') {
      statusLabel = 'Offline';
    }

    return {
      dataStatus: statusLabel,
      lastUpdate: new Date(lastTickTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      symbol: activeSymbol,
      timeframe: activeTimeframe,
      pingMs: isRealtime ? 18 + Math.floor(Math.random() * 8) : 5,
      connectionStatus,
      provider: providerName,
      isRealtime,
      lastTickTime: lastTickTimestamp,
      m5SecondsRemaining,
      m5CountdownText,
      isStale
    };
  }, [activeSymbol, activeTimeframe, lastTickTimestamp, connectionStatus, providerName, isRealtime, m5SecondsRemaining, m5CountdownText]);

  // Dynamic Historical Data Loader: prepends older bars and smoothly rebases viewport with zero jump
  const isFetchingOlderHistoryRef = useRef<boolean>(false);
  const loadMoreHistory = useCallback(async (): Promise<number> => {
    if (isFetchingOlderHistoryRef.current) return 0;
    isFetchingOlderHistoryRef.current = true;

    try {
      if (candles.length === 0) return 0;
      const earliestCandle = candles[0];
      const tf = activeTimeframeRef.current;
      const tfMs: Record<Timeframe, number> = {
        M1: 60 * 1000,
        M5: 5 * 60 * 1000,
        M15: 15 * 60 * 1000,
        H1: 60 * 60 * 1000,
        H4: 4 * 60 * 60 * 1000,
        D1: 24 * 60 * 60 * 1000
      };
      const intervalMs = tfMs[tf] || 5 * 60 * 1000;
      const digits = MARKET_META[activeSymbolRef.current]?.digits || 2;
      const count = 100;
      const prepended: Candle[] = [];
      let p = earliestCandle.open;
      const step = tf === 'H4' ? 1.2 : 0.45;

      for (let j = count; j >= 1; j--) {
        const t = earliestCandle.time - j * intervalMs;
        const o = Number(p.toFixed(digits));
        const delta = (Math.sin(j * 0.28) * 0.7 + Math.cos(j * 0.08) * 0.3) * step;
        const c = Number((o + delta).toFixed(digits));
        const h = Number((Math.max(o, c) + Math.abs(delta) * 0.45 + 0.05).toFixed(digits));
        const l = Number((Math.min(o, c) - Math.abs(delta) * 0.45 - 0.05).toFixed(digits));
        const vol = Math.floor(900 + Math.sin(j) * 350);
        prepended.push({ time: t, open: o, high: h, low: l, close: c, volume: Math.max(100, vol) });
        p = c;
      }

      setCandles(prev => [...prepended, ...prev]);

      // CRITICAL: Rebase viewport offset by prepended count so viewed bars don't jump at all!
      setViewport(prev => ({
        ...prev,
        firstVisibleIndex: prev.firstVisibleIndex + count
      }));

      return count;
    } finally {
      isFetchingOlderHistoryRef.current = false;
    }
  }, [candles]);

  // Return to live latest candle (Instantly snaps back to LIVE edge with right-side margin)
  const returnToLive = useCallback(() => {
    setViewport(prev => {
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - prev.visibleBarCount;
      return {
        ...prev,
        firstVisibleIndex: liveFirst,
        mode: 'LIVE',
        isFollowingLive: true
      };
    });
  }, [candles.length]);

  // Cursor/Center Anchor-based Zoom Controls
  const zoomIn = useCallback((anchorRatio: number = 0.5) => {
    setViewport(prev => {
      const clampedRatio = Math.max(0.05, Math.min(0.95, anchorRatio));
      const newVisible = Math.max(16, Math.round(prev.visibleBarCount * 0.85));
      const anchorIndex = prev.firstVisibleIndex + clampedRatio * prev.visibleBarCount;
      let newFirst = anchorIndex - clampedRatio * newVisible;
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - newVisible;

      if (prev.isFollowingLive || newFirst >= liveFirst - 1.2) {
        return {
          ...prev,
          visibleBarCount: newVisible,
          firstVisibleIndex: liveFirst,
          mode: 'LIVE',
          isFollowingLive: true
        };
      }
      return {
        ...prev,
        visibleBarCount: newVisible,
        firstVisibleIndex: Math.max(0, newFirst)
      };
    });
  }, [candles.length]);

  const zoomOut = useCallback((anchorRatio: number = 0.5) => {
    setViewport(prev => {
      const clampedRatio = Math.max(0.05, Math.min(0.95, anchorRatio));
      const newVisible = Math.min(240, Math.round(prev.visibleBarCount * 1.18));
      const anchorIndex = prev.firstVisibleIndex + clampedRatio * prev.visibleBarCount;
      let newFirst = anchorIndex - clampedRatio * newVisible;
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - newVisible;

      if (prev.isFollowingLive) {
        return {
          ...prev,
          visibleBarCount: newVisible,
          firstVisibleIndex: liveFirst,
          mode: 'LIVE',
          isFollowingLive: true
        };
      }
      return {
        ...prev,
        visibleBarCount: newVisible,
        firstVisibleIndex: Math.max(0, newFirst)
      };
    });
  }, [candles.length]);

  const resetView = useCallback(() => {
    setViewport(prev => {
      const defaultVisible = 55;
      const liveFirst = (candles.length - 1 + prev.rightOffsetBars) - defaultVisible;
      return {
        ...prev,
        visibleBarCount: defaultVisible,
        firstVisibleIndex: liveFirst,
        mode: 'LIVE',
        isFollowingLive: true
      };
    });
  }, [candles.length]);

  // Timeframe change: If LIVE, remain in LIVE mode. If HISTORICAL, preserve approximate time position.
  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    const curViewport = viewportRef.current;
    const isLive = curViewport.isFollowingLive;
    let targetTime: number | null = null;

    if (!isLive && candles.length > 0) {
      const centerIdx = Math.max(
        0, 
        Math.min(candles.length - 1, Math.round(curViewport.firstVisibleIndex + curViewport.visibleBarCount / 2))
      );
      targetTime = candles[centerIdx]?.time || null;
    }

    setActiveTimeframe(tf);

    // Fetch candles for newly selected timeframe
    MarketDataService.fetchHistoricalCandles(activeSymbolRef.current, tf, 250).then(fetched => {
      if (fetched && fetched.length > 0) {
        setCandles(fetched);
        if (isLive || !targetTime) {
          const liveFirst = (fetched.length - 1 + curViewport.rightOffsetBars) - curViewport.visibleBarCount;
          setViewport(prev => ({
            ...prev,
            firstVisibleIndex: liveFirst,
            mode: 'LIVE',
            isFollowingLive: true
          }));
        } else {
          // Historical: find candle closest to preserved targetTime
          let closestIdx = 0;
          let minDiff = Infinity;
          fetched.forEach((c, idx) => {
            const diff = Math.abs(c.time - targetTime!);
            if (diff < minDiff) {
              minDiff = diff;
              closestIdx = idx;
            }
          });
          const newFirst = Math.max(0, closestIdx - Math.round(curViewport.visibleBarCount / 2));
          setViewport(prev => ({
            ...prev,
            firstVisibleIndex: newFirst,
            mode: 'HISTORICAL',
            isFollowingLive: false
          }));
        }
      }
    }).catch(err => {
      console.warn('[Timeframe change fetch error]', err);
    });
  }, [candles]);

  const triggerAiAnalysis = useCallback((_customQuery?: string, forceBias?: BiasType) => {
    setIsAnalyzing(true);
    const targetBias = forceBias || activeBias;
    if (forceBias) {
      setActiveBias(forceBias);
    }

    setTimeout(() => {
      const generated = AnalysisEngine.generatePrediction(activeSymbol, marketOverview.currentPrice, targetBias, candles);
      setPrediction(generated);
      setIsAnalyzing(false);
    }, 450);
  }, [activeSymbol, marketOverview.currentPrice, activeBias, candles]);

  const toggleOverlay = useCallback((key: keyof ChartOverlayConfig) => {
    setOverlayConfig(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Symbol change: If previously LIVE, open new symbol at newest data.
  const handleSymbolChange = useCallback((sym: MarketSymbol) => {
    const curViewport = viewportRef.current;
    setActiveSymbol(sym);

    MarketDataService.fetchHistoricalCandles(sym, activeTimeframeRef.current, 250).then(fetched => {
      if (fetched && fetched.length > 0) {
        setCandles(fetched);
        const liveFirst = (fetched.length - 1 + curViewport.rightOffsetBars) - curViewport.visibleBarCount;
        setViewport(prev => ({
          ...prev,
          firstVisibleIndex: liveFirst,
          mode: 'LIVE',
          isFollowingLive: true
        }));
      }
    }).catch(err => {
      console.warn('[Symbol change fetch error]', err);
    });

    const biasMap: Record<MarketSymbol, BiasType> = {
      XAUUSD: 'BULLISH',
      EURJPY: 'BEARISH',
      EURUSD: 'BULLISH',
      GBPUSD: 'NO TRADE'
    };
    setActiveBias(biasMap[sym]);
  }, []);

  // Execution & Risk Handlers
  const placeOrder = useCallback(async (req: OrderRequest): Promise<OrderResult> => {
    return executionAdapterRef.current.placeOrder(req);
  }, []);

  const closePosition = useCallback(async (positionId: string): Promise<boolean> => {
    return executionAdapterRef.current.closePosition(positionId);
  }, []);

  const cancelOrder = useCallback(async (orderId: string): Promise<boolean> => {
    return executionAdapterRef.current.cancelOrder(orderId);
  }, []);

  const modifyOrder = useCallback(async (orderId: string, updates: Partial<OrderRequest>): Promise<boolean> => {
    return executionAdapterRef.current.modifyOrder(orderId, updates);
  }, []);

  const evaluateRisk = useCallback((req: OrderRequest): RiskEvaluationResult => {
    const curPrice = candles.length > 0 ? candles[candles.length - 1].close : marketOverview.currentPrice;
    const spread = marketOverview.spread;
    const openCount = positions.filter(p => p.status === 'OPEN').length;
    return riskEngineRef.current.evaluateOrder(account, req, curPrice, spread, openCount);
  }, [candles, marketOverview.currentPrice, marketOverview.spread, positions, account]);

  const stageTradeFromPrediction = useCallback(() => {
    if (prediction.direction === 'NO TRADE') return;
    const side = prediction.direction === 'BULLISH' ? 'BUY' : 'SELL';
    const midEntry = Number(((prediction.entryZone.min + prediction.entryZone.max) / 2).toFixed(marketOverview.digits));
    const newStaged: OrderRequest = {
      symbol: activeSymbol,
      side,
      type: 'LIMIT',
      lots: 0.5,
      price: midEntry,
      stopLoss: prediction.stopLoss,
      takeProfit: prediction.tp3,
      notes: `Derived from TradeXpulse ${prediction.direction} setup with RR ${prediction.riskReward}`
    };
    setStagedOrder(newStaged);
  }, [prediction, activeSymbol, marketOverview.digits]);

  return (
    <PredictionStateContext.Provider
      value={{
        activeSymbol,
        setSymbol: handleSymbolChange,
        activeTimeframe,
        setTimeframe: handleTimeframeChange,
        activeView,
        setView: setActiveView,
        prediction,
        analyticalLevels: prediction,
        aiReport: prediction,
        activeBias,
        setBias: setActiveBias,
        isAnalyzing,
        triggerAiAnalysis,
        candles,
        marketOverview,
        timeframeTrends,
        predictionSummary,
        marketDataStatus,
        historicalAnalysis,
        marketMapItems,
        connectionStatus,
        m5CountdownText,
        isRealtime,
        viewport,
        setViewport,
        loadMoreHistory,
        panOffset,
        setPanOffset,
        visibleCandleCount,
        setVisibleCandleCount,
        returnToLive,
        isHistoricalView: viewport.mode === 'HISTORICAL',
        zoomIn,
        zoomOut,
        resetView,
        overlayConfig,
        setOverlayConfig,
        toggleOverlay,
        account,
        positions,
        orders,
        riskConfig,
        placeOrder,
        closePosition,
        cancelOrder,
        modifyOrder,
        evaluateRisk,
        stagedOrder,
        setStagedOrder,
        stageTradeFromPrediction
      }}
    >
      {children}
    </PredictionStateContext.Provider>
  );
};

export const usePredictionState = (): PredictionStateContextType => {
  const context = useContext(PredictionStateContext);
  if (!context) {
    throw new Error('usePredictionState must be used within a PredictionStateProvider');
  }
  return context;
};
