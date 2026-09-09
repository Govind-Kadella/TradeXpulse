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

export interface EvidenceScoring {
  bullishEvidenceScore: number;
  bearishEvidenceScore: number;
  neutralScore: number;
  confluenceMet: boolean;
  conflictWarning?: string;
  topFactors: { factor: string; direction: BiasType; weight: number }[];
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
  candleMetrics?: CandleMetrics;
  patterns?: CandlePattern[];
  structureEvents?: MarketStructureEvent[];
  structurePoints?: MarketStructurePoint[];
  fvgs?: FVGZone[];
  orderBlocks?: OrderBlockZone[];
  keyLevels?: SupportResistanceLevel[];
  multiTimeframe?: MultiTimeframeSummary;
  narrative?: NarrativeAnalysis;
  evidenceScoring?: EvidenceScoring;
  liquidityLevels?: any;
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
  showMarketStructure: boolean;
  showFVG: boolean;
  showOrderBlocks: boolean;
}

/**
 * Dedicated Chart Viewport Model
 * Professional trading chart viewport independent of growing realtime candle datasets.
 */
export interface ChartViewport {
  firstVisibleIndex: number; // floating-point bar index e.g. 125.37
  visibleBarCount: number; // number of bars spanning the plot width
  rightOffsetBars: number; // configured empty space to right of latest candle in live mode (e.g. 14 bars)
  mode: 'LIVE' | 'HISTORICAL';
  isFollowingLive: boolean;
  isDragging: boolean;
  isZooming: boolean;
  anchorIndex?: number;
  anchorPrice?: number;
}

export type ActiveView = 'dashboard' | 'marketMap' | 'execution' | 'settings';

export type OrderType = 'MARKET' | 'LIMIT' | 'STOP';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'FILLED' | 'REJECTED' | 'CANCELLED';

export interface Position {
  id: string;
  symbol: MarketSymbol;
  side: OrderSide;
  lots: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnL: number;
  realizedPnL: number;
  openTime: number;
  closeTime?: number;
  commission: number;
  slippage: number;
  status: 'OPEN' | 'CLOSED';
}

export interface Order {
  id: string;
  symbol: MarketSymbol;
  side: OrderSide;
  type: OrderType;
  lots: number;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  status: OrderStatus;
  fillPrice?: number;
  createdAt: number;
  filledAt?: number;
  cancelledAt?: number;
  rejectReason?: string;
}

export interface OrderRequest {
  symbol: MarketSymbol;
  side: OrderSide;
  type: OrderType;
  lots: number;
  price?: number;
  stopLoss?: number;
  takeProfit?: number;
  notes?: string;
}

export interface OrderResult {
  success: boolean;
  order?: Order;
  position?: Position;
  error?: string;
}

export interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  dailyRealizedPnL: number;
  initialBalance: number;
}

export interface RiskConfig {
  maxRiskPerTradePercent: number; // e.g. 1.0%
  maxDailyLossPercent: number; // e.g. 5.0%
  maxOpenPositions: number; // e.g. 3
  maxLotSize: number; // e.g. 10.0
  minLotSize: number; // e.g. 0.01
  autoExecutionEnabled: boolean; // MANDATORY: always false for live broker execution
}

export interface RiskEvaluationResult {
  approved: boolean;
  recommendedLots: number;
  riskAmount: number;
  riskPercent: number;
  stopDistance: number;
  potentialReward: number;
  riskRewardRatio: number;
  spreadOk: boolean;
  currentSpread: number;
  maxAllowedSpread: number;
  rejectionReason?: string;
  warnings: string[];
}

export interface LiquidityPool {
  id: string;
  type: 'BUY_SIDE' | 'SELL_SIDE' | 'EQH' | 'EQL' | 'PDH' | 'PDL' | 'PWH' | 'PWL' | 'SESSION_HIGH' | 'SESSION_LOW';
  price: number;
  upperPrice?: number;
  lowerPrice?: number;
  timeframe: Timeframe;
  createdAt: number;
  isSwept: boolean;
  sweptAt?: number;
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

export interface CandleMetrics {
  range: number;
  body: number;
  upperWick: number;
  lowerWick: number;
  bodyToRange: number;
  direction: 'BULLISH' | 'BEARISH' | 'DOJI';
  bullish: boolean;
  bearish: boolean;
  bodyPercentage: number;
  upperWickPercentage: number;
  lowerWickPercentage: number;
  trueRange: number;
  atr14: number;
  relativeRange: number;
  momentum: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPANSION';
}

export interface CandlePattern {
  name: string;
  type: 'SINGLE' | 'TWO_CANDLE' | 'MULTI_CANDLE';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeframe: Timeframe;
  candleIndex: number;
  timestamp: number;
  price: number;
  location: string;
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  confirmation: string;
  invalidation: string;
}

export interface MarketStructurePoint {
  index: number;
  time: number;
  price: number;
  type: 'HH' | 'HL' | 'LH' | 'LL' | 'SWING_HIGH' | 'SWING_LOW';
  isInternal: boolean;
}

export interface MarketStructureEvent {
  id: string;
  type: 'BOS' | 'CHoCH' | 'MSS' | 'LIQUIDITY_SWEEP' | 'EQH' | 'EQL' | 'DISPLACEMENT' | 'RETEST' | 'REJECTION' | 'ABSORPTION' | 'INDUCEMENT';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  price: number;
  timestamp: number;
  candleIndex: number;
  timeframe: Timeframe;
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  confirmation: string;
  invalidation: string;
  isInternal: boolean;
}

export interface FVGZone {
  id: string;
  type: 'BULLISH_FVG' | 'BEARISH_FVG';
  direction: 'BULLISH' | 'BEARISH';
  upperPrice: number;
  lowerPrice: number;
  midPrice: number;
  candleIndex: number;
  createdAt: number;
  timeframe: Timeframe;
  status: 'UNTOUCHED' | 'PARTIALLY_FILLED' | 'FULLY_FILLED' | 'REJECTED' | 'INVALIDATED';
  fillPercentage: number;
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface OrderBlockZone {
  id: string;
  type: 'ORDER_BLOCK_BULLISH' | 'ORDER_BLOCK_BEARISH' | 'DEMAND_ZONE' | 'SUPPLY_ZONE';
  priceHigh: number;
  priceLow: number;
  timeframe: Timeframe;
  direction: 'BULLISH' | 'BEARISH';
  strength: 'HIGH' | 'MEDIUM' | 'LOW';
  createdAt: number;
  candleIndex: number;
  status: 'UNMITIGATED' | 'TESTED' | 'BREACHED' | 'INVALIDATED';
  contextDetails: string;
}

export interface SupportResistanceLevel {
  price: number;
  type: 'SUPPORT' | 'RESISTANCE' | 'EQUILIBRIUM';
  strength: 'MAJOR' | 'INTERMEDIATE' | 'MINOR';
  touches: number;
  source: string;
}

export interface MultiTimeframeSummary {
  h4: { trend: string; bias: BiasType; keyLevel: number; structure: string };
  h1: { trend: string; bias: BiasType; keyLevel: number; orderFlow: string };
  m15: { trend: string; bias: BiasType; recentEvent: string; activeFvg?: string };
  m5: { trend: string; bias: BiasType; immediateMomentum: string; triggerPattern?: string };
  alignment: 'STRONG_ALIGNMENT' | 'PARTIAL_ALIGNMENT' | 'CONFLICT' | 'COMPRESSION';
  alignmentDescription: string;
}

export interface NarrativeAnalysis {
  events: string[];
  summary: string;
}

export interface MarketMapItem {
  symbol: MarketSymbol;
  name: string;
  currentPrice: number;
  direction: BiasType;
  strength: number; // 0-100
  trend: string;
  structure: string;
  m5Setup: string;
  keySupport: number;
  keyResistance: number;
  expectedMovement: string;
  signalStatus: 'ACTIVE' | 'STANDBY';
  confidence: number;
  classification: 'TRENDING' | 'RANGING' | 'BEST_OPPORTUNITY' | 'AVOID';
  digits: number;
}

