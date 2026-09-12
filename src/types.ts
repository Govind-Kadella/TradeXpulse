export type MarketSymbol = 'XAUUSD' | 'EURJPY' | 'EURUSD' | 'GBPUSD';

export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export const VALID_TIMEFRAMES: readonly Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'] as const;

export function sanitizeTimeframe(tf: any): Timeframe {
  if (tf && VALID_TIMEFRAMES.includes(tf as Timeframe)) {
    return tf as Timeframe;
  }
  return 'M5';
}

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

export type CandlePatternKey =
  | 'DOJI'
  | 'HAMMER'
  | 'INVERTED_HAMMER'
  | 'SHOOTING_STAR'
  | 'HANGING_MAN'
  | 'PIN_BAR'
  | 'MARUBOZU'
  | 'SPINNING_TOP'
  | 'BULLISH_ENGULFING'
  | 'BEARISH_ENGULFING'
  | 'BULLISH_HARAMI'
  | 'BEARISH_HARAMI'
  | 'PIERCING_LINE'
  | 'DARK_CLOUD_COVER'
  | 'TWEEZER_TOP'
  | 'TWEEZER_BOTTOM'
  | 'MORNING_STAR'
  | 'EVENING_STAR'
  | 'THREE_WHITE_SOLDIERS'
  | 'THREE_BLACK_CROWS'
  | 'THREE_INSIDE_UP'
  | 'THREE_INSIDE_DOWN'
  | 'THREE_OUTSIDE_UP'
  | 'THREE_OUTSIDE_DOWN';

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
  showCandlePatterns?: boolean;

  // Single-Candle Price Action
  showPatternDoji: boolean;
  showPatternHammer: boolean;
  showPatternInvertedHammer: boolean;
  showPatternShootingStar: boolean;
  showPatternHangingMan: boolean;
  showPatternPinBar: boolean;
  showPatternMarubozu: boolean;
  showPatternSpinningTop: boolean;

  // Two-Candle Patterns
  showPatternBullishEngulfing: boolean;
  showPatternBearishEngulfing: boolean;
  showPatternBullishHarami: boolean;
  showPatternBearishHarami: boolean;
  showPatternPiercingLine: boolean;
  showPatternDarkCloudCover: boolean;
  showPatternTweezerTop: boolean;
  showPatternTweezerBottom: boolean;

  // Multi-Candle Patterns
  showPatternMorningStar: boolean;
  showPatternEveningStar: boolean;
  showPatternThreeWhiteSoldiers: boolean;
  showPatternThreeBlackCrows: boolean;
  showPatternThreeInsideUp: boolean;
  showPatternThreeInsideDown: boolean;
  showPatternThreeOutsideUp: boolean;
  showPatternThreeOutsideDown: boolean;

  // Market Structure
  showMS_BOS: boolean;
  showMS_CHoCH: boolean;
  showMS_CoC: boolean;
  showMS_Swings: boolean;
  showMS_HH_HL: boolean;
  showMS_LH_LL: boolean;

  // Fair Value Gaps (FVG)
  showFVG_Bullish: boolean;
  showFVG_Bearish: boolean;
  showFVG_Mitigated: boolean;

  // Order Blocks (OB)
  showOB_Bullish: boolean;
  showOB_Bearish: boolean;
  showOB_Mitigated: boolean;

  // Liquidity
  showLiq_Sweeps: boolean;
  showLiq_EQH: boolean;
  showLiq_EQL: boolean;

  // Support / Resistance
  showSR_Support: boolean;
  showSR_Resistance: boolean;
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

export type ActiveView = 'dashboard' | 'marketMap' | 'aiSignals' | 'execution' | 'settings' | 'strategyBuilder' | 'backtest' | 'newsCalendar' | 'economicData';

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
  patternKey?: CandlePatternKey;
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
  diagnostic?: string;
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
  type: 'BOS' | 'CHoCH' | 'COC' | 'MSS' | 'LIQUIDITY_SWEEP' | 'EQH' | 'EQL' | 'DISPLACEMENT' | 'RETEST' | 'REJECTION' | 'ABSORPTION' | 'INDUCEMENT';
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  price: number;
  timestamp: number;
  candleIndex: number;
  originIndex?: number;
  originPrice?: number;
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
  mitigatedIndex?: number;
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
  mitigatedIndex?: number;
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

export type ChartTemplate =
  | 'TRADEXPULSE_AI_PRO'
  | 'PURE_PRICE_ACTION'
  | 'INSTITUTIONAL_LEVELS'
  | 'CUSTOM';

export interface ChartTemplateDefinition {
  id: ChartTemplate;
  name: string;
  badge: string;
  description: string;
  overlays: Partial<ChartOverlayConfig>;
}

export type AssetCategory = 'All Assets' | 'Forex' | 'Commodities' | 'Indices' | 'Crypto' | 'Stocks';

export type HeatmapMode = 'PRICE_CHANGE' | 'AI_SIGNAL' | 'VOLATILITY' | 'CUSTOM';

export type ViewLayoutMode = 'GRID' | 'LIST';

export interface ScannerInstrument {
  symbol: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto' | 'Stocks';
  price: number;
  change24h: number;
  changePercent24h: number;
  direction: BiasType;
  confidence: number;
  trendH1: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trendH4: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  atr14: number;
  opportunityScore: number;
  setupSummary: string;
  support: number;
  resistance: number;
  digits: number;
  sparkline: number[];
  lastUpdate: string;
  isCoreLive: boolean;
}

export interface SentimentMetrics {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  total: number;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
}

export interface FearGreedIndexData {
  score: number;
  zone: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  breadthScore: number;
  momentumScore: number;
  volatilityScore: number;
  confluenceScore: number;
  lastUpdated: string;
}

// ============================================================================
// PAGE 3: AI SIGNALS ARCHITECTURE
// ============================================================================

export type SignalDirection = 'BUY' | 'SELL' | 'NO_TRADE';

export type SignalStatus =
  | 'ACTIVE'
  | 'VALID'
  | 'EXPIRED'
  | 'INVALIDATED'
  | 'TARGET_HIT'
  | 'STOP_HIT'
  | 'CLOSED';

export type SignalOutcomeResult =
  | 'WIN'
  | 'LOSS'
  | 'BREAKEVEN'
  | 'EXPIRED'
  | 'INVALIDATED'
  | 'OPEN';

export interface SignalEvidence {
  higherTimeframeTrend?: string;
  marketStructure?: string;
  momentum?: string;
  volatility?: string;
  volume?: string;
  sentiment?: string;
  supportResistance?: string;
  fvg?: string;
  orderBlock?: string;
  liquidity?: string;
  newsImpact?: string;
  bullishFactors: string[];
  bearishFactors: string[];
}

export interface SignalOutcome {
  result: SignalOutcomeResult;
  exitPrice?: number;
  pnlPoints?: number;
  pnlPercent?: number;
  closedAt?: number;
  durationMs?: number;
  durationText?: string;
  mfe?: number; // Maximum Favorable Excursion
  mae?: number; // Maximum Adverse Excursion
}

export interface AISignal {
  id: string;
  symbol: string; // e.g. 'XAUUSD'
  displayName: string; // 'Gold Spot / US Dollar'
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto' | 'Stocks';
  timeframe: Timeframe;
  direction: SignalDirection;
  confidence: number; // 0-100 model confidence (NOT certainty)
  qualityScore: number; // 0-100 deterministic Signal Quality Score
  currentPrice: number;
  entry: number;
  entryZone: {
    min: number;
    max: number;
    text: string;
  };
  stopLoss: number;
  takeProfits: number[];
  riskReward: string; // e.g. "1:3.1"
  rrRatio: number; // e.g. 3.1
  generatedAt: number;
  validUntil: number;
  lastUpdatedAt: number;
  status: SignalStatus;
  evidence: SignalEvidence;
  reasoning: {
    trend: string;
    keySupport: number;
    keyResistance: number;
    marketStructure: string;
    volume: string;
    sentiment: string;
    outlook: string;
  };
  invalidation: string;
  outcome?: SignalOutcome;
  isFavorite?: boolean;
}

export interface SignalKpis {
  activeSignalsCount: number;
  winRate30d: number | null; // e.g. 72% or null if N/A
  avgRiskReward: string; // e.g. "1:2.8" or "N/A"
  totalSignals30d: number;
  avgAiConfidence: number; // e.g. 87%
  marketBias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
}

export interface SignalAlertConfig {
  buySignals: boolean;
  sellSignals: boolean;
  highConfidenceOnly: boolean;
  minConfidence: number;
  symbols: string[];
  timeframes: Timeframe[];
  inAppNotifications: boolean;
  soundAlerts: boolean;
}

export interface MarketNewsItem {
  id: string;
  time: string;
  timestamp: number;
  headline: string;
  summary: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  relatedSymbols: string[];
  source: string;
}

export interface SymbolPerformanceStat {
  symbol: string;
  signals: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgRR: string;
  pnlPoints: number;
}

export interface TimeframePerformanceStat {
  timeframe: Timeframe;
  signals: number;
  wins: number;
  losses: number;
  winRate: number | null;
  avgConfidence: number;
  avgRR: string;
}

// ============================================================================
// PAGE 4: STRATEGY BUILDER & BACKTEST ARCHITECTURE
// ============================================================================

export type StrategyDirection = 'LONG_ONLY' | 'SHORT_ONLY' | 'BOTH';

export type ConditionSourceType = 'INDICATOR' | 'PRICE' | 'PRICE_ACTION' | 'MARKET_STRUCTURE';

export type IndicatorKey =
  | 'SMA'
  | 'EMA'
  | 'WMA'
  | 'RSI'
  | 'MACD'
  | 'ATR'
  | 'BOLLINGER'
  | 'STOCHASTIC'
  | 'ADX'
  | 'VWAP'
  | 'VOLUME';

export type PriceKey =
  | 'OPEN'
  | 'HIGH'
  | 'LOW'
  | 'CLOSE'
  | 'PREVIOUS_CLOSE'
  | 'HIGH_LOW_RANGE';

export type MarketStructureConditionKey =
  | 'BOS'
  | 'CHOCH'
  | 'FVG'
  | 'ORDER_BLOCK'
  | 'LIQUIDITY_SWEEP'
  | 'EQH'
  | 'EQL'
  | 'HH'
  | 'HL'
  | 'LH'
  | 'LL';

export type ConditionOperator =
  | '>'
  | '<'
  | '>='
  | '<='
  | '='
  | '!='
  | 'crosses_above'
  | 'crosses_below'
  | 'inside'
  | 'outside'
  | 'increases'
  | 'decreases';

export type ConditionTargetType =
  | 'VALUE'
  | 'INDICATOR'
  | 'PRICE'
  | 'PATTERN'
  | 'STRUCTURE';

export interface StrategyCondition {
  id: string;
  sourceType: ConditionSourceType;
  indicator?: IndicatorKey;
  indicatorPeriod?: number; // e.g. 50, 200, 14
  indicatorSubKey?: 'LINE' | 'SIGNAL' | 'HISTOGRAM' | 'UPPER' | 'LOWER' | 'MIDDLE' | 'K' | 'D';
  priceKey?: PriceKey;
  patternKey?: CandlePatternKey;
  structureKey?: MarketStructureConditionKey;
  structureDirection?: 'BULLISH' | 'BEARISH';
  operator: ConditionOperator;
  targetType: ConditionTargetType;
  targetValue?: number; // e.g. 50, 1.5
  targetIndicator?: IndicatorKey;
  targetIndicatorPeriod?: number; // e.g. 200
  targetIndicatorSubKey?: string;
  targetPriceKey?: PriceKey;
  targetPattern?: CandlePatternKey;
  targetStructure?: string;
  customLabel?: string;
}

export type ConditionGroupLogic = 'ALL' | 'ANY';

export type ExitType =
  | 'TAKE_PROFIT'
  | 'STOP_LOSS'
  | 'TRAILING_STOP'
  | 'INDICATOR_EXIT'
  | 'PRICE_ACTION_EXIT'
  | 'MARKET_STRUCTURE_EXIT'
  | 'TIME_EXIT';

export type ExitMode =
  | 'R_MULTIPLE'
  | 'ATR_MULTIPLE'
  | 'PERCENTAGE'
  | 'FIXED_PRICE'
  | 'POINTS';

export interface StrategyExit {
  id: string;
  type: ExitType;
  mode: ExitMode;
  value: number; // e.g. 2.0 (for 2R), 1.0 (for 1R), 1.5 (for 1.5x ATR)
  condition?: StrategyCondition; // For indicator / PA / Structure exits
  timeBars?: number; // For time-based exit
}

export type SessionFilterType = 'ALL' | 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'LONDON_NEW_YORK' | 'CUSTOM';

export interface StrategyFilter {
  id: string;
  type:
    | 'SESSION'
    | 'NEWS'
    | 'MIN_ATR'
    | 'MAX_ATR'
    | 'MAX_SPREAD'
    | 'MAX_OPEN_TRADES'
    | 'DAY_OF_WEEK'
    | 'VOLATILITY'
    | 'HTF_TREND';
  session?: SessionFilterType;
  customSessionStartUtc?: number; // 0-23
  customSessionEndUtc?: number; // 0-23
  newsBlackoutMinutes?: number; // e.g. 30 minutes before/after
  minAtrValue?: number;
  maxAtrValue?: number;
  maxSpreadValue?: number;
  maxOpenTrades?: number;
  allowedDays?: number[]; // [1, 2, 3, 4, 5] Mon-Fri
  htfTimeframe?: 'H1' | 'H4' | 'D1';
  enabled: boolean;
}

export interface AdvancedStrategyOptions {
  useAiMarketBiasFilter: boolean;
  aiBiasMode: 'STRICT_DIRECTION' | 'ALLOW_IF_NOT_OPPOSING' | 'BLOCK_NO_TRADE';
  enableTrailingStop: boolean;
  trailingStopDistanceR: number; // e.g. 1.0R
  enableBreakEven: boolean;
  breakEvenTriggerR: number; // e.g. 1.0R
  breakEvenOffsetR: number; // e.g. 0.0R
  customRiskPerTradePercent: number; // e.g. 1.0%
  intrabarPolicy: 'CONSERVATIVE_SL_FIRST' | 'AMBIGUOUS';
  executionModel: 'NEXT_BAR_OPEN' | 'BAR_CLOSE';
}

export interface RiskManagementSettings {
  accountEquity: number; // default 10,000
  riskPerTradePercent: number; // e.g. 1.0%
  maxDailyLossPercent: number; // e.g. 5.0%
  maxOpenTrades: number; // e.g. 1
  defaultStopLossR: number; // e.g. 1.0
  defaultTakeProfitR: number; // e.g. 2.0
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description?: string;
  symbol: MarketSymbol;
  timeframe: Timeframe;
  direction: StrategyDirection;
  conditionGroupLogic: ConditionGroupLogic;
  entryConditions: StrategyCondition[];
  exitConditions: StrategyExit[];
  filters: StrategyFilter[];
  advancedOptions: AdvancedStrategyOptions;
  riskManagement: RiskManagementSettings;
  createdAt: number;
  updatedAt: number;
  version: number;
  isTemplate?: boolean;
}

export type CommissionType = 'NONE' | 'PER_TRADE' | 'PERCENTAGE' | 'PER_UNIT';

export interface BacktestConfig {
  startDate?: number;
  endDate?: number;
  initialCapital: number;
  commissionType: CommissionType;
  commissionValue: number;
  slippagePips: number;
  assumedSpreadPips: number;
  useHistoricalSpread: boolean;
  intrabarPolicy: 'CONSERVATIVE_SL_FIRST' | 'AMBIGUOUS';
  executionModel: 'NEXT_BAR_OPEN' | 'BAR_CLOSE';
}

export type BacktestTradeOutcome = 'WIN' | 'LOSS' | 'BREAKEVEN';

export interface BacktestTrade {
  id: string;
  tradeNumber: number;
  symbol: MarketSymbol;
  direction: 'BUY' | 'SELL';
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit: number;
  lots: number;
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  outcome: BacktestTradeOutcome;
  exitReason: 'TAKE_PROFIT' | 'STOP_LOSS' | 'TRAILING_STOP' | 'INDICATOR_EXIT' | 'PRICE_ACTION_EXIT' | 'MARKET_STRUCTURE_EXIT' | 'TIME_EXIT' | 'SESSION_CLOSE';
  entryReason: string;
  durationMinutes: number;
  mfe: number; // Maximum Favorable Excursion in price points
  mae: number; // Maximum Adverse Excursion in price points
  commission: number;
  slippage: number;
  spread: number;
  entryConditionsMet: string[];
}

export interface MonthlyReturn {
  year: number;
  month: number; // 0 = Jan, 11 = Dec
  pnl: number;
  returnPercent: number;
  trades: number;
  winRate: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakevenTrades: number;
  winRate: number; // percentage 0-100
  profitFactor: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  totalReturnPercent: number;
  annualizedReturnPercent?: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio?: number;
  avgRR: string;
  averageWin: number;
  averageLoss: number;
  bestTrade: number;
  worstTrade: number;
  winningStreak: number;
  losingStreak: number;
  avgDurationMinutes: number;
  expectancy: number;
}

export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number;
  tradeIndex: number;
}

export interface BacktestAssumptions {
  dataSource: string;
  timeframe: Timeframe;
  spread: number;
  spreadType: 'HISTORICAL' | 'ASSUMED';
  commission: number;
  commissionType: string;
  slippagePips: number;
  executionModel: string;
  intrabarPolicy: string;
  startingCapital: number;
  riskPerTrade: number;
  totalCandlesEvaluated: number;
  dateRange: { start: string; end: string };
}

export interface BlockedSignalRecord {
  time: number;
  timeFormatted: string;
  price: number;
  direction: 'BUY' | 'SELL';
  reason: string;
}

export interface BacktestResult {
  strategyId: string;
  strategyName: string;
  symbol: MarketSymbol;
  timeframe: Timeframe;
  executedAt: number;
  metrics: BacktestMetrics;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  monthlyReturns: MonthlyReturn[];
  assumptions: BacktestAssumptions;
  blockedSignalsLog: BlockedSignalRecord[];
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  contradictions: string[];
}

export interface StrategyTemplateItem {
  id: string;
  title: string;
  category: 'Trend Following' | 'Mean Reversion' | 'Breakout' | 'Momentum' | 'Price Action' | 'Market Structure' | 'AI-Assisted';
  description: string;
  tags: string[];
  complexity: 'Beginner' | 'Intermediate' | 'Advanced' | 'Institutional';
  targetSymbol: MarketSymbol;
  targetTimeframe: Timeframe;
  strategy: StrategyDefinition;
}

// ============================================================================
// NEWS & ECONOMIC CALENDAR TYPES
// ============================================================================

export type NewsCategory = 
  | 'FOREX' 
  | 'COMMODITIES' 
  | 'ECONOMY' 
  | 'MARKETS' 
  | 'CENTRAL BANKS' 
  | 'CRYPTO' 
  | 'INDICES' 
  | 'STOCKS';

export type ImpactLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type SentimentType = 'BULLISH' | 'BEARISH' | 'NEUTRAL';

export interface MarketNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceLogo?: string;
  url?: string;
  publishedAt: string; // ISO string or relative e.g. "12m ago"
  timestamp: number; // Unix timestamp in ms
  category: NewsCategory;
  currencies: string[]; // e.g. ['USD', 'EUR']
  instruments: MarketSymbol[]; // e.g. ['XAUUSD', 'EURUSD']
  impact: ImpactLevel;
  sentiment: SentimentType;
  imageUrl?: string;
  content?: string;
  readTimeMinutes?: number;
}

export type EventCategory = 
  | 'CENTRAL_BANK' 
  | 'INFLATION' 
  | 'EMPLOYMENT' 
  | 'GDP' 
  | 'TRADE' 
  | 'HOUSING' 
  | 'CONSUMER' 
  | 'MANUFACTURING'
  | 'SERVICES'
  | 'OTHER';

export interface EconomicEvent {
  id: string;
  date: string; // YYYY-MM-DD
  timeUtc: string; // HH:mm format, canonical UTC
  timestamp: number; // Exact Unix timestamp in ms for live countdown
  currency: string; // 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'NZD' | 'CNY'
  country: string;
  flag: string;
  impact: ImpactLevel;
  event: string;
  actual: string | null; // e.g. "680K" or null (rendered as '--')
  forecast: string | null;
  previous: string | null;
  surprise?: number | null; // actual minus forecast where applicable
  unit?: string;
  category: EventCategory;
  description: string;
  historicalImportance?: string;
  expectedVolatility: 'HIGH' | 'MODERATE' | 'LOW';
  marketImpactScore: number; // 0-100 deterministic classification
  affectedCurrencies: string[];
  affectedInstruments: MarketSymbol[];
  alertType?: 'BELL' | 'DOCUMENT';
  historicalData?: HistoricalEconomicPoint[];
  aiAnalysis?: {
    fact: string;
    interpretation: string;
    bullishScenario: string;
    bearishScenario: string;
    neutralScenario: string;
  };
}

export interface EventAlert {
  id: string;
  eventId: string;
  eventName: string;
  currency: string;
  impact: ImpactLevel;
  eventTime: number; // Unix ms
  leadTimeMinutes: number; // 5, 15, 30, 60, 1440
  createdAt: number;
  soundEnabled: boolean;
  notified?: boolean;
}

export type NewsSortOption = 'NEWEST' | 'HIGHEST_IMPACT' | 'MOST_RELEVANT';

export interface NewsFilterOptions {
  category?: NewsCategory | 'ALL';
  currencies?: string[]; // Selected currencies
  impact?: ImpactLevel | 'ALL';
  sentiment?: SentimentType | 'ALL';
  searchQuery?: string;
  sort?: NewsSortOption;
}

export interface CalendarFilterOptions {
  currencies?: string[]; // Empty means all
  impact?: ImpactLevel | 'ALL';
  eventType?: EventCategory | 'ALL';
  searchQuery?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface CurrencyItem {
  code: string;
  name: string;
  flag: string;
  country: string;
}

export interface AiMarketInsight {
  currency: string;
  symbol?: MarketSymbol;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number; // 0-100
  catalystSummary: string;
  keyDrivers: string[];
  upcomingRisks: string[];
  affectedInstruments: MarketSymbol[];
}

export interface HistoricalEconomicPoint {
  date: string; // e.g. "Jan", "Feb" or "2026-01"
  value: number | null;
  forecast?: number | null;
  previous?: number | null;
}

export interface CentralBankInfo {
  id: string;
  name: string;
  shortName: string;
  country: string;
  currency: string;
  flag: string;
  currentRate: number;
  previousRate: number;
  lastDecision: string;
  lastDecisionDate: string;
  nextMeeting: string;
  policyStance: 'HAWKISH' | 'DOVISH' | 'NEUTRAL' | 'DATA_DEPENDENT';
  rateHistory: { date: string; rate: number }[];
  commentary: string;
  aiAnalysis: {
    fact: string;
    interpretation: string;
    bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  };
}

export interface KeyIndicator {
  id: string;
  name: string;
  category: 'INFLATION' | 'EMPLOYMENT' | 'GROWTH' | 'CONSUMER' | 'BUSINESS' | 'MANUFACTURING' | 'HOUSING' | 'TRADE';
  country: string;
  currency: string;
  flag: string;
  latest: string;
  previous: string;
  forecast: string;
  releaseDate: string;
  impact: ImpactLevel;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface InterestRateItem {
  id: string;
  country: string;
  flag: string;
  currency: string;
  centralBank: string;
  currentRate: number;
  previousRate: number;
  lastChange: string;
  nextDecision: string;
  direction: 'HIKE' | 'CUT' | 'HOLD';
}

export interface GdpInflationItem {
  id: string;
  country: string;
  flag: string;
  currency: string;
  gdpGrowthYoY: number;
  gdpGrowthQoQ: number;
  cpiYoY: number;
  coreCpiYoY: number;
  pceYoY: number;
  corePceYoY: number;
  ppiYoY: number;
  lastUpdated: string;
}

export interface MarketHolidayItem {
  id: string;
  date: string;
  country: string;
  flag: string;
  market: string;
  holiday: string;
  affectedInstruments: string;
  status: 'CLOSED' | 'EARLY_CLOSE' | 'BANKS_CLOSED_FX_OPEN' | 'NORMAL';
}

export interface NewsSettingsConfig {
  provider: 'REFINITIV_LIVE' | 'FINNHUB' | 'ALPHA_VANTAGE' | 'SIMULATED';
  defaultTimezone: 'UTC' | 'EST' | 'GMT' | 'CET' | 'JST';
  autoRefreshIntervalSeconds: number; // 0 = manual, 30, 60, 300
  defaultAlertLeadMinutes: number; // 15
  soundAlertsEnabled: boolean;
  highImpactAlertsOnly: boolean;
  activeCurrencies: string[];
}




