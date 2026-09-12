import {
  Candle,
  MarketSymbol,
  Timeframe,
  StrategyDefinition,
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  BacktestMetrics,
  EquityPoint,
  MonthlyReturn,
  BlockedSignalRecord,
  BiasType
} from '../types';
import { StrategyEngine, IndicatorSeries } from './strategyEngine';
import { MARKET_META } from './marketDataService';
import { MarketNewsService } from './marketNewsService';
import { AnalysisEngine } from './analysisEngine';

export class BacktestEngine {
  /**
   * Runs backtest against historical candles using the exact StrategyDefinition
   */
  public static runBacktest(
    strategy: StrategyDefinition,
    candles: Candle[],
    config: BacktestConfig,
    aiBiasOverride?: BiasType
  ): BacktestResult {
    const executedAt = Date.now();
    const symbol = strategy.symbol;
    const meta = MARKET_META[symbol] || {
      pricePrecision: 2,
      tickSize: 0.01,
      pointSize: 0.1,
      pipMultiplier: 10,
      defaultSpread: 0.2
    };

    // Filter candles by user-specified date range if provided, ensuring all candles are valid
    let evalCandles = (candles || []).filter(c => c && typeof c.high === 'number' && typeof c.low === 'number' && typeof c.close === 'number' && typeof c.open === 'number');
    if (config.startDate || config.endDate) {
      evalCandles = evalCandles.filter(c => {
        if (config.startDate && c.time < config.startDate) return false;
        if (config.endDate && c.time > config.endDate) return false;
        return true;
      });
    }

    if (evalCandles.length < 15) {
      return this.emptyResult(strategy, config, executedAt, evalCandles);
    }

    // 1. Calculate technical indicators series across candles
    const series = StrategyEngine.calculateIndicators(evalCandles);

    // 2. Pre-build pattern cache for fast, look-ahead-free lookup
    const patternCache = StrategyEngine.buildPatternCache(evalCandles, strategy.timeframe);

    // 3. Determine AI Bias state for this symbol
    let activeAiBias: BiasType = aiBiasOverride || 'BULLISH';
    try {
      const lastCandle = evalCandles[evalCandles.length - 1];
      const pred = AnalysisEngine.generatePrediction(symbol, lastCandle?.close || 100, undefined, evalCandles, strategy.timeframe);
      activeAiBias = pred.direction;
    } catch (e) {
      // default
    }

    // Execution assumptions
    const spreadPoints = config.useHistoricalSpread ? meta.defaultSpread : (config.assumedSpreadPips * (meta.pointSize / (meta.pipMultiplier || 10)));
    const slippagePoints = (config.slippagePips || 0) * (meta.pointSize / (meta.pipMultiplier || 10));
    const initialCapital = config.initialCapital || 10000;
    let currentEquity = initialCapital;
    let peakEquity = initialCapital;
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;

    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [
      { time: evalCandles[0].time, equity: initialCapital, drawdown: 0, tradeIndex: 0 }
    ];
    const blockedSignalsLog: BlockedSignalRecord[] = [];

    // Active position state
    interface ActiveSimPosition {
      id: string;
      tradeNumber: number;
      direction: 'BUY' | 'SELL';
      entryTime: number;
      entryBarIdx: number;
      entryPrice: number;
      stopLoss: number;
      takeProfit: number;
      initialRiskPoints: number;
      initialStopLoss: number;
      lots: number;
      entryReason: string;
      entryConditionsMet: string[];
      mfe: number;
      mae: number;
      hasMovedToBreakEven: boolean;
    }

    let activePositions: ActiveSimPosition[] = [];
    const maxOpenTrades = strategy.riskManagement?.maxOpenTrades || 1;

    // News events for news filter
    const newsItems = MarketNewsService.getInstance().getRecentNews(symbol);

    // Start evaluation at bar 15 so moving averages have sufficient historical bars
    for (let i = 15; i < evalCandles.length; i++) {
      const currCandle = evalCandles[i];
      const prevCandle = evalCandles[i - 1];
      if (!currCandle || !prevCandle) continue;

      // ======================================================================
      // A. UPDATE ACTIVE TRADES (Check Intrabar Exits, Trailing Stops, BE)
      // ======================================================================
      const remainingPositions: ActiveSimPosition[] = [];

      for (const pos of activePositions) {
        let isClosed = false;
        let exitPrice = 0;
        let exitReason: BacktestTrade['exitReason'] = 'TAKE_PROFIT';

        // Update MFE / MAE
        if (pos.direction === 'BUY') {
          const favorable = Math.max(0, currCandle.high - pos.entryPrice);
          const adverse = Math.max(0, pos.entryPrice - currCandle.low);
          pos.mfe = Math.max(pos.mfe, favorable);
          pos.mae = Math.max(pos.mae, adverse);
        } else {
          const favorable = Math.max(0, pos.entryPrice - currCandle.low);
          const adverse = Math.max(0, currCandle.high - pos.entryPrice);
          pos.mfe = Math.max(pos.mfe, favorable);
          pos.mae = Math.max(pos.mae, adverse);
        }

        // Break-Even check
        if (strategy.advancedOptions.enableBreakEven && !pos.hasMovedToBreakEven && pos.initialRiskPoints > 0) {
          const beTriggerDist = pos.initialRiskPoints * (strategy.advancedOptions.breakEvenTriggerR || 1.0);
          if (pos.mfe >= beTriggerDist) {
            const offset = (strategy.advancedOptions.breakEvenOffsetR || 0) * pos.initialRiskPoints;
            pos.stopLoss = pos.direction === 'BUY' ? pos.entryPrice + offset : pos.entryPrice - offset;
            pos.hasMovedToBreakEven = true;
          }
        }

        // Trailing Stop check
        if (strategy.advancedOptions.enableTrailingStop && pos.initialRiskPoints > 0) {
          const trailDist = pos.initialRiskPoints * (strategy.advancedOptions.trailingStopDistanceR || 1.0);
          if (pos.direction === 'BUY') {
            const newSl = currCandle.high - trailDist;
            if (newSl > pos.stopLoss) pos.stopLoss = newSl;
          } else {
            const newSl = currCandle.low + trailDist;
            if (newSl < pos.stopLoss) pos.stopLoss = newSl;
          }
        }

        // Check Intrabar SL and TP hits
        let hitSl = false;
        let hitTp = false;

        if (pos.direction === 'BUY') {
          if (currCandle.low <= pos.stopLoss) hitSl = true;
          if (pos.takeProfit > 0 && currCandle.high >= pos.takeProfit) hitTp = true;
        } else {
          if (currCandle.high >= pos.stopLoss) hitSl = true;
          if (pos.takeProfit > 0 && currCandle.low <= pos.takeProfit) hitTp = true;
        }

        if (hitSl && hitTp) {
          // Conservative deterministic policy: assume SL hit first
          if (config.intrabarPolicy === 'CONSERVATIVE_SL_FIRST') {
            isClosed = true;
            exitPrice = pos.stopLoss;
            exitReason = pos.hasMovedToBreakEven && Math.abs(pos.stopLoss - pos.entryPrice) < 0.0001 ? 'STOP_LOSS' : 'STOP_LOSS';
          } else {
            isClosed = true;
            exitPrice = pos.stopLoss;
            exitReason = 'STOP_LOSS';
          }
        } else if (hitSl) {
          isClosed = true;
          exitPrice = pos.stopLoss;
          exitReason = 'STOP_LOSS';
        } else if (hitTp) {
          isClosed = true;
          exitPrice = pos.takeProfit;
          exitReason = 'TAKE_PROFIT';
        }

        // Time-based exit check
        if (!isClosed) {
          const timeExit = strategy.exitConditions.find(e => e.type === 'TIME_EXIT');
          if (timeExit && timeExit.timeBars && (i - pos.entryBarIdx) >= timeExit.timeBars) {
            isClosed = true;
            exitPrice = currCandle.close;
            exitReason = 'TIME_EXIT';
          }
        }

        // If closed on this candle, record the trade
        if (isClosed) {
          const tradePnlPoints = pos.direction === 'BUY' ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
          const rMultiple = pos.initialRiskPoints > 0 ? tradePnlPoints / pos.initialRiskPoints : 0;
          
          // Symbol monetary PnL calculation
          const pointVal = meta.pointSize > 0 ? (1 / meta.pointSize) : 10;
          const grossPnl = tradePnlPoints * pos.lots * pointVal;
          
          // Apply commission
          let commAmount = 0;
          if (config.commissionType === 'PER_TRADE') commAmount = config.commissionValue;
          else if (config.commissionType === 'PER_UNIT') commAmount = config.commissionValue * pos.lots;
          else if (config.commissionType === 'PERCENTAGE') commAmount = Math.abs(grossPnl) * (config.commissionValue / 100);

          const netPnl = grossPnl - commAmount;
          const pnlPercent = (netPnl / currentEquity) * 100;
          currentEquity += netPnl;

          if (currentEquity > peakEquity) peakEquity = currentEquity;
          const dd = peakEquity - currentEquity;
          const ddPercent = peakEquity > 0 ? (dd / peakEquity) * 100 : 0;
          if (dd > maxDrawdown) maxDrawdown = dd;
          if (ddPercent > maxDrawdownPercent) maxDrawdownPercent = ddPercent;

          const outcome: BacktestTrade['outcome'] =
            Math.abs(tradePnlPoints) < 0.0001 ? 'BREAKEVEN' :
            tradePnlPoints > 0 ? 'WIN' : 'LOSS';

          const durationMs = currCandle.time - pos.entryTime;
          const durationMinutes = Math.max(1, Math.round(durationMs / (60 * 1000)));

          trades.push({
            id: pos.id,
            tradeNumber: pos.tradeNumber,
            symbol,
            direction: pos.direction,
            entryTime: pos.entryTime,
            exitTime: currCandle.time,
            entryPrice: Number(pos.entryPrice.toFixed(meta.pricePrecision)),
            exitPrice: Number(exitPrice.toFixed(meta.pricePrecision)),
            stopLoss: Number(pos.stopLoss.toFixed(meta.pricePrecision)),
            takeProfit: Number(pos.takeProfit.toFixed(meta.pricePrecision)),
            lots: Number(pos.lots.toFixed(2)),
            pnl: Number(netPnl.toFixed(2)),
            pnlPercent: Number(pnlPercent.toFixed(2)),
            rMultiple: Number(rMultiple.toFixed(2)),
            outcome,
            exitReason,
            entryReason: pos.entryReason,
            durationMinutes,
            mfe: Number(pos.mfe.toFixed(meta.pricePrecision)),
            mae: Number(pos.mae.toFixed(meta.pricePrecision)),
            commission: Number(commAmount.toFixed(2)),
            slippage: Number(slippagePoints.toFixed(meta.pricePrecision)),
            spread: Number(spreadPoints.toFixed(meta.pricePrecision)),
            entryConditionsMet: pos.entryConditionsMet
          });

          equityCurve.push({
            time: currCandle.time,
            equity: Number(currentEquity.toFixed(2)),
            drawdown: Number(dd.toFixed(2)),
            tradeIndex: trades.length
          });
        } else {
          remainingPositions.push(pos);
        }
      }

      activePositions = remainingPositions;

      // ======================================================================
      // B. EVALUATE STRATEGY ENTRY SIGNAL AT CLOSED CANDLE [i - 1]
      // ======================================================================
      // Strictly NO LOOK-AHEAD:
      // Condition evaluated at bar (i - 1) close.
      // Order executes on bar (i) open!
      if (activePositions.length >= maxOpenTrades) {
        continue;
      }

      const evalBarIdx = i - 1;
      const evalCandle = evalCandles[evalBarIdx];
      const entryEval = StrategyEngine.evaluateEntry(strategy, evalCandles, evalBarIdx, series, patternCache);

      if (!entryEval.isTriggered) {
        continue;
      }

      // Determine signal direction based on strategy type
      let signalDirection: 'BUY' | 'SELL' = 'BUY';
      if (strategy.direction === 'LONG_ONLY') {
        signalDirection = 'BUY';
      } else if (strategy.direction === 'SHORT_ONLY') {
        signalDirection = 'SELL';
      } else {
        // BOTH: determine direction from momentum/RSI/structure
        const rsiVal = StrategyEngine.getIndicatorValue(series, evalCandles, evalBarIdx, 'RSI', 14);
        signalDirection = rsiVal >= 50 ? 'BUY' : 'SELL';
      }

      // ----------------------------------------------------------------------
      // C. CHECK ADDITIONAL FILTERS
      // ----------------------------------------------------------------------
      let filterPassed = true;
      let blockedReason = '';

      // 1. Session filter
      const sessionFilter = strategy.filters.find(f => f.type === 'SESSION' && f.enabled);
      if (sessionFilter && sessionFilter.session && sessionFilter.session !== 'ALL') {
        const utcHour = new Date(evalCandle.time).getUTCHours();
        let inSession = true;
        if (sessionFilter.session === 'ASIAN') inSession = utcHour >= 0 && utcHour < 8;
        else if (sessionFilter.session === 'LONDON') inSession = utcHour >= 7 && utcHour < 16;
        else if (sessionFilter.session === 'NEW_YORK') inSession = utcHour >= 12 && utcHour < 21;
        else if (sessionFilter.session === 'LONDON_NEW_YORK') inSession = utcHour >= 7 && utcHour < 21;
        else if (sessionFilter.session === 'CUSTOM') {
          const sStart = sessionFilter.customSessionStartUtc ?? 7;
          const sEnd = sessionFilter.customSessionEndUtc ?? 16;
          inSession = utcHour >= sStart && utcHour <= sEnd;
        }

        if (!inSession) {
          filterPassed = false;
          blockedReason = `Outside configured trading session (${sessionFilter.session})`;
        }
      }

      // 2. News Filter
      const newsFilter = strategy.filters.find(f => f.type === 'NEWS' && f.enabled);
      if (newsFilter && filterPassed) {
        const windowMs = (newsFilter.newsBlackoutMinutes || 30) * 60 * 1000;
        const isNearHighImpactNews = newsItems.some(n => {
          if (n.impact !== 'HIGH') return false;
          if (n.relatedSymbols && n.relatedSymbols.length > 0 && !n.relatedSymbols.includes(symbol)) return false;
          return Math.abs(evalCandle.time - n.timestamp) <= windowMs;
        });

        if (isNearHighImpactNews) {
          filterPassed = false;
          blockedReason = `High Impact News event within blackout window`;
        }
      }

      // 3. Minimum ATR filter
      const minAtrFilter = strategy.filters.find(f => f.type === 'MIN_ATR' && f.enabled);
      if (minAtrFilter && minAtrFilter.minAtrValue !== undefined && filterPassed) {
        const currentAtr = StrategyEngine.getIndicatorValue(series, evalCandles, evalBarIdx, 'ATR', 14);
        if (currentAtr < minAtrFilter.minAtrValue) {
          filterPassed = false;
          blockedReason = `ATR(14) ${currentAtr.toFixed(2)} below minimum threshold ${minAtrFilter.minAtrValue}`;
        }
      }

      // 4. AI Market Bias Filter
      if (strategy.advancedOptions.useAiMarketBiasFilter && filterPassed) {
        const aiMode = strategy.advancedOptions.aiBiasMode;
        if (aiMode === 'BLOCK_NO_TRADE' && activeAiBias === 'NO TRADE') {
          filterPassed = false;
          blockedReason = `AI Market Bias is NO TRADE (Neutral regime)`;
        } else if (aiMode === 'STRICT_DIRECTION') {
          if (signalDirection === 'BUY' && activeAiBias !== 'BULLISH') {
            filterPassed = false;
            blockedReason = `AI Market Bias = ${activeAiBias}; Strategy Direction = Long`;
          } else if (signalDirection === 'SELL' && activeAiBias !== 'BEARISH') {
            filterPassed = false;
            blockedReason = `AI Market Bias = ${activeAiBias}; Strategy Direction = Short`;
          }
        } else if (aiMode === 'ALLOW_IF_NOT_OPPOSING') {
          if (signalDirection === 'BUY' && activeAiBias === 'BEARISH') {
            filterPassed = false;
            blockedReason = `AI Market Bias = Bearish contradicts Long setup`;
          } else if (signalDirection === 'SELL' && activeAiBias === 'BULLISH') {
            filterPassed = false;
            blockedReason = `AI Market Bias = Bullish contradicts Short setup`;
          }
        }
      }

      // If blocked by any filter, record to blocked log for full transparency
      if (!filterPassed) {
        blockedSignalsLog.push({
          time: evalCandle.time,
          timeFormatted: new Date(evalCandle.time).toISOString().replace('T', ' ').slice(0, 16),
          price: evalCandle.close,
          direction: signalDirection,
          reason: blockedReason
        });
        continue;
      }

      // ----------------------------------------------------------------------
      // D. EXECUTE ENTRY AT CANDLE [i] OPEN (Realistic Execution)
      // ----------------------------------------------------------------------
      const baseEntryPrice = currCandle.open;
      const executedEntryPrice = signalDirection === 'BUY'
        ? baseEntryPrice + (spreadPoints / 2) + slippagePoints
        : baseEntryPrice - (spreadPoints / 2) - slippagePoints;

      // Calculate Stop Loss & Take Profit levels based on Strategy Exits
      const slExit = strategy.exitConditions.find(e => e.type === 'STOP_LOSS') || {
        id: 'default_sl',
        type: 'STOP_LOSS',
        mode: 'R_MULTIPLE',
        value: 1.0
      };
      const tpExit = strategy.exitConditions.find(e => e.type === 'TAKE_PROFIT') || {
        id: 'default_tp',
        type: 'TAKE_PROFIT',
        mode: 'R_MULTIPLE',
        value: 2.0
      };

      const fallbackRange = (evalCandle && typeof evalCandle.high === 'number' && typeof evalCandle.low === 'number')
        ? (evalCandle.high - evalCandle.low)
        : (meta.tickSize * 20);
      const atr14 = StrategyEngine.getIndicatorValue(series, evalCandles, evalBarIdx, 'ATR', 14) || fallbackRange;
      let slDistancePoints = 0;

      if (slExit.mode === 'ATR_MULTIPLE') {
        slDistancePoints = atr14 * (slExit.value || 1.5);
      } else if (slExit.mode === 'PERCENTAGE') {
        slDistancePoints = executedEntryPrice * (slExit.value / 100);
      } else if (slExit.mode === 'POINTS') {
        slDistancePoints = slExit.value;
      } else {
        // R_MULTIPLE or default: use 1.0x ATR as 1R baseline
        slDistancePoints = atr14 * (slExit.value || 1.0);
      }

      if (slDistancePoints <= 0) {
        slDistancePoints = atr14 > 0 ? atr14 : (executedEntryPrice * 0.005);
      }

      const slPrice = signalDirection === 'BUY'
        ? executedEntryPrice - slDistancePoints
        : executedEntryPrice + slDistancePoints;

      let tpDistancePoints = 0;
      if (tpExit.mode === 'ATR_MULTIPLE') {
        tpDistancePoints = atr14 * (tpExit.value || 3.0);
      } else if (tpExit.mode === 'PERCENTAGE') {
        tpDistancePoints = executedEntryPrice * (tpExit.value / 100);
      } else if (tpExit.mode === 'POINTS') {
        tpDistancePoints = tpExit.value;
      } else {
        // R_MULTIPLE: rewardMultiple * riskDistance
        tpDistancePoints = slDistancePoints * (tpExit.value || 2.0);
      }

      const tpPrice = signalDirection === 'BUY'
        ? executedEntryPrice + tpDistancePoints
        : executedEntryPrice - tpDistancePoints;

      // Position Sizing: Account risk % / Stop Loss distance
      const riskPercent = strategy.riskManagement?.riskPerTradePercent || 1.0;
      const riskAmountDollars = currentEquity * (riskPercent / 100);
      const pointValue = meta.pointSize > 0 ? (1 / meta.pointSize) : 10;
      let calculatedLots = (riskAmountDollars / (slDistancePoints * pointValue));
      calculatedLots = Math.max(0.01, Math.min(10.0, calculatedLots));

      activePositions.push({
        id: `sim_trade_${trades.length + 1}`,
        tradeNumber: trades.length + 1,
        direction: signalDirection,
        entryTime: currCandle.time,
        entryBarIdx: i,
        entryPrice: executedEntryPrice,
        stopLoss: slPrice,
        takeProfit: tpPrice,
        initialRiskPoints: slDistancePoints,
        initialStopLoss: slPrice,
        lots: calculatedLots,
        entryReason: entryEval.reasons.slice(0, 3).join('; '),
        entryConditionsMet: entryEval.reasons,
        mfe: 0,
        mae: 0,
        hasMovedToBreakEven: false
      });
    }

    // 4. Close any open trades at last candle close for audit reconciliation
    if (activePositions.length > 0 && evalCandles.length > 0) {
      const lastCandle = evalCandles[evalCandles.length - 1];
      for (const pos of activePositions) {
        const exitPrice = lastCandle.close;
        const tradePnlPoints = pos.direction === 'BUY' ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
        const rMultiple = pos.initialRiskPoints > 0 ? tradePnlPoints / pos.initialRiskPoints : 0;
        const pointVal = meta.pointSize > 0 ? (1 / meta.pointSize) : 10;
        const netPnl = tradePnlPoints * pos.lots * pointVal;
        currentEquity += netPnl;

        trades.push({
          id: pos.id,
          tradeNumber: pos.tradeNumber,
          symbol,
          direction: pos.direction,
          entryTime: pos.entryTime,
          exitTime: lastCandle.time,
          entryPrice: Number(pos.entryPrice.toFixed(meta.pricePrecision)),
          exitPrice: Number(exitPrice.toFixed(meta.pricePrecision)),
          stopLoss: Number(pos.stopLoss.toFixed(meta.pricePrecision)),
          takeProfit: Number(pos.takeProfit.toFixed(meta.pricePrecision)),
          lots: Number(pos.lots.toFixed(2)),
          pnl: Number(netPnl.toFixed(2)),
          pnlPercent: Number(((netPnl / currentEquity) * 100).toFixed(2)),
          rMultiple: Number(rMultiple.toFixed(2)),
          outcome: netPnl >= 0 ? 'WIN' : 'LOSS',
          exitReason: 'TIME_EXIT',
          entryReason: pos.entryReason,
          durationMinutes: Math.round((lastCandle.time - pos.entryTime) / (60 * 1000)),
          mfe: Number(pos.mfe.toFixed(meta.pricePrecision)),
          mae: Number(pos.mae.toFixed(meta.pricePrecision)),
          commission: 0,
          slippage: Number(slippagePoints.toFixed(meta.pricePrecision)),
          spread: Number(spreadPoints.toFixed(meta.pricePrecision)),
          entryConditionsMet: pos.entryConditionsMet
        });

        equityCurve.push({
          time: lastCandle.time,
          equity: Number(currentEquity.toFixed(2)),
          drawdown: Number(maxDrawdown.toFixed(2)),
          tradeIndex: trades.length
        });
      }
    }

    // 5. Calculate statistical performance metrics
    const metrics = this.computeMetrics(trades, initialCapital, currentEquity, maxDrawdown, maxDrawdownPercent);

    // 6. Calculate monthly returns heatmap table
    const monthlyReturns = this.computeMonthlyReturns(trades);

    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol,
      timeframe: strategy.timeframe,
      executedAt,
      metrics,
      trades,
      equityCurve,
      monthlyReturns,
      assumptions: {
        dataSource: 'Historical Candlestick Feed (Look-Ahead Free)',
        timeframe: strategy.timeframe,
        spread: Number(spreadPoints.toFixed(meta.pricePrecision)),
        spreadType: config.useHistoricalSpread ? 'HISTORICAL' : 'ASSUMED',
        commission: config.commissionValue,
        commissionType: config.commissionType,
        slippagePips: config.slippagePips,
        executionModel: config.executionModel,
        intrabarPolicy: config.intrabarPolicy,
        startingCapital: initialCapital,
        riskPerTrade: strategy.riskManagement?.riskPerTradePercent || 1.0,
        totalCandlesEvaluated: evalCandles.length,
        dateRange: {
          start: new Date(evalCandles[0].time).toISOString().slice(0, 10),
          end: new Date(evalCandles[evalCandles.length - 1].time).toISOString().slice(0, 10)
        }
      },
      blockedSignalsLog
    };
  }

  private static computeMetrics(
    trades: BacktestTrade[],
    initialCapital: number,
    finalCapital: number,
    maxDrawdown: number,
    maxDrawdownPercent: number
  ): BacktestMetrics {
    const totalTrades = trades.length;
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        profitFactor: 0,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        totalReturnPercent: 0,
        annualizedReturnPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        avgRR: 'N/A',
        averageWin: 0,
        averageLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        winningStreak: 0,
        losingStreak: 0,
        avgDurationMinutes: 0,
        expectancy: 0
      };
    }

    const wins = trades.filter(t => t.pnl > 0);
    const losses = trades.filter(t => t.pnl < 0);
    const bes = trades.filter(t => t.pnl === 0);

    const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;

    const netProfit = finalCapital - initialCapital;
    const totalReturnPercent = (netProfit / initialCapital) * 100;
    const winRate = (wins.length / totalTrades) * 100;

    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;
    const avgRRRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '1:2.0';

    const pnlValues = trades.map(t => t.pnl);
    const bestTrade = pnlValues.length > 0 ? Math.max(...pnlValues) : 0;
    const worstTrade = pnlValues.length > 0 ? Math.min(...pnlValues) : 0;

    // Calculate approximate backtest duration for annualized return
    const firstTradeTime = trades[0]?.entryTime || Date.now();
    const lastTradeTime = trades[trades.length - 1]?.exitTime || Date.now();
    const durationDays = Math.max(1, (lastTradeTime - firstTradeTime) / (1000 * 60 * 60 * 24));
    const annualizedReturn = totalReturnPercent * (365 / durationDays);
    const calmarRatio = maxDrawdownPercent > 0 ? annualizedReturn / maxDrawdownPercent : 0;

    // Streaks
    let currentWinStreak = 0;
    let maxWinStreak = 0;
    let currentLossStreak = 0;
    let maxLossStreak = 0;

    trades.forEach(t => {
      if (t.pnl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (t.pnl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    });

    // Sharpe Ratio & Sortino Ratio
    const returns = trades.map(t => t.pnlPercent);
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0;

    const downReturns = returns.filter(r => r < 0);
    const downVariance = downReturns.length > 0
      ? downReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downReturns.length
      : 0;
    const downStdDev = Math.sqrt(downVariance);
    const sortino = downStdDev > 0 ? (meanReturn / downStdDev) * Math.sqrt(252) : 0;

    const avgDuration = trades.reduce((sum, t) => sum + t.durationMinutes, 0) / totalTrades;
    const expectancy = ((winRate / 100) * avgWin) - (((100 - winRate) / 100) * avgLoss);

    return {
      totalTrades,
      winningTrades: wins.length,
      losingTrades: losses.length,
      breakevenTrades: bes.length,
      winRate: Number(winRate.toFixed(1)),
      profitFactor: Number(profitFactor.toFixed(2)),
      netProfit: Number(netProfit.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      totalReturnPercent: Number(totalReturnPercent.toFixed(2)),
      annualizedReturnPercent: Number(annualizedReturn.toFixed(2)),
      maxDrawdown: Number(maxDrawdown.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      sharpeRatio: Number(sharpe.toFixed(2)),
      sortinoRatio: Number(sortino.toFixed(2)),
      calmarRatio: Number(calmarRatio.toFixed(2)),
      avgRR: `1:${avgRRRatio}`,
      averageWin: Number(avgWin.toFixed(2)),
      averageLoss: Number(avgLoss.toFixed(2)),
      bestTrade: Number(bestTrade.toFixed(2)),
      worstTrade: Number(worstTrade.toFixed(2)),
      winningStreak: maxWinStreak,
      losingStreak: maxLossStreak,
      avgDurationMinutes: Math.round(avgDuration),
      expectancy: Number(expectancy.toFixed(2))
    };
  }

  private static computeMonthlyReturns(trades: BacktestTrade[]): MonthlyReturn[] {
    const map = new Map<string, { pnl: number; trades: number; wins: number }>();

    trades.forEach(t => {
      const d = new Date(t.exitTime);
      const key = `${d.getFullYear()}_${d.getMonth()}`;
      if (!map.has(key)) {
        map.set(key, { pnl: 0, trades: 0, wins: 0 });
      }
      const m = map.get(key)!;
      m.pnl += t.pnl;
      m.trades++;
      if (t.pnl > 0) m.wins++;
    });

    const results: MonthlyReturn[] = [];
    map.forEach((data, key) => {
      const [yearStr, monthStr] = key.split('_');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      results.push({
        year,
        month,
        pnl: Number(data.pnl.toFixed(2)),
        returnPercent: Number(((data.pnl / 10000) * 100).toFixed(2)),
        trades: data.trades,
        winRate: data.trades > 0 ? Number(((data.wins / data.trades) * 100).toFixed(1)) : 0
      });
    });

    return results.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }

  private static emptyResult(
    strategy: StrategyDefinition,
    config: BacktestConfig,
    executedAt: number,
    candles: Candle[]
  ): BacktestResult {
    const meta = MARKET_META[strategy.symbol];
    return {
      strategyId: strategy.id,
      strategyName: strategy.name,
      symbol: strategy.symbol,
      timeframe: strategy.timeframe,
      executedAt,
      metrics: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        breakevenTrades: 0,
        winRate: 0,
        profitFactor: 0,
        netProfit: 0,
        grossProfit: 0,
        grossLoss: 0,
        totalReturnPercent: 0,
        annualizedReturnPercent: 0,
        maxDrawdown: 0,
        maxDrawdownPercent: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        calmarRatio: 0,
        avgRR: 'N/A',
        averageWin: 0,
        averageLoss: 0,
        bestTrade: 0,
        worstTrade: 0,
        winningStreak: 0,
        losingStreak: 0,
        avgDurationMinutes: 0,
        expectancy: 0
      },
      trades: [],
      equityCurve: [{ time: Date.now(), equity: config.initialCapital || 10000, drawdown: 0, tradeIndex: 0 }],
      monthlyReturns: [],
      assumptions: {
        dataSource: 'Historical Candlestick Feed (Insufficient bars)',
        timeframe: strategy.timeframe,
        spread: meta?.defaultSpread || 0.2,
        spreadType: 'ASSUMED',
        commission: config.commissionValue || 0,
        commissionType: config.commissionType || 'NONE',
        slippagePips: config.slippagePips || 0.5,
        executionModel: config.executionModel || 'NEXT_BAR_OPEN',
        intrabarPolicy: config.intrabarPolicy || 'CONSERVATIVE_SL_FIRST',
        startingCapital: config.initialCapital || 10000,
        riskPerTrade: strategy.riskManagement?.riskPerTradePercent || 1.0,
        totalCandlesEvaluated: candles.length,
        dateRange: { start: 'N/A', end: 'N/A' }
      },
      blockedSignalsLog: []
    };
  }
}
