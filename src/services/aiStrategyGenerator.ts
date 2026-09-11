import {
  StrategyDefinition,
  StrategyCondition,
  StrategyExit,
  StrategyFilter,
  MarketSymbol,
  Timeframe
} from '../types';

export interface AiGenerationResult {
  strategy: StrategyDefinition;
  explanation: string;
  matchedElements: string[];
  suggestedName: string;
}

export class AiStrategyGenerator {
  /**
   * Generates a canonical StrategyDefinition from a natural language prompt.
   * Guarantees strict adherence to supported indicators, operators, and schemas.
   */
  public static async generateStrategy(
    prompt: string,
    currentSymbol: MarketSymbol = 'XAUUSD',
    currentTimeframe: Timeframe = 'M15'
  ): Promise<AiGenerationResult> {
    const p = prompt.toLowerCase();
    const matchedElements: string[] = [];

    // 1. Detect Symbol
    let symbol: MarketSymbol = currentSymbol;
    if (p.includes('xau') || p.includes('gold')) {
      symbol = 'XAUUSD';
      matchedElements.push('Asset: Gold (XAUUSD)');
    } else if (p.includes('eurusd') || p.includes('euro')) {
      symbol = 'EURUSD';
      matchedElements.push('Asset: EURUSD');
    } else if (p.includes('gbpusd') || p.includes('cable') || p.includes('pound')) {
      symbol = 'GBPUSD';
      matchedElements.push('Asset: GBPUSD');
    } else if (p.includes('eurjpy') || p.includes('yen')) {
      symbol = 'EURJPY';
      matchedElements.push('Asset: EURJPY');
    }

    // 2. Detect Timeframe
    let timeframe: Timeframe = currentTimeframe;
    if (p.includes('m1') && !p.includes('m15')) timeframe = 'M1';
    else if (p.includes('m5')) timeframe = 'M5';
    else if (p.includes('m15')) timeframe = 'M15';
    else if (p.includes('h1') && !p.includes('h4')) timeframe = 'H1';
    else if (p.includes('h4')) timeframe = 'H4';
    else if (p.includes('d1') || p.includes('daily')) timeframe = 'D1';
    matchedElements.push(`Timeframe: ${timeframe}`);

    // 3. Detect Direction
    let direction: StrategyDefinition['direction'] = 'LONG_ONLY';
    if (p.includes('short only') || p.includes('bearish only') || p.includes('sell only')) {
      direction = 'SHORT_ONLY';
      matchedElements.push('Direction: Short Only');
    } else if (p.includes('both') || p.includes('bi-directional') || p.includes('long and short')) {
      direction = 'BOTH';
      matchedElements.push('Direction: Long & Short');
    } else {
      matchedElements.push('Direction: Long Only');
    }

    // 4. Detect Entry Conditions
    const conditions: StrategyCondition[] = [];

    // EMA conditions
    if (p.includes('ema 50/200') || p.includes('ema 50 and 200') || p.includes('golden cross') || (p.includes('50') && p.includes('200'))) {
      conditions.push({
        id: `cond_${Date.now()}_1`,
        sourceType: 'INDICATOR',
        indicator: 'EMA',
        indicatorPeriod: 50,
        operator: '>',
        targetType: 'INDICATOR',
        targetIndicator: 'EMA',
        targetIndicatorPeriod: 200,
        customLabel: 'EMA 50 > EMA 200'
      });
      matchedElements.push('Indicator: EMA(50) > EMA(200)');
    } else if (p.includes('ema 20/50') || p.includes('ema 20 and 50')) {
      conditions.push({
        id: `cond_${Date.now()}_1`,
        sourceType: 'INDICATOR',
        indicator: 'EMA',
        indicatorPeriod: 20,
        operator: '>',
        targetType: 'INDICATOR',
        targetIndicator: 'EMA',
        targetIndicatorPeriod: 50,
        customLabel: 'EMA 20 > EMA 50'
      });
      matchedElements.push('Indicator: EMA(20) > EMA(50)');
    } else if (p.includes('ema') && p.includes('trend')) {
      conditions.push({
        id: `cond_${Date.now()}_1`,
        sourceType: 'INDICATOR',
        indicator: 'EMA',
        indicatorPeriod: 50,
        operator: '>',
        targetType: 'INDICATOR',
        targetIndicator: 'EMA',
        targetIndicatorPeriod: 200,
        customLabel: 'EMA 50 > EMA 200'
      });
      matchedElements.push('Indicator: EMA 50/200 Trend Filter');
    }

    // RSI conditions
    if (p.includes('rsi') && (p.includes('oversold') || p.includes('30'))) {
      conditions.push({
        id: `cond_${Date.now()}_2`,
        sourceType: 'INDICATOR',
        indicator: 'RSI',
        indicatorPeriod: 14,
        operator: '<=',
        targetType: 'VALUE',
        targetValue: 30,
        customLabel: 'RSI(14) <= 30 (Oversold)'
      });
      matchedElements.push('Indicator: RSI(14) <= 30 Oversold');
    } else if (p.includes('rsi') && (p.includes('overbought') || p.includes('70'))) {
      conditions.push({
        id: `cond_${Date.now()}_2`,
        sourceType: 'INDICATOR',
        indicator: 'RSI',
        indicatorPeriod: 14,
        operator: '>=',
        targetType: 'VALUE',
        targetValue: 70,
        customLabel: 'RSI(14) >= 70'
      });
      matchedElements.push('Indicator: RSI(14) >= 70 Overbought');
    } else if (p.includes('rsi') || p.includes('momentum')) {
      conditions.push({
        id: `cond_${Date.now()}_2`,
        sourceType: 'INDICATOR',
        indicator: 'RSI',
        indicatorPeriod: 14,
        operator: '>',
        targetType: 'VALUE',
        targetValue: 50,
        customLabel: 'RSI(14) > 50'
      });
      matchedElements.push('Indicator: RSI(14) > 50 Momentum');
    }

    // Market Structure: BOS / CHoCH / FVG / Liquidity Sweep / Order Block
    if (p.includes('bos') || p.includes('break of structure') || p.includes('structure')) {
      conditions.push({
        id: `cond_${Date.now()}_3`,
        sourceType: 'MARKET_STRUCTURE',
        structureKey: 'BOS',
        structureDirection: 'BULLISH',
        operator: '=',
        targetType: 'STRUCTURE',
        customLabel: 'Bullish BOS'
      });
      matchedElements.push('Market Structure: Bullish Break of Structure (BOS)');
    } else if (p.includes('choch') || p.includes('change of character')) {
      conditions.push({
        id: `cond_${Date.now()}_3`,
        sourceType: 'MARKET_STRUCTURE',
        structureKey: 'CHOCH',
        structureDirection: 'BULLISH',
        operator: '=',
        targetType: 'STRUCTURE',
        customLabel: 'Bullish CHoCH'
      });
      matchedElements.push('Market Structure: Bullish CHoCH');
    } else if (p.includes('fvg') || p.includes('fair value gap') || p.includes('imbalance')) {
      conditions.push({
        id: `cond_${Date.now()}_3`,
        sourceType: 'MARKET_STRUCTURE',
        structureKey: 'FVG',
        structureDirection: 'BULLISH',
        operator: '=',
        targetType: 'STRUCTURE',
        customLabel: 'Bullish Fair Value Gap'
      });
      matchedElements.push('Market Structure: Bullish Fair Value Gap (FVG)');
    }

    // Price Action: Candle Patterns
    if (p.includes('engulfing')) {
      conditions.push({
        id: `cond_${Date.now()}_4`,
        sourceType: 'PRICE_ACTION',
        patternKey: 'BULLISH_ENGULFING',
        operator: '=',
        targetType: 'PATTERN',
        customLabel: 'Bullish Engulfing'
      });
      matchedElements.push('Price Action: Bullish Engulfing');
    } else if (p.includes('pin bar') || p.includes('pinbar') || p.includes('hammer')) {
      conditions.push({
        id: `cond_${Date.now()}_4`,
        sourceType: 'PRICE_ACTION',
        patternKey: 'PIN_BAR',
        operator: '=',
        targetType: 'PATTERN',
        customLabel: 'Pin Bar (Hammer)'
      });
      matchedElements.push('Price Action: Pin Bar');
    }

    // ADX / MACD / Bollinger
    if (p.includes('adx')) {
      conditions.push({
        id: `cond_${Date.now()}_5`,
        sourceType: 'INDICATOR',
        indicator: 'ADX',
        indicatorPeriod: 14,
        operator: '>',
        targetType: 'VALUE',
        targetValue: 25,
        customLabel: 'ADX(14) > 25'
      });
      matchedElements.push('Indicator: ADX(14) > 25');
    }

    if (p.includes('macd')) {
      conditions.push({
        id: `cond_${Date.now()}_6`,
        sourceType: 'INDICATOR',
        indicator: 'MACD',
        indicatorPeriod: 12,
        indicatorSubKey: 'HISTOGRAM',
        operator: '>',
        targetType: 'VALUE',
        targetValue: 0,
        customLabel: 'MACD Histogram > 0'
      });
      matchedElements.push('Indicator: MACD Histogram > 0');
    }

    // Ensure at least one solid entry condition
    if (conditions.length === 0) {
      conditions.push(
        {
          id: `cond_${Date.now()}_1`,
          sourceType: 'INDICATOR',
          indicator: 'EMA',
          indicatorPeriod: 50,
          operator: '>',
          targetType: 'INDICATOR',
          targetIndicator: 'EMA',
          targetIndicatorPeriod: 200,
          customLabel: 'EMA 50 > EMA 200'
        },
        {
          id: `cond_${Date.now()}_2`,
          sourceType: 'INDICATOR',
          indicator: 'RSI',
          indicatorPeriod: 14,
          operator: '>',
          targetType: 'VALUE',
          targetValue: 50,
          customLabel: 'RSI(14) > 50'
        }
      );
      matchedElements.push('Default Trend Baseline: EMA 50/200 + RSI > 50');
    }

    // 5. Exits & Risk Management
    let tpMultiple = 2.5;
    let slMultiple = 1.0;
    if (p.includes('1:2') || p.includes('2r') || p.includes('2:1')) tpMultiple = 2.0;
    else if (p.includes('1:3') || p.includes('3r') || p.includes('3:1')) tpMultiple = 3.0;
    else if (p.includes('1:1.5') || p.includes('1.5r')) tpMultiple = 1.5;

    const exitConditions: StrategyExit[] = [
      {
        id: 'exit_sl',
        type: 'STOP_LOSS',
        mode: 'R_MULTIPLE',
        value: slMultiple
      },
      {
        id: 'exit_tp',
        type: 'TAKE_PROFIT',
        mode: 'R_MULTIPLE',
        value: tpMultiple
      }
    ];

    if (p.includes('trailing') || p.includes('trail')) {
      exitConditions.push({
        id: 'exit_trailing',
        type: 'TRAILING_STOP',
        mode: 'R_MULTIPLE',
        value: 1.0
      });
      matchedElements.push('Exit: 1.0R Trailing Stop');
    }

    // 6. Filters
    const filters: StrategyFilter[] = [
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
      }
    ];

    if (p.includes('asian')) {
      filters[0].session = 'ASIAN';
      matchedElements.push('Session: Asian (00:00-08:00 UTC)');
    } else if (p.includes('london only')) {
      filters[0].session = 'LONDON';
      matchedElements.push('Session: London (07:00-16:00 UTC)');
    } else if (p.includes('new york only')) {
      filters[0].session = 'NEW_YORK';
      matchedElements.push('Session: New York (12:00-21:00 UTC)');
    } else {
      matchedElements.push('Session: London + New York overlap');
    }

    // 7. Advanced options
    const useAi = p.includes('ai') || p.includes('bias') || p.includes('neural') || p.includes('machine learning');
    matchedElements.push(`AI Market Bias Filter: ${useAi ? 'Active (Strict Direction)' : 'Disabled'}`);

    const suggestedName = `${symbol} ${p.includes('scalp') ? 'Scalper' : p.includes('reversal') ? 'Reversal' : 'Trend Rider'} (${timeframe})`;

    const strategy: StrategyDefinition = {
      id: `ai_strat_${Date.now()}`,
      name: suggestedName,
      description: `AI-constructed quantitative strategy generated from prompt: "${prompt}". Synthesizes technical indicators with market structure validation.`,
      symbol,
      timeframe,
      direction,
      conditionGroupLogic: 'ALL',
      entryConditions: conditions,
      exitConditions,
      filters,
      advancedOptions: {
        useAiMarketBiasFilter: useAi,
        aiBiasMode: 'STRICT_DIRECTION',
        enableTrailingStop: p.includes('trailing'),
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
        defaultStopLossR: slMultiple,
        defaultTakeProfitR: tpMultiple
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1
    };

    const explanation = `Successfully synthesized prompt into a deterministic quantitative strategy. Mapped ${conditions.length} mathematical entry conditions, ${exitConditions.length} risk-managed exits (Target RR 1:${tpMultiple}), and institutional session filters.`;

    return {
      strategy,
      explanation,
      matchedElements,
      suggestedName
    };
  }
}
