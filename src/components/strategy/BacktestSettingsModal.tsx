import React, { useState } from 'react';
import { BacktestConfig, CommissionType } from '../../types';
import { 
  X, 
  Settings, 
  DollarSign, 
  Shield, 
  Clock, 
  HelpCircle,
  RotateCcw,
  Check
} from 'lucide-react';

interface BacktestSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BacktestConfig;
  onSave: (newConfig: BacktestConfig) => void;
}

export const BacktestSettingsModal: React.FC<BacktestSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave
}) => {
  const [localConfig, setLocalConfig] = useState<BacktestConfig>({ ...config });

  if (!isOpen) return null;

  const handleReset = () => {
    setLocalConfig({
      initialCapital: 10000,
      commissionType: 'PER_TRADE',
      commissionValue: 2.0,
      slippagePips: 0.5,
      assumedSpreadPips: 1.5,
      useHistoricalSpread: false,
      intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
      executionModel: 'NEXT_BAR_OPEN'
    });
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-[#0B101D] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0E1526]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Backtest Execution Parameters</h2>
              <p className="text-xs text-slate-400">Configure institutional capital, cost models, and fill mechanics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* 1. Starting Capital */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Starting Capital (USD)
              </label>
              <span className="text-[11px] text-slate-400">Base simulation equity</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[5000, 10000, 50000, 100000].map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setLocalConfig(prev => ({ ...prev, initialCapital: amount }))}
                  className={`py-1.5 px-2 rounded-md font-medium border text-center transition-all ${
                    localConfig.initialCapital === amount
                      ? 'bg-blue-600/20 border-cyan-500 text-cyan-300 shadow-sm'
                      : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ${amount.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="100"
              step="500"
              value={localConfig.initialCapital}
              onChange={e => setLocalConfig(prev => ({ ...prev, initialCapital: Math.max(100, Number(e.target.value)) }))}
              className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg px-3 py-2 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* 2. Execution & Timing Model */}
          <div className="space-y-3 pt-4 border-t border-[#1E293B]">
            <label className="font-medium text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              Execution Timing Model
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, executionModel: 'NEXT_BAR_OPEN' }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  localConfig.executionModel === 'NEXT_BAR_OPEN'
                    ? 'bg-blue-500/10 border-blue-500/50 text-cyan-300'
                    : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs mb-1">Next Bar Open (Realistic)</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Evaluates signal at bar close [i-1], enters immediately on open of bar [i]. Zero look-ahead.
                </p>
              </div>

              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, executionModel: 'BAR_CLOSE' }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  localConfig.executionModel === 'BAR_CLOSE'
                    ? 'bg-blue-500/10 border-blue-500/50 text-cyan-300'
                    : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs mb-1">Same Bar Close</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Assumes instant fill at exact closing price of current candle when conditions trigger.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Intrabar Fill Policy */}
          <div className="space-y-3 pt-4 border-t border-[#1E293B]">
            <div className="flex items-center justify-between">
              <label className="font-medium text-slate-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Intrabar Ambiguity Policy
              </label>
              <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Conservative
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When both Take Profit and Stop Loss are within a single candle's High-Low range:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, intrabarPolicy: 'CONSERVATIVE_SL_FIRST' }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  localConfig.intrabarPolicy === 'CONSERVATIVE_SL_FIRST'
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                    : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs mb-1">Stop Loss First (Recommended)</div>
                <p className="text-[11px] text-slate-400">Assumes worst-case fill: Stop Loss was hit before Take Profit.</p>
              </div>
              <div
                onClick={() => setLocalConfig(prev => ({ ...prev, intrabarPolicy: 'AMBIGUOUS' }))}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  localConfig.intrabarPolicy === 'AMBIGUOUS'
                    ? 'bg-blue-500/10 border-blue-500/50 text-cyan-300'
                    : 'bg-[#131B2E] border-[#1E293B] text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-200 text-xs mb-1">Proportional Direction</div>
                <p className="text-[11px] text-slate-400">Infers path based on candle open and close trend momentum.</p>
              </div>
            </div>
          </div>

          {/* 4. Friction & Costs (Spread, Commission, Slippage) */}
          <div className="space-y-3 pt-4 border-t border-[#1E293B]">
            <div className="font-medium text-slate-200">Friction & Trading Costs</div>
            <div className="grid grid-cols-3 gap-3">
              {/* Spread */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Assumed Spread (Pips)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={localConfig.assumedSpreadPips}
                  onChange={e => setLocalConfig(prev => ({ ...prev, assumedSpreadPips: Number(e.target.value) }))}
                  className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Slippage */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Slippage (Pips)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={localConfig.slippagePips}
                  onChange={e => setLocalConfig(prev => ({ ...prev, slippagePips: Number(e.target.value) }))}
                  className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Commission */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">Commission ($ / Trade)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={localConfig.commissionValue}
                  onChange={e => setLocalConfig(prev => ({ ...prev, commissionValue: Number(e.target.value) }))}
                  className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#1E293B] bg-[#0E1526]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-[#1E293B] text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Apply Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
