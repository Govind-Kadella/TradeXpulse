import { ChartOverlayConfig } from '../types';

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

export const TEMPLATE_STORAGE_KEY = 'tradeXpulse.chartTemplate';
export const OVERLAY_STORAGE_KEY = 'tradeXpulse.chartOverlaySettings';

export const ALL_PATTERN_KEYS: (keyof ChartOverlayConfig)[] = [
  'showPatternDoji',
  'showPatternHammer',
  'showPatternInvertedHammer',
  'showPatternShootingStar',
  'showPatternHangingMan',
  'showPatternPinBar',
  'showPatternMarubozu',
  'showPatternSpinningTop',
  'showPatternBullishEngulfing',
  'showPatternBearishEngulfing',
  'showPatternBullishHarami',
  'showPatternBearishHarami',
  'showPatternPiercingLine',
  'showPatternDarkCloudCover',
  'showPatternTweezerTop',
  'showPatternTweezerBottom',
  'showPatternMorningStar',
  'showPatternEveningStar',
  'showPatternThreeWhiteSoldiers',
  'showPatternThreeBlackCrows',
  'showPatternThreeInsideUp',
  'showPatternThreeInsideDown',
  'showPatternThreeOutsideUp',
  'showPatternThreeOutsideDown',
];

export const ALL_STRUCTURE_KEYS: (keyof ChartOverlayConfig)[] = [
  'showMS_BOS',
  'showMS_CHoCH',
  'showMS_CoC',
  'showMS_Swings',
  'showMS_HH_HL',
  'showMS_LH_LL',
  'showFVG_Bullish',
  'showFVG_Bearish',
  'showFVG_Mitigated',
  'showOB_Bullish',
  'showOB_Bearish',
  'showOB_Mitigated',
  'showLiq_Sweeps',
  'showLiq_EQH',
  'showLiq_EQL',
  'showSR_Support',
  'showSR_Resistance',
];

export const CHART_TEMPLATES: Record<Exclude<ChartTemplate, 'CUSTOM'>, ChartTemplateDefinition> = {
  TRADEXPULSE_AI_PRO: {
    id: 'TRADEXPULSE_AI_PRO',
    name: 'TradeXpulse AI Pro',
    badge: 'AI Pro',
    description: 'Full workspace: AI prediction corridor, verified SMC structure & all price action patterns',
    overlays: {
      // Prediction Visuals
      showForecastPath: true,
      showEntryZone: true,
      showTargets: true,

      // Market Structure
      showMarketStructure: true,
      showMS_BOS: true,
      showMS_CHoCH: true,
      showMS_CoC: true,
      showMS_Swings: true,
      showMS_HH_HL: true,
      showMS_LH_LL: true,

      // FVG
      showFVG: true,
      showFVG_Bullish: true,
      showFVG_Bearish: true,
      showFVG_Mitigated: false, // OFF or low-visibility

      // Order Blocks
      showOrderBlocks: true,
      showOB_Bullish: true,
      showOB_Bearish: true,
      showOB_Mitigated: false, // OFF or low-visibility

      // Liquidity
      showHistoricalLevels: true,
      showLiq_Sweeps: true,
      showLiq_EQH: true,
      showLiq_EQL: true,

      // Support & Resistance
      showSupportResistance: true,
      showSR_Support: true,
      showSR_Resistance: true,

      // Price Action (Single, Two-candle, Multi-candle)
      showCandlePatterns: true,
      showPatternDoji: true,
      showPatternHammer: true,
      showPatternInvertedHammer: true,
      showPatternShootingStar: true,
      showPatternHangingMan: true,
      showPatternPinBar: true,
      showPatternMarubozu: true,
      showPatternSpinningTop: true,

      showPatternBullishEngulfing: true,
      showPatternBearishEngulfing: true,
      showPatternBullishHarami: true,
      showPatternBearishHarami: true,
      showPatternPiercingLine: true,
      showPatternDarkCloudCover: true,
      showPatternTweezerTop: true,
      showPatternTweezerBottom: true,

      showPatternMorningStar: true,
      showPatternEveningStar: true,
      showPatternThreeWhiteSoldiers: true,
      showPatternThreeBlackCrows: true,
      showPatternThreeInsideUp: true,
      showPatternThreeInsideDown: true,
      showPatternThreeOutsideUp: true,
      showPatternThreeOutsideDown: true,
    },
  },

  PURE_PRICE_ACTION: {
    id: 'PURE_PRICE_ACTION',
    name: 'Pure Price Action',
    badge: 'Candlestick',
    description: 'Clean candlestick analysis: all single, dual & multi-candle patterns with zero clutter',
    overlays: {
      // Prediction Visuals OFF
      showForecastPath: false,
      showEntryZone: false,
      showTargets: false,

      // Market Structure OFF
      showMarketStructure: false,
      showMS_BOS: false,
      showMS_CHoCH: false,
      showMS_CoC: false,
      showMS_Swings: false,
      showMS_HH_HL: false,
      showMS_LH_LL: false,

      // FVG OFF
      showFVG: false,
      showFVG_Bullish: false,
      showFVG_Bearish: false,
      showFVG_Mitigated: false,

      // Order Blocks OFF
      showOrderBlocks: false,
      showOB_Bullish: false,
      showOB_Bearish: false,
      showOB_Mitigated: false,

      // Liquidity OFF
      showHistoricalLevels: false,
      showLiq_Sweeps: false,
      showLiq_EQH: false,
      showLiq_EQL: false,

      // Support & Resistance OFF
      showSupportResistance: false,
      showSR_Support: false,
      showSR_Resistance: false,

      // Price Action (Single, Two-candle, Multi-candle) ALL ON
      showCandlePatterns: true,
      showPatternDoji: true,
      showPatternHammer: true,
      showPatternInvertedHammer: true,
      showPatternShootingStar: true,
      showPatternHangingMan: true,
      showPatternPinBar: true,
      showPatternMarubozu: true,
      showPatternSpinningTop: true,

      showPatternBullishEngulfing: true,
      showPatternBearishEngulfing: true,
      showPatternBullishHarami: true,
      showPatternBearishHarami: true,
      showPatternPiercingLine: true,
      showPatternDarkCloudCover: true,
      showPatternTweezerTop: true,
      showPatternTweezerBottom: true,

      showPatternMorningStar: true,
      showPatternEveningStar: true,
      showPatternThreeWhiteSoldiers: true,
      showPatternThreeBlackCrows: true,
      showPatternThreeInsideUp: true,
      showPatternThreeInsideDown: true,
      showPatternThreeOutsideUp: true,
      showPatternThreeOutsideDown: true,
    },
  },

  INSTITUTIONAL_LEVELS: {
    id: 'INSTITUTIONAL_LEVELS',
    name: 'Institutional Levels',
    badge: 'SMC Levels',
    description: 'SMC & institutional zones: BOS, CHoCH, OBs, FVGs, Sweeps, EQH/EQL & key levels',
    overlays: {
      // Prediction Visuals OFF
      showForecastPath: false,
      showEntryZone: false,
      showTargets: false,

      // Market Structure ALL ON
      showMarketStructure: true,
      showMS_BOS: true,
      showMS_CHoCH: true,
      showMS_CoC: true,
      showMS_Swings: true,
      showMS_HH_HL: true,
      showMS_LH_LL: true,

      // FVG ALL ON (including mitigated)
      showFVG: true,
      showFVG_Bullish: true,
      showFVG_Bearish: true,
      showFVG_Mitigated: true,

      // Order Blocks ALL ON (including mitigated)
      showOrderBlocks: true,
      showOB_Bullish: true,
      showOB_Bearish: true,
      showOB_Mitigated: true,

      // Liquidity ALL ON
      showHistoricalLevels: true,
      showLiq_Sweeps: true,
      showLiq_EQH: true,
      showLiq_EQL: true,

      // Support & Resistance ON
      showSupportResistance: true,
      showSR_Support: true,
      showSR_Resistance: true,

      // ALL CANDLESTICK PATTERNS OFF
      showCandlePatterns: false,
      showPatternDoji: false,
      showPatternHammer: false,
      showPatternInvertedHammer: false,
      showPatternShootingStar: false,
      showPatternHangingMan: false,
      showPatternPinBar: false,
      showPatternMarubozu: false,
      showPatternSpinningTop: false,

      showPatternBullishEngulfing: false,
      showPatternBearishEngulfing: false,
      showPatternBullishHarami: false,
      showPatternBearishHarami: false,
      showPatternPiercingLine: false,
      showPatternDarkCloudCover: false,
      showPatternTweezerTop: false,
      showPatternTweezerBottom: false,

      showPatternMorningStar: false,
      showPatternEveningStar: false,
      showPatternThreeWhiteSoldiers: false,
      showPatternThreeBlackCrows: false,
      showPatternThreeInsideUp: false,
      showPatternThreeInsideDown: false,
      showPatternThreeOutsideUp: false,
      showPatternThreeOutsideDown: false,
    },
  },
};

export const TEMPLATE_LIST: ChartTemplateDefinition[] = [
  CHART_TEMPLATES.TRADEXPULSE_AI_PRO,
  CHART_TEMPLATES.PURE_PRICE_ACTION,
  CHART_TEMPLATES.INSTITUTIONAL_LEVELS,
];

/**
 * Apply a template preset onto existing overlay configuration.
 * Preserves user's technical indicators (volume, EMAs, crosshair).
 */
export function applyTemplateToConfig(
  templateId: ChartTemplate,
  currentConfig: ChartOverlayConfig
): { newConfig: ChartOverlayConfig; activeTemplate: ChartTemplate } {
  if (templateId === 'CUSTOM') {
    return { newConfig: currentConfig, activeTemplate: 'CUSTOM' };
  }

  const tmpl = CHART_TEMPLATES[templateId];
  if (!tmpl) {
    return { newConfig: currentConfig, activeTemplate: 'CUSTOM' };
  }

  const newConfig: ChartOverlayConfig = {
    ...currentConfig,
    ...tmpl.overlays,
    // Preserve unrelated technical indicator state
    showVolume: currentConfig.showVolume !== undefined ? currentConfig.showVolume : true,
    showEMAs: currentConfig.showEMAs !== undefined ? currentConfig.showEMAs : false,
    showCrosshair: currentConfig.showCrosshair !== undefined ? currentConfig.showCrosshair : true,
  };

  return { newConfig, activeTemplate: templateId };
}

/**
 * Checks if a config strictly matches one of the known template presets
 */
export function detectMatchingTemplate(config: ChartOverlayConfig): ChartTemplate {
  const ids: Exclude<ChartTemplate, 'CUSTOM'>[] = [
    'TRADEXPULSE_AI_PRO',
    'PURE_PRICE_ACTION',
    'INSTITUTIONAL_LEVELS',
  ];

  for (const id of ids) {
    const tmpl = CHART_TEMPLATES[id];
    let isMatch = true;
    for (const [k, v] of Object.entries(tmpl.overlays)) {
      if ((config as any)[k] !== v) {
        isMatch = false;
        break;
      }
    }
    if (isMatch) return id;
  }

  return 'CUSTOM';
}
