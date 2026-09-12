import { AiMarketInsight, EconomicEvent, MarketNewsArticle, MarketSymbol } from '../types';
import { EconomicCalendarService } from './economicCalendarService';
import { MarketNewsProvider } from './marketNewsProvider';

export interface MarketRiskItem {
  id: string;
  title: string;
  date: string;
  severity: 'CRITICAL' | 'ELEVATED' | 'MODERATE';
  affectedInstruments: MarketSymbol[];
  description: string;
  tacticalMitigation: string;
}

export interface MacroDriverItem {
  id: string;
  driver: string;
  weightPercent: number; // 0-100
  trend: 'EXPANDING' | 'STABLE' | 'CONTRACTING';
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  impacts: string;
}

export class AiInsightsService {
  private static instance: AiInsightsService | null = null;

  public static getInstance(): AiInsightsService {
    if (!AiInsightsService.instance) {
      AiInsightsService.instance = new AiInsightsService();
    }
    return AiInsightsService.instance;
  }

  public getMarketContext(): AiMarketInsight[] {
    return [
      {
        currency: 'USD',
        symbol: undefined,
        bias: 'BULLISH',
        confidence: 74,
        catalystSummary: 'Fed rhetoric resists hasty easing; economic resilience supports real rate differential.',
        keyDrivers: [
          'Services inflation persistence (rent & labor-intensive services)',
          'Treasury yield curve stabilization near key technical thresholds',
          'Safe-haven capital flows amidst Middle East geopolitical tension'
        ],
        upcomingRisks: [
          'Upcoming Fed Chair Powell speech tone',
          'Core PCE Price Index surprise',
          'Non-Farm Payroll revisions'
        ],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD']
      },
      {
        currency: 'EUR',
        symbol: undefined,
        bias: 'NEUTRAL',
        confidence: 62,
        catalystSummary: 'ECB data dependence balances sluggish German manufacturing against service wage inflation.',
        keyDrivers: [
          'Eurozone preliminary manufacturing PMI below 50.0 contraction line',
          'ECB Governing Council divided on pace of consecutive rate cuts',
          'Gas inventory levels stabilizing European energy costs'
        ],
        upcomingRisks: [
          'ECB President Lagarde keynote address',
          'German factory orders trajectory'
        ],
        affectedInstruments: ['EURUSD', 'EURJPY']
      },
      {
        currency: 'GBP',
        symbol: undefined,
        bias: 'BULLISH',
        confidence: 68,
        catalystSummary: 'Bank of England cautious on easing due to UK services inflation remaining above 5%.',
        keyDrivers: [
          'UK core consumer price index stability',
          'Firm private sector wage settlements',
          'MPC hawkish dissenters resisting premature cuts'
        ],
        upcomingRisks: [
          'Upcoming UK CPI year-over-year release',
          'BoE Monetary Policy Committee vote distribution'
        ],
        affectedInstruments: ['GBPUSD']
      },
      {
        currency: 'JPY',
        symbol: undefined,
        bias: 'BULLISH',
        confidence: 71,
        catalystSummary: 'Bank of Japan maintains rate normalization bias as wage-price virtuous cycle takes hold.',
        keyDrivers: [
          'BoJ Governor Ueda commentary on domestic inflation pass-through',
          'Carry trade unwinds and narrowing G10-Japan yield spreads',
          'Ministry of Finance verbal currency surveillance'
        ],
        upcomingRisks: [
          'BoJ Interest Rate Decision and Outlook Report',
          'Tokyo Core CPI release'
        ],
        affectedInstruments: ['EURJPY']
      },
      {
        currency: 'GOLD',
        symbol: 'XAUUSD',
        bias: 'BULLISH',
        confidence: 82,
        catalystSummary: 'Sovereign central bank bullion accumulation and structural geopolitical hedging preserve bid.',
        keyDrivers: [
          'Central bank gold reserves net accumulation (PBoC, sovereign wealth funds)',
          'Geopolitical risk premiums across key maritime transport corridors',
          'Robust institutional physical ETF inflows during price pullbacks'
        ],
        upcomingRisks: [
          'U.S. Dollar Index explosive momentum',
          'Spike in 10-year U.S. TIPS real yields above 2.25%'
        ],
        affectedInstruments: ['XAUUSD']
      }
    ];
  }

  public getMacroDrivers(): MacroDriverItem[] {
    return [
      {
        id: 'drv-1',
        driver: 'Central Bank Rate Divergence',
        weightPercent: 35,
        trend: 'EXPANDING',
        sentiment: 'NEUTRAL',
        impacts: 'Dictates capital allocation across G10 currencies (USD yield advantage vs EUR/JPY).'
      },
      {
        id: 'drv-2',
        driver: 'Global Geopolitical Risk Premium',
        weightPercent: 25,
        trend: 'EXPANDING',
        sentiment: 'BULLISH',
        impacts: 'Provides continuous structural underlying bids for XAUUSD spot bullion.'
      },
      {
        id: 'drv-3',
        driver: 'Labor Market Normalization vs Wage Growth',
        weightPercent: 20,
        trend: 'STABLE',
        sentiment: 'NEUTRAL',
        impacts: 'Governs the terminal timing of Fed and BoE rate reduction cycles.'
      },
      {
        id: 'drv-4',
        driver: 'Energy & Commodity Supply Constraints',
        weightPercent: 20,
        trend: 'CONTRACTING',
        sentiment: 'BEARISH',
        impacts: 'Lower oil dampens headline inflation expectations, easing consumer pressures.'
      }
    ];
  }

  public getUpcomingRisks(): MarketRiskItem[] {
    return [
      {
        id: 'rsk-1',
        title: 'FOMC Policy Redirection Shock',
        date: 'Upcoming FOMC Decision',
        severity: 'CRITICAL',
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD'],
        description: 'Divergence from 25bps consensus cut or hawkish dot-plot shift could trigger sharp deleveraging.',
        tacticalMitigation: 'Reduce open position sizing prior to 14:00 UTC and widen stop loss parameters.'
      },
      {
        id: 'rsk-2',
        title: 'European Industrial Contraction Acceleration',
        date: 'Next Flash PMI Releases',
        severity: 'ELEVATED',
        affectedInstruments: ['EURUSD', 'EURJPY'],
        description: 'Persistent stagnation in export-oriented manufacturing risks sovereign spread widening.',
        tacticalMitigation: 'Hedge EUR long exposure with trailing protective stops.'
      },
      {
        id: 'rsk-3',
        title: 'Carry Trade Liquidation Flare',
        date: 'BoJ Rate Meeting',
        severity: 'ELEVATED',
        affectedInstruments: ['EURJPY'],
        description: 'Abrupt JPY strengthening triggers algorithmic stop runs on high-yielding crosses.',
        tacticalMitigation: 'Avoid heavy EURJPY long exposure into BoJ Tokyo morning window.'
      }
    ];
  }

  /**
   * Deterministic Market Impact Score (0-100)
   * Strictly deterministic based on event impact tier, time proximity, and instrument sensitivity.
   * Labeled strictly as "Market Impact Score", not "Probability of Price Movement".
   */
  public calculateMarketImpactScore(event: EconomicEvent): number {
    let base = 0;
    if (event.impact === 'HIGH') base = 75;
    else if (event.impact === 'MEDIUM') base = 45;
    else base = 25;

    // Currency relevance boost
    if (['USD', 'EUR', 'JPY', 'GBP'].includes(event.currency)) {
      base += 10;
    }

    // Time proximity boost (events within 24h get higher urgency)
    const hoursUntil = (event.timestamp - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil > 0 && hoursUntil <= 24) {
      base += 10;
    } else if (hoursUntil > 24 && hoursUntil <= 72) {
      base += 5;
    }

    return Math.min(99, Math.max(10, base));
  }
}
