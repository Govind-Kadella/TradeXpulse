import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { OrderRequest, OrderSide, OrderType, MarketSymbol } from '../types';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  SlidersHorizontal,
  RefreshCw,
  Wallet
} from 'lucide-react';

export const ExecutionView: React.FC = () => {
  const {
    activeSymbol,
    setSymbol,
    prediction,
    candles,
    marketOverview,
    account,
    positions,
    orders,
    riskConfig,
    placeOrder,
    closePosition,
    cancelOrder,
    evaluateRisk,
    stagedOrder,
    setStagedOrder,
    stageTradeFromPrediction
  } = usePredictionState();

  const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : prediction.currentPrice;

  // Local Form state
  const [symbol, setOrderSymbol] = useState<MarketSymbol>(stagedOrder?.symbol || activeSymbol);
  const [side, setSide] = useState<OrderSide>(stagedOrder?.side || (prediction.direction === 'BEARISH' ? 'SELL' : 'BUY'));
  const [orderType, setOrderType] = useState<OrderType>(stagedOrder?.type || 'LIMIT');
  const [lots, setLots] = useState<number>(stagedOrder?.lots || 0.5);
  const [limitPrice, setLimitPrice] = useState<number>(
    stagedOrder?.price || (prediction.entryZone ? (prediction.entryZone.min + prediction.entryZone.max) / 2 : currentPrice)
  );
  const [stopLoss, setStopLoss] = useState<number>(stagedOrder?.stopLoss || prediction.stopLoss);
  const [takeProfit, setTakeProfit] = useState<number>(stagedOrder?.takeProfit || prediction.tp3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync with staged order if present
  React.useEffect(() => {
    if (stagedOrder) {
      setOrderSymbol(stagedOrder.symbol);
      setSide(stagedOrder.side);
      setOrderType(stagedOrder.type);
      setLots(stagedOrder.lots);
      if (stagedOrder.price) setLimitPrice(stagedOrder.price);
      if (stagedOrder.stopLoss) setStopLoss(stagedOrder.stopLoss);
      if (stagedOrder.takeProfit) setTakeProfit(stagedOrder.takeProfit);
    }
  }, [stagedOrder]);

  // Current order request for risk evaluation
  const currentRequest: OrderRequest = {
    symbol,
    side,
    type: orderType,
    lots,
    price: orderType === 'LIMIT' ? limitPrice : currentPrice,
    stopLoss,
    takeProfit
  };

  const riskResult = evaluateRisk(currentRequest);

  const handleApplyRecommendedLots = () => {
    if (riskResult.recommendedLots > 0) {
      setLots(riskResult.recommendedLots);
    }
  };

  const handleExecute = async () => {
    if (!riskResult.approved) {
      setFeedback({
        type: 'error',
        message: riskResult.rejectionReason || 'Order rejected by Risk Engine'
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      const res = await placeOrder(currentRequest);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `${orderType} ${side} ${lots} lots on ${symbol} successfully executed!`
        });
        setStagedOrder(null);
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Execution failed'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error communicating with execution provider'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-[#0A0E17] text-[#F8FAFC] p-4 sm:p-6 select-none" id="execution-view-container">
      {/* 1. Top Account & Risk Status Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            Balance
          </div>
          <div className="text-lg font-mono font-bold text-white mt-1">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Base currency: USD</div>
        </div>

        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Equity
          </div>
          <div className={`text-lg font-mono font-bold mt-1 ${account.equity >= account.balance ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Floating: ${(account.equity - account.balance).toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Free Margin
          </div>
          <div className="text-lg font-mono font-bold text-white mt-1">
            ${account.freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Used: ${account.margin.toFixed(2)}
          </div>
        </div>

        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            Daily Realized PnL
          </div>
          <div className={`text-lg font-mono font-bold mt-1 ${account.dailyRealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {account.dailyRealizedPnL >= 0 ? '+' : ''}${account.dailyRealizedPnL.toFixed(2)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            Limit: -{riskConfig.maxDailyLossPercent}% max
          </div>
        </div>

        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3">
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Risk Rules
          </div>
          <div className="text-sm font-mono font-bold text-slate-200 mt-1">
            {riskConfig.maxRiskPerTradePercent}% / Trade
          </div>
          <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
            Max {riskConfig.maxOpenPositions} positions
          </div>
        </div>

        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-3 flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Broker Mode
            </div>
            <div className="text-xs font-mono font-bold text-amber-300 mt-1">
              PAPER SIMULATOR
            </div>
          </div>
          <div className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Auto-trading: OFF
          </div>
        </div>
      </div>

      {/* 2. Main Stage: Order Staging Ticket & Risk Validation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        {/* Left: Staged Order Ticket */}
        <div className="lg:col-span-7 bg-[#0E1421] border border-[#1F2937] rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F2937] mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Order Staging & Ticket
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  PRE-TRADE GATED
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every trade is scrutinized against institutional risk rules before execution.
              </p>
            </div>

            <button
              onClick={stageTradeFromPrediction}
              disabled={prediction.direction === 'NO TRADE'}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                prediction.direction === 'NO TRADE'
                  ? 'bg-[#1D283D]/50 text-slate-500 border border-[#1F2937] cursor-not-allowed'
                  : 'bg-blue-600/20 text-blue-300 border border-blue-500/40 hover:bg-blue-600/30'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              Import Active Prediction
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Symbol & Side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Instrument
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {(['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'] as MarketSymbol[]).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setOrderSymbol(s);
                        setSymbol(s);
                      }}
                      className={`py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                        symbol === s
                          ? 'bg-blue-600 text-white border border-blue-400'
                          : 'bg-[#1D283D] text-slate-400 hover:text-white border border-transparent'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Order Side
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSide('BUY')}
                    className={`py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      side === 'BUY'
                        ? 'bg-emerald-600 text-white border border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-[#1D283D] text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    BUY (Long)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSide('SELL')}
                    className={`py-1.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      side === 'SELL'
                        ? 'bg-rose-600 text-white border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                        : 'bg-[#1D283D] text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    SELL (Short)
                  </button>
                </div>
              </div>
            </div>

            {/* Type & Lots */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Order Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('LIMIT')}
                    className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'LIMIT'
                        ? 'bg-indigo-600 text-white border border-indigo-400'
                        : 'bg-[#1D283D] text-slate-400 hover:text-white'
                    }`}
                  >
                    LIMIT ORDER
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('MARKET')}
                    className={`py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                      orderType === 'MARKET'
                        ? 'bg-indigo-600 text-white border border-indigo-400'
                        : 'bg-[#1D283D] text-slate-400 hover:text-white'
                    }`}
                  >
                    MARKET (Instant)
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Position Lots
                  </label>
                  {riskResult.recommendedLots > 0 && (
                    <button
                      type="button"
                      onClick={handleApplyRecommendedLots}
                      className="text-[10px] text-blue-400 hover:underline font-mono cursor-pointer"
                    >
                      Use 1% Risk Size ({riskResult.recommendedLots})
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="10.0"
                  value={lots}
                  onChange={e => setLots(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#151D2C] border border-[#1F2937] rounded px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Entry, Stop Loss & Take Profit */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  {orderType === 'LIMIT' ? 'Limit Price' : 'Market Price'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={orderType === 'MARKET'}
                  value={orderType === 'MARKET' ? currentPrice : limitPrice}
                  onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className={`w-full bg-[#151D2C] border border-[#1F2937] rounded px-3 py-1.5 font-mono text-sm focus:outline-none focus:border-blue-500 ${
                    orderType === 'MARKET' ? 'text-slate-400 cursor-not-allowed' : 'text-white'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                    Stop Loss *
                  </label>
                  <span className="text-[10px] text-slate-500">Mandatory</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  value={stopLoss || ''}
                  onChange={e => setStopLoss(parseFloat(e.target.value) || 0)}
                  placeholder="Required SL"
                  className="w-full bg-[#151D2C] border border-rose-500/30 rounded px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  Take Profit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={takeProfit || ''}
                  onChange={e => setTakeProfit(parseFloat(e.target.value) || 0)}
                  placeholder="TP target"
                  className="w-full bg-[#151D2C] border border-emerald-500/30 rounded px-3 py-1.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              feedback.type === 'success' 
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Action button */}
          <div className="mt-5 pt-4 border-t border-[#1F2937] flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Provider: <span className="text-slate-200 font-mono font-medium">TradeXpulse Paper Engine</span>
            </div>

            <button
              type="button"
              id="btn-place-paper-order"
              onClick={handleExecute}
              disabled={isSubmitting || !riskResult.approved}
              className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                riskResult.approved
                  ? (side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]')
                  : 'bg-[#1D283D] text-slate-500 border border-[#1F2937] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Simulating Fill...' : `Confirm & Place ${side} Order`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Institutional Pre-Trade Risk Gate */}
        <div className="lg:col-span-5 bg-[#0E1421] border border-[#1F2937] rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#1F2937] mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Pre-Trade Risk Engine Gate
              </h3>
              {riskResult.approved ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> APPROVED
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> REJECTED
                </span>
              )}
            </div>

            {/* Rejection notice if not approved */}
            {!riskResult.approved && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>
                  <div className="font-bold">Risk Rule Violation:</div>
                  <div className="mt-0.5">{riskResult.rejectionReason}</div>
                </div>
              </div>
            )}

            {/* Risk Metrics Breakdown */}
            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#151D2C] border border-[#1F2937]">
                <span className="text-slate-400 font-sans">Stop Distance:</span>
                <span className="text-white font-bold">{riskResult.stopDistance.toFixed(2)} pts</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#151D2C] border border-[#1F2937]">
                <span className="text-slate-400 font-sans">Total Dollar Risk:</span>
                <span className={`font-bold ${riskResult.riskPercent > riskConfig.maxRiskPerTradePercent ? 'text-rose-400' : 'text-slate-200'}`}>
                  ${riskResult.riskAmount.toFixed(2)} ({riskResult.riskPercent}%)
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#151D2C] border border-[#1F2937]">
                <span className="text-slate-400 font-sans">Potential Reward:</span>
                <span className="text-emerald-400 font-bold">${riskResult.potentialReward.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#151D2C] border border-[#1F2937]">
                <span className="text-slate-400 font-sans">Risk / Reward Ratio:</span>
                <span className={`font-bold ${riskResult.riskRewardRatio >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  1 : {riskResult.riskRewardRatio}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#151D2C] border border-[#1F2937]">
                <span className="text-slate-400 font-sans">Spread Check:</span>
                <span className={`font-bold ${riskResult.spreadOk ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {riskResult.currentSpread.toFixed(2)} (max {riskResult.maxAllowedSpread.toFixed(2)})
                </span>
              </div>
            </div>

            {/* Warnings if any */}
            {riskResult.warnings.length > 0 && (
              <div className="mt-4 space-y-1.5">
                {riskResult.warnings.map((w, idx) => (
                  <div key={idx} className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                    {w}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F2937] text-[11px] text-slate-500 font-sans">
            Safety Directive: Auto-execution is permanently decoupled. Orders are never submitted automatically without conscious manual confirmation.
          </div>
        </div>
      </div>

      {/* 3. Open Positions Table */}
      <div className="bg-[#0E1421] border border-[#1F2937] rounded-xl p-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Open Positions ({positions.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            Mark-to-market live valuation
          </span>
        </div>

        {positions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-[#1F2937] rounded-lg">
            No active positions open. Stage an order above to begin paper simulation.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1F2937] text-slate-400">
                  <th className="pb-2 font-semibold">Instrument</th>
                  <th className="pb-2 font-semibold">Side</th>
                  <th className="pb-2 font-semibold">Lots</th>
                  <th className="pb-2 font-semibold">Entry Price</th>
                  <th className="pb-2 font-semibold">Current Price</th>
                  <th className="pb-2 font-semibold">Stop Loss</th>
                  <th className="pb-2 font-semibold">Take Profit</th>
                  <th className="pb-2 font-semibold">Unrealized PnL</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                {positions.map(p => (
                  <tr key={p.id} className="hover:bg-[#151D2C]/40 transition-colors">
                    <td className="py-2.5 font-bold text-white">{p.symbol}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {p.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{p.lots}</td>
                    <td className="py-2.5 text-slate-300">{p.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-white font-bold">{p.currentPrice.toFixed(2)}</td>
                    <td className="py-2.5 text-rose-400">{p.stopLoss ? p.stopLoss.toFixed(2) : '-'}</td>
                    <td className="py-2.5 text-emerald-400">{p.takeProfit ? p.takeProfit.toFixed(2) : '-'}</td>
                    <td className={`py-2.5 font-bold ${p.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {p.unrealizedPnL >= 0 ? '+' : ''}${p.unrealizedPnL.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => closePosition(p.id)}
                        className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 text-[11px] font-medium transition-all cursor-pointer"
                      >
                        Close Market
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Working Orders Table */}
      <div className="bg-[#0E1421] border border-[#1F2937] rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Working & Historical Orders ({orders.length})
          </h3>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-[#1F2937] rounded-lg">
            No orders submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1F2937] text-slate-400">
                  <th className="pb-2 font-semibold">ID</th>
                  <th className="pb-2 font-semibold">Instrument</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Side</th>
                  <th className="pb-2 font-semibold">Lots</th>
                  <th className="pb-2 font-semibold">Order Price</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]/50">
                {orders.slice(-8).reverse().map(o => (
                  <tr key={o.id} className="hover:bg-[#151D2C]/40 transition-colors">
                    <td className="py-2.5 text-slate-400">{o.id.slice(-8)}</td>
                    <td className="py-2.5 font-bold text-white">{o.symbol}</td>
                    <td className="py-2.5 text-slate-300">{o.type}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.side === 'BUY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {o.side}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-300">{o.lots}</td>
                    <td className="py-2.5 text-slate-200">{o.price.toFixed(2)}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'FILLED' ? 'bg-emerald-500/20 text-emerald-300' : (o.status === 'CANCELLED' ? 'bg-slate-700 text-slate-400' : 'bg-blue-500/20 text-blue-300')
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      {o.status === 'ACCEPTED' || o.status === 'PENDING' ? (
                        <button
                          onClick={() => cancelOrder(o.id)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-slate-500 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
