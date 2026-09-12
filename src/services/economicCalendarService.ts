import { 
  EconomicEvent, 
  CalendarFilterOptions, 
  EventAlert, 
  ImpactLevel, 
  EventCategory,
  CurrencyItem,
  MarketSymbol
} from '../types';

export const SUPPORTED_CURRENCIES: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', country: 'United States' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', country: 'Eurozone' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵', country: 'Japan' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', country: 'Australia' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', country: 'Canada' },
  { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', country: 'Switzerland' },
  { code: 'NZD', name: 'New Zealand Dollar', flag: '🇳🇿', country: 'New Zealand' },
  { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳', country: 'China' }
];

export const CURRENCY_INSTRUMENT_MAP: Record<string, MarketSymbol[]> = {
  USD: ['XAUUSD', 'EURUSD', 'GBPUSD'],
  EUR: ['EURUSD', 'EURJPY'],
  GBP: ['GBPUSD'],
  JPY: ['EURJPY'],
  AUD: ['EURUSD'],
  CAD: ['XAUUSD'],
  CHF: ['EURUSD'],
  NZD: ['GBPUSD'],
  CNY: ['XAUUSD']
};

export class EconomicCalendarService {
  private static instance: EconomicCalendarService | null = null;
  private events: EconomicEvent[] = [];
  private alerts: EventAlert[] = [];
  private providerStatus: 'LIVE' | 'DEMO' | 'OFFLINE' = 'DEMO';

  private constructor() {
    this.initEvents();
    this.loadAlerts();
  }

  public static getInstance(): EconomicCalendarService {
    if (!EconomicCalendarService.instance) {
      EconomicCalendarService.instance = new EconomicCalendarService();
    }
    return EconomicCalendarService.instance;
  }

  public getProviderStatus(): { status: 'LIVE' | 'DEMO' | 'OFFLINE'; label: string; source: string } {
    return {
      status: this.providerStatus,
      label: this.providerStatus === 'LIVE' ? 'Data: Live (Refinitiv)' : 'Data: Demo (Simulated Feed)',
      source: 'Refinitiv / Institutional Macro Feeds'
    };
  }

  private initEvents() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    this.events = [
      // === 2026-08-24 Canonical Events (Matches the Reference Screenshot Table Exactly) ===
      {
        id: 'evt_boj_rate_decision_canon',
        date: '2026-08-24',
        timeUtc: '00:30',
        timestamp: new Date('2026-08-24T00:30:00Z').getTime(),
        currency: 'JPY',
        country: 'Japan',
        flag: '🇯🇵',
        impact: 'HIGH',
        event: 'BoJ Interest Rate Decision',
        actual: '0.10%',
        forecast: '0.10%',
        previous: '0.10%',
        category: 'CENTRAL_BANK',
        alertType: 'BELL',
        description: 'Bank of Japan Policy Board sets the benchmark uncollateralized overnight call rate target. Serves as the primary monetary anchor for the Japanese economy.',
        historicalImportance: 'Major catalyst for yen exchange rates and global currency carry unwinds.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 92,
        affectedCurrencies: ['JPY', 'USD', 'EUR'],
        affectedInstruments: ['EURJPY'],
        historicalData: [
          { date: 'Jan', value: 0.0, forecast: 0.0, previous: 0.0 },
          { date: 'Feb', value: 0.0, forecast: 0.0, previous: 0.0 },
          { date: 'Mar', value: 0.1, forecast: 0.0, previous: 0.0 },
          { date: 'Apr', value: 0.1, forecast: 0.1, previous: 0.1 },
          { date: 'May', value: 0.1, forecast: 0.1, previous: 0.1 },
          { date: 'Jun', value: 0.1, forecast: 0.1, previous: 0.1 },
          { date: 'Jul', value: 0.1, forecast: 0.1, previous: 0.1 },
          { date: 'Aug', value: 0.1, forecast: 0.1, previous: 0.1 }
        ]
      },
      {
        id: 'evt_boj_statement_canon',
        date: '2026-08-24',
        timeUtc: '00:30',
        timestamp: new Date('2026-08-24T00:30:00Z').getTime() + 1000,
        currency: 'JPY',
        country: 'Japan',
        flag: '🇯🇵',
        impact: 'HIGH',
        event: 'BoJ Monetary Policy Statement',
        actual: null,
        forecast: null,
        previous: null,
        category: 'CENTRAL_BANK',
        alertType: 'DOCUMENT',
        description: 'Official release from the Bank of Japan outlining economic growth projections, bond-buying framework adjustments, and forward monetary guidance.',
        historicalImportance: 'Provides structural context for future rate trajectory and yields.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 89,
        affectedCurrencies: ['JPY', 'USD'],
        affectedInstruments: ['EURJPY'],
        historicalData: []
      },
      {
        id: 'evt_cn_mfg_pmi_canon',
        date: '2026-08-24',
        timeUtc: '02:00',
        timestamp: new Date('2026-08-24T02:00:00Z').getTime(),
        currency: 'CNY',
        country: 'China',
        flag: '🇨🇳',
        impact: 'MEDIUM',
        event: 'Chinese Manufacturing PMI (Aug)',
        actual: '49.8',
        forecast: '50.1',
        previous: '49.5',
        category: 'MANUFACTURING',
        alertType: 'BELL',
        description: 'National Bureau of Statistics purchasing managers index surveying key state and private industrial firms across China. Below 50 indicates contraction.',
        historicalImportance: 'Influences global commodity pricing, especially Copper and Gold (XAUUSD).',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 78,
        affectedCurrencies: ['CNY', 'AUD', 'USD'],
        affectedInstruments: ['XAUUSD'],
        historicalData: [
          { date: 'Jan', value: 49.2, forecast: 49.0, previous: 49.0 },
          { date: 'Feb', value: 49.1, forecast: 49.1, previous: 49.2 },
          { date: 'Mar', value: 50.8, forecast: 50.0, previous: 49.1 },
          { date: 'Apr', value: 50.4, forecast: 50.3, previous: 50.8 },
          { date: 'May', value: 49.5, forecast: 50.0, previous: 50.4 },
          { date: 'Jun', value: 49.5, forecast: 49.6, previous: 49.5 },
          { date: 'Jul', value: 49.4, forecast: 49.5, previous: 49.5 },
          { date: 'Aug', value: 49.8, forecast: 50.1, previous: 49.4 }
        ]
      },
      {
        id: 'evt_cn_nonmfg_pmi_canon',
        date: '2026-08-24',
        timeUtc: '02:00',
        timestamp: new Date('2026-08-24T02:00:00Z').getTime() + 1000,
        currency: 'CNY',
        country: 'China',
        flag: '🇨🇳',
        impact: 'MEDIUM',
        event: 'Chinese Non-Manufacturing PMI (Aug)',
        actual: '51.0',
        forecast: '50.8',
        previous: '50.5',
        category: 'SERVICES',
        alertType: 'BELL',
        description: 'Measures business activity across China services, construction, and logistics sectors.',
        historicalImportance: 'Gauges domestic consumer services momentum in China.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 70,
        affectedCurrencies: ['CNY', 'AUD'],
        affectedInstruments: ['XAUUSD'],
        historicalData: [
          { date: 'Jan', value: 50.7, forecast: 50.5, previous: 50.4 },
          { date: 'Feb', value: 51.4, forecast: 51.0, previous: 50.7 },
          { date: 'Mar', value: 53.0, forecast: 51.5, previous: 51.4 },
          { date: 'Apr', value: 51.2, forecast: 52.0, previous: 53.0 },
          { date: 'May', value: 51.1, forecast: 51.2, previous: 51.2 },
          { date: 'Jun', value: 50.5, forecast: 50.8, previous: 51.1 },
          { date: 'Jul', value: 50.2, forecast: 50.5, previous: 50.5 },
          { date: 'Aug', value: 51.0, forecast: 50.8, previous: 50.2 }
        ]
      },
      {
        id: 'evt_de_gfk_climate_canon',
        date: '2026-08-24',
        timeUtc: '06:00',
        timestamp: new Date('2026-08-24T06:00:00Z').getTime(),
        currency: 'EUR',
        country: 'Eurozone',
        flag: '🇪🇺',
        impact: 'HIGH',
        event: 'German GfK Consumer Climate (Sep)',
        actual: '-24.3',
        forecast: '-22.0',
        previous: '-21.8',
        category: 'CONSUMER',
        alertType: 'BELL',
        description: 'Survey of German households measuring consumer confidence, propensity to buy, and income expectations across Europe largest economy.',
        historicalImportance: 'Leading indicator of private consumer consumption in Germany.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 82,
        affectedCurrencies: ['EUR', 'USD'],
        affectedInstruments: ['EURUSD', 'EURJPY'],
        historicalData: [
          { date: 'Jan', value: -25.1, forecast: -25.0, previous: -27.6 },
          { date: 'Feb', value: -29.6, forecast: -26.0, previous: -25.1 },
          { date: 'Mar', value: -28.0, forecast: -28.5, previous: -29.6 },
          { date: 'Apr', value: -27.3, forecast: -27.0, previous: -28.0 },
          { date: 'May', value: -24.0, forecast: -26.0, previous: -27.3 },
          { date: 'Jun', value: -21.1, forecast: -23.0, previous: -24.0 },
          { date: 'Jul', value: -21.8, forecast: -21.5, previous: -21.1 },
          { date: 'Aug', value: -24.3, forecast: -22.0, previous: -21.8 }
        ]
      },
      {
        id: 'evt_uk_cpi_canon',
        date: '2026-08-24',
        timeUtc: '08:00',
        timestamp: new Date('2026-08-24T08:00:00Z').getTime(),
        currency: 'GBP',
        country: 'United Kingdom',
        flag: '🇬🇧',
        impact: 'MEDIUM',
        event: 'UK CPI y/y (Jul)',
        actual: '2.4%',
        forecast: '2.3%',
        previous: '2.3%',
        category: 'INFLATION',
        alertType: 'BELL',
        description: 'Office for National Statistics publishes the annual rate of consumer inflation in the United Kingdom.',
        historicalImportance: 'Critical input for Bank of England Monetary Policy Committee decisions.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 85,
        affectedCurrencies: ['GBP', 'USD', 'EUR'],
        affectedInstruments: ['GBPUSD'],
        historicalData: [
          { date: 'Jan', value: 4.0, forecast: 4.1, previous: 4.0 },
          { date: 'Feb', value: 3.4, forecast: 3.5, previous: 4.0 },
          { date: 'Mar', value: 3.2, forecast: 3.1, previous: 3.4 },
          { date: 'Apr', value: 2.3, forecast: 2.1, previous: 3.2 },
          { date: 'May', value: 2.0, forecast: 2.0, previous: 2.3 },
          { date: 'Jun', value: 2.0, forecast: 1.9, previous: 2.0 },
          { date: 'Jul', value: 2.2, forecast: 2.3, previous: 2.0 },
          { date: 'Aug', value: 2.4, forecast: 2.3, previous: 2.2 }
        ]
      },
      {
        id: 'evt_uk_core_cpi_canon',
        date: '2026-08-24',
        timeUtc: '08:00',
        timestamp: new Date('2026-08-24T08:00:00Z').getTime() + 1000,
        currency: 'GBP',
        country: 'United Kingdom',
        flag: '🇬🇧',
        impact: 'MEDIUM',
        event: 'UK Core CPI y/y (Jul)',
        actual: '3.1%',
        forecast: '3.0%',
        previous: '3.0%',
        category: 'INFLATION',
        alertType: 'BELL',
        description: 'UK Consumer Price Index excluding food, energy, alcohol, and tobacco.',
        historicalImportance: 'Underlying gauge of domestic persistent services inflation.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 80,
        affectedCurrencies: ['GBP', 'USD'],
        affectedInstruments: ['GBPUSD'],
        historicalData: [
          { date: 'Jan', value: 5.1, forecast: 5.2, previous: 5.1 },
          { date: 'Feb', value: 4.5, forecast: 4.6, previous: 5.1 },
          { date: 'Mar', value: 4.2, forecast: 4.1, previous: 4.5 },
          { date: 'Apr', value: 3.9, forecast: 3.6, previous: 4.2 },
          { date: 'May', value: 3.5, forecast: 3.5, previous: 3.9 },
          { date: 'Jun', value: 3.5, forecast: 3.4, previous: 3.5 },
          { date: 'Jul', value: 3.3, forecast: 3.2, previous: 3.5 },
          { date: 'Aug', value: 3.1, forecast: 3.0, previous: 3.3 }
        ]
      },
      {
        id: 'evt_us_core_pce_mom_canon',
        date: '2026-08-24',
        timeUtc: '12:30',
        timestamp: new Date('2026-08-24T12:30:00Z').getTime(),
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'HIGH',
        event: 'U.S. Core PCE Price Index (Jul)',
        actual: '0.2%',
        forecast: '0.3%',
        previous: '0.2%',
        category: 'INFLATION',
        alertType: 'BELL',
        description: 'The Core PCE Price Index measures the change in prices of goods and services, excluding food and energy. It is the Federal Reserve\'s preferred inflation gauge and a key indicator for future monetary policy decisions.',
        historicalImportance: 'Primary policy input for FOMC rate expectations. Historically induces immediate 40-70 pip volatility in major currencies and $25+ in gold.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 96,
        affectedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD', 'EURJPY'],
        historicalData: [
          { date: 'Jan', value: 0.3, forecast: 0.3, previous: 0.2 },
          { date: 'Feb', value: 0.5, forecast: 0.4, previous: 0.3 },
          { date: 'Mar', value: 0.3, forecast: 0.3, previous: 0.5 },
          { date: 'Apr', value: 0.25, forecast: 0.3, previous: 0.3 },
          { date: 'May', value: 0.2, forecast: 0.2, previous: 0.25 },
          { date: 'Jun', value: 0.15, forecast: 0.2, previous: 0.2 },
          { date: 'Jul', value: 0.35, forecast: 0.3, previous: 0.15 },
          { date: 'Aug', value: 0.2, forecast: 0.3, previous: 0.35 }
        ],
        aiAnalysis: {
          fact: 'Core PCE MoM came in at 0.2%, lower than the 0.3% forecast and matching the previous month.',
          interpretation: 'Softening core price pressure confirms continuing disinflation toward the Fed 2% target, strengthening expectations of interest rate cuts.',
          bullishScenario: 'Lower inflation print validates soft landing, lifting bullion (XAUUSD) and softening US Treasury yields.',
          bearishScenario: 'Should revisions show secondary stickiness, USD may rebound against cyclical peers.',
          neutralScenario: 'Consensus 0.2% aligns with current money market easing pricing.'
        }
      },
      {
        id: 'evt_us_pce_yoy_canon',
        date: '2026-08-24',
        timeUtc: '12:30',
        timestamp: new Date('2026-08-24T12:30:00Z').getTime() + 1000,
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'HIGH',
        event: 'U.S. PCE Price Index y/y (Jul)',
        actual: '2.6%',
        forecast: '2.7%',
        previous: '2.5%',
        category: 'INFLATION',
        alertType: 'BELL',
        description: 'Annualized change in prices for all domestic personal consumption expenditures in the United States.',
        historicalImportance: 'Comprehensive headline inflation metric tracked by macroeconomic planners.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 92,
        affectedCurrencies: ['USD', 'EUR', 'GBP'],
        affectedInstruments: ['XAUUSD', 'EURUSD'],
        historicalData: [
          { date: 'Jan', value: 2.6, forecast: 2.6, previous: 2.6 },
          { date: 'Feb', value: 2.7, forecast: 2.7, previous: 2.6 },
          { date: 'Mar', value: 2.7, forecast: 2.6, previous: 2.7 },
          { date: 'Apr', value: 2.7, forecast: 2.7, previous: 2.7 },
          { date: 'May', value: 2.6, forecast: 2.6, previous: 2.7 },
          { date: 'Jun', value: 2.5, forecast: 2.5, previous: 2.6 },
          { date: 'Jul', value: 2.5, forecast: 2.6, previous: 2.5 },
          { date: 'Aug', value: 2.6, forecast: 2.7, previous: 2.5 }
        ]
      },
      {
        id: 'evt_us_personal_income_canon',
        date: '2026-08-24',
        timeUtc: '12:30',
        timestamp: new Date('2026-08-24T12:30:00Z').getTime() + 2000,
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'MEDIUM',
        event: 'U.S. Personal Income (Jul)',
        actual: '0.3%',
        forecast: '0.3%',
        previous: '0.2%',
        category: 'CONSUMER',
        alertType: 'BELL',
        description: 'Total value of income received from all sources by American individuals during the preceding month.',
        historicalImportance: 'Leading gauge of consumer wage momentum and spending capacity.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 72,
        affectedCurrencies: ['USD'],
        affectedInstruments: ['XAUUSD', 'EURUSD'],
        historicalData: [
          { date: 'Jan', value: 0.4, forecast: 0.3, previous: 0.3 },
          { date: 'Feb', value: 0.3, forecast: 0.4, previous: 0.4 },
          { date: 'Mar', value: 0.5, forecast: 0.5, previous: 0.3 },
          { date: 'Apr', value: 0.3, forecast: 0.3, previous: 0.5 },
          { date: 'May', value: 0.4, forecast: 0.4, previous: 0.3 },
          { date: 'Jun', value: 0.2, forecast: 0.4, previous: 0.4 },
          { date: 'Jul', value: 0.2, forecast: 0.2, previous: 0.2 },
          { date: 'Aug', value: 0.3, forecast: 0.3, previous: 0.2 }
        ]
      },
      {
        id: 'evt_us_personal_spending_canon',
        date: '2026-08-24',
        timeUtc: '12:30',
        timestamp: new Date('2026-08-24T12:30:00Z').getTime() + 3000,
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'MEDIUM',
        event: 'U.S. Personal Spending (Jul)',
        actual: '0.5%',
        forecast: '0.4%',
        previous: '0.3%',
        category: 'CONSUMER',
        alertType: 'BELL',
        description: 'Measures change in inflation-adjusted expenditure by consumers on goods and services, comprising over 68% of U.S. GDP.',
        historicalImportance: 'Direct proxy for overall consumer activity and growth trajectory.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 75,
        affectedCurrencies: ['USD'],
        affectedInstruments: ['XAUUSD', 'EURUSD'],
        historicalData: [
          { date: 'Jan', value: 0.2, forecast: 0.2, previous: 0.7 },
          { date: 'Feb', value: 0.8, forecast: 0.5, previous: 0.2 },
          { date: 'Mar', value: 0.8, forecast: 0.6, previous: 0.8 },
          { date: 'Apr', value: 0.2, forecast: 0.3, previous: 0.8 },
          { date: 'May', value: 0.4, forecast: 0.3, previous: 0.2 },
          { date: 'Jun', value: 0.3, forecast: 0.3, previous: 0.4 },
          { date: 'Jul', value: 0.3, forecast: 0.3, previous: 0.3 },
          { date: 'Aug', value: 0.5, forecast: 0.4, previous: 0.3 }
        ]
      },
      {
        id: 'evt_us_new_home_sales_canon',
        date: '2026-08-24',
        timeUtc: '14:00',
        timestamp: new Date('2026-08-24T14:00:00Z').getTime(),
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'MEDIUM',
        event: 'U.S. New Home Sales (Jul)',
        actual: '680K',
        forecast: '698K',
        previous: '656K',
        category: 'HOUSING',
        alertType: 'DOCUMENT',
        description: 'Measures the annualized number of newly constructed single-family houses sold during the prior month.',
        historicalImportance: 'Sensitive to mortgage rates and broad household wealth expectations.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 74,
        affectedCurrencies: ['USD'],
        affectedInstruments: ['XAUUSD', 'EURUSD'],
        historicalData: [
          { date: 'Jan', value: 661, forecast: 680, previous: 664 },
          { date: 'Feb', value: 662, forecast: 675, previous: 661 },
          { date: 'Mar', value: 693, forecast: 668, previous: 662 },
          { date: 'Apr', value: 634, forecast: 679, previous: 693 },
          { date: 'May', value: 619, forecast: 636, previous: 634 },
          { date: 'Jun', value: 656, forecast: 640, previous: 619 },
          { date: 'Jul', value: 656, forecast: 650, previous: 656 },
          { date: 'Aug', value: 680, forecast: 698, previous: 656 }
        ]
      },
      {
        id: 'evt_us_powell_speech_canon',
        date: '2026-08-24',
        timeUtc: '15:00',
        timestamp: new Date('2026-08-24T15:00:00Z').getTime(),
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'MEDIUM',
        event: 'U.S. Fed Chair Powell Speech',
        actual: null,
        forecast: null,
        previous: null,
        category: 'CENTRAL_BANK',
        alertType: 'DOCUMENT',
        description: 'Federal Reserve Chairman Jerome Powell delivers keynote remarks on economic outlook and monetary policy framework.',
        historicalImportance: 'Comments often shape interest rate expectations across asset classes for days.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 95,
        affectedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD', 'EURJPY'],
        historicalData: []
      },
      {
        id: 'evt_us_richmond_mfg_canon',
        date: '2026-08-24',
        timeUtc: '16:00',
        timestamp: new Date('2026-08-24T16:00:00Z').getTime(),
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'LOW',
        event: 'U.S. Richmond Manufacturing Index (Aug)',
        actual: '-7',
        forecast: '-5',
        previous: '-10',
        category: 'MANUFACTURING',
        alertType: 'BELL',
        description: 'Composite index of manufacturing activity in the Fifth Federal Reserve District (Richmond).',
        historicalImportance: 'Regional manufacturing gauge, valuable as an input for national ISM models.',
        expectedVolatility: 'LOW',
        marketImpactScore: 50,
        affectedCurrencies: ['USD'],
        affectedInstruments: ['EURUSD'],
        historicalData: [
          { date: 'Jan', value: -15, forecast: -10, previous: -11 },
          { date: 'Feb', value: -5, forecast: -9, previous: -15 },
          { date: 'Mar', value: -11, forecast: -5, previous: -5 },
          { date: 'Apr', value: -7, forecast: -8, previous: -11 },
          { date: 'May', value: 0, forecast: -6, previous: -7 },
          { date: 'Jun', value: -10, forecast: -3, previous: 0 },
          { date: 'Jul', value: -10, forecast: -8, previous: -10 },
          { date: 'Aug', value: -7, forecast: -5, previous: -10 }
        ]
      },
      {
        id: 'evt_nz_trade_balance_canon',
        date: '2026-08-24',
        timeUtc: '21:45',
        timestamp: new Date('2026-08-24T21:45:00Z').getTime(),
        currency: 'NZD',
        country: 'New Zealand',
        flag: '🇳🇿',
        impact: 'MEDIUM',
        event: 'New Zealand Trade Balance (Jul)',
        actual: '520M',
        forecast: '450M',
        previous: '410M',
        category: 'TRADE',
        alertType: 'BELL',
        description: 'Difference in value between imported and exported goods for New Zealand.',
        historicalImportance: 'Export performance drives NZD valuations during Asia-Pacific trading.',
        expectedVolatility: 'MODERATE',
        marketImpactScore: 68,
        affectedCurrencies: ['NZD', 'USD'],
        affectedInstruments: ['GBPUSD'],
        historicalData: [
          { date: 'Jan', value: 210, forecast: 150, previous: -300 },
          { date: 'Feb', value: 305, forecast: 250, previous: 210 },
          { date: 'Mar', value: 450, forecast: 380, previous: 305 },
          { date: 'Apr', value: 390, forecast: 420, previous: 450 },
          { date: 'May', value: 410, forecast: 390, previous: 390 },
          { date: 'Jun', value: 410, forecast: 400, previous: 410 },
          { date: 'Jul', value: 410, forecast: 420, previous: 410 },
          { date: 'Aug', value: 520, forecast: 450, previous: 410 }
        ]
      },
      {
        id: 'evt_jp_retail_sales_canon',
        date: '2026-08-24',
        timeUtc: '23:50',
        timestamp: new Date('2026-08-24T23:50:00Z').getTime(),
        currency: 'JPY',
        country: 'Japan',
        flag: '🇯🇵',
        impact: 'LOW',
        event: 'Japanese Retail Sales y/y (Jul)',
        actual: '1.8%',
        forecast: '1.6%',
        previous: '1.5%',
        category: 'CONSUMER',
        alertType: 'BELL',
        description: 'Annualized change in total value of retail goods sold by stores throughout Japan.',
        historicalImportance: 'Direct gauge of Japanese domestic consumer spending resilience.',
        expectedVolatility: 'LOW',
        marketImpactScore: 54,
        affectedCurrencies: ['JPY', 'USD'],
        affectedInstruments: ['EURJPY'],
        historicalData: [
          { date: 'Jan', value: 2.3, forecast: 2.0, previous: 2.4 },
          { date: 'Feb', value: 4.6, forecast: 3.0, previous: 2.3 },
          { date: 'Mar', value: 1.2, forecast: 2.5, previous: 4.6 },
          { date: 'Apr', value: 2.4, forecast: 1.9, previous: 1.2 },
          { date: 'May', value: 3.0, forecast: 2.0, previous: 2.4 },
          { date: 'Jun', value: 3.7, forecast: 3.3, previous: 3.0 },
          { date: 'Jul', value: 1.5, forecast: 2.8, previous: 3.7 },
          { date: 'Aug', value: 1.8, forecast: 1.6, previous: 1.5 }
        ]
      },

      // Future/Upcoming Week Events for Range Filters & Countdown Panels
      {
        id: 'evt_fed_decision_upcoming',
        date: '2026-08-25',
        timeUtc: '18:00',
        timestamp: now + (3 * oneHour + 32 * 60 * 1000), // ~3h 32m from now for ticking timer
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'HIGH',
        event: 'Fed Rate Decision',
        actual: null,
        forecast: '5.25%',
        previous: '5.50%',
        category: 'CENTRAL_BANK',
        alertType: 'BELL',
        description: 'Federal Open Market Committee (FOMC) announces the benchmark federal funds target rate.',
        historicalImportance: 'Highest tier macro event. Historically drives 80-150 pips in EURUSD and $25-$50 moves in spot Gold.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 98,
        affectedCurrencies: ['USD', 'EUR', 'GBP', 'JPY'],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD'],
        historicalData: [
          { date: 'Jan', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Feb', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Mar', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Apr', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'May', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Jun', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Jul', value: 5.5, forecast: 5.5, previous: 5.5 },
          { date: 'Aug', value: 5.25, forecast: 5.25, previous: 5.5 }
        ]
      },
      {
        id: 'evt_cpi_upcoming',
        date: '2026-08-25',
        timeUtc: '12:30',
        timestamp: now + (28 * oneHour), // ~1d 4h
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'HIGH',
        event: 'U.S. CPI m/m',
        actual: null,
        forecast: '0.2%',
        previous: '0.2%',
        category: 'INFLATION',
        alertType: 'BELL',
        description: 'The Consumer Price Index measures the change in prices paid by consumers for goods and services.',
        historicalImportance: 'Key determinant of real interest rate expectations.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 94,
        affectedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD'],
        historicalData: []
      },
      {
        id: 'evt_ecb_press_conf',
        date: '2026-08-26',
        timeUtc: '13:15',
        timestamp: now + (49 * oneHour), // ~2d 1h
        currency: 'EUR',
        country: 'Eurozone',
        flag: '🇪🇺',
        impact: 'HIGH',
        event: 'ECB Press Conference',
        actual: null,
        forecast: null,
        previous: null,
        category: 'CENTRAL_BANK',
        alertType: 'DOCUMENT',
        description: 'President Christine Lagarde and Vice President Luis de Guindos explain policy decisions.',
        historicalImportance: 'Governing Council communication causes intraday structural breaks in European currency crosses.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 91,
        affectedCurrencies: ['EUR', 'USD', 'GBP'],
        affectedInstruments: ['EURUSD', 'EURJPY'],
        historicalData: []
      },
      {
        id: 'evt_us_nfp',
        date: '2026-08-28',
        timeUtc: '12:30',
        timestamp: now + (99 * oneHour), // ~4d 3h
        currency: 'USD',
        country: 'United States',
        flag: '🇺🇸',
        impact: 'HIGH',
        event: 'U.S. NFP (Non-Farm Payrolls)',
        actual: null,
        forecast: '165K',
        previous: '114K',
        category: 'EMPLOYMENT',
        alertType: 'BELL',
        description: 'Measures net change in employment during previous month, excluding farming sector.',
        historicalImportance: 'Highest-volatility recurring monthly economic report for global currency and bullion markets.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 96,
        affectedCurrencies: ['USD', 'EUR', 'GBP'],
        affectedInstruments: ['XAUUSD', 'EURUSD', 'GBPUSD'],
        historicalData: []
      },
      {
        id: 'evt_boe_rate_decision',
        date: '2026-08-29',
        timeUtc: '11:00',
        timestamp: now + (126 * oneHour), // ~5d 6h
        currency: 'GBP',
        country: 'United Kingdom',
        flag: '🇬🇧',
        impact: 'HIGH',
        event: 'BoE Interest Rate Decision',
        actual: null,
        forecast: '5.00%',
        previous: '5.00%',
        category: 'CENTRAL_BANK',
        alertType: 'BELL',
        description: 'Bank of England Monetary Policy Committee (MPC) vote tally and Bank Rate announcement.',
        historicalImportance: 'Split MPC votes generate substantial directional trends in Sterling pairs.',
        expectedVolatility: 'HIGH',
        marketImpactScore: 89,
        affectedCurrencies: ['GBP', 'USD', 'EUR'],
        affectedInstruments: ['GBPUSD'],
        historicalData: []
      }
    ];
  }

  public getEvents(filters?: CalendarFilterOptions): EconomicEvent[] {
    let result = [...this.events];

    // Filter by currencies
    if (filters?.currencies && filters.currencies.length > 0) {
      const curSet = new Set(filters.currencies.map(c => c.toUpperCase()));
      result = result.filter(e => curSet.has(e.currency.toUpperCase()));
    }

    // Filter by impact
    if (filters?.impact && filters.impact !== 'ALL') {
      result = result.filter(e => e.impact === filters.impact);
    }

    // Filter by event type / category
    if (filters?.eventType && filters.eventType !== 'ALL') {
      result = result.filter(e => e.category === filters.eventType);
    }

    // Filter by search query
    if (filters?.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      result = result.filter(e => 
        e.event.toLowerCase().includes(q) ||
        e.currency.toLowerCase().includes(q) ||
        e.country.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.affectedInstruments.some(inst => inst.toLowerCase().includes(q))
      );
    }

    // Filter by date range if provided
    if (filters?.startDate) {
      result = result.filter(e => e.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(e => e.date <= filters.endDate!);
    }

    // Sort chronologically by timestamp
    result.sort((a, b) => a.timestamp - b.timestamp);

    return result;
  }

  public getUpcomingHighImpactEvents(limit = 5, currencyFilter?: string[]): EconomicEvent[] {
    const now = Date.now();
    let upcoming = this.events.filter(e => e.timestamp > now && e.impact === 'HIGH');

    if (currencyFilter && currencyFilter.length > 0) {
      const curSet = new Set(currencyFilter.map(c => c.toUpperCase()));
      upcoming = upcoming.filter(e => curSet.has(e.currency.toUpperCase()));
    }

    upcoming.sort((a, b) => a.timestamp - b.timestamp);
    return upcoming.slice(0, limit);
  }

  public getMarketImpactEvents(limit = 5, currencyFilter?: string[]): EconomicEvent[] {
    return this.getUpcomingHighImpactEvents(limit, currencyFilter);
  }

  public getEventById(id: string): EconomicEvent | null {
    return this.events.find(e => e.id === id) || null;
  }

  // Alerts Management
  private loadAlerts() {
    try {
      const saved = localStorage.getItem('tradexpulse_event_alerts');
      if (saved) {
        this.alerts = JSON.parse(saved);
      }
    } catch {
      this.alerts = [];
    }
  }

  private saveAlertsToStorage() {
    try {
      localStorage.setItem('tradexpulse_event_alerts', JSON.stringify(this.alerts));
    } catch {
      // ignore
    }
  }

  public getAlerts(): EventAlert[] {
    return [...this.alerts];
  }

  public isAlertSet(eventId: string): boolean {
    return this.alerts.some(a => a.eventId === eventId);
  }

  public setAlert(alert: Omit<EventAlert, 'id' | 'createdAt'>): EventAlert {
    const existingIdx = this.alerts.findIndex(a => a.eventId === alert.eventId);
    const newAlert: EventAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now()
    };

    if (existingIdx >= 0) {
      this.alerts[existingIdx] = newAlert;
    } else {
      this.alerts.push(newAlert);
    }

    this.saveAlertsToStorage();
    return newAlert;
  }

  public addAlert(eventId: string, minutesBefore: number, eventName?: string): EventAlert {
    const event = this.getEventById(eventId);
    return this.setAlert({
      eventId,
      eventName: eventName || event?.event || 'Economic Event',
      currency: event?.currency || 'USD',
      impact: event?.impact || 'HIGH',
      eventTime: event?.timestamp || Date.now() + 3600000,
      leadTimeMinutes: minutesBefore,
      soundEnabled: true
    });
  }

  public removeAlert(eventId: string): boolean {
    const initLen = this.alerts.length;
    this.alerts = this.alerts.filter(a => a.eventId !== eventId);
    if (this.alerts.length !== initLen) {
      this.saveAlertsToStorage();
      return true;
    }
    return false;
  }
}
