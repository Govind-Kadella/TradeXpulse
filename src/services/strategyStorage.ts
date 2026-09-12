import {
  StrategyDefinition,
  StrategyTemplateItem,
  MarketSymbol,
  Timeframe
} from '../types';

const STORAGE_KEY = 'tradexpulse_saved_strategies';

export const DEFAULT_STRATEGY: StrategyDefinition = {
  id: 'strat_xauusd_trend_default',
  name: 'XAUUSD Trend Rider',
  description: 'Trend following strategy using EMA, RSI and price action confirmation.',
  symbol: 'XAUUSD',
  timeframe: 'M15',
  direction: 'LONG_ONLY',
  conditionGroupLogic: 'ALL',
  entryConditions: [
    {
      id: 'cond_ema_50_200',
      sourceType: 'INDICATOR',
      indicator: 'EMA',
      indicatorPeriod: 50,
      operator: '>',
      targetType: 'INDICATOR',
      targetIndicator: 'EMA',
      targetIndicatorPeriod: 200,
      customLabel: 'EMA (50) > EMA (200)'
    },
    {
      id: 'cond_rsi_50',
      sourceType: 'INDICATOR',
      indicator: 'RSI',
      indicatorPeriod: 14,
      operator: '>',
      targetType: 'VALUE',
      targetValue: 50,
      customLabel: 'RSI (14) > 50'
    },
    {
      id: 'cond_bullish_engulfing',
      sourceType: 'PRICE_ACTION',
      patternKey: 'BULLISH_ENGULFING',
      operator: '=',
      targetType: 'PATTERN',
      customLabel: 'Price Action Bullish Engulfing'
    },
    {
      id: 'cond_vol_average',
      sourceType: 'INDICATOR',
      indicator: 'VOLUME',
      operator: '>',
      targetType: 'INDICATOR',
      targetIndicator: 'VOLUME',
      targetIndicatorSubKey: 'AVERAGE',
      targetValue: 1.5,
      customLabel: 'Volume > 1.5x Average'
    }
  ],
  exitConditions: [
    {
      id: 'exit_tp',
      type: 'TAKE_PROFIT',
      mode: 'R_MULTIPLE',
      value: 2.0
    },
    {
      id: 'exit_sl',
      type: 'STOP_LOSS',
      mode: 'R_MULTIPLE',
      value: 1.0
    },
    {
      id: 'exit_rsi_or',
      type: 'INDICATOR_EXIT',
      mode: 'R_MULTIPLE',
      value: 0,
      condition: {
        id: 'cond_exit_rsi',
        sourceType: 'INDICATOR',
        indicator: 'RSI',
        indicatorPeriod: 14,
        operator: '<',
        targetType: 'VALUE',
        targetValue: 30,
        customLabel: 'OR RSI (14) < 30'
      }
    }
  ],
  filters: [
    {
      id: 'filt_session',
      type: 'SESSION',
      session: 'LONDON_NEW_YORK',
      enabled: true
    },
    {
      id: 'filt_news',
      type: 'NEWS',
      newsBlackoutMinutes: 30,
      enabled: true
    },
    {
      id: 'filt_min_atr',
      type: 'MIN_ATR',
      minAtrValue: 0.5,
      enabled: true
    },
    {
      id: 'filt_max_trades',
      type: 'MAX_OPEN_TRADES',
      maxOpenTrades: 1,
      enabled: true
    }
  ],
  advancedOptions: {
    useAiMarketBiasFilter: true,
    aiBiasMode: 'STRICT_DIRECTION',
    enableTrailingStop: true,
    trailingStopDistanceR: 1.0,
    enableBreakEven: true,
    breakEvenTriggerR: 1.0,
    breakEvenOffsetR: 0.0,
    customRiskPerTradePercent: 1.0,
    intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
    executionModel: 'NEXT_BAR_OPEN'
  },
  riskManagement: {
    accountEquity: 10000,
    riskPerTradePercent: 1.0,
    maxDailyLossPercent: 5.0,
    maxOpenTrades: 1,
    defaultStopLossR: 1.0,
    defaultTakeProfitR: 2.0
  },
  createdAt: Date.now() - 86400000 * 5,
  updatedAt: Date.now() - 3600000,
  version: 1
};

export const STRATEGY_TEMPLATES: StrategyTemplateItem[] = [
  {
    id: 'tpl_trend_rider',
    title: 'Institutional Trend Rider',
    category: 'Trend Following',
    description: 'Rides sustained macro trends using exponential moving average divergence, RSI momentum filter, and confirmed Bullish BOS breaks.',
    tags: ['EMA', 'RSI', 'BOS', 'Trend'],
    complexity: 'Intermediate',
    targetSymbol: 'XAUUSD',
    targetTimeframe: 'M15',
    strategy: { ...DEFAULT_STRATEGY, id: 'strat_trend_rider_tpl', name: 'Institutional Trend Rider', isTemplate: true }
  },
  {
    id: 'tpl_ict_fvg',
    title: 'ICT Fair Value Gap Scalper',
    category: 'Market Structure',
    description: 'Exploits institutional liquidity sweeps and 3-candle imbalance fair value gaps during London and NY session overlaps.',
    tags: ['FVG', 'Liquidity Sweep', 'SMC', 'Scalping'],
    complexity: 'Advanced',
    targetSymbol: 'EURUSD',
    targetTimeframe: 'M5',
    strategy: {
      id: 'strat_ict_fvg_tpl',
      name: 'ICT Fair Value Gap Scalper',
      description: 'Capitalizes on market imbalance closures and liquidity pool sweeps.',
      symbol: 'EURUSD',
      timeframe: 'M5',
      direction: 'LONG_ONLY',
      conditionGroupLogic: 'ALL',
      entryConditions: [
        {
          id: 'cond_fvg',
          sourceType: 'MARKET_STRUCTURE',
          structureKey: 'FVG',
          structureDirection: 'BULLISH',
          operator: '=',
          targetType: 'STRUCTURE',
          customLabel: 'Bullish FVG Imbalance'
        },
        {
          id: 'cond_sweep',
          sourceType: 'MARKET_STRUCTURE',
          structureKey: 'LIQUIDITY_SWEEP',
          structureDirection: 'BULLISH',
          operator: '=',
          targetType: 'STRUCTURE',
          customLabel: 'Liquidity Sweep'
        }
      ],
      exitConditions: [
        { id: 'exit_sl', type: 'STOP_LOSS', mode: 'R_MULTIPLE', value: 1.0 },
        { id: 'exit_tp', type: 'TAKE_PROFIT', mode: 'R_MULTIPLE', value: 2.2 }
      ],
      filters: [
        { id: 'filt_session', type: 'SESSION', session: 'LONDON', enabled: true },
        { id: 'filt_news', type: 'NEWS', newsBlackoutMinutes: 30, enabled: true }
      ],
      advancedOptions: {
        useAiMarketBiasFilter: false,
        aiBiasMode: 'ALLOW_IF_NOT_OPPOSING',
        enableTrailingStop: false,
        trailingStopDistanceR: 1.0,
        enableBreakEven: true,
        breakEvenTriggerR: 1.0,
        breakEvenOffsetR: 0.1,
        customRiskPerTradePercent: 1.0,
        intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
        executionModel: 'NEXT_BAR_OPEN'
      },
      riskManagement: {
        accountEquity: 10000,
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 4.0,
        maxOpenTrades: 1,
        defaultStopLossR: 1.0,
        defaultTakeProfitR: 2.2
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: true
    }
  },
  {
    id: 'tpl_mean_reversion',
    title: 'Bollinger RSI Mean Reversion',
    category: 'Mean Reversion',
    description: 'Identifies statistically stretched prices touching the outer Bollinger Band with extreme RSI and reversal pin bar formation.',
    tags: ['Bollinger', 'RSI', 'Pin Bar', 'Mean Reversion'],
    complexity: 'Beginner',
    targetSymbol: 'GBPUSD',
    targetTimeframe: 'M15',
    strategy: {
      id: 'strat_mean_rev_tpl',
      name: 'Bollinger RSI Mean Reversion',
      description: 'Trades oversold extremes back to the 20-period baseline.',
      symbol: 'GBPUSD',
      timeframe: 'M15',
      direction: 'LONG_ONLY',
      conditionGroupLogic: 'ALL',
      entryConditions: [
        {
          id: 'cond_price_bb',
          sourceType: 'PRICE',
          priceKey: 'LOW',
          operator: '<=',
          targetType: 'INDICATOR',
          targetIndicator: 'BOLLINGER',
          targetIndicatorPeriod: 20,
          targetIndicatorSubKey: 'LOWER',
          customLabel: 'Low <= Bollinger Lower'
        },
        {
          id: 'cond_rsi_30',
          sourceType: 'INDICATOR',
          indicator: 'RSI',
          indicatorPeriod: 14,
          operator: '<=',
          targetType: 'VALUE',
          targetValue: 32,
          customLabel: 'RSI(14) <= 32'
        },
        {
          id: 'cond_pin_bar',
          sourceType: 'PRICE_ACTION',
          patternKey: 'PIN_BAR',
          operator: '=',
          targetType: 'PATTERN',
          customLabel: 'Pin Bar (Reversal)'
        }
      ],
      exitConditions: [
        { id: 'exit_sl', type: 'STOP_LOSS', mode: 'R_MULTIPLE', value: 1.0 },
        { id: 'exit_tp', type: 'TAKE_PROFIT', mode: 'R_MULTIPLE', value: 2.0 }
      ],
      filters: [
        { id: 'filt_session', type: 'SESSION', session: 'LONDON_NEW_YORK', enabled: true },
        { id: 'filt_news', type: 'NEWS', newsBlackoutMinutes: 30, enabled: true }
      ],
      advancedOptions: {
        useAiMarketBiasFilter: false,
        aiBiasMode: 'ALLOW_IF_NOT_OPPOSING',
        enableTrailingStop: false,
        trailingStopDistanceR: 1.0,
        enableBreakEven: true,
        breakEvenTriggerR: 1.0,
        breakEvenOffsetR: 0.0,
        customRiskPerTradePercent: 1.0,
        intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
        executionModel: 'NEXT_BAR_OPEN'
      },
      riskManagement: {
        accountEquity: 10000,
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 5.0,
        maxOpenTrades: 1,
        defaultStopLossR: 1.0,
        defaultTakeProfitR: 2.0
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: true
    }
  },
  {
    id: 'tpl_momentum_breakout',
    title: 'Multi-Confluence Momentum Breakout',
    category: 'Momentum',
    description: 'High-probability momentum continuation targeting strong expansion when ADX confirms trend strength and Bullish Engulfing triggers.',
    tags: ['ADX', 'MACD', 'Bullish Engulfing', 'Breakout'],
    complexity: 'Intermediate',
    targetSymbol: 'EURJPY',
    targetTimeframe: 'H1',
    strategy: {
      id: 'strat_mom_breakout_tpl',
      name: 'Multi-Confluence Momentum Breakout',
      description: 'Capitalizes on volatility expansion with MACD crossover and ADX trend strength.',
      symbol: 'EURJPY',
      timeframe: 'H1',
      direction: 'LONG_ONLY',
      conditionGroupLogic: 'ALL',
      entryConditions: [
        {
          id: 'cond_adx_25',
          sourceType: 'INDICATOR',
          indicator: 'ADX',
          indicatorPeriod: 14,
          operator: '>',
          targetType: 'VALUE',
          targetValue: 24,
          customLabel: 'ADX(14) > 24'
        },
        {
          id: 'cond_bullish_engulfing',
          sourceType: 'PRICE_ACTION',
          patternKey: 'BULLISH_ENGULFING',
          operator: '=',
          targetType: 'PATTERN',
          customLabel: 'Bullish Engulfing'
        }
      ],
      exitConditions: [
        { id: 'exit_sl', type: 'STOP_LOSS', mode: 'R_MULTIPLE', value: 1.0 },
        { id: 'exit_tp', type: 'TAKE_PROFIT', mode: 'R_MULTIPLE', value: 2.4 },
        { id: 'exit_trail', type: 'TRAILING_STOP', mode: 'R_MULTIPLE', value: 1.0 }
      ],
      filters: [
        { id: 'filt_session', type: 'SESSION', session: 'ALL', enabled: false },
        { id: 'filt_news', type: 'NEWS', newsBlackoutMinutes: 30, enabled: true }
      ],
      advancedOptions: {
        useAiMarketBiasFilter: false,
        aiBiasMode: 'ALLOW_IF_NOT_OPPOSING',
        enableTrailingStop: true,
        trailingStopDistanceR: 1.0,
        enableBreakEven: true,
        breakEvenTriggerR: 1.0,
        breakEvenOffsetR: 0.0,
        customRiskPerTradePercent: 1.0,
        intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
        executionModel: 'NEXT_BAR_OPEN'
      },
      riskManagement: {
        accountEquity: 10000,
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 5.0,
        maxOpenTrades: 1,
        defaultStopLossR: 1.0,
        defaultTakeProfitR: 2.4
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: true
    }
  },
  {
    id: 'tpl_ai_bias_trend',
    title: 'AI Market Bias Synchronizer',
    category: 'AI-Assisted',
    description: 'Combines algorithmic moving averages with TradeXpulse deep learning market bias. Enforces strict AI direction alignment before trade execution.',
    tags: ['AI Bias', 'Neural Alignment', 'EMA', 'Risk Parity'],
    complexity: 'Institutional',
    targetSymbol: 'XAUUSD',
    targetTimeframe: 'M15',
    strategy: {
      id: 'strat_ai_sync_tpl',
      name: 'AI Market Bias Synchronizer',
      description: 'Filters out counter-trend trades by coupling EMA trend with AI predictive bias.',
      symbol: 'XAUUSD',
      timeframe: 'M15',
      direction: 'LONG_ONLY',
      conditionGroupLogic: 'ALL',
      entryConditions: [
        {
          id: 'cond_ema_20_50',
          sourceType: 'INDICATOR',
          indicator: 'EMA',
          indicatorPeriod: 20,
          operator: '>',
          targetType: 'INDICATOR',
          targetIndicator: 'EMA',
          targetIndicatorPeriod: 50,
          customLabel: 'EMA 20 > EMA 50'
        },
        {
          id: 'cond_rsi_filter',
          sourceType: 'INDICATOR',
          indicator: 'RSI',
          indicatorPeriod: 14,
          operator: '>',
          targetType: 'VALUE',
          targetValue: 48,
          customLabel: 'RSI(14) > 48'
        }
      ],
      exitConditions: [
        { id: 'exit_sl', type: 'STOP_LOSS', mode: 'R_MULTIPLE', value: 1.0 },
        { id: 'exit_tp', type: 'TAKE_PROFIT', mode: 'R_MULTIPLE', value: 3.0 },
        { id: 'exit_trail', type: 'TRAILING_STOP', mode: 'R_MULTIPLE', value: 1.0 }
      ],
      filters: [
        { id: 'filt_session', type: 'SESSION', session: 'LONDON_NEW_YORK', enabled: true },
        { id: 'filt_news', type: 'NEWS', newsBlackoutMinutes: 30, enabled: true }
      ],
      advancedOptions: {
        useAiMarketBiasFilter: true,
        aiBiasMode: 'STRICT_DIRECTION',
        enableTrailingStop: true,
        trailingStopDistanceR: 1.0,
        enableBreakEven: true,
        breakEvenTriggerR: 1.0,
        breakEvenOffsetR: 0.1,
        customRiskPerTradePercent: 1.0,
        intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
        executionModel: 'NEXT_BAR_OPEN'
      },
      riskManagement: {
        accountEquity: 10000,
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 4.0,
        maxOpenTrades: 1,
        defaultStopLossR: 1.0,
        defaultTakeProfitR: 3.0
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: true
    }
  },
  {
    id: 'tpl_choch_reversal',
    title: 'Order Block & CHoCH Reversal',
    category: 'Price Action',
    description: 'Detects trend exhaustion and structural reversal via Change of Character (CHoCH) at major supply/demand order blocks.',
    tags: ['CHoCH', 'Order Block', 'Price Action', 'Reversal'],
    complexity: 'Advanced',
    targetSymbol: 'XAUUSD',
    targetTimeframe: 'H1',
    strategy: {
      id: 'strat_choch_tpl',
      name: 'Order Block & CHoCH Reversal',
      description: 'Enters on confirmed structural changes of character for high risk-to-reward swing trades.',
      symbol: 'XAUUSD',
      timeframe: 'H1',
      direction: 'LONG_ONLY',
      conditionGroupLogic: 'ALL',
      entryConditions: [
        {
          id: 'cond_choch',
          sourceType: 'MARKET_STRUCTURE',
          structureKey: 'CHOCH',
          structureDirection: 'BULLISH',
          operator: '=',
          targetType: 'STRUCTURE',
          customLabel: 'Bullish CHoCH'
        },
        {
          id: 'cond_rsi_rebound',
          sourceType: 'INDICATOR',
          indicator: 'RSI',
          indicatorPeriod: 14,
          operator: 'increases',
          targetType: 'VALUE',
          customLabel: 'RSI(14) increases'
        }
      ],
      exitConditions: [
        { id: 'exit_sl', type: 'STOP_LOSS', mode: 'R_MULTIPLE', value: 1.0 },
        { id: 'exit_tp', type: 'TAKE_PROFIT', mode: 'R_MULTIPLE', value: 3.5 }
      ],
      filters: [
        { id: 'filt_session', type: 'SESSION', session: 'LONDON_NEW_YORK', enabled: true },
        { id: 'filt_news', type: 'NEWS', newsBlackoutMinutes: 30, enabled: true }
      ],
      advancedOptions: {
        useAiMarketBiasFilter: false,
        aiBiasMode: 'ALLOW_IF_NOT_OPPOSING',
        enableTrailingStop: true,
        trailingStopDistanceR: 1.2,
        enableBreakEven: true,
        breakEvenTriggerR: 1.0,
        breakEvenOffsetR: 0.0,
        customRiskPerTradePercent: 1.0,
        intrabarPolicy: 'CONSERVATIVE_SL_FIRST',
        executionModel: 'NEXT_BAR_OPEN'
      },
      riskManagement: {
        accountEquity: 10000,
        riskPerTradePercent: 1.0,
        maxDailyLossPercent: 5.0,
        maxOpenTrades: 1,
        defaultStopLossR: 1.0,
        defaultTakeProfitR: 3.5
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: true
    }
  }
];

export class StrategyStorageService {
  /**
   * Retrieves all saved user strategies from localStorage, seeding with default if empty
   */
  public static getSavedStrategies(): StrategyDefinition[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load saved strategies from localStorage:', e);
    }
    // Return default initial list
    const defaults = [
      { ...DEFAULT_STRATEGY },
      { ...STRATEGY_TEMPLATES[1].strategy, id: 'strat_saved_eurusd_ict', isTemplate: false },
      { ...STRATEGY_TEMPLATES[2].strategy, id: 'strat_saved_gbpusd_bb', isTemplate: false }
    ];
    this.saveAll(defaults);
    return defaults;
  }

  /**
   * Saves or updates a strategy
   */
  public static saveStrategy(strategy: StrategyDefinition): StrategyDefinition {
    const list = this.getSavedStrategies();
    const existingIdx = list.findIndex(s => s.id === strategy.id);
    const updated: StrategyDefinition = {
      ...strategy,
      updatedAt: Date.now(),
      version: (strategy.version || 1) + 1
    };

    if (existingIdx >= 0) {
      list[existingIdx] = updated;
    } else {
      list.unshift(updated);
    }

    this.saveAll(list);
    return updated;
  }

  /**
   * Duplicates an existing strategy
   */
  public static duplicateStrategy(strategyId: string): StrategyDefinition | null {
    const list = this.getSavedStrategies();
    const target = list.find(s => s.id === strategyId);
    if (!target) return null;

    const copy: StrategyDefinition = {
      ...target,
      id: `strat_${Date.now()}`,
      name: `${target.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      isTemplate: false
    };

    list.unshift(copy);
    this.saveAll(list);
    return copy;
  }

  /**
   * Renames a strategy
   */
  public static renameStrategy(strategyId: string, newName: string): boolean {
    const list = this.getSavedStrategies();
    const target = list.find(s => s.id === strategyId);
    if (!target) return false;

    target.name = newName;
    target.updatedAt = Date.now();
    this.saveAll(list);
    return true;
  }

  /**
   * Deletes a strategy
   */
  public static deleteStrategy(strategyId: string): boolean {
    let list = this.getSavedStrategies();
    const initialLen = list.length;
    list = list.filter(s => s.id !== strategyId);
    if (list.length === initialLen) return false;

    this.saveAll(list);
    return true;
  }

  /**
   * Gets strategy by ID
   */
  public static getStrategyById(strategyId: string): StrategyDefinition | null {
    const list = this.getSavedStrategies();
    const found = list.find(s => s.id === strategyId);
    if (found) return found;

    // Check templates
    const tpl = this.getAllTemplates().find(t => t.strategy.id === strategyId);
    return tpl ? tpl.strategy : null;
  }

  /**
   * Gets all templates (built-in + user-saved custom templates)
   */
  public static getAllTemplates(): StrategyTemplateItem[] {
    try {
      const customRaw = localStorage.getItem('tradexpulse_custom_templates');
      const custom: StrategyTemplateItem[] = customRaw ? JSON.parse(customRaw) : [];
      return [...custom, ...STRATEGY_TEMPLATES];
    } catch {
      return STRATEGY_TEMPLATES;
    }
  }

  /**
   * Saves an existing strategy definition as a reusable template
   */
  public static saveAsTemplate(
    strategy: StrategyDefinition,
    category: 'Trend Following' | 'Mean Reversion' | 'Breakout' | 'Momentum' | 'Price Action' | 'Market Structure' | 'AI-Assisted' = 'Price Action',
    description?: string
  ): StrategyTemplateItem {
    const template: StrategyTemplateItem = {
      id: `tpl_${Date.now()}`,
      title: strategy.name,
      category,
      description: description || strategy.description || `Custom template saved from verified strategy ${strategy.name}.`,
      tags: ['Custom', 'Verified', strategy.direction],
      complexity: 'Intermediate',
      targetSymbol: strategy.symbol,
      targetTimeframe: strategy.timeframe,
      strategy: {
        ...strategy,
        isTemplate: true,
        updatedAt: Date.now()
      }
    };

    try {
      const current = this.getAllTemplates().filter(t => t.id.startsWith('tpl_'));
      current.unshift(template);
      localStorage.setItem('tradexpulse_custom_templates', JSON.stringify(current));
    } catch (e) {
      console.error('Failed to save custom template:', e);
    }

    return template;
  }

  private static saveAll(list: StrategyDefinition[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save strategies to localStorage:', e);
    }
  }
}
