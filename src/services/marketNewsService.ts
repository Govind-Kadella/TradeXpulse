import { MarketNewsItem } from '../types';

export class MarketNewsService {
  private static instance: MarketNewsService | null = null;
  private newsItems: MarketNewsItem[] = [];

  private constructor() {
    this.initNewsFeed();
  }

  public static getInstance(): MarketNewsService {
    if (!MarketNewsService.instance) {
      MarketNewsService.instance = new MarketNewsService();
    }
    return MarketNewsService.instance;
  }

  private initNewsFeed() {
    const now = Date.now();
    const min = 60 * 1000;
    const hour = 60 * min;

    this.newsItems = [
      {
        id: 'news-1',
        time: '14 min ago',
        timestamp: now - 14 * min,
        headline: 'FOMC Minutes Signal Prudent Rate Path Amid Resilient Economic Indicators',
        summary: 'Federal Reserve officials emphasized data dependency and ongoing monitoring of inflation trajectory before considering adjustments.',
        impact: 'HIGH',
        sentiment: 'Neutral',
        relatedSymbols: ['XAUUSD', 'EURUSD', 'GBPUSD', 'US30'],
        source: 'Federal Reserve / Reuters'
      },
      {
        id: 'news-2',
        time: '42 min ago',
        timestamp: now - 42 * min,
        headline: 'Gold Spot Tests Key Structural Support as Dollar Index Stabilizes',
        summary: 'Institutional bullion demand absorbs selling near previous liquidity zones with sovereign reserves reporting net buying.',
        impact: 'HIGH',
        sentiment: 'Bullish',
        relatedSymbols: ['XAUUSD', 'SILVER'],
        source: 'World Gold Council / Bloomberg'
      },
      {
        id: 'news-3',
        time: '1h 28m ago',
        timestamp: now - 88 * min,
        headline: 'ECB Maintains Restrictive Policy Stance to Anchor Core Price Stability',
        summary: 'European Central Bank policymakers reiterate steady rate framework, citing persistent services inflation across eurozone economies.',
        impact: 'MEDIUM',
        sentiment: 'Bearish',
        relatedSymbols: ['EURUSD', 'EURJPY', 'GER40'],
        source: 'European Central Bank'
      },
      {
        id: 'news-4',
        time: '2h 15m ago',
        timestamp: now - 135 * min,
        headline: 'Bank of Japan Monitors Forex Volatility and Domestic Wage Growth Trend',
        summary: 'Japanese monetary officials note yen exchange rate pressures on import costs while evaluating gradual policy normalization.',
        impact: 'HIGH',
        sentiment: 'Bullish',
        relatedSymbols: ['EURJPY', 'USDJPY'],
        source: 'Bank of Japan'
      },
      {
        id: 'news-5',
        time: '3h 40m ago',
        timestamp: now - 220 * min,
        headline: 'UK Gilt Yields Steady as Bank of England Gauges Services Inflation',
        summary: 'Sterling holds near recent balance range as market participants price balanced odds on benchmark interest rates.',
        impact: 'MEDIUM',
        sentiment: 'Bullish',
        relatedSymbols: ['GBPUSD'],
        source: 'Bank of England'
      },
      {
        id: 'news-6',
        time: '5h 10m ago',
        timestamp: now - 310 * min,
        headline: 'US Initial Jobless Claims Match Expectations at 218K',
        summary: 'Labor market tightness continues to support consumer expenditures without signaling abrupt macroeconomic deterioration.',
        impact: 'LOW',
        sentiment: 'Neutral',
        relatedSymbols: ['EURUSD', 'US30', 'NAS100'],
        source: 'U.S. Bureau of Labor Statistics'
      }
    ];
  }

  public getRecentNews(filterSymbol?: string): MarketNewsItem[] {
    if (!filterSymbol || filterSymbol === 'ALL' || filterSymbol === 'All Assets') {
      return [...this.newsItems];
    }
    return this.newsItems.filter(item => 
      item.relatedSymbols.includes(filterSymbol) || 
      item.relatedSymbols.some(s => s.includes(filterSymbol))
    );
  }
}
