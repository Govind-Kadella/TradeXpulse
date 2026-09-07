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
  HistoricalStructureInfo,
  ConnectionStatus,
  PriceTick
} from '../types';
import { MarketDataService, MARKET_META } from '../services/marketDataService';
import { AnalysisEngine } from '../services/analysisEngine';
import { RealtimeMarketClient } from '../services/realtimeMarketClient';

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

  // Real-time metadata
  connectionStatus: ConnectionStatus;
  m5CountdownText: string;
  isRealtime: boolean;

  // Chart Interactive Navigation (Panning, Zooming, Return to Live)
  panOffset: number; // 0 = at live latest candle; > 0 = scrolled back in time
  setPanOffset: React.Dispatch<React.SetStateAction<number>>;
  visibleCandleCount: number;
  setVisibleCandleCount: React.Dispatch<React.SetStateAction<number>>;
  returnToLive: () => void;
  isHistoricalView: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  
  // Chart Display Controls
  overlayConfig: ChartOverlayConfig;
  setOverlayConfig: React.Dispatch<React.SetStateAction<ChartOverlayConfig>>;
  toggleOverlay: (key: keyof ChartOverlayConfig) => void;
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

  // Historical chart navigation state
  const [panOffset, setPanOffset] = useState<number>(0); // 0 means live view at current price
  const [visibleCandleCount, setVisibleCandleCount] = useState<number>(55); // Default zoom level

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
          return updated.slice(-280);
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
    return AnalysisEngine.generatePrediction('XAUUSD', 2357.89, 'BULLISH', candles);
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

      const updated = AnalysisEngine.generatePrediction(activeSymbol, currentPrice, activeBias, candles);
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

  // Return to live latest candle
  const returnToLive = useCallback(() => {
    setPanOffset(0);
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setVisibleCandleCount(prev => Math.max(20, prev - 8));
  }, []);

  const zoomOut = useCallback(() => {
    setVisibleCandleCount(prev => Math.min(120, prev + 8));
  }, []);

  const resetView = useCallback(() => {
    setPanOffset(0);
    setVisibleCandleCount(55);
  }, []);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setActiveTimeframe(tf);
    setPanOffset(0);
  }, []);

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

  const handleSymbolChange = useCallback((sym: MarketSymbol) => {
    setActiveSymbol(sym);
    setPanOffset(0);
    const biasMap: Record<MarketSymbol, BiasType> = {
      XAUUSD: 'BULLISH',
      EURJPY: 'BEARISH',
      EURUSD: 'BULLISH',
      GBPUSD: 'NO TRADE'
    };
    setActiveBias(biasMap[sym]);
  }, []);

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
        connectionStatus,
        m5CountdownText,
        isRealtime,
        panOffset,
        setPanOffset,
        visibleCandleCount,
        setVisibleCandleCount,
        returnToLive,
        isHistoricalView: panOffset > 0,
        zoomIn,
        zoomOut,
        resetView,
        overlayConfig,
        setOverlayConfig,
        toggleOverlay
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
