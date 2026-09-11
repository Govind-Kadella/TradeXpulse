import React, { useState, useEffect, useMemo } from 'react';
import {
  MarketSymbol,
  Timeframe,
  StrategyDefinition,
  StrategyCondition,
  StrategyExit,
  StrategyFilter,
  BacktestConfig,
  BacktestResult,
  StrategyTemplateItem,
  IndicatorKey,
  CandlePatternKey,
  MarketStructureConditionKey
} from '../../types';
import { usePredictionState } from '../../context/PredictionStateContext';
import { StrategyEngine } from '../../services/strategyEngine';
import { BacktestEngine } from '../../services/backtestEngine';
import {
  StrategyStorageService,
  DEFAULT_STRATEGY,
  STRATEGY_TEMPLATES
} from '../../services/strategyStorage';
import { AiStrategyGenerator, AiGenerationResult } from '../../services/aiStrategyGenerator';
import { StrategyChartPreview } from './StrategyChartPreview';
import { BacktestResultsView } from './BacktestResultsView';
import {
  Sliders,
  Play,
  Save,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FolderKanban,
  Sparkles,
  BookOpen,
  Copy,
  Edit2,
  Check,
  ChevronRight,
  Shield,
  Clock,
  Layers,
  Activity,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';

const SUPPORTED_SYMBOLS: MarketSymbol[] = ['XAUUSD', 'EURUSD', 'GBPUSD', 'EURJPY'];
const SUPPORTED_TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

const INDICATOR_LIST: { key: IndicatorKey; label: string; defaultPeriod: number }[] = [
  { key: 'EMA', label: 'EMA (Exponential Moving Average)', defaultPeriod: 50 },
  { key: 'SMA', label: 'SMA (Simple Moving Average)', defaultPeriod: 20 },
  { key: 'WMA', label: 'WMA (Weighted Moving Average)', defaultPeriod: 20 },
  { key: 'RSI', label: 'RSI (Relative Strength Index)', defaultPeriod: 14 },
  { key: 'MACD', label: 'MACD (Moving Average Convergence Divergence)', defaultPeriod: 12 },
  { key: 'ATR', label: 'ATR (Average True Range)', defaultPeriod: 14 },
  { key: 'BOLLINGER', label: 'Bollinger Bands', defaultPeriod: 20 },
  { key: 'STOCHASTIC', label: 'Stochastic Oscillator', defaultPeriod: 14 },
  { key: 'ADX', label: 'ADX (Average Directional Index)', defaultPeriod: 14 },
  { key: 'VWAP', label: 'VWAP (Volume Weighted Average Price)', defaultPeriod: 1 },
  { key: 'VOLUME', label: 'Volume Flow', defaultPeriod: 20 }
];

const PATTERN_LIST: { key: CandlePatternKey; label: string }[] = [
  { key: 'BULLISH_ENGULFING', label: 'Bullish Engulfing' },
  { key: 'BEARISH_ENGULFING', label: 'Bearish Engulfing' },
  { key: 'PIN_BAR', label: 'Pin Bar (Hammer / Shooting Star)' },
  { key: 'HAMMER', label: 'Hammer' },
  { key: 'INVERTED_HAMMER', label: 'Inverted Hammer' },
  { key: 'SHOOTING_STAR', label: 'Shooting Star' },
  { key: 'MORNING_STAR', label: 'Morning Star' },
  { key: 'EVENING_STAR', label: 'Evening Star' },
  { key: 'DOJI', label: 'Doji' },
  { key: 'MARUBOZU', label: 'Marubozu' },
  { key: 'THREE_WHITE_SOLDIERS', label: 'Three White Soldiers' },
  { key: 'THREE_BLACK_CROWS', label: 'Three Black Crows' },
  { key: 'TWEEZER_BOTTOM', label: 'Tweezer Bottom' },
  { key: 'TWEEZER_TOP', label: 'Tweezer Top' }
];

const STRUCTURE_LIST: { key: MarketStructureConditionKey; label: string }[] = [
  { key: 'BOS', label: 'BOS (Break of Structure)' },
  { key: 'CHOCH', label: 'CHoCH (Change of Character)' },
  { key: 'FVG', label: 'FVG (Fair Value Gap Imbalance)' },
  { key: 'ORDER_BLOCK', label: 'Order Block (Institutional Supply/Demand)' },
  { key: 'LIQUIDITY_SWEEP', label: 'Liquidity Sweep (Stop Run)' },
  { key: 'EQH', label: 'Equal Highs (EQH)' },
  { key: 'EQL', label: 'Equal Lows (EQL)' }
];

export const StrategyBuilderView: React.FC = () => {
  const { 
    activeSymbol, 
    activeTimeframe, 
    setSymbol, 
    setTimeframe, 
    candles,
    setActiveView,
    setActiveStrategy,
    activeStrategy
  } = usePredictionState();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'create' | 'myStrategies' | 'templates' | 'generator'>('create');

  // Working Strategy Definition
  const [strategy, setStrategy] = useState<StrategyDefinition>(() => {
    return activeStrategy || {
      ...DEFAULT_STRATEGY,
      symbol: activeSymbol,
      timeframe: activeTimeframe
    };
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Backtest State
  const [backtestConfig, setBacktestConfig] = useState<BacktestConfig>({
    initialCapital: 10000,
    commissionType: 'PER_TRADE',
    commissionValue: 2.0,
    slippagePips: 0.5,
    assumedSpreadPips: 0.2,
    useHistoricalSpread: true,
    intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
    executionModel: 'NEXT_BAR_OPEN'
  });
  const [isRunningBacktest, setIsRunningBacktest] = useState(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);

  // My Strategies list
  const [savedStrategies, setSavedStrategies] = useState<StrategyDefinition[]>([]);
  const [myStratSearch, setMyStratSearch] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingName, setRenamingName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<AiGenerationResult | null>(null);

  // Sync symbol and timeframe when global controls change
  useEffect(() => {
    setStrategy(prev => ({
      ...prev,
      symbol: activeSymbol,
      timeframe: activeTimeframe
    }));
  }, [activeSymbol, activeTimeframe]);

  // Load saved strategies from storage on mount
  useEffect(() => {
    const list = StrategyStorageService.getSavedStrategies();
    setSavedStrategies(list);
  }, []);

  // Validation
  const validation = useMemo(() => {
    return StrategyEngine.validateStrategy(strategy);
  }, [strategy]);

  // Strategy Logic Explanation
  const explanation = useMemo(() => {
    return StrategyEngine.generateStrategyExplanation(strategy);
  }, [strategy]);

  // Trigger automated backtest when switching strategies or loading templates
  const executeBacktest = () => {
    if (candles.length < 15) return;
    setIsRunningBacktest(true);
    setTimeout(() => {
      try {
        const res = BacktestEngine.runBacktest(strategy, candles, backtestConfig);
        setBacktestResult(res);
      } catch (err) {
        console.error('Backtest error:', err);
      } finally {
        setIsRunningBacktest(false);
      }
    }, 100);
  };

  // Run backtest on initial candle load
  useEffect(() => {
    if (candles.length >= 20 && !backtestResult) {
      executeBacktest();
    }
  }, [candles.length]);

  // Handle saving strategy
  const handleSaveStrategy = () => {
    const updated = StrategyStorageService.saveStrategy(strategy);
    setStrategy(updated);
    setSavedStrategies(StrategyStorageService.getSavedStrategies());
    setHasUnsavedChanges(false);
    setSaveSuccessMessage(`Strategy "${updated.name}" saved successfully!`);
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Field updates
  const updateSetup = (field: keyof StrategyDefinition, value: any) => {
    setStrategy(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  // Entry condition actions
  const addEntryCondition = () => {
    const newCond: StrategyCondition = {
      id: `cond_${Date.now()}`,
      sourceType: 'INDICATOR',
      indicator: 'EMA',
      indicatorPeriod: 50,
      operator: '>',
      targetType: 'INDICATOR',
      targetIndicator: 'EMA',
      targetIndicatorPeriod: 200,
      customLabel: 'EMA 50 > EMA 200'
    };
    setStrategy(prev => ({
      ...prev,
      entryConditions: [...prev.entryConditions, newCond]
    }));
    setHasUnsavedChanges(true);
  };

  const removeEntryCondition = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      entryConditions: prev.entryConditions.filter(c => c.id !== id)
    }));
    setHasUnsavedChanges(true);
  };

  const updateEntryCondition = (id: string, patch: Partial<StrategyCondition>) => {
    setStrategy(prev => ({
      ...prev,
      entryConditions: prev.entryConditions.map(c => (c.id === id ? { ...c, ...patch } : c))
    }));
    setHasUnsavedChanges(true);
  };

  // Exit actions
  const addExitCondition = () => {
    const newExit: StrategyExit = {
      id: `exit_${Date.now()}`,
      type: 'TAKE_PROFIT',
      mode: 'R_MULTIPLE',
      value: 2.0
    };
    setStrategy(prev => ({
      ...prev,
      exitConditions: [...prev.exitConditions, newExit]
    }));
    setHasUnsavedChanges(true);
  };

  const removeExitCondition = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      exitConditions: prev.exitConditions.filter(e => e.id !== id)
    }));
    setHasUnsavedChanges(true);
  };

  const updateExitCondition = (id: string, patch: Partial<StrategyExit>) => {
    setStrategy(prev => ({
      ...prev,
      exitConditions: prev.exitConditions.map(e => (e.id === id ? { ...e, ...patch } : e))
    }));
    setHasUnsavedChanges(true);
  };

  // Filter actions
  const addFilter = () => {
    const newFilter: StrategyFilter = {
      id: `filt_${Date.now()}`,
      type: 'SESSION',
      session: 'LONDON_NEW_YORK',
      enabled: true
    };
    setStrategy(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
    setHasUnsavedChanges(true);
  };

  const removeFilter = (id: string) => {
    setStrategy(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== id)
    }));
    setHasUnsavedChanges(true);
  };

  const updateFilter = (id: string, patch: Partial<StrategyFilter>) => {
    setStrategy(prev => ({
      ...prev,
      filters: prev.filters.map(f => (f.id === id ? { ...f, ...patch } : f))
    }));
    setHasUnsavedChanges(true);
  };

  // Advanced options patch
  const updateAdvanced = (patch: Partial<StrategyDefinition['advancedOptions']>) => {
    setStrategy(prev => ({
      ...prev,
      advancedOptions: { ...prev.advancedOptions, ...patch }
    }));
    setHasUnsavedChanges(true);
  };

  // Template loader
  const handleUseTemplate = (tpl: StrategyTemplateItem) => {
    setStrategy({
      ...tpl.strategy,
      id: `strat_${Date.now()}`,
      symbol: activeSymbol,
      timeframe: activeTimeframe,
      isTemplate: false
    });
    setHasUnsavedChanges(true);
    setActiveTab('create');
    setBacktestResult(null);
  };

  // AI Generator execution
  const handleGenerateAiStrategy = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await AiStrategyGenerator.generateStrategy(aiPrompt, activeSymbol, activeTimeframe);
      setAiResult(res);
    } catch (e) {
      console.error('AI generation error:', e);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleApplyAiStrategy = () => {
    if (!aiResult) return;
    setStrategy(aiResult.strategy);
    setHasUnsavedChanges(true);
    setActiveTab('create');
    setBacktestResult(null);
  };

  return (
    <div id="strategy-builder-view" className="w-full flex-1 flex flex-col bg-[#0B101D] text-slate-100 overflow-y-auto">
      {/* 1. TOP HEADER BAR */}
      <div className="px-6 py-4 border-b border-[#1B2537] bg-[#0E1526] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-wider text-slate-100 uppercase">
                  Strategy Builder
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                  Institutional No-Code Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Create, test and optimize your trading strategies with zero coding. Use indicators, price action and AI filters.
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Selectors */}
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center gap-1.5 bg-[#162036] rounded-lg px-2.5 py-1.5 border border-[#24334D]">
            <span className="text-[11px] text-slate-400 font-medium">Market:</span>
            <select
              id="header-market-select"
              value={activeSymbol}
              onChange={e => {
                const sym = e.target.value as MarketSymbol;
                setSymbol(sym);
                updateSetup('symbol', sym);
              }}
              className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_SYMBOLS.map(s => (
                <option key={s} value={s} className="bg-[#162036] text-slate-100">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 bg-[#162036] rounded-lg px-2.5 py-1.5 border border-[#24334D]">
            <span className="text-[11px] text-slate-400 font-medium">Timeframe:</span>
            <select
              id="header-timeframe-select"
              value={activeTimeframe}
              onChange={e => {
                const tf = e.target.value as Timeframe;
                setTimeframe(tf);
                updateSetup('timeframe', tf);
              }}
              className="bg-transparent text-xs font-mono font-bold text-cyan-300 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_TIMEFRAMES.map(tf => (
                <option key={tf} value={tf} className="bg-[#162036] text-slate-100">
                  {tf}
                </option>
              ))}
            </select>
          </div>

          {/* Save Strategy Button */}
          <button
            id="save-strategy-header-btn"
            onClick={handleSaveStrategy}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-[#1B2537] hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{hasUnsavedChanges ? 'Save Changes *' : 'Save Strategy'}</span>
          </button>
        </div>
      </div>

      {/* Save feedback toast */}
      {saveSuccessMessage && (
        <div className="mx-6 mt-3 p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMessage}</span>
          </div>
          <button onClick={() => setSaveSuccessMessage(null)} className="text-slate-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. TOP BUILDER TABS */}
      <div className="px-6 pt-4 border-b border-[#1B2537] bg-[#0E1526]/50 flex items-center gap-2">
        <button
          id="tab-create-strategy"
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'create'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Create Strategy</span>
        </button>

        <button
          id="tab-my-strategies"
          onClick={() => setActiveTab('myStrategies')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'myStrategies'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderKanban className="w-3.5 h-3.5" />
          <span>My Strategies ({savedStrategies.length})</span>
        </button>

        <button
          id="tab-templates"
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'templates'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Strategy Templates ({STRATEGY_TEMPLATES.length})</span>
        </button>

        <button
          id="tab-ai-generator"
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold tracking-wide border-b-2 transition-all ${
            activeTab === 'generator'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Strategy Generator</span>
        </button>
      </div>

      {/* 3. MAIN BODY PER ACTIVE TAB */}
      <div className="p-6 space-y-6">
        {/* =================================================================== */}
        {/* TAB 1: CREATE STRATEGY WORKSPACE                                   */}
        {/* =================================================================== */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Validation Banner if errors or contradictions */}
            {(!validation.isValid || validation.warnings.length > 0) && (
              <div
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 text-xs ${
                  !validation.isValid
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                    : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                  {!validation.isValid ? (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span>
                    Strategy Validation: {!validation.isValid ? 'Rules Incomplete or Contradictory' : 'Advisories'}
                  </span>
                </div>
                {validation.errors.map((e, idx) => (
                  <div key={`err-${idx}`} className="ml-6 text-rose-300">• {e}</div>
                ))}
                {validation.contradictions.map((c, idx) => (
                  <div key={`contra-${idx}`} className="ml-6 text-rose-400 font-semibold">• {c}</div>
                ))}
                {validation.warnings.map((w, idx) => (
                  <div key={`warn-${idx}`} className="ml-6 text-amber-300">• {w}</div>
                ))}
              </div>
            )}

            {/* 2-Column Strategy Builder Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT COLUMN: 1. Setup, 3. Exits, 5. Advanced */}
              <div className="space-y-6">
                {/* 1. STRATEGY SETUP */}
                <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
                        1
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Strategy Setup
                      </h2>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      v{strategy.version || 1}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Strategy Name</label>
                      <input
                        type="text"
                        value={strategy.name}
                        onChange={e => updateSetup('name', e.target.value)}
                        placeholder="e.g. Institutional Trend Rider"
                        className="w-full bg-[#131B2E] border border-[#24334D] rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={strategy.description || ''}
                        onChange={e => updateSetup('description', e.target.value)}
                        placeholder="Explain setup logic, rationale, or rules..."
                        className="w-full bg-[#131B2E] border border-[#24334D] rounded-lg px-3 py-2 text-slate-100 focus:border-cyan-400 focus:outline-none text-xs resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Market Symbol</label>
                        <select
                          value={strategy.symbol}
                          onChange={e => {
                            const sym = e.target.value as MarketSymbol;
                            setSymbol(sym);
                            updateSetup('symbol', sym);
                          }}
                          className="w-full bg-[#131B2E] border border-[#24334D] rounded-lg px-3 py-2 text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none text-xs"
                        >
                          {SUPPORTED_SYMBOLS.map(s => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 font-semibold mb-1">Timeframe</label>
                        <select
                          value={strategy.timeframe}
                          onChange={e => {
                            const tf = e.target.value as Timeframe;
                            setTimeframe(tf);
                            updateSetup('timeframe', tf);
                          }}
                          className="w-full bg-[#131B2E] border border-[#24334D] rounded-lg px-3 py-2 text-cyan-300 font-mono font-bold focus:border-cyan-400 focus:outline-none text-xs"
                        >
                          {SUPPORTED_TIMEFRAMES.map(tf => (
                            <option key={tf} value={tf}>
                              {tf}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1.5">Strategy Direction</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['LONG_ONLY', 'SHORT_ONLY', 'BOTH'] as const).map(dir => (
                          <button
                            key={dir}
                            type="button"
                            onClick={() => updateSetup('direction', dir)}
                            className={`py-2 px-2 rounded-lg text-xs font-semibold text-center transition-all ${
                              strategy.direction === dir
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                                : 'bg-[#131B2E] text-slate-400 border border-[#24334D] hover:text-slate-200'
                            }`}
                          >
                            {dir === 'LONG_ONLY' ? 'Long Only' : dir === 'SHORT_ONLY' ? 'Short Only' : 'Both (Bi-dir)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. EXIT CONDITIONS */}
                <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
                        3
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Exit Conditions
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={addExitCondition}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Condition</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {strategy.exitConditions.map((exit, idx) => (
                      <div
                        key={exit.id}
                        className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-mono text-slate-500">{idx + 1}.</span>
                          <select
                            value={exit.type}
                            onChange={e => updateExitCondition(exit.id, { type: e.target.value as any })}
                            className="bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-slate-200 font-medium"
                          >
                            <option value="STOP_LOSS">Stop Loss</option>
                            <option value="TAKE_PROFIT">Take Profit</option>
                            <option value="TRAILING_STOP">Trailing Stop</option>
                            <option value="TIME_EXIT">Time-based Exit</option>
                          </select>

                          {exit.type !== 'TIME_EXIT' ? (
                            <>
                              <select
                                value={exit.mode}
                                onChange={e => updateExitCondition(exit.id, { mode: e.target.value as any })}
                                className="bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-slate-300"
                              >
                                <option value="R_MULTIPLE">R Multiple</option>
                                <option value="ATR_MULTIPLE">ATR Multiple</option>
                                <option value="PERCENTAGE">Percentage (%)</option>
                                <option value="POINTS">Fixed Points</option>
                              </select>
                              <input
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={exit.value}
                                onChange={e => updateExitCondition(exit.id, { value: parseFloat(e.target.value) || 0 })}
                                className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono font-bold text-center"
                              />
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">After</span>
                              <input
                                type="number"
                                min="1"
                                value={exit.timeBars || 20}
                                onChange={e => updateExitCondition(exit.id, { timeBars: parseInt(e.target.value, 10) || 1 })}
                                className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono text-center"
                              />
                              <span className="text-slate-400">bars</span>
                            </div>
                          )}
                        </div>

                        {strategy.exitConditions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeExitCondition(exit.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. ADVANCED OPTIONS */}
                <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
                        5
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Advanced Options
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* AI Market Bias Filter */}
                    <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={strategy.advancedOptions.useAiMarketBiasFilter}
                            onChange={e => updateAdvanced({ useAiMarketBiasFilter: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                          />
                          <span className="font-semibold text-slate-200">Use AI Market Bias Filter</span>
                        </label>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                          Neural Alignment
                        </span>
                      </div>

                      {strategy.advancedOptions.useAiMarketBiasFilter && (
                        <div className="pt-2 border-t border-[#24334D]">
                          <select
                            value={strategy.advancedOptions.aiBiasMode}
                            onChange={e => updateAdvanced({ aiBiasMode: e.target.value as any })}
                            className="w-full bg-[#162036] border border-[#24334D] rounded px-2.5 py-1.5 text-slate-200"
                          >
                            <option value="STRICT_DIRECTION">Only trade in AI direction (Strict)</option>
                            <option value="ALLOW_IF_NOT_OPPOSING">Allow trades if AI not opposing</option>
                            <option value="BLOCK_NO_TRADE">Filter out NO TRADE (Chop regime)</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Break Even at 1.0R */}
                    <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={strategy.advancedOptions.enableBreakEven}
                          onChange={e => updateAdvanced({ enableBreakEven: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold text-slate-200">Break Even at</span>
                      </label>
                      <div className="flex items-center gap-1.5 font-mono">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          disabled={!strategy.advancedOptions.enableBreakEven}
                          value={strategy.advancedOptions.breakEvenTriggerR}
                          onChange={e => updateAdvanced({ breakEvenTriggerR: parseFloat(e.target.value) || 1.0 })}
                          className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-bold text-center disabled:opacity-50"
                        />
                        <span className="text-slate-400">R</span>
                      </div>
                    </div>

                    {/* Enable Trailing Stop */}
                    <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={strategy.advancedOptions.enableTrailingStop}
                          onChange={e => updateAdvanced({ enableTrailingStop: e.target.checked })}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                        <span className="font-semibold text-slate-200">Enable Trailing Stop</span>
                      </label>
                      <div className="flex items-center gap-1.5 font-mono">
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          disabled={!strategy.advancedOptions.enableTrailingStop}
                          value={strategy.advancedOptions.trailingStopDistanceR}
                          onChange={e => updateAdvanced({ trailingStopDistanceR: parseFloat(e.target.value) || 1.0 })}
                          className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-bold text-center disabled:opacity-50"
                        />
                        <span className="text-slate-400">R</span>
                      </div>
                    </div>

                    {/* Custom Risk per Trade */}
                    <div className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-200">Risk per Trade</div>
                        <div className="text-[11px] text-slate-400">Position sized from stop loss distance</div>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="5.0"
                          value={strategy.riskManagement.riskPerTradePercent}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 1.0;
                            setStrategy(prev => ({
                              ...prev,
                              riskManagement: { ...prev.riskManagement, riskPerTradePercent: val },
                              advancedOptions: { ...prev.advancedOptions, customRiskPerTradePercent: val }
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-bold text-center"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: 2. Entry Conditions & 4. Additional Filters */}
              <div className="space-y-6">
                {/* 2. ENTRY CONDITIONS */}
                <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
                        2
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Entry Conditions
                      </h2>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Logic selector: ALL (AND) vs ANY (OR) */}
                      <div className="flex items-center bg-[#131B2E] rounded-lg p-0.5 border border-[#24334D]">
                        <button
                          type="button"
                          onClick={() => updateSetup('conditionGroupLogic', 'ALL')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                            strategy.conditionGroupLogic === 'ALL'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          ALL (AND)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateSetup('conditionGroupLogic', 'ANY')}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                            strategy.conditionGroupLogic === 'ANY'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          ANY (OR)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={addEntryCondition}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Condition</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditions List */}
                  <div className="space-y-3">
                    {strategy.entryConditions.map((cond, idx) => (
                      <div
                        key={cond.id}
                        className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3.5 space-y-2.5 text-xs transition-all hover:border-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <GripVertical className="w-3.5 h-3.5 text-slate-600 cursor-grab" />
                            <span className="font-mono text-slate-400 font-bold">Rule #{idx + 1}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                              {cond.sourceType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {strategy.entryConditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEntryCondition(cond.id)}
                              className="text-slate-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Condition Row Controls */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          {/* Source Type Selector */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Source</label>
                            <select
                              value={cond.sourceType}
                              onChange={e => {
                                const st = e.target.value as any;
                                updateEntryCondition(cond.id, {
                                  sourceType: st,
                                  operator: st === 'PRICE_ACTION' || st === 'MARKET_STRUCTURE' ? '=' : '>'
                                });
                              }}
                              className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                            >
                              <option value="INDICATOR">Indicator</option>
                              <option value="PRICE">Price Level</option>
                              <option value="PRICE_ACTION">Price Action (Pattern)</option>
                              <option value="MARKET_STRUCTURE">Market Structure (SMC)</option>
                            </select>
                          </div>

                          {/* Specific Source Target */}
                          {cond.sourceType === 'INDICATOR' && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Indicator</label>
                                <select
                                  value={cond.indicator || 'EMA'}
                                  onChange={e => {
                                    const ind = e.target.value as IndicatorKey;
                                    const found = INDICATOR_LIST.find(i => i.key === ind);
                                    updateEntryCondition(cond.id, {
                                      indicator: ind,
                                      indicatorPeriod: found ? found.defaultPeriod : 14
                                    });
                                  }}
                                  className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                                >
                                  {INDICATOR_LIST.map(i => (
                                    <option key={i.key} value={i.key}>
                                      {i.key}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Period</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="500"
                                  value={cond.indicatorPeriod || 14}
                                  onChange={e => updateEntryCondition(cond.id, { indicatorPeriod: parseInt(e.target.value, 10) || 14 })}
                                  className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-cyan-300 font-mono text-center text-xs"
                                />
                              </div>
                            </>
                          )}

                          {cond.sourceType === 'PRICE' && (
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Price Field</label>
                              <select
                                value={cond.priceKey || 'CLOSE'}
                                onChange={e => updateEntryCondition(cond.id, { priceKey: e.target.value as any })}
                                className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                              >
                                <option value="CLOSE">Close Price</option>
                                <option value="OPEN">Open Price</option>
                                <option value="HIGH">High Price</option>
                                <option value="LOW">Low Price</option>
                                <option value="PREVIOUS_CLOSE">Previous Close</option>
                              </select>
                            </div>
                          )}

                          {cond.sourceType === 'PRICE_ACTION' && (
                            <div className="sm:col-span-2">
                              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Pattern Detection</label>
                              <select
                                value={cond.patternKey || 'BULLISH_ENGULFING'}
                                onChange={e => updateEntryCondition(cond.id, { patternKey: e.target.value as any })}
                                className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                              >
                                {PATTERN_LIST.map(p => (
                                  <option key={p.key} value={p.key}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {cond.sourceType === 'MARKET_STRUCTURE' && (
                            <>
                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Structure Type</label>
                                <select
                                  value={cond.structureKey || 'BOS'}
                                  onChange={e => updateEntryCondition(cond.id, { structureKey: e.target.value as any })}
                                  className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                                >
                                  {STRUCTURE_LIST.map(s => (
                                    <option key={s.key} value={s.key}>
                                      {s.key}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Direction</label>
                                <select
                                  value={cond.structureDirection || 'BULLISH'}
                                  onChange={e => updateEntryCondition(cond.id, { structureDirection: e.target.value as any })}
                                  className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                                >
                                  <option value="BULLISH">Bullish</option>
                                  <option value="BEARISH">Bearish</option>
                                </select>
                              </div>
                            </>
                          )}

                          {/* Operator */}
                          <div>
                            <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Operator</label>
                            <select
                              value={cond.operator}
                              onChange={e => updateEntryCondition(cond.id, { operator: e.target.value as any })}
                              className="w-full bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs"
                            >
                              <option value=">">Greater than (&gt;)</option>
                              <option value="<">Less than (&lt;)</option>
                              <option value=">=">&gt;=</option>
                              <option value="<=">&lt;=</option>
                              <option value="=">Equals (=)</option>
                              <option value="!=">Not Equals (!=)</option>
                              <option value="crosses_above">Crosses Above (✕↑)</option>
                              <option value="crosses_below">Crosses Below (✕↓)</option>
                              <option value="increases">Increases</option>
                              <option value="decreases">Decreases</option>
                            </select>
                          </div>

                          {/* Target Value / Indicator */}
                          {cond.sourceType !== 'PRICE_ACTION' && cond.sourceType !== 'MARKET_STRUCTURE' && (
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Compare Target</label>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={cond.targetType}
                                  onChange={e => updateEntryCondition(cond.id, { targetType: e.target.value as any })}
                                  className="bg-[#162036] border border-[#24334D] rounded px-2 py-1.5 text-slate-200 text-xs flex-1"
                                >
                                  <option value="INDICATOR">Indicator</option>
                                  <option value="VALUE">Constant Value</option>
                                  <option value="PRICE">Price Level</option>
                                </select>

                                {cond.targetType === 'VALUE' ? (
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={cond.targetValue ?? 50}
                                    onChange={e => updateEntryCondition(cond.id, { targetValue: parseFloat(e.target.value) || 0 })}
                                    className="w-16 bg-[#162036] border border-[#24334D] rounded px-1.5 py-1.5 text-cyan-300 font-mono text-center text-xs"
                                  />
                                ) : cond.targetType === 'INDICATOR' ? (
                                  <div className="flex items-center gap-1">
                                    <select
                                      value={cond.targetIndicator || 'EMA'}
                                      onChange={e => updateEntryCondition(cond.id, { targetIndicator: e.target.value as any })}
                                      className="bg-[#162036] border border-[#24334D] rounded px-1.5 py-1.5 text-slate-200 text-xs"
                                    >
                                      {INDICATOR_LIST.map(i => (
                                        <option key={i.key} value={i.key}>{i.key}</option>
                                      ))}
                                    </select>
                                    <input
                                      type="number"
                                      min="1"
                                      value={cond.targetIndicatorPeriod || 200}
                                      onChange={e => updateEntryCondition(cond.id, { targetIndicatorPeriod: parseInt(e.target.value, 10) || 200 })}
                                      className="w-14 bg-[#162036] border border-[#24334D] rounded px-1 py-1.5 text-cyan-300 font-mono text-center text-xs"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. ADDITIONAL FILTERS */}
                <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center text-xs font-bold font-mono">
                        4
                      </span>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Additional Filters
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={addFilter}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Filter</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {strategy.filters.map(filt => (
                      <div
                        key={filt.id}
                        className="bg-[#131B2E] border border-[#24334D] rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={filt.enabled}
                            onChange={e => updateFilter(filt.id, { enabled: e.target.checked })}
                            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                          />
                          <select
                            value={filt.type}
                            onChange={e => updateFilter(filt.id, { type: e.target.value as any })}
                            className="bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-slate-200 font-medium"
                          >
                            <option value="SESSION">Trading Session</option>
                            <option value="NEWS">News Filter (Blackout)</option>
                            <option value="MIN_ATR">Minimum ATR(14)</option>
                            <option value="MAX_SPREAD">Maximum Spread (pips)</option>
                          </select>
                        </div>

                        {filt.type === 'SESSION' && (
                          <select
                            value={filt.session || 'LONDON_NEW_YORK'}
                            onChange={e => updateFilter(filt.id, { session: e.target.value as any })}
                            className="bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono text-xs"
                          >
                            <option value="ALL">24/7 (All Sessions)</option>
                            <option value="ASIAN">Asian (00:00 - 08:00 UTC)</option>
                            <option value="LONDON">London (07:00 - 16:00 UTC)</option>
                            <option value="NEW_YORK">New York (12:00 - 21:00 UTC)</option>
                            <option value="LONDON_NEW_YORK">London + NY Overlap (07:00 - 21:00 UTC)</option>
                          </select>
                        )}

                        {filt.type === 'NEWS' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Blackout ±</span>
                            <input
                              type="number"
                              min="5"
                              max="120"
                              value={filt.newsBlackoutMinutes || 30}
                              onChange={e => updateFilter(filt.id, { newsBlackoutMinutes: parseInt(e.target.value, 10) || 30 })}
                              className="w-14 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono text-center"
                            />
                            <span className="text-slate-400">min</span>
                          </div>
                        )}

                        {filt.type === 'MIN_ATR' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">&gt;</span>
                            <input
                              type="number"
                              step="0.1"
                              value={filt.minAtrValue || 1.0}
                              onChange={e => updateFilter(filt.id, { minAtrValue: parseFloat(e.target.value) || 0.5 })}
                              className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono text-center"
                            />
                          </div>
                        )}

                        {filt.type === 'MAX_SPREAD' && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">&lt;</span>
                            <input
                              type="number"
                              step="0.1"
                              value={filt.maxSpreadValue || 2.0}
                              onChange={e => updateFilter(filt.id, { maxSpreadValue: parseFloat(e.target.value) || 1.5 })}
                              className="w-16 bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-cyan-300 font-mono text-center"
                            />
                            <span className="text-slate-400">pips</span>
                          </div>
                        )}

                        {strategy.filters.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFilter(filt.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* DYNAMIC PLAIN-ENGLISH STRATEGY LOGIC EXPLANATION */}
            <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#1B2537]">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Strategy Logic & Execution Blueprint
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Auto-compiled from rules
                </span>
              </div>

              <div className="text-xs text-slate-300 font-mono leading-relaxed bg-[#090E1A] p-4 rounded-lg border border-[#162036] space-y-2">
                <p className="font-semibold text-cyan-300 font-sans">{explanation.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-sans text-xs">
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Entry Conditions ({strategy.conditionGroupLogic}):
                    </div>
                    {explanation.entryRules.map((r, i) => (
                      <div key={`er-${i}`} className="text-slate-300 py-0.5 font-mono text-[11px]">• {r}</div>
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                      Exits & Risk Management:
                    </div>
                    {explanation.exitRules.map((r, i) => (
                      <div key={`ex-${i}`} className="text-slate-300 py-0.5 font-mono text-[11px]">• {r}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STRATEGY CHART PREVIEW */}
            <StrategyChartPreview
              candles={candles}
              strategy={strategy}
              backtestResult={backtestResult}
              symbol={activeSymbol}
              timeframe={activeTimeframe}
              onRunBacktest={executeBacktest}
              isRunningBacktest={isRunningBacktest}
            />

            {/* BACKTEST CONTROLS BAR */}
            <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Capital:</span>
                  <input
                    type="number"
                    value={backtestConfig.initialCapital}
                    onChange={e => setBacktestConfig(prev => ({ ...prev, initialCapital: parseFloat(e.target.value) || 10000 }))}
                    className="w-20 bg-[#131B2E] border border-[#24334D] rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Slippage:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={backtestConfig.slippagePips}
                    onChange={e => setBacktestConfig(prev => ({ ...prev, slippagePips: parseFloat(e.target.value) || 0 }))}
                    className="w-16 bg-[#131B2E] border border-[#24334D] rounded px-2 py-1 text-slate-200 font-mono text-xs"
                  />
                  <span className="text-slate-500">pips</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Intrabar Policy:</span>
                  <select
                    value={backtestConfig.intrabarPolicy}
                    onChange={e => setBacktestConfig(prev => ({ ...prev, intrabarPolicy: e.target.value as any }))}
                    className="bg-[#131B2E] border border-[#24334D] rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    <option value="CONSERVATIVE_SL_FIRST">Conservative (SL First)</option>
                    <option value="AMBIGUOUS">Strict Ambiguous Policy</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="open-full-backtest-btn"
                  onClick={() => {
                    setActiveStrategy(strategy);
                    setActiveView('backtest');
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#131B2E] hover:bg-[#1C263D] border border-cyan-500/30 text-cyan-300 font-bold rounded-lg text-xs tracking-wider uppercase transition-all"
                  title="Open in dedicated full institutional backtest analysis center"
                >
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Full Backtest Page &rarr;</span>
                </button>

                <button
                  id="run-backtest-main-btn"
                  onClick={() => {
                    setActiveStrategy(strategy);
                    executeBacktest();
                  }}
                  disabled={isRunningBacktest || candles.length < 15}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-md"
                >
                  <Play className={`w-4 h-4 ${isRunningBacktest ? 'animate-spin' : ''}`} />
                  <span>{isRunningBacktest ? 'Running Backtest...' : 'Quick Backtest'}</span>
                </button>
              </div>
            </div>

            {/* BACKTEST RESULTS PANEL */}
            {backtestResult && (
              <BacktestResultsView
                result={backtestResult}
                onRerun={executeBacktest}
              />
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: MY STRATEGIES (SAVED LIST)                                  */}
        {/* =================================================================== */}
        {activeTab === 'myStrategies' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                  Saved Quantitative Strategies ({savedStrategies.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage, duplicate, edit, and backtest your customized algorithmic setups.
                </p>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search strategies..."
                  value={myStratSearch}
                  onChange={e => setMyStratSearch(e.target.value)}
                  className="bg-[#131B2E] border border-[#24334D] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedStrategies
                .filter(s => s.name.toLowerCase().includes(myStratSearch.toLowerCase()) || s.symbol.toLowerCase().includes(myStratSearch.toLowerCase()))
                .map(strat => (
                  <div
                    key={strat.id}
                    className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-4 flex flex-col justify-between hover:border-slate-600 transition-all space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold text-xs">
                            {strat.symbol}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {strat.timeframe}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          v{strat.version || 1} • {new Date(strat.updatedAt).toISOString().slice(0, 10)}
                        </span>
                      </div>

                      {renamingId === strat.id ? (
                        <div className="flex items-center gap-1 mb-2">
                          <input
                            type="text"
                            value={renamingName}
                            onChange={e => setRenamingName(e.target.value)}
                            className="bg-[#162036] border border-[#24334D] rounded px-2 py-1 text-xs text-slate-100 flex-1"
                          />
                          <button
                            onClick={() => {
                              StrategyStorageService.renameStrategy(strat.id, renamingName);
                              setSavedStrategies(StrategyStorageService.getSavedStrategies());
                              setRenamingId(null);
                            }}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-slate-100 leading-tight">
                          {strat.name}
                        </h3>
                      )}

                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {strat.description || 'No description provided.'}
                      </p>

                      <div className="mt-3 pt-2 border-t border-[#162036] flex flex-wrap gap-1.5 text-[10px] text-slate-400 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {strat.direction.replace(/_/g, ' ')}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {strat.entryConditions.length} Entry Rules
                        </span>
                        {strat.advancedOptions.useAiMarketBiasFilter && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            AI Bias Active
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-[#1B2537] flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setRenamingId(strat.id);
                            setRenamingName(strat.name);
                          }}
                          title="Rename strategy"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const dupe = StrategyStorageService.duplicateStrategy(strat.id);
                            if (dupe) setSavedStrategies(StrategyStorageService.getSavedStrategies());
                          }}
                          title="Duplicate strategy"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (deleteConfirmId === strat.id) {
                              StrategyStorageService.deleteStrategy(strat.id);
                              setSavedStrategies(StrategyStorageService.getSavedStrategies());
                              setDeleteConfirmId(null);
                            } else {
                              setDeleteConfirmId(strat.id);
                            }
                          }}
                          title={deleteConfirmId === strat.id ? 'Click to confirm delete' : 'Delete'}
                          className={`p-1.5 rounded transition-colors ${
                            deleteConfirmId === strat.id
                              ? 'bg-rose-600 text-white font-bold text-[10px] px-2'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                          }`}
                        >
                          {deleteConfirmId === strat.id ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setStrategy(strat);
                          setSymbol(strat.symbol);
                          setTimeframe(strat.timeframe);
                          setActiveTab('create');
                          setBacktestResult(null);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        <span>Open in Builder</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: STRATEGY TEMPLATES                                          */}
        {/* =================================================================== */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                Institutional Strategy Templates ({STRATEGY_TEMPLATES.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ready-to-deploy strategy templates built by quantitative analysts. Load, inspect, optimize, or backtest immediately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {STRATEGY_TEMPLATES.map(tpl => (
                <div
                  key={tpl.id}
                  className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 flex flex-col justify-between hover:border-slate-600 transition-all space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        {tpl.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {tpl.complexity}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-100">{tpl.title}</h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                      {tpl.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tpl.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-[#131B2E] border border-[#24334D] text-[10px] text-slate-300 font-mono">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#162036] flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Target: {tpl.targetSymbol} • {tpl.targetTimeframe}</span>
                      <span>{tpl.strategy.entryConditions.length} Rules</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUseTemplate(tpl)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                  >
                    <span>Use Template in Builder</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: AI STRATEGY GENERATOR                                       */}
        {/* =================================================================== */}
        {activeTab === 'generator' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wide text-slate-100">
                AI Natural Language Strategy Generator
              </h2>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                Describe your trading idea in plain English. The TradeXpulse quantitative engine translates it into a deterministic, look-ahead-free strategy with strict mathematical rules.
              </p>
            </div>

            {/* Prompt Box */}
            <div className="bg-[#0E1526] border border-[#1B2537] rounded-xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Enter Your Strategy Concept:
                </label>
                <textarea
                  rows={4}
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. Build a trend-following XAUUSD M15 strategy using EMA 50/200, RSI momentum above 50 and bullish break of structure with 1:2.5 R:R and London session filter."
                  className="w-full bg-[#131B2E] border border-[#24334D] rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-cyan-400 resize-none font-mono"
                />
              </div>

              {/* Quick suggestions */}
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Quick Prompts:
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    'Build a trend-following XAUUSD M15 strategy using EMA 50/200, RSI and bullish market structure.',
                    'Create an ICT EURUSD M5 scalp strategy with Fair Value Gaps, liquidity sweeps and 1:2 R:R.',
                    'Mean-reversion GBPUSD M15 strategy trading oversold RSI below 30 with Bollinger lower band touch and pin bar.',
                    'AI-assisted trend follower on XAUUSD that only trades in AI direction with 1:3 R:R and trailing stop.'
                  ].map((preset, idx) => (
                    <button
                      key={`preset-${idx}`}
                      type="button"
                      onClick={() => setAiPrompt(preset)}
                      className="px-2.5 py-1 rounded-lg bg-[#131B2E] hover:bg-slate-800 text-slate-300 border border-[#24334D] text-[11px] text-left transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateAiStrategy}
                disabled={isGeneratingAi || !aiPrompt.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                <span>{isGeneratingAi ? 'Synthesizing Quantitative Strategy...' : 'Generate Quantitative Strategy'}</span>
              </button>
            </div>

            {/* Generated Strategy Preview Card */}
            {aiResult && (
              <div className="bg-[#0E1526] border border-cyan-500/40 rounded-xl p-5 space-y-4 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Generated Strategy: {aiResult.suggestedName}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                    Deterministic Validation: Passed
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-[#131B2E] p-3 rounded-lg border border-[#24334D]">
                  {aiResult.explanation}
                </p>

                {/* Parsed elements tags */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                    Synthesized Architecture Elements:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {aiResult.matchedElements.map((el, idx) => (
                      <span
                        key={`m-${idx}`}
                        className="px-2.5 py-1 rounded bg-[#162036] text-cyan-300 border border-cyan-500/20 text-xs font-mono"
                      >
                        ✓ {el}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <div className="pt-3 border-t border-[#1B2537] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiStrategy}
                    className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs tracking-wide uppercase transition-all shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply to Builder & Backtest</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
