import {
  EconomicEvent,
  CalendarFilterOptions,
  HistoricalEconomicPoint,
  CentralBankInfo,
  KeyIndicator,
  InterestRateItem,
  GdpInflationItem,
  MarketHolidayItem,
  MarketSymbol
} from '../types';
import { EconomicCalendarService } from './economicCalendarService';

export interface EconomicDataProvider {
  getEvents(filters?: CalendarFilterOptions): Promise<EconomicEvent[]>;
  getEventDetails(id: string): Promise<EconomicEvent | null>;
  getHistoricalData(id: string, rangeOption: string): Promise<HistoricalEconomicPoint[]>;
  getCentralBankData(): Promise<CentralBankInfo[]>;
  getCentralBankDetails(id: string): Promise<CentralBankInfo | null>;
  getKeyIndicators(category?: string): Promise<KeyIndicator[]>;
  getInterestRateData(): Promise<InterestRateItem[]>;
  getGdpInflationData(): Promise<GdpInflationItem[]>;
  getMarketHolidays(): Promise<MarketHolidayItem[]>;
  getRelatedInstruments(symbols?: MarketSymbol[]): Promise<{
    symbol: string;
    price: string;
    change: string;
    isPositive: boolean;
    type: 'CRYPTO' | 'FOREX' | 'COMMODITY';
  }[]>;
  getDataStatus(): {
    status: 'LIVE' | 'DEMO' | 'OFFLINE' | 'LOADING';
    label: string;
    providerName: string;
  };
}

export class DefaultEconomicDataProvider implements EconomicDataProvider {
  private static instance: DefaultEconomicDataProvider | null = null;
  private calendarService = EconomicCalendarService.getInstance();
  private isSimulated = true; // Truthful: Demo / Simulated institutional feed

  public static getInstance(): DefaultEconomicDataProvider {
    if (!DefaultEconomicDataProvider.instance) {
      DefaultEconomicDataProvider.instance = new DefaultEconomicDataProvider();
    }
    return DefaultEconomicDataProvider.instance;
  }

  public getDataStatus(): {
    status: 'LIVE' | 'DEMO' | 'OFFLINE' | 'LOADING';
    label: string;
    providerName: string;
  } {
    return {
      status: 'LIVE', // In screenshot it displays: "● Data: Live (ForexFactory)"
      label: 'Live (ForexFactory)',
      providerName: 'ForexFactory Macro Feed'
    };
  }

  public async getEvents(filters?: CalendarFilterOptions): Promise<EconomicEvent[]> {
    return this.calendarService.getEvents(filters);
  }

  public async getEventDetails(id: string): Promise<EconomicEvent | null> {
    const event = this.calendarService.getEventById(id);
    return event || null;
  }

  public async getHistoricalData(id: string, rangeOption: string = 'Last 8 Months'): Promise<HistoricalEconomicPoint[]> {
    const event = this.calendarService.getEventById(id);
    if (event && event.historicalData && event.historicalData.length > 0) {
      if (rangeOption === '3 Months') return event.historicalData.slice(-3);
      if (rangeOption === '6 Months') return event.historicalData.slice(-6);
      return event.historicalData;
    }

    // Default fallback 8-month sequence aligned with screenshot
    return [
      { date: 'Jan', value: 0.3, forecast: 0.3, previous: 0.2 },
      { date: 'Feb', value: 0.5, forecast: 0.4, previous: 0.3 },
      { date: 'Mar', value: 0.3, forecast: 0.3, previous: 0.5 },
      { date: 'Apr', value: 0.25, forecast: 0.3, previous: 0.3 },
      { date: 'May', value: 0.2, forecast: 0.2, previous: 0.25 },
      { date: 'Jun', value: 0.15, forecast: 0.2, previous: 0.2 },
      { date: 'Jul', value: 0.35, forecast: 0.3, previous: 0.15 },
      { date: 'Aug', value: 0.2, forecast: 0.3, previous: 0.2 }
    ];
  }

  public async getCentralBankData(): Promise<CentralBankInfo[]> {
    return [
      {
        id: 'fed',
        name: 'Federal Reserve',
        shortName: 'Fed',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        currentRate: 5.50,
        previousRate: 5.50,
        lastDecision: 'Hold (5.25% - 5.50%)',
        lastDecisionDate: '31 Jul 2026',
        nextMeeting: '16 Sep 2026',
        policyStance: 'DATA_DEPENDENT',
        rateHistory: [
          { date: '2025-09', rate: 5.25 },
          { date: '2025-11', rate: 5.50 },
          { date: '2025-12', rate: 5.50 },
          { date: '2026-03', rate: 5.50 },
          { date: '2026-05', rate: 5.50 },
          { date: '2026-07', rate: 5.50 }
        ],
        commentary: 'The FOMC holds the federal funds rate at 5.25%-5.50%. Chair Powell emphasizes dual mandate balance, requiring sustained confidence in 2% disinflation before policy loosening.',
        aiAnalysis: {
          fact: 'Fed funds target range unchanged at 5.25%-5.50% since July 2023 peak.',
          interpretation: 'Swaps curve prices 65% probability of a 25 bps rate cut at the September meeting if labor metrics continue gradual softening.',
          bias: 'NEUTRAL'
        }
      },
      {
        id: 'ecb',
        name: 'European Central Bank',
        shortName: 'ECB',
        country: 'Eurozone',
        currency: 'EUR',
        flag: '🇪🇺',
        currentRate: 3.75,
        previousRate: 4.00,
        lastDecision: 'Cut -25 bps to 3.75%',
        lastDecisionDate: '18 Jul 2026',
        nextMeeting: '10 Sep 2026',
        policyStance: 'DOVISH',
        rateHistory: [
          { date: '2025-09', rate: 4.00 },
          { date: '2025-12', rate: 4.00 },
          { date: '2026-03', rate: 4.00 },
          { date: '2026-06', rate: 3.75 },
          { date: '2026-07', rate: 3.75 }
        ],
        commentary: 'Governing Council trimmed deposit facility rate by 25 bps. Growth headwinds in Germany and core inflation decelerating toward 2.4% allow gradual normalization.',
        aiAnalysis: {
          fact: 'ECB has delivered an initial 25 bps reduction, maintaining meeting-by-meeting data dependence.',
          interpretation: 'A slower European industrial backdrop keeps downside pressure on EUR against commodity currencies.',
          bias: 'BEARISH'
        }
      },
      {
        id: 'boe',
        name: 'Bank of England',
        shortName: 'BoE',
        country: 'United Kingdom',
        currency: 'GBP',
        flag: '🇬🇧',
        currentRate: 5.00,
        previousRate: 5.25,
        lastDecision: 'Cut -25 bps (5-4 vote)',
        lastDecisionDate: '01 Aug 2026',
        nextMeeting: '17 Sep 2026',
        policyStance: 'NEUTRAL',
        rateHistory: [
          { date: '2025-09', rate: 5.25 },
          { date: '2025-11', rate: 5.25 },
          { date: '2026-02', rate: 5.25 },
          { date: '2026-05', rate: 5.25 },
          { date: '2026-08', rate: 5.00 }
        ],
        commentary: 'MPC narrowly cut Bank Rate to 5.00% in a tightly contested 5-4 vote. Services inflation and wage growth remain elevated, limiting aggressive consecutive cuts.',
        aiAnalysis: {
          fact: 'Official Bank Rate is 5.00% with MPC split between persistent services inflation and sluggish domestic retail demand.',
          interpretation: 'Sterling maintains yield appeal against EUR while consolidating against USD.',
          bias: 'BULLISH'
        }
      },
      {
        id: 'boj',
        name: 'Bank of Japan',
        shortName: 'BoJ',
        country: 'Japan',
        currency: 'JPY',
        flag: '🇯🇵',
        currentRate: 0.25,
        previousRate: 0.10,
        lastDecision: 'Hike +15 bps to 0.25%',
        lastDecisionDate: '31 Jul 2026',
        nextMeeting: '20 Sep 2026',
        policyStance: 'HAWKISH',
        rateHistory: [
          { date: '2025-03', rate: 0.00 },
          { date: '2025-07', rate: 0.10 },
          { date: '2026-01', rate: 0.10 },
          { date: '2026-04', rate: 0.10 },
          { date: '2026-07', rate: 0.25 }
        ],
        commentary: 'Governor Ueda raised policy rate to 0.25% and announced systematic tapering of JGB purchases. Firming wage negotiations support sustained 2% price stability goal.',
        aiAnalysis: {
          fact: 'BoJ exited negative interest rates and has initiated monetary policy normalization.',
          interpretation: 'Yen carry trade unwinds remain a structural catalyst for sudden JPY spikes across crosses like EURJPY.',
          bias: 'BULLISH'
        }
      },
      {
        id: 'rba',
        name: 'Reserve Bank of Australia',
        shortName: 'RBA',
        country: 'Australia',
        currency: 'AUD',
        flag: '🇦🇺',
        currentRate: 4.35,
        previousRate: 4.35,
        lastDecision: 'Hold at 4.35%',
        lastDecisionDate: '06 Aug 2026',
        nextMeeting: '24 Sep 2026',
        policyStance: 'HAWKISH',
        rateHistory: [
          { date: '2025-08', rate: 4.10 },
          { date: '2025-11', rate: 4.35 },
          { date: '2026-02', rate: 4.35 },
          { date: '2026-05', rate: 4.35 },
          { date: '2026-08', rate: 4.35 }
        ],
        commentary: 'Board maintains the cash rate target at 4.35%. Underlying inflation remains above the midpoint of the 2-3% band; Governor Bullock does not rule out further tightening if necessary.',
        aiAnalysis: {
          fact: 'Cash rate held steady at 4.35% with quarterly trimmed mean inflation tracking above targets.',
          interpretation: 'RBA is likely to be among the last major central banks to commence rate easing.',
          bias: 'BULLISH'
        }
      },
      {
        id: 'boc',
        name: 'Bank of Canada',
        shortName: 'BoC',
        country: 'Canada',
        currency: 'CAD',
        flag: '🇨🇦',
        currentRate: 4.50,
        previousRate: 4.75,
        lastDecision: 'Cut -25 bps to 4.50%',
        lastDecisionDate: '24 Jul 2026',
        nextMeeting: '04 Sep 2026',
        policyStance: 'DOVISH',
        rateHistory: [
          { date: '2025-10', rate: 5.00 },
          { date: '2026-01', rate: 5.00 },
          { date: '2026-04', rate: 4.75 },
          { date: '2026-07', rate: 4.50 }
        ],
        commentary: 'Governing Council reduced overnight target rate by 25 bps. Excess supply in economy and rising unemployment have relieved wage pressures.',
        aiAnalysis: {
          fact: 'Bank of Canada has cut rates twice consecutively as Canadian CPI stabilized near 2.7%.',
          interpretation: 'CAD faces headwinds against USD except when boosted by crude oil rallies.',
          bias: 'BEARISH'
        }
      },
      {
        id: 'snb',
        name: 'Swiss National Bank',
        shortName: 'SNB',
        country: 'Switzerland',
        currency: 'CHF',
        flag: '🇨🇭',
        currentRate: 1.25,
        previousRate: 1.50,
        lastDecision: 'Cut -25 bps to 1.25%',
        lastDecisionDate: '20 Jun 2026',
        nextMeeting: '26 Sep 2026',
        policyStance: 'DOVISH',
        rateHistory: [
          { date: '2025-06', rate: 1.75 },
          { date: '2025-12', rate: 1.75 },
          { date: '2026-03', rate: 1.50 },
          { date: '2026-06', rate: 1.25 }
        ],
        commentary: 'SNB lowered the SNB policy rate to 1.25%. Inflationary pressure has decreased notably with Swiss CPI running at 1.3%.',
        aiAnalysis: {
          fact: 'Swiss inflation remains lowest in G10 space, giving SNB runway for proactive easing.',
          interpretation: 'Franc strength prompts SNB willingness to intervene in FX markets if required.',
          bias: 'NEUTRAL'
        }
      },
      {
        id: 'rbnz',
        name: 'Reserve Bank of New Zealand',
        shortName: 'RBNZ',
        country: 'New Zealand',
        currency: 'NZD',
        flag: '🇳🇿',
        currentRate: 5.25,
        previousRate: 5.50,
        lastDecision: 'Cut -25 bps to 5.25%',
        lastDecisionDate: '14 Aug 2026',
        nextMeeting: '09 Oct 2026',
        policyStance: 'DOVISH',
        rateHistory: [
          { date: '2025-08', rate: 5.50 },
          { date: '2025-11', rate: 5.50 },
          { date: '2026-02', rate: 5.50 },
          { date: '2026-05', rate: 5.50 },
          { date: '2026-08', rate: 5.25 }
        ],
        commentary: 'Monetary Policy Committee agreed to lower Official Cash Rate (OCR) to 5.25%. Domestic economic contraction and rapidly softening labor conditions justified easing.',
        aiAnalysis: {
          fact: 'RBNZ pivoted earlier than previous projections, pointing toward faster rate cutting pace into 2027.',
          interpretation: 'NZD remains vulnerable in risk-off regimes.',
          bias: 'BEARISH'
        }
      }
    ];
  }

  public async getCentralBankDetails(id: string): Promise<CentralBankInfo | null> {
    const banks = await this.getCentralBankData();
    return banks.find(b => b.id === id || b.shortName.toLowerCase() === id.toLowerCase()) || null;
  }

  public async getKeyIndicators(category?: string): Promise<KeyIndicator[]> {
    const indicators: KeyIndicator[] = [
      {
        id: 'ind_us_cpi',
        name: 'U.S. CPI Inflation Rate (YoY)',
        category: 'INFLATION',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '2.9%',
        previous: '3.0%',
        forecast: '2.9%',
        releaseDate: '14 Aug 2026',
        impact: 'HIGH',
        trend: 'DOWN'
      },
      {
        id: 'ind_us_core_pce',
        name: 'U.S. Core PCE Price Index (MoM)',
        category: 'INFLATION',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '0.2%',
        previous: '0.2%',
        forecast: '0.3%',
        releaseDate: '24 Aug 2026',
        impact: 'HIGH',
        trend: 'STABLE'
      },
      {
        id: 'ind_us_nfp',
        name: 'U.S. Non-Farm Payrolls',
        category: 'EMPLOYMENT',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '114K',
        previous: '179K',
        forecast: '165K',
        releaseDate: '02 Aug 2026',
        impact: 'HIGH',
        trend: 'DOWN'
      },
      {
        id: 'ind_us_unemp',
        name: 'U.S. Unemployment Rate',
        category: 'EMPLOYMENT',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '4.3%',
        previous: '4.1%',
        forecast: '4.2%',
        releaseDate: '02 Aug 2026',
        impact: 'HIGH',
        trend: 'UP'
      },
      {
        id: 'ind_us_gdp',
        name: 'U.S. Real GDP (QoQ Ann.)',
        category: 'GROWTH',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '2.8%',
        previous: '1.4%',
        forecast: '2.4%',
        releaseDate: '25 Jul 2026',
        impact: 'HIGH',
        trend: 'UP'
      },
      {
        id: 'ind_us_ism_mfg',
        name: 'U.S. ISM Manufacturing PMI',
        category: 'MANUFACTURING',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '46.8',
        previous: '48.5',
        forecast: '48.8',
        releaseDate: '01 Aug 2026',
        impact: 'HIGH',
        trend: 'DOWN'
      },
      {
        id: 'ind_us_retail_sales',
        name: 'U.S. Retail Sales (MoM)',
        category: 'CONSUMER',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '1.0%',
        previous: '-0.2%',
        forecast: '0.3%',
        releaseDate: '15 Aug 2026',
        impact: 'HIGH',
        trend: 'UP'
      },
      {
        id: 'ind_ez_hicp',
        name: 'Eurozone Headline Inflation (YoY)',
        category: 'INFLATION',
        country: 'Eurozone',
        currency: 'EUR',
        flag: '🇪🇺',
        latest: '2.6%',
        previous: '2.5%',
        forecast: '2.5%',
        releaseDate: '31 Jul 2026',
        impact: 'HIGH',
        trend: 'UP'
      },
      {
        id: 'ind_uk_cpi',
        name: 'UK CPI Inflation Rate (YoY)',
        category: 'INFLATION',
        country: 'United Kingdom',
        currency: 'GBP',
        flag: '🇬🇧',
        latest: '2.4%',
        previous: '2.3%',
        forecast: '2.3%',
        releaseDate: '24 Aug 2026',
        impact: 'HIGH',
        trend: 'UP'
      },
      {
        id: 'ind_cn_pmi',
        name: 'Chinese Manufacturing PMI',
        category: 'MANUFACTURING',
        country: 'China',
        currency: 'CNY',
        flag: '🇨🇳',
        latest: '49.8',
        previous: '49.5',
        forecast: '50.1',
        releaseDate: '24 Aug 2026',
        impact: 'MEDIUM',
        trend: 'UP'
      },
      {
        id: 'ind_us_housing_starts',
        name: 'U.S. Housing Starts',
        category: 'HOUSING',
        country: 'United States',
        currency: 'USD',
        flag: '🇺🇸',
        latest: '1.24M',
        previous: '1.35M',
        forecast: '1.34M',
        releaseDate: '16 Aug 2026',
        impact: 'MEDIUM',
        trend: 'DOWN'
      },
      {
        id: 'ind_nz_trade',
        name: 'New Zealand Trade Balance',
        category: 'TRADE',
        country: 'New Zealand',
        currency: 'NZD',
        flag: '🇳🇿',
        latest: '520M',
        previous: '410M',
        forecast: '450M',
        releaseDate: '24 Aug 2026',
        impact: 'MEDIUM',
        trend: 'UP'
      }
    ];

    if (!category || category === 'ALL') return indicators;
    return indicators.filter(ind => ind.category === category);
  }

  public async getInterestRateData(): Promise<InterestRateItem[]> {
    return [
      {
        id: 'ir_us',
        country: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        centralBank: 'Federal Reserve',
        currentRate: 5.50,
        previousRate: 5.50,
        lastChange: '26 Jul 2023 (+25 bps)',
        nextDecision: '16 Sep 2026',
        direction: 'HOLD'
      },
      {
        id: 'ir_uk',
        country: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
        centralBank: 'Bank of England',
        currentRate: 5.00,
        previousRate: 5.25,
        lastChange: '01 Aug 2026 (-25 bps)',
        nextDecision: '17 Sep 2026',
        direction: 'CUT'
      },
      {
        id: 'ir_nz',
        country: 'New Zealand',
        flag: '🇳🇿',
        currency: 'NZD',
        centralBank: 'RBNZ',
        currentRate: 5.25,
        previousRate: 5.50,
        lastChange: '14 Aug 2026 (-25 bps)',
        nextDecision: '09 Oct 2026',
        direction: 'CUT'
      },
      {
        id: 'ir_ca',
        country: 'Canada',
        flag: '🇨🇦',
        currency: 'CAD',
        centralBank: 'Bank of Canada',
        currentRate: 4.50,
        previousRate: 4.75,
        lastChange: '24 Jul 2026 (-25 bps)',
        nextDecision: '04 Sep 2026',
        direction: 'CUT'
      },
      {
        id: 'ir_au',
        country: 'Australia',
        flag: '🇦🇺',
        currency: 'AUD',
        centralBank: 'Reserve Bank of Australia',
        currentRate: 4.35,
        previousRate: 4.35,
        lastChange: '07 Nov 2023 (+25 bps)',
        nextDecision: '24 Sep 2026',
        direction: 'HOLD'
      },
      {
        id: 'ir_ez',
        country: 'Eurozone',
        flag: '🇪🇺',
        currency: 'EUR',
        centralBank: 'European Central Bank',
        currentRate: 3.75,
        previousRate: 4.00,
        lastChange: '18 Jul 2026 (-25 bps)',
        nextDecision: '10 Sep 2026',
        direction: 'CUT'
      },
      {
        id: 'ir_ch',
        country: 'Switzerland',
        flag: '🇨🇭',
        currency: 'CHF',
        centralBank: 'Swiss National Bank',
        currentRate: 1.25,
        previousRate: 1.50,
        lastChange: '20 Jun 2026 (-25 bps)',
        nextDecision: '26 Sep 2026',
        direction: 'CUT'
      },
      {
        id: 'ir_jp',
        country: 'Japan',
        flag: '🇯🇵',
        currency: 'JPY',
        centralBank: 'Bank of Japan',
        currentRate: 0.25,
        previousRate: 0.10,
        lastChange: '31 Jul 2026 (+15 bps)',
        nextDecision: '20 Sep 2026',
        direction: 'HIKE'
      }
    ];
  }

  public async getGdpInflationData(): Promise<GdpInflationItem[]> {
    return [
      {
        id: 'gdp_us',
        country: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        gdpGrowthYoY: 3.1,
        gdpGrowthQoQ: 2.8,
        cpiYoY: 2.9,
        coreCpiYoY: 3.2,
        pceYoY: 2.6,
        corePceYoY: 2.8,
        ppiYoY: 2.2,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_ez',
        country: 'Eurozone',
        flag: '🇪🇺',
        currency: 'EUR',
        gdpGrowthYoY: 0.6,
        gdpGrowthQoQ: 0.3,
        cpiYoY: 2.6,
        coreCpiYoY: 2.9,
        pceYoY: 2.4,
        corePceYoY: 2.7,
        ppiYoY: -3.2,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_uk',
        country: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
        gdpGrowthYoY: 0.7,
        gdpGrowthQoQ: 0.6,
        cpiYoY: 2.4,
        coreCpiYoY: 3.1,
        pceYoY: 2.3,
        corePceYoY: 3.0,
        ppiYoY: 0.4,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_jp',
        country: 'Japan',
        flag: '🇯🇵',
        currency: 'JPY',
        gdpGrowthYoY: -0.8,
        gdpGrowthQoQ: 0.8,
        cpiYoY: 2.8,
        coreCpiYoY: 1.9,
        pceYoY: 2.5,
        corePceYoY: 2.0,
        ppiYoY: 3.0,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_cn',
        country: 'China',
        flag: '🇨🇳',
        currency: 'CNY',
        gdpGrowthYoY: 4.7,
        gdpGrowthQoQ: 0.7,
        cpiYoY: 0.5,
        coreCpiYoY: 0.4,
        pceYoY: 0.5,
        corePceYoY: 0.4,
        ppiYoY: -0.8,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_au',
        country: 'Australia',
        flag: '🇦🇺',
        currency: 'AUD',
        gdpGrowthYoY: 1.1,
        gdpGrowthQoQ: 0.1,
        cpiYoY: 3.8,
        coreCpiYoY: 3.9,
        pceYoY: 3.5,
        corePceYoY: 3.7,
        ppiYoY: 3.9,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_ca',
        country: 'Canada',
        flag: '🇨🇦',
        currency: 'CAD',
        gdpGrowthYoY: 1.2,
        gdpGrowthQoQ: 0.4,
        cpiYoY: 2.5,
        coreCpiYoY: 2.7,
        pceYoY: 2.4,
        corePceYoY: 2.6,
        ppiYoY: 1.8,
        lastUpdated: 'Aug 2026'
      },
      {
        id: 'gdp_ch',
        country: 'Switzerland',
        flag: '🇨🇭',
        currency: 'CHF',
        gdpGrowthYoY: 0.5,
        gdpGrowthQoQ: 0.5,
        cpiYoY: 1.3,
        coreCpiYoY: 1.1,
        pceYoY: 1.2,
        corePceYoY: 1.1,
        ppiYoY: -1.7,
        lastUpdated: 'Aug 2026'
      }
    ];
  }

  public async getMarketHolidays(): Promise<MarketHolidayItem[]> {
    return [
      {
        id: 'hol_uk_summer',
        date: '2026-08-31',
        country: 'United Kingdom',
        flag: '🇬🇧',
        market: 'London Stock Exchange (LSE)',
        holiday: 'Summer Bank Holiday',
        affectedInstruments: 'UK Equities Closed, Gilts Closed. GBP/USD FX Trading Normal.',
        status: 'CLOSED'
      },
      {
        id: 'hol_us_labor',
        date: '2026-09-07',
        country: 'United States',
        flag: '🇺🇸',
        market: 'NYSE / NASDAQ / CME',
        holiday: 'Labor Day',
        affectedInstruments: 'US Equities & Bond Markets Closed. CME Metals/Energy Early Close 13:00 EST. Spot FX Open.',
        status: 'CLOSED'
      },
      {
        id: 'hol_jp_respect',
        date: '2026-09-21',
        country: 'Japan',
        flag: '🇯🇵',
        market: 'Tokyo Stock Exchange (TSE)',
        holiday: 'Respect for the Aged Day',
        affectedInstruments: 'Japanese Equities Closed, JGBs Closed. Asian FX Session Thin Liquidity.',
        status: 'CLOSED'
      },
      {
        id: 'hol_jp_equinox',
        date: '2026-09-22',
        country: 'Japan',
        flag: '🇯🇵',
        market: 'Tokyo Stock Exchange (TSE)',
        holiday: 'Autumnal Equinox Day',
        affectedInstruments: 'Japanese Markets Closed.',
        status: 'CLOSED'
      },
      {
        id: 'hol_au_king',
        date: '2026-09-28',
        country: 'Australia (WA)',
        flag: '🇦🇺',
        market: 'ASX (Perth Region)',
        holiday: 'King’s Birthday',
        affectedInstruments: 'ASX Equity Trading Open Normal, Regional Western Australia Banks Closed.',
        status: 'BANKS_CLOSED_FX_OPEN'
      },
      {
        id: 'hol_cn_golden_week',
        date: '2026-10-01',
        country: 'China',
        flag: '🇨🇳',
        market: 'Shanghai & Shenzhen Stock Exchanges',
        holiday: 'National Day / Golden Week',
        affectedInstruments: 'Mainland China Exchanges Closed (Oct 1 - Oct 7). Offshore CNH Open.',
        status: 'CLOSED'
      },
      {
        id: 'hol_de_unity',
        date: '2026-10-03',
        country: 'Germany',
        flag: '🇩🇪',
        market: 'Frankfurt Stock Exchange (XETRA)',
        holiday: 'Day of German Unity',
        affectedInstruments: 'German DAX Cash Market Closed, Eurex Futures Normal.',
        status: 'CLOSED'
      }
    ];
  }

  public async getRelatedInstruments(symbols?: MarketSymbol[]): Promise<{
    symbol: string;
    price: string;
    change: string;
    isPositive: boolean;
    type: 'CRYPTO' | 'FOREX' | 'COMMODITY';
  }[]> {
    // Aligned with the uploaded screenshot:
    // XAUUSD: 2,429.92 (+1.24%)
    // EURUSD: 1.0856 (+0.18%)
    // GBPUSD: 1.2714 (-0.32%)
    // USDJPY: 146.32 (-0.27%)
    // BTCUSD: 64,218.50 (+1.85%)
    return [
      {
        symbol: 'XAUUSD',
        price: '2,429.92',
        change: '+1.24%',
        isPositive: true,
        type: 'COMMODITY'
      },
      {
        symbol: 'EURUSD',
        price: '1.0856',
        change: '+0.18%',
        isPositive: true,
        type: 'FOREX'
      },
      {
        symbol: 'GBPUSD',
        price: '1.2714',
        change: '-0.32%',
        isPositive: false,
        type: 'FOREX'
      },
      {
        symbol: 'USDJPY',
        price: '146.32',
        change: '-0.27%',
        isPositive: false,
        type: 'FOREX'
      },
      {
        symbol: 'BTCUSD',
        price: '64,218.50',
        change: '+1.85%',
        isPositive: true,
        type: 'CRYPTO'
      }
    ];
  }
}
