export type MarketSymbol = 'XAUUSD' | 'EURJPY' | 'EURUSD' | 'GBPUSD';

export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export type BiasType = 'BULLISH' | 'BEARISH' | 'NO TRADE';

export type LimitType = 'BUY LIMIT' | 'SELL LIMIT' | 'WAIT';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isForecast?: boolean;
}

export interface PredictionReasoning {
  h4Context: string;
  h1Trend: string;
  m15Structure: string;
  m5Momentum: string;
  candlePattern: string;
  candleSequence: string;
  supportResistance: string;
  volatility: string;
}

export interface ProbabilityBreakdown {
  bullish: number;
  bearish: number;
  neutral: number;
}

export interface Prediction {
  symbol: MarketSymbol;
  currentPrice: number;
  direction: BiasType;
  confidence: number; // e.g. 84
  probabilityBreakdown: ProbabilityBreakdown;
  expectedMovement: string; // e.g. "+180 to +260 points"
  entryZone: {
    min: number;
    max: number;
    text: string;
  };
  orderType: LimitType;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  riskReward: string; // e.g. "1 : 2.4"
  support: number;
  resistance: number;
  marketCondition: string;
  primaryScenario: string;
  alternativeScenario: string;
  invalidation: string;
  reasoning: PredictionReasoning;
  validity: string;
  noTradeReason?: string;
  waitingCondition?: string;
  forecastPath: { xStep: number; price: number; label?: string }[];
  generatedAt: string;
}

// Backwards-compatible alias for existing components
export type AnalyticalLevels = Prediction;
export type AiAnalysisReport = Prediction;

export interface MarketOverview {
  symbol: MarketSymbol;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  spread: number;
  session: string;
  volatility: string;
  atr14: number;
  digits: number;
  pointValue: number;
}

export interface TimeframeTrendInfo {
  timeframe: 'H4' | 'H1' | 'M15' | 'M5';
  direction: 'Bullish' | 'Bearish' | 'Neutral';
  strength: number; // percentage 0-100
  structure: string;
}

export interface AiPredictionSummary {
  direction: BiasType;
  confidence: number;
  probabilityBreakdown: ProbabilityBreakdown;
  expectedMovement: string;
  marketCondition: string;
}

export interface HistoricalStructureInfo {
  swingHighs: { time: number; price: number }[];
  swingLows: { time: number; price: number }[];
  lastBOS?: { type: 'BULLISH' | 'BEARISH'; price: number; label: string };
  atr14: number;
  averageVolume: number;
}

export type ConnectionStatus = 'LIVE' | 'CONNECTING' | 'RECONNECTING' | 'STALE' | 'OFFLINE' | 'DEMO';

export interface SymbolMetadata {
  symbol: MarketSymbol;
  displayName: string;
  name: string;
  providerSymbol: string; // e.g. 'XAU/USD'
  marketType: 'SPOT' | 'FUTURES' | 'FOREX';
  pricePrecision: number;
  tickSize: number;
  pointSize: number;
  pipMultiplier: number;
  unit: 'points' | 'pips';
  defaultSpread: number;
}

export interface LiveDiagnostics {
  provider: string;
  symbol: string;
  providerSymbol: string;
  connection: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'RECONNECTING';
  lastTickTimestamp: number;
  lastTickFormatted: string;
  lastPrice: number;
  lastCandleTimestamp: number;
  lastCandleFormatted: string;
  ticksReceived: number;
  historicalCandlesCount: number;
  dataAgeMs: number;
  isRealtime: boolean;
  status: ConnectionStatus;
  statusDetails?: string;
}

export interface MultiTimeframeCandles {
  M1: Candle[];
  M5: Candle[];
  M15: Candle[];
  H1: Candle[];
  H4: Candle[];
}

export interface PriceTick {
  symbol: MarketSymbol;
  price: number;
  timestamp: number;
  bid?: number;
  ask?: number;
  volume?: number;
}

export interface MarketDataStatusInfo {
  dataStatus: string;
  lastUpdate: string;
  symbol: MarketSymbol;
  timeframe: Timeframe;
  pingMs: number;
  connectionStatus: ConnectionStatus;
  provider: string; // e.g. 'Twelve Data'
  isRealtime: boolean;
  lastTickTime: number;
  m5SecondsRemaining: number;
  m5CountdownText: string;
  isStale?: boolean;
}

export interface ChartOverlayConfig {
  showForecastPath: boolean;
  showEntryZone: boolean;
  showTargets: boolean; // SL, TP1, TP2, TP3
  showSupportResistance: boolean;
  showVolume: boolean;
  showEMAs: boolean;
  showCrosshair: boolean;
  showHistoricalLevels: boolean;
}

export type ActiveView = 'dashboard' | 'marketMap' | 'settings';

