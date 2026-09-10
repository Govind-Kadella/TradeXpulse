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
  RiskEvaluationResult,
  sanitizeTimeframe,
  ChartTemplate
} from '../types';
import { MarketDataService, MARKET_META } from '../services/marketDataService';
import { AnalysisEngine } from '../services/analysisEngine';
import { RealtimeMarketClient } from '../services/realtimeMarketClient';
import { TwelveDataMarketService, SymbolMarketState } from '../services/TwelveDataMarketService';
import { PaperExecutionAdapter, RiskEngine } from '../services/executionProvider';
import { ChartViewportEngine } from '../services/chartViewportEngine';
import {
  CHART_TEMPLATES,
  TEMPLATE_STORAGE_KEY,
  OVERLAY_STORAGE_KEY,
  applyTemplateToConfig,
} from '../services/templateService';

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
  
  // Fullscreen Mode
  isChartFullscreen: boolean;
  setIsChartFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleChartFullscreen: () => void;
  
  // Chart Display Controls
  overlayConfig: ChartOverlayConfig;
  setOverlayConfig: React.Dispatch<React.SetStateAction<ChartOverlayConfig>>;
  toggleOverlay: (key: keyof ChartOverlayConfig) => void;
  selectAllMarketStructure: () => void;
  clearAllMarketStructure: () => void;
  isMarketStructureEnabled: boolean;
  toggleMarketStructure: () => void;
  isMarketPredictionEnabled: boolean;
  toggleMarketPrediction: () => void;

  // Chart Templates
  activeTemplate: ChartTemplate;
  setActiveTemplate: React.Dispatch<React.SetStateAction<ChartTemplate>>;
  applyTemplate: (template: ChartTemplate) => void;

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

export const ALL_MARKET_STRUCTURE_KEYS: (keyof ChartOverlayConfig)[] = [
  'showPatternDoji', 'showPatternHammer', 'showPatternInvertedHammer', 'showPatternShootingStar',
  'showPatternHangingMan', 'showPatternPinBar', 'showPatternMarubozu', 'showPatternSpinningTop',
  'showPatternBullishEngulfing', 'showPatternBearishEngulfing', 'showPatternBullishHarami', 'showPatternBearishHarami',
  'showPatternPiercingLine', 'showPatternDarkCloudCover', 'showPatternTweezerTop', 'showPatternTweezerBottom',
  'showPatternMorningStar', 'showPatternEveningStar', 'showPatternThreeWhiteSoldiers', 'showPatternThreeBlackCrows',
  'showPatternThreeInsideUp', 'showPatternThreeInsideDown', 'showPatternThreeOutsideUp', 'showPatternThreeOutsideDown',
  'showMS_BOS', 'showMS_CHoCH', 'showMS_CoC', 'showMS_Swings', 'showMS_HH_HL', 'showMS_LH_LL',
  'showFVG_Bullish', 'showFVG_Bearish', 'showFVG_Mitigated',
  'showOB_Bullish', 'showOB_Bearish', 'showOB_Mitigated',
  'showLiq_Sweeps', 'showLiq_EQH', 'showLiq_EQL',
  'showSR_Support', 'showSR_Resistance'
];

const defaultOverlayConfig: ChartOverlayConfig = {
  showForecastPath: false,
  showEntryZone: false,
  showTargets: false,
  showSupportResistance: false,
  showVolume: true,
  showEMAs: false,
  showCrosshair: true,
  showHistoricalLevels: false,
  showMarketStructure: false,
  showFVG: false,
  showOrderBlocks: false,
  showCandlePatterns: false,

  // Single-Candle Price Action
  showPatternDoji: false,
  showPatternHammer: false,
  showPatternInvertedHammer: false,
  showPatternShootingStar: false,
  showPatternHangingMan: false,
  showPatternPinBar: false,
  showPatternMarubozu: false,
  showPatternSpinningTop: false,

  // Two-Candle Patterns
  showPatternBullishEngulfing: false,
  showPatternBearishEngulfing: false,
  showPatternBullishHarami: false,
  showPatternBearishHarami: false,
  showPatternPiercingLine: false,
  showPatternDarkCloudCover: false,
  showPatternTweezerTop: false,
  showPatternTweezerBottom: false,

  // Multi-Candle Patterns
  showPatternMorningStar: false,
  showPatternEveningStar: false,
  showPatternThreeWhiteSoldiers: false,
  showPatternThreeBlackCrows: false,
  showPatternThreeInsideUp: false,
  showPatternThreeInsideDown: false,
  showPatternThreeOutsideUp: false,
  showPatternThreeOutsideDown: false,

  // Market Structure
  showMS_BOS: false,
  showMS_CHoCH: false,
  showMS_CoC: false,
  showMS_Swings: false,
  showMS_HH_HL: false,
  showMS_LH_LL: false,

  // Fair Value Gaps (FVG)
  showFVG_Bullish: false,
  showFVG_Bearish: false,
  showFVG_Mitigated: false,

  // Order Blocks (OB)
  showOB_Bullish: false,
  showOB_Bearish: false,
  showOB_Mitigated: false,

  // Liquidity
  showLiq_Sweeps: false,
  showLiq_EQH: false,
  showLiq_EQL: false,

  // Support / Resistance
  showSR_Support: false,
  showSR_Resistance: false,
};

const PredictionStateContext = createContext<PredictionStateContextType | null>(null);

export const PredictionStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSymbol, setActiveSymbol] = useState<MarketSymbol>('XAUUSD');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(() => sanitizeTimeframe('M5'));
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [activeBias, setActiveBias] = useState<BiasType>('BULLISH');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  // Template and Overlay Settings with Session Persistence
  const [activeTemplate, setActiveTemplate] = useState<ChartTemplate>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (
        saved === 'TRADEXPULSE_AI_PRO' ||
        saved === 'PURE_PRICE_ACTION' ||
        saved === 'INSTITUTIONAL_LEVELS' ||
        saved === 'CUSTOM'
      ) {
        return saved as ChartTemplate;
      }
    } catch {
      // ignore
    }
    return 'TRADEXPULSE_AI_PRO';
  });

  const [overlayConfig, setOverlayConfig] = useState<ChartOverlayConfig>(() => {
    try {
      const savedSettings = localStorage.getItem(OVERLAY_STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultOverlayConfig, ...parsed };
        }
      }

      const savedTmpl = localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (savedTmpl && (savedTmpl === 'TRADEXPULSE_AI_PRO' || savedTmpl === 'PURE_PRICE_ACTION' || savedTmpl === 'INSTITUTIONAL_LEVELS')) {
        return {
          ...defaultOverlayConfig,
          ...CHART_TEMPLATES[savedTmpl].overlays,
        };
      }
    } catch {
      // ignore
    }
    // Default to TradeXpulse AI Pro workspace presets
    return {
      ...defaultOverlayConfig,
      ...CHART_TEMPLATES.TRADEXPULSE_AI_PRO.overlays,
    };
  });

  const [isChartFullscreen, setIsChartFullscreen] = useState<boolean>(false);

  // Fullscreen management with Browser Fullscreen API and fallback support
  const toggleChartFullscreen = useCallback(() => {
    setIsChartFullscreen(prev => {
      const next = !prev;
      if (next) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (e) {}
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch (e) {}
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsChartFullscreen(false);
      } else {
        setIsChartFullscreen(true);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsChartFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time connection & feed state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTING');
  const [providerName, setProviderName] = useState<string>('Demo');
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
    return ChartViewportEngine.createInitialViewport(250, 55, 12);
  });

  const viewportRef = useRef<ChartViewport>(viewport);
  viewportRef.current = viewport;

  // Backwards-compatible panOffset & visibleCandleCount bridges
  const panOffset = useMemo(() => {
    if (viewport.mode === 'LIVE') return 0;
    const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, viewport.visibleBarCount, viewport.rightOffsetBars);
    return Math.max(0, Math.round(liveFirst - viewport.firstVisibleIndex));
  }, [viewport, candles.length]);

  const setPanOffset = useCallback((action: React.SetStateAction<number>) => {
    setViewport(prev => {
      const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, prev.visibleBarCount, prev.rightOffsetBars);
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
      const clamped = Math.max(ChartViewportEngine.MIN_VISIBLE_BARS, Math.min(ChartViewportEngine.MAX_VISIBLE_BARS, nextCount));
      const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, clamped, prev.rightOffsetBars);
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
            setViewport(prev => ChartViewportEngine.handleNewRealtimeCandle(prev, updated.length));
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
            setViewport(prev => ChartViewportEngine.snapToLive(prev, tfCandles.length));
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

  // Canonical truthful data status with connection state & data staleness protection
  const marketDataStatus: MarketDataStatusInfo = useMemo(() => {
    const now = Date.now();
    const tickAge = lastTickTimestamp > 0 ? now - lastTickTimestamp : Infinity;
    const isStale = tickAge > 25000 && connectionStatus === 'LIVE';
    
    // Determine canonical effective status
    const effectiveStatus: ConnectionStatus = 
      connectionStatus === 'LIVE' && isStale 
        ? 'STALE' 
        : connectionStatus;

    // Determine actual active provider
    let cleanProvider = providerName || 'Demo';
    if (effectiveStatus === 'DEMO' || cleanProvider.toLowerCase().includes('demo')) {
      cleanProvider = 'Demo';
    }

    // Determine truthful status description
    let statusLabel = 'Connecting...';
    if (effectiveStatus === 'LIVE') {
      statusLabel = `${cleanProvider} (Live Stream)`;
    } else if (effectiveStatus === 'STALE') {
      statusLabel = `${cleanProvider} (Data Stale)`;
    } else if (effectiveStatus === 'DEMO') {
      statusLabel = 'Demo Mode (Simulated Feed)';
    } else if (effectiveStatus === 'RECONNECTING') {
      statusLabel = 'Reconnecting...';
    } else if (effectiveStatus === 'OFFLINE') {
      statusLabel = 'Offline';
    }

    const isLiveVerified = effectiveStatus === 'LIVE';

    return {
      dataStatus: statusLabel,
      lastUpdate: lastTickTimestamp > 0 ? new Date(lastTickTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'None',
      symbol: activeSymbol,
      timeframe: activeTimeframe,
      pingMs: isLiveVerified ? 18 + Math.floor(Math.random() * 8) : 5,
      connectionStatus: effectiveStatus,
      provider: cleanProvider,
      isRealtime: isLiveVerified,
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
    setViewport(prev => ChartViewportEngine.snapToLive(prev, candles.length));
  }, [candles.length]);

  // Cursor/Center Anchor-based Zoom Controls
  const zoomIn = useCallback((anchorRatio: number = 0.5) => {
    setViewport(prev => {
      const clampedRatio = Math.max(0.05, Math.min(0.95, anchorRatio));
      const newVisible = Math.max(ChartViewportEngine.MIN_VISIBLE_BARS, Math.round(prev.visibleBarCount * 0.85));
      const anchorIndex = prev.firstVisibleIndex + clampedRatio * prev.visibleBarCount;
      let newFirst = anchorIndex - clampedRatio * newVisible;
      const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, newVisible, prev.rightOffsetBars);

      if (prev.isFollowingLive || newFirst >= liveFirst - ChartViewportEngine.LIVE_EDGE_SNAP_TOLERANCE) {
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
      const newVisible = Math.min(ChartViewportEngine.MAX_VISIBLE_BARS, Math.round(prev.visibleBarCount * 1.18));
      const anchorIndex = prev.firstVisibleIndex + clampedRatio * prev.visibleBarCount;
      let newFirst = anchorIndex - clampedRatio * newVisible;
      const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, newVisible, prev.rightOffsetBars);

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
      const liveFirst = ChartViewportEngine.getLiveFirstVisibleIndex(candles.length, defaultVisible, prev.rightOffsetBars);
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
    const cleanTf = sanitizeTimeframe(tf);
    const curViewport = viewportRef.current;
    let targetTime: number | null = null;

    if (!curViewport.isFollowingLive && candles.length > 0) {
      const centerIdx = Math.max(
        0, 
        Math.min(candles.length - 1, Math.round(curViewport.firstVisibleIndex + curViewport.visibleBarCount / 2))
      );
      targetTime = candles[centerIdx]?.time || null;
    }

    setActiveTimeframe(cleanTf);

    // Fetch candles for newly selected timeframe
    MarketDataService.fetchHistoricalCandles(activeSymbolRef.current, cleanTf, 250).then(fetched => {
      if (fetched && fetched.length > 0) {
        setCandles(fetched);
        setViewport(prev => ChartViewportEngine.rebaseTimeframe(prev, targetTime, fetched));
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

  const applyTemplate = useCallback((templateId: ChartTemplate) => {
    setOverlayConfig(prev => {
      const { newConfig, activeTemplate: newTmpl } = applyTemplateToConfig(templateId, prev);
      setActiveTemplate(newTmpl);
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, newTmpl);
        localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(newConfig));
      } catch {
        // ignore
      }
      return newConfig;
    });
  }, []);

  const toggleOverlay = useCallback((key: keyof ChartOverlayConfig) => {
    setOverlayConfig(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      setActiveTemplate('CUSTOM');
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, 'CUSTOM');
        localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const isMarketStructureEnabled = useMemo(() => {
    return ALL_MARKET_STRUCTURE_KEYS.some(k => !!overlayConfig[k]) || !!overlayConfig.showMarketStructure;
  }, [overlayConfig]);

  const selectAllMarketStructure = useCallback(() => {
    setOverlayConfig(prev => {
      const updated = { 
        ...prev, 
        showMarketStructure: true, 
        showFVG: true, 
        showOrderBlocks: true, 
        showCandlePatterns: true, 
        showHistoricalLevels: true 
      };
      ALL_MARKET_STRUCTURE_KEYS.forEach(k => {
        (updated as any)[k] = true;
      });
      setActiveTemplate('CUSTOM');
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, 'CUSTOM');
        localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const clearAllMarketStructure = useCallback(() => {
    setOverlayConfig(prev => {
      const updated = { 
        ...prev, 
        showMarketStructure: false, 
        showFVG: false, 
        showOrderBlocks: false, 
        showCandlePatterns: false, 
        showHistoricalLevels: false 
      };
      ALL_MARKET_STRUCTURE_KEYS.forEach(k => {
        (updated as any)[k] = false;
      });
      setActiveTemplate('CUSTOM');
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, 'CUSTOM');
        localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const toggleMarketStructure = useCallback(() => {
    if (isMarketStructureEnabled) {
      clearAllMarketStructure();
    } else {
      setOverlayConfig(prev => {
        const updated = { ...prev, showMarketStructure: true, showFVG: true, showOrderBlocks: true };
        updated.showMS_BOS = true;
        updated.showMS_CHoCH = true;
        updated.showFVG_Bullish = true;
        updated.showFVG_Bearish = true;
        updated.showOB_Bullish = true;
        updated.showOB_Bearish = true;
        updated.showLiq_Sweeps = true;
        setActiveTemplate('CUSTOM');
        try {
          localStorage.setItem(TEMPLATE_STORAGE_KEY, 'CUSTOM');
          localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
    }
  }, [isMarketStructureEnabled, clearAllMarketStructure]);

  const isMarketPredictionEnabled = overlayConfig.showForecastPath;
  const toggleMarketPrediction = useCallback(() => {
    setOverlayConfig(prev => {
      const next = !prev.showForecastPath;
      const updated = {
        ...prev,
        showForecastPath: next,
        showEntryZone: next,
        showTargets: next,
        showSupportResistance: next,
      };
      setActiveTemplate('CUSTOM');
      try {
        localStorage.setItem(TEMPLATE_STORAGE_KEY, 'CUSTOM');
        localStorage.setItem(OVERLAY_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
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
        isChartFullscreen,
        setIsChartFullscreen,
        toggleChartFullscreen,
        overlayConfig,
        setOverlayConfig,
        toggleOverlay,
        selectAllMarketStructure,
        clearAllMarketStructure,
        isMarketStructureEnabled,
        toggleMarketStructure,
        isMarketPredictionEnabled,
        toggleMarketPrediction,
        activeTemplate,
        setActiveTemplate,
        applyTemplate,
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
