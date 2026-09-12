import React, { useState, useEffect, useMemo } from 'react';
import { usePredictionState } from '../../context/PredictionStateContext';
import { StrategyStorageService } from '../../services/strategyStorage';
import { BacktestConfig, StrategyDefinition } from '../../types';
import { BacktestOverviewTab } from './BacktestOverviewTab';
import { BacktestTradeListTab } from './BacktestTradeListTab';
import { BacktestPerformanceTab } from './BacktestPerformanceTab';
import { BacktestDrawdownTab } from './BacktestDrawdownTab';
import { BacktestMonthlyReturnsTab } from './BacktestMonthlyReturnsTab';
import { BacktestAssumptionsTab } from './BacktestAssumptionsTab';
import { BacktestSettingsModal } from './BacktestSettingsModal';
import { 
  Play, 
  RotateCcw, 
  ArrowLeft, 
  Bookmark, 
  Settings, 
  Download, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Layers, 
  ChevronDown,
  Sparkles,
  Database,
  BarChart2
} from 'lucide-react';

type BacktestTab = 'OVERVIEW' | 'TRADES' | 'PERFORMANCE' | 'DRAWDOWN' | 'MONTHLY' | 'ASSUMPTIONS';

export const BacktestView: React.FC = () => {
  const {
    activeStrategy,
    setActiveStrategy,
    activeBacktestResult,
    backtestStatus,
    backtestError,
    runBacktestSimulation,
    setActiveView
  } = usePredictionState();

  const [activeTab, setActiveTab] = useState<BacktestTab>('OVERVIEW');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [strategyDropdownOpen, setStrategyDropdownOpen] = useState(false);

  // Local backtest parameters
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    initialCapital: 10000,
    commissionType: 'PER_TRADE',
    commissionValue: 2.0,
    slippagePips: 0.5,
    assumedSpreadPips: 1.5,
    useHistoricalSpread: false,
    intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
    executionModel: 'NEXT_BAR_OPEN'
  });

  // Available strategies & templates for quick switcher
  const availableStrategies = useMemo(() => {
    const saved = StrategyStorageService.getSavedStrategies();
    const templates = StrategyStorageService.getAllTemplates();
    return {
      saved,
      templates
    };
  }, [activeStrategy]);

  // Check if strategy was modified since last backtest
  const isStrategyModified = useMemo(() => {
    if (!activeBacktestResult || !activeStrategy) return false;
    // Check if name, symbol, timeframe, or updated timestamp changed
    if (activeBacktestResult.strategyName !== activeStrategy.name) return true;
    if (activeBacktestResult.symbol !== activeStrategy.symbol) return true;
    if (activeBacktestResult.timeframe !== activeStrategy.timeframe) return true;
    return false;
  }, [activeBacktestResult, activeStrategy]);

  // Run backtest on initial mount if no result exists
  useEffect(() => {
    if (!activeBacktestResult && backtestStatus === 'IDLE') {
      runBacktestSimulation(activeStrategy, backtestConfig);
    }
  }, [activeBacktestResult, backtestStatus, activeStrategy, runBacktestSimulation, backtestConfig]);

  // Handle manual backtest trigger
  const handleRunBacktest = async () => {
    await runBacktestSimulation(activeStrategy, backtestConfig);
  };

  // Handle Save as Template
  const handleSaveAsTemplate = () => {
    if (!activeStrategy) return;
    StrategyStorageService.saveAsTemplate(activeStrategy, 'Price Action');
    setToastMessage(`Strategy "${activeStrategy.name}" saved as reusable template.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle selecting a different strategy
  const handleSelectStrategy = (strat: StrategyDefinition) => {
    setActiveStrategy(strat);
    setStrategyDropdownOpen(false);
    runBacktestSimulation(strat, backtestConfig);
    setToastMessage(`Loaded strategy "${strat.name}" & executed backtest.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle Export Full Backtest JSON
  const handleExportJson = () => {
    if (!activeBacktestResult) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(activeBacktestResult, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `tradexpulse_backtest_${activeBacktestResult.strategyName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070A13] text-slate-100 overflow-y-auto min-h-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0E1729] border border-cyan-500/40 text-cyan-300 shadow-xl text-xs animate-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP CONTEXT HEADER & ACTION BAR */}
      <div className="border-b border-[#1E293B] bg-[#0A0F1E] px-6 py-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Strategy Identity & Selector */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/10 border border-blue-500/20 text-cyan-400">
              <BarChart2 className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 relative">
                <button
                  type="button"
                  onClick={() => setStrategyDropdownOpen(!strategyDropdownOpen)}
                  className="flex items-center gap-2 text-base font-bold text-slate-100 hover:text-cyan-300 transition-colors"
                >
                  <span>{activeStrategy?.name || 'Momentum Trend Continuation'}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Strategy Switcher Dropdown */}
                {strategyDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-[#0E1526] border border-[#1E293B] rounded-xl shadow-2xl z-40 p-2 text-xs space-y-1">
                    <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Saved Strategies
                    </div>
                    {availableStrategies.saved.length === 0 ? (
                      <div className="px-2 py-1 text-slate-500 text-[11px]">No saved strategies found</div>
                    ) : (
                      availableStrategies.saved.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectStrategy(s)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                            activeStrategy?.id === s.id
                              ? 'bg-blue-600/20 text-cyan-300 font-semibold'
                              : 'text-slate-300 hover:bg-[#131B2E]'
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{s.symbol}</span>
                        </button>
                      ))
                    )}

                    <div className="pt-2 px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-t border-[#1E293B]">
                      Templates
                    </div>
                    {availableStrategies.templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectStrategy(t.strategy)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                          activeStrategy?.id === t.strategy.id
                            ? 'bg-blue-600/20 text-cyan-300 font-semibold'
                            : 'text-slate-300 hover:bg-[#131B2E]'
                        }`}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{t.targetSymbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-pills: Symbol, Timeframe, Capital, Zero Lookahead */}
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#131B2E] text-slate-300 font-mono border border-[#1E293B]">
                  {activeStrategy?.symbol || 'EURUSD'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#131B2E] text-slate-300 font-mono border border-[#1E293B]">
                  {activeStrategy?.timeframe || '15m'}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#131B2E] text-slate-300 font-mono border border-[#1E293B]">
                  Initial: ${backtestConfig.initialCapital.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Zero Look-Ahead Certified
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  <Database className="w-3 h-3" />
                  Deterministic Execution
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Back to Builder */}
            <button
              onClick={() => setActiveView('strategyBuilder')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Return to Strategy Builder with current configuration preserved"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
              <span>Back to Builder</span>
            </button>

            {/* Save as Template */}
            <button
              onClick={handleSaveAsTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Save current strategy as a reusable template"
            >
              <Bookmark className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save as Template</span>
            </button>

            {/* Edit Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              title="Configure starting capital, spread, commission & slippage"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Settings</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJson}
              disabled={!activeBacktestResult}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Export complete backtest results object as JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export JSON</span>
            </button>

            {/* Run / Re-run Backtest */}
            <button
              onClick={handleRunBacktest}
              disabled={backtestStatus === 'RUNNING'}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer disabled:opacity-50"
            >
              {backtestStatus === 'RUNNING' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Backtest</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Strategy Modification Warning Banner */}
        {isStrategyModified && (
          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Strategy parameters were modified in the Strategy Builder since the last simulation.
              </span>
            </div>
            <button
              onClick={handleRunBacktest}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] border border-amber-500/40 transition-colors"
            >
              Recompute Now
            </button>
          </div>
        )}

        {/* 2. PRIMARY TAB NAVIGATION */}
        <div className="flex items-center gap-1 mt-4 pt-2 border-t border-[#162033] overflow-x-auto text-xs">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'TRADES', label: `Trade List (${activeBacktestResult?.trades.length || 0})` },
            { id: 'PERFORMANCE', label: 'Performance Analytics' },
            { id: 'DRAWDOWN', label: 'Drawdown' },
            { id: 'MONTHLY', label: 'Monthly Returns' },
            { id: 'ASSUMPTIONS', label: 'Assumptions & Audit' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BacktestTab)}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#131B2E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MAIN TAB CONTENT AREA */}
      <div className="p-6 flex-1 min-h-0">
        {backtestStatus === 'RUNNING' && (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-slate-100">Simulating Historical Candlesticks</h3>
              <p className="text-xs text-slate-400">
                Evaluating {activeStrategy?.name} against bar sequence with strict zero look-ahead bias...
              </p>
            </div>
          </div>
        )}

        {backtestStatus === 'FAILED' && (
          <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-3">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              <span>Backtest Execution Failed</span>
            </div>
            <p className="text-xs text-rose-200">{backtestError || 'Unknown simulation error occurred.'}</p>
            <button
              onClick={handleRunBacktest}
              className="px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium border border-rose-500/40"
            >
              Retry Simulation
            </button>
          </div>
        )}

        {backtestStatus !== 'RUNNING' && activeBacktestResult && (
          <>
            {activeTab === 'OVERVIEW' && (
              <BacktestOverviewTab
                result={activeBacktestResult}
                onViewTradeList={() => setActiveTab('TRADES')}
                onViewPerformance={() => setActiveTab('PERFORMANCE')}
              />
            )}

            {activeTab === 'TRADES' && (
              <BacktestTradeListTab
                trades={activeBacktestResult.trades}
                symbol={activeBacktestResult.symbol}
              />
            )}

            {activeTab === 'PERFORMANCE' && (
              <BacktestPerformanceTab result={activeBacktestResult} />
            )}

            {activeTab === 'DRAWDOWN' && (
              <BacktestDrawdownTab result={activeBacktestResult} />
            )}

            {activeTab === 'MONTHLY' && (
              <BacktestMonthlyReturnsTab
                monthlyReturns={activeBacktestResult.monthlyReturns}
              />
            )}

            {activeTab === 'ASSUMPTIONS' && (
              <BacktestAssumptionsTab
                result={activeBacktestResult}
                onEditSettings={() => setIsSettingsOpen(true)}
              />
            )}
          </>
        )}
      </div>

      {/* Settings Modal */}
      <BacktestSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={backtestConfig}
        onSave={newConfig => {
          setBacktestConfig(newConfig);
          runBacktestSimulation(activeStrategy, newConfig);
          setToastMessage('Parameters updated and simulation recomputed.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />
    </div>
  );
};
