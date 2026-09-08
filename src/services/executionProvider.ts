import { 
  MarketSymbol, 
  OrderSide, 
  OrderType, 
  OrderStatus, 
  Position, 
  Order, 
  OrderRequest, 
  OrderResult, 
  AccountInfo, 
  RiskConfig, 
  RiskEvaluationResult,
  SymbolMetadata 
} from '../types';
import { SYMBOL_METADATA } from '../../server/marketDataProvider';

export interface ExecutionProvider {
  readonly name: string;
  readonly isLiveBroker: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getAccount(): AccountInfo;
  getPositions(): Position[];
  getOrders(): Order[];
  placeOrder(req: OrderRequest): Promise<OrderResult>;
  modifyOrder(orderId: string, updates: Partial<OrderRequest>): Promise<boolean>;
  cancelOrder(orderId: string): Promise<boolean>;
  closePosition(positionId: string): Promise<boolean>;
  onAccountChange(cb: (acc: AccountInfo) => void): () => void;
  onPositionsChange(cb: (pos: Position[]) => void): () => void;
  onOrdersChange(cb: (orders: Order[]) => void): () => void;
}

/**
 * Institutional Risk Engine
 * Enforces pre-trade risk validation:
 * - Maximum risk per trade (default 1.0%)
 * - Daily loss limit check
 * - Margin requirements and max exposure
 * - Spread widening safety gate
 * - Maximum concurrent positions
 * - Dynamic lot size calculation based on invalidation stop distance
 */
export class RiskEngine {
  private config: RiskConfig;

  constructor(customConfig?: Partial<RiskConfig>) {
    this.config = {
      maxRiskPerTradePercent: 1.0,
      maxDailyLossPercent: 5.0,
      maxOpenPositions: 4,
      maxLotSize: 10.0,
      minLotSize: 0.01,
      autoExecutionEnabled: false, // Strictly false: never auto-execute
      ...customConfig
    };
  }

  public getConfig(): RiskConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<RiskConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      autoExecutionEnabled: false // Safety enforcement: cannot enable automated real execution
    };
  }

  /**
   * Pre-trade validation and position sizing calculation
   */
  public evaluateOrder(
    account: AccountInfo,
    request: OrderRequest,
    currentPrice: number,
    currentSpread: number,
    openPositionsCount: number
  ): RiskEvaluationResult {
    const warnings: string[] = [];
    const meta: SymbolMetadata = SYMBOL_METADATA[request.symbol] || {
      symbol: request.symbol,
      displayName: request.symbol,
      name: request.symbol,
      providerSymbol: request.symbol,
      marketType: 'SPOT',
      pricePrecision: 2,
      tickSize: 0.01,
      pointSize: 0.1,
      pipMultiplier: 10,
      unit: 'points',
      defaultSpread: 0.2
    };

    const maxAllowedSpread = meta.defaultSpread * 3.5;
    const spreadOk = currentSpread <= maxAllowedSpread;

    if (!spreadOk) {
      warnings.push(`Current spread (${currentSpread.toFixed(2)}) is unusually high (> 3.5x normal). Risk of excessive slippage.`);
    }

    // 1. Check max open positions
    if (openPositionsCount >= this.config.maxOpenPositions) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: 0,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: `Max concurrent open positions (${this.config.maxOpenPositions}) reached. Close an active trade first.`,
        warnings
      };
    }

    // 2. Check daily loss limit
    const dailyDrawdownPercent = Math.abs(Math.min(0, account.dailyRealizedPnL)) / account.initialBalance * 100;
    if (dailyDrawdownPercent >= this.config.maxDailyLossPercent) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: 0,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: `Daily loss limit reached (-${dailyDrawdownPercent.toFixed(1)}% / max -${this.config.maxDailyLossPercent}%). Account trading is locked for today.`,
        warnings
      };
    }

    // 3. Stop loss validation
    const executionPrice = request.type === 'LIMIT' && request.price ? request.price : currentPrice;
    if (!request.stopLoss) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: 0,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: 'Stop Loss is mandatory. Unprotected market orders are strictly forbidden by risk rules.',
        warnings
      };
    }

    const stopDist = Math.abs(executionPrice - request.stopLoss);
    if (stopDist < meta.tickSize * 5) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: stopDist,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: `Stop loss is too close (${stopDist.toFixed(meta.pricePrecision)}) to entry price. Minimum distance is ${(meta.tickSize * 5).toFixed(meta.pricePrecision)}.`,
        warnings
      };
    }

    // Directional consistency check
    if (request.side === 'BUY' && request.stopLoss >= executionPrice) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: stopDist,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: 'For a BUY order, Stop Loss must be placed strictly below the entry price.',
        warnings
      };
    }

    if (request.side === 'SELL' && request.stopLoss <= executionPrice) {
      return {
        approved: false,
        recommendedLots: 0,
        riskAmount: 0,
        riskPercent: 0,
        stopDistance: stopDist,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: 'For a SELL order, Stop Loss must be placed strictly above the entry price.',
        warnings
      };
    }

    // 4. Position Sizing
    const allowedRiskDollars = account.equity * (this.config.maxRiskPerTradePercent / 100);
    // Value of 1 lot movement over stop distance:
    // For Gold (XAUUSD): 1 lot = 100 oz. $1 move = $100. Stop distance of $5 on 1 lot = $500 risk.
    // For Forex (EURUSD): 1 standard lot = 100,000 units. 0.0001 move (1 pip) = $10.
    const contractMultiplier = request.symbol === 'XAUUSD' ? 100 : (request.symbol === 'EURJPY' ? 1000 : 100000);
    const riskPerLot = stopDist * contractMultiplier;
    let recommendedLots = Number((allowedRiskDollars / Math.max(0.01, riskPerLot)).toFixed(2));
    recommendedLots = Math.max(this.config.minLotSize, Math.min(this.config.maxLotSize, recommendedLots));

    // Desired lots from user request or recommended
    const finalLots = request.lots > 0 ? request.lots : recommendedLots;
    const actualRiskAmount = Number((finalLots * riskPerLot).toFixed(2));
    const actualRiskPercent = Number(((actualRiskAmount / account.equity) * 100).toFixed(2));

    // 5. Margin requirements check (assuming 1:100 leverage for demo/paper simulation)
    const requiredMargin = (executionPrice * contractMultiplier * finalLots) / 100;
    if (requiredMargin > account.freeMargin) {
      return {
        approved: false,
        recommendedLots,
        riskAmount: actualRiskAmount,
        riskPercent: actualRiskPercent,
        stopDistance: stopDist,
        potentialReward: 0,
        riskRewardRatio: 0,
        spreadOk,
        currentSpread,
        maxAllowedSpread,
        rejectionReason: `Insufficient free margin ($${account.freeMargin.toFixed(2)} available, $${requiredMargin.toFixed(2)} required for ${finalLots} lots).`,
        warnings
      };
    }

    // 6. Reward & R:R calculation
    let potentialReward = 0;
    let riskRewardRatio = 0;
    if (request.takeProfit) {
      const rewardDist = Math.abs(request.takeProfit - executionPrice);
      potentialReward = Number((finalLots * rewardDist * contractMultiplier).toFixed(2));
      riskRewardRatio = Number((rewardDist / stopDist).toFixed(2));

      if (riskRewardRatio < 1.0) {
        warnings.push(`Risk-to-Reward ratio is ${riskRewardRatio.toFixed(2)} : 1 (less than 1:1). Trade does not offer positive expectancy.`);
      }
    }

    return {
      approved: true,
      recommendedLots,
      riskAmount: actualRiskAmount,
      riskPercent: actualRiskPercent,
      stopDistance: Number(stopDist.toFixed(meta.pricePrecision)),
      potentialReward,
      riskRewardRatio,
      spreadOk,
      currentSpread,
      maxAllowedSpread,
      warnings
    };
  }
}

/**
 * Realistic Paper Execution Adapter
 * Simulates real broker execution mechanics:
 * - Mark-to-market positions
 * - Order lifecycle (PENDING -> SUBMITTED -> ACCEPTED -> FILLED -> CLOSED)
 * - Realistic slippage and commission models
 * - Real-time SL / TP evaluation
 */
export class PaperExecutionAdapter implements ExecutionProvider {
  public readonly name = 'Paper Execution Engine (Simulated)';
  public readonly isLiveBroker = false;

  private account: AccountInfo;
  private positions: Map<string, Position> = new Map();
  private orders: Map<string, Order> = new Map();

  private accountListeners: Set<(acc: AccountInfo) => void> = new Set();
  private positionListeners: Set<(pos: Position[]) => void> = new Set();
  private orderListeners: Set<(orders: Order[]) => void> = new Set();

  private latestPrices: Map<MarketSymbol, number> = new Map();

  constructor(initialCapital: number = 50000) {
    this.account = {
      balance: initialCapital,
      equity: initialCapital,
      margin: 0,
      freeMargin: initialCapital,
      marginLevel: 0,
      currency: 'USD',
      dailyRealizedPnL: 0,
      initialBalance: initialCapital
    };
  }

  public async connect(): Promise<void> {
    // Simulator ready
  }

  public async disconnect(): Promise<void> {
    // Simulator cleanup
  }

  public getAccount(): AccountInfo {
    return { ...this.account };
  }

  public getPositions(): Position[] {
    return Array.from(this.positions.values()).filter(p => p.status === 'OPEN');
  }

  public getOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  public onAccountChange(cb: (acc: AccountInfo) => void): () => void {
    this.accountListeners.add(cb);
    return () => this.accountListeners.delete(cb);
  }

  public onPositionsChange(cb: (pos: Position[]) => void): () => void {
    this.positionListeners.add(cb);
    return () => this.positionListeners.delete(cb);
  }

  public onOrdersChange(cb: (orders: Order[]) => void): () => void {
    this.orderListeners.add(cb);
    return () => this.orderListeners.delete(cb);
  }

  /**
   * Called on every incoming price tick to update PnL, trigger pending limit orders, and evaluate SL/TP
   */
  public handlePriceTick(symbol: MarketSymbol, price: number): void {
    this.latestPrices.set(symbol, price);
    const meta = SYMBOL_METADATA[symbol];
    const contractMultiplier = symbol === 'XAUUSD' ? 100 : (symbol === 'EURJPY' ? 1000 : 100000);

    // 1. Evaluate Pending Orders
    this.orders.forEach(order => {
      if (order.status === 'ACCEPTED' || order.status === 'PENDING') {
        if (order.symbol !== symbol) return;

        let shouldFill = false;
        if (order.type === 'LIMIT') {
          if (order.side === 'BUY' && price <= order.price) {
            shouldFill = true;
          } else if (order.side === 'SELL' && price >= order.price) {
            shouldFill = true;
          }
        }

        if (shouldFill) {
          this.executeFill(order, price, contractMultiplier, meta);
        }
      }
    });

    // 2. Mark-to-market active positions and check SL/TP
    let totalUnrealizedPnL = 0;
    let totalMargin = 0;

    this.positions.forEach(pos => {
      if (pos.status !== 'OPEN') return;
      if (pos.symbol === symbol) {
        pos.currentPrice = price;
        const priceDiff = pos.side === 'BUY' ? (price - pos.entryPrice) : (pos.entryPrice - price);
        pos.unrealizedPnL = Number((priceDiff * pos.lots * contractMultiplier - pos.commission).toFixed(2));

        // Check SL
        if (pos.stopLoss) {
          const slHit = pos.side === 'BUY' ? price <= pos.stopLoss : price >= pos.stopLoss;
          if (slHit) {
            this.closePositionInternal(pos.id, pos.stopLoss, 'Stop Loss Hit');
            return;
          }
        }

        // Check TP
        if (pos.takeProfit) {
          const tpHit = pos.side === 'BUY' ? price >= pos.takeProfit : price <= pos.takeProfit;
          if (tpHit) {
            this.closePositionInternal(pos.id, pos.takeProfit, 'Take Profit Hit');
            return;
          }
        }
      }

      totalUnrealizedPnL += pos.unrealizedPnL;
      totalMargin += (pos.entryPrice * contractMultiplier * pos.lots) / 100;
    });

    // Update Account Equity & Margin
    this.account.equity = Number((this.account.balance + totalUnrealizedPnL).toFixed(2));
    this.account.margin = Number(totalMargin.toFixed(2));
    this.account.freeMargin = Number((this.account.equity - this.account.margin).toFixed(2));
    this.account.marginLevel = this.account.margin > 0 ? Number(((this.account.equity / this.account.margin) * 100).toFixed(1)) : 0;

    this.notifyListeners();
  }

  public async placeOrder(req: OrderRequest): Promise<OrderResult> {
    const currentPrice = this.latestPrices.get(req.symbol) || (req.symbol === 'XAUUSD' ? 2357.89 : 1.0845);
    const meta = SYMBOL_METADATA[req.symbol];
    const contractMultiplier = req.symbol === 'XAUUSD' ? 100 : (req.symbol === 'EURJPY' ? 1000 : 100000);

    const orderId = `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const order: Order = {
      id: orderId,
      symbol: req.symbol,
      side: req.side,
      type: req.type,
      lots: req.lots,
      price: req.type === 'LIMIT' && req.price ? req.price : currentPrice,
      stopLoss: req.stopLoss,
      takeProfit: req.takeProfit,
      status: req.type === 'MARKET' ? 'FILLED' : 'ACCEPTED',
      createdAt: Date.now()
    };

    this.orders.set(orderId, order);

    if (req.type === 'MARKET') {
      const position = this.executeFill(order, currentPrice, contractMultiplier, meta);
      return { success: true, order, position };
    } else {
      this.notifyListeners();
      return { success: true, order };
    }
  }

  private executeFill(order: Order, price: number, contractMultiplier: number, meta?: SymbolMetadata): Position {
    // Realistic slippage: 0.5 to 1.5 ticks
    const tick = meta?.tickSize || 0.01;
    const slippageTicks = (Math.random() * 1.5 - 0.5);
    const slippage = Number((slippageTicks * tick).toFixed(meta?.pricePrecision || 2));
    const fillPrice = Number((price + (order.side === 'BUY' ? slippage : -slippage)).toFixed(meta?.pricePrecision || 2));
    const commission = Number((order.lots * 3.50).toFixed(2)); // $3.50 per lot commission

    order.status = 'FILLED';
    order.fillPrice = fillPrice;
    order.filledAt = Date.now();

    const positionId = `pos-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const position: Position = {
      id: positionId,
      symbol: order.symbol,
      side: order.side,
      lots: order.lots,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
      unrealizedPnL: -commission,
      realizedPnL: 0,
      openTime: Date.now(),
      commission,
      slippage,
      status: 'OPEN'
    };

    this.positions.set(positionId, position);
    this.notifyListeners();
    return position;
  }

  public async closePosition(positionId: string): Promise<boolean> {
    const pos = this.positions.get(positionId);
    if (!pos || pos.status !== 'OPEN') return false;
    const currentPrice = this.latestPrices.get(pos.symbol) || pos.currentPrice;
    return this.closePositionInternal(positionId, currentPrice, 'Manual User Close');
  }

  private closePositionInternal(positionId: string, exitPrice: number, _reason: string): boolean {
    const pos = this.positions.get(positionId);
    if (!pos || pos.status !== 'OPEN') return false;

    const contractMultiplier = pos.symbol === 'XAUUSD' ? 100 : (pos.symbol === 'EURJPY' ? 1000 : 100000);
    const priceDiff = pos.side === 'BUY' ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
    const grossPnL = priceDiff * pos.lots * contractMultiplier;
    const netPnL = Number((grossPnL - pos.commission).toFixed(2));

    pos.status = 'CLOSED';
    pos.closeTime = Date.now();
    pos.currentPrice = exitPrice;
    pos.realizedPnL = netPnL;
    pos.unrealizedPnL = 0;

    this.account.balance = Number((this.account.balance + netPnL).toFixed(2));
    this.account.dailyRealizedPnL = Number((this.account.dailyRealizedPnL + netPnL).toFixed(2));

    this.notifyListeners();
    return true;
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order || (order.status !== 'ACCEPTED' && order.status !== 'PENDING')) return false;
    order.status = 'CANCELLED';
    order.cancelledAt = Date.now();
    this.notifyListeners();
    return true;
  }

  public async modifyOrder(orderId: string, updates: Partial<OrderRequest>): Promise<boolean> {
    const order = this.orders.get(orderId);
    if (!order || (order.status !== 'ACCEPTED' && order.status !== 'PENDING')) return false;
    if (updates.price) order.price = updates.price;
    if (updates.stopLoss) order.stopLoss = updates.stopLoss;
    if (updates.takeProfit) order.takeProfit = updates.takeProfit;
    if (updates.lots) order.lots = updates.lots;
    this.notifyListeners();
    return true;
  }

  private notifyListeners(): void {
    const acc = this.getAccount();
    const pos = this.getPositions();
    const ord = this.getOrders();

    this.accountListeners.forEach(cb => cb(acc));
    this.positionListeners.forEach(cb => cb(pos));
    this.orderListeners.forEach(cb => cb(ord));
  }
}
