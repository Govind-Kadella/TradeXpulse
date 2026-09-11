import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { 
  ScannerInstrument, 
  AssetCategory, 
  HeatmapMode, 
  ViewLayoutMode, 
  MarketSymbol,
  BiasType
} from '../types';
import { 
  MarketScannerService, 
  SCANNER_CATALOG 
} from '../services/marketScannerService';
import { TwelveDataMarketService } from '../services/TwelveDataMarketService';
import { 
  Compass, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Star, 
  RefreshCw, 
  Activity, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Eye, 
  BarChart3, 
  Clock, 
  Filter, 
  Grid3X3, 
  List, 
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronLeft
} from 'lucide-react';

const CATEGORIES: AssetCategory[] = [
  'All Assets',
  'Forex',
  'Commodities',
  'Indices',
  'Crypto',
  'Stocks'
];

type SortField = 'symbol' | 'price' | 'changePercent24h' | 'confidence' | 'opportunityScore' | 'lastUpdate';
type SortDirection = 'asc' | 'desc';

export const MarketOverview: React.FC = () => {
  const {
    activeSymbol,
    setSymbol,
    setView,
    marketOverview,
    connectionStatus,
    marketDataStatus
  } = usePredictionState();

  // --- STATE ---
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('All Assets');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('GRID');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('PRICE_CHANGE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [signalFilter, setSignalFilter] = useState<'ALL' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('ALL');
  const [timeframeFilter, setTimeframeFilter] = useState<'ALL' | 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1'>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('opportunityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Column Visibility
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState<boolean>(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    price: true,
    change24h: true,
    signal: true,
    confidence: true,
    trendH1: true,
    trendH4: true,
    volatility: true,
    oppScore: true,
    lastUpdate: true
  });

  // Favorites (persisted in localStorage)
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('tradexpulse_favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set(['XAUUSD', 'EURUSD']);
    } catch {
      return new Set(['XAUUSD', 'EURUSD']);
    }
  });

  // Multi-select rows
  const [selectedRowSymbols, setSelectedRowSymbols] = useState<Set<string>>(new Set());

  // Live UTC Clock
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().slice(11, 19) + ' UTC');
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Multi-market live states listener
  const [liveMarketStates, setLiveMarketStates] = useState(() => {
    return TwelveDataMarketService.getInstance().getAllMarketStates();
  });

  useEffect(() => {
    const service = TwelveDataMarketService.getInstance();
    const unsubscribe = service.onMultiMarketUpdate(states => {
      setLiveMarketStates({ ...states });
    });
    return unsubscribe;
  }, []);

  // Refresh trigger counter for animation and re-computation
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // --- CANONICAL SCANNER DATASET ---
  const allInstruments: ScannerInstrument[] = useMemo(() => {
    return MarketScannerService.scanAllInstruments(
      activeSymbol,
      marketOverview.currentPrice,
      liveMarketStates
    );
  }, [activeSymbol, marketOverview.currentPrice, liveMarketStates, refreshKey]);

  // Aggregate Sentiment & Fear/Greed calculated from canonical dataset
  const sentiment = useMemo(() => {
    return MarketScannerService.calculateSentiment(allInstruments);
  }, [allInstruments]);

  const fearGreed = useMemo(() => {
    return MarketScannerService.calculateFearGreed(allInstruments);
  }, [allInstruments]);

  const topOpportunities = useMemo(() => {
    return MarketScannerService.getTopOpportunities(allInstruments, 5);
  }, [allInstruments]);

  // Favorite toggle handler
  const toggleFavorite = (symbol: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      try {
        localStorage.setItem('tradexpulse_favorites', JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Could not save favorites to localStorage', err);
      }
      return next;
    });
  };

  // Filtered dataset
  const filteredInstruments = useMemo(() => {
    return allInstruments.filter(item => {
      // Category filter
      if (selectedCategory !== 'All Assets' && item.category !== selectedCategory) {
        return false;
      }
      // Favorites filter
      if (onlyFavorites && !favorites.has(item.symbol)) {
        return false;
      }
      // Signal filter
      if (signalFilter === 'BULLISH' && item.direction !== 'BULLISH') return false;
      if (signalFilter === 'BEARISH' && item.direction !== 'BEARISH') return false;
      if (signalFilter === 'NEUTRAL' && item.direction !== 'NO TRADE') return false;

      // Search query filter (symbol or full name)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesSymbol = item.symbol.toLowerCase().includes(query);
        const matchesName = item.name.toLowerCase().includes(query);
        if (!matchesSymbol && !matchesName) return false;
      }

      return true;
    });
  }, [allInstruments, selectedCategory, onlyFavorites, favorites, signalFilter, searchQuery]);

  // Sorted dataset
  const sortedInstruments = useMemo(() => {
    const list = [...filteredInstruments];
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'symbol') {
        valA = a.symbol;
        valB = b.symbol;
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
    return list;
  }, [filteredInstruments, sortField, sortDirection]);

  // Paginated dataset
  const totalPages = Math.max(1, Math.ceil(sortedInstruments.length / pageSize));
  const paginatedInstruments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedInstruments.slice(start, start + pageSize);
  }, [sortedInstruments, currentPage, pageSize]);

  // Reset pagination if filtered list changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sort toggle handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Navigate to Chart for symbol
  const handleViewInstrument = (symbol: string) => {
    // If it's one of the 4 core symbols, switch directly; otherwise fallback to closest or XAUUSD
    const coreSymbols: MarketSymbol[] = ['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'];
    if (coreSymbols.includes(symbol as MarketSymbol)) {
      setSymbol(symbol as MarketSymbol);
    } else {
      // Set to closest core market matching category or XAUUSD
      if (symbol === 'SILVER' || symbol === 'UKOIL' || symbol === 'USOIL') setSymbol('XAUUSD');
      else if (symbol.includes('EUR') || symbol.includes('USD') || symbol.includes('JPY') || symbol.includes('AUD')) setSymbol('EURUSD');
      else setSymbol('XAUUSD');
    }
    setView('dashboard');
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = [
      'Symbol',
      'Name',
      'Category',
      'Price',
      '24h Change',
      '24h Change %',
      'Signal',
      'Confidence %',
      'Trend H1',
      'Trend H4',
      'Volatility',
      'Opportunity Score',
      'Support',
      'Resistance',
      'Last Update'
    ];

    const rows = filteredInstruments.map(item => [
      `"${item.symbol}"`,
      `"${item.name}"`,
      `"${item.category}"`,
      item.price.toFixed(item.digits),
      item.change24h.toFixed(item.digits),
      `${item.changePercent24h.toFixed(2)}%`,
      `"${item.direction}"`,
      item.confidence,
      `"${item.trendH1}"`,
      `"${item.trendH4}"`,
      `"${item.volatility}"`,
      item.opportunityScore,
      item.support.toFixed(item.digits),
      item.resistance.toFixed(item.digits),
      `"${item.lastUpdate}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tradexpulse-market-overview-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Top opportunity instrument
  const bestOpportunity = topOpportunities[0] || allInstruments[0];

  // Hover Tooltip State for Heatmap Tiles
  const [hoveredTile, setHoveredTile] = useState<{
    item: ScannerInstrument;
    x: number;
    y: number;
  } | null>(null);

  // Column toggle handler
  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div 
      className="flex-1 flex flex-col bg-[#070B14] text-slate-100 overflow-y-auto select-none font-sans min-h-0"
      id="market-overview-page"
    >
      {/* 1. PAGE HEADER */}
      <header className="border-b border-[#182338] bg-[#0A0F1D]/80 backdrop-blur px-4 sm:px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 uppercase">
                Market Scanner • Intelligence Terminal
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                PAGE 2 / 2
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <span>MARKET OVERVIEW</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></span>
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-0.5">
              Real-time market analysis across multiple assets. Find opportunities with AI-powered insights.
            </p>
          </div>

          {/* Right: Status Pill & Live UTC Clock */}
          <div className="flex items-center flex-wrap gap-3">
            {/* Truthful Connection Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B] shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'LIVE' 
                    ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]' 
                    : connectionStatus === 'DEMO'
                    ? 'bg-cyan-400'
                    : 'bg-amber-400'
                }`} />
                <span className="text-xs font-mono font-bold text-slate-200 uppercase">
                  {connectionStatus === 'LIVE' ? 'LIVE FEED' : 'DEMO ENGINE'}
                </span>
              </div>
              <span className="text-slate-600">|</span>
              <span className="text-[11px] text-slate-400 font-medium">
                {marketDataStatus?.provider || 'Twelve Data'}
              </span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0F172A] border border-[#1E293B]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <div className="flex flex-col text-right leading-none">
                <span className="font-mono text-xs font-bold text-slate-200">
                  {currentTime || '00:00:00 UTC'}
                </span>
                <span className="text-[9px] text-slate-400">
                  {currentDate}
                </span>
              </div>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={handleManualRefresh}
              title="Refresh Market Intelligence"
              className="p-2 rounded-lg bg-[#0F172A] border border-[#1E293B] hover:border-cyan-500/40 hover:text-cyan-300 text-slate-400 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        
        {/* ASSET CATEGORY NAVIGATION BAR + CUSTOM VIEW CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-1 border-b border-[#141E30]">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none" id="category-filter-tabs">
            {CATEGORIES.map(category => {
              const isActive = selectedCategory === category;
              const count = category === 'All Assets' 
                ? allInstruments.length 
                : allInstruments.filter(i => i.category === category).length;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                      : 'bg-[#0E1524] text-slate-400 hover:text-slate-200 hover:bg-[#131D31] border border-transparent'
                  }`}
                >
                  <span>{category}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                    isActive ? 'bg-cyan-500/20 text-cyan-200 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Controls: Favorites Toggle, Grid/List View Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Favorites Filter Button */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                onlyFavorites
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                  : 'bg-[#0E1524] text-slate-400 hover:text-white border-[#1B263B]'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
              <span>Favorites ({favorites.size})</span>
            </button>

            {/* Layout Mode (Grid vs List) */}
            <div className="flex items-center bg-[#0E1524] p-1 rounded-lg border border-[#1B263B]">
              <button
                onClick={() => setViewLayout('GRID')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === 'GRID'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Heatmap View"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewLayout('LIST')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  viewLayout === 'LIST'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Detailed List Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. TOP 6 KPI SUMMARY CARDS */}
        <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4" id="kpi-summary-cards">
          {/* Card 1: Total Instruments */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-[#182338] flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Scanned</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-mono">
                {filteredInstruments.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                of {allInstruments.length} monitored markets
              </div>
            </div>
          </div>

          {/* Card 2: Bullish Signals */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-[#182338] flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bullish</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400 font-mono flex items-baseline gap-1.5">
                <span>{sentiment.bullishCount}</span>
                <span className="text-xs font-bold text-emerald-400/80">({sentiment.bullishPercent}%)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Upward momentum bias
              </div>
            </div>
          </div>

          {/* Card 3: Bearish Signals */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-[#182338] flex flex-col justify-between hover:border-rose-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bearish</span>
              <TrendingDown className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-rose-400 font-mono flex items-baseline gap-1.5">
                <span>{sentiment.bearishCount}</span>
                <span className="text-xs font-bold text-rose-400/80">({sentiment.bearishPercent}%)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Downward expansion flow
              </div>
            </div>
          </div>

          {/* Card 4: Neutral */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-[#182338] flex flex-col justify-between hover:border-slate-500 transition-all shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Neutral</span>
              <MinusCircle className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-300 font-mono flex items-baseline gap-1.5">
                <span>{sentiment.neutralCount}</span>
                <span className="text-xs font-bold text-slate-400">({sentiment.neutralPercent}%)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Consolidation / No Trade
              </div>
            </div>
          </div>

          {/* Card 5: Top Opportunity */}
          <div 
            onClick={() => bestOpportunity && handleViewInstrument(bestOpportunity.symbol)}
            className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-blue-500/30 flex flex-col justify-between hover:border-cyan-400 hover:bg-[#0E1528] transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.08)] group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Top Setup
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                {bestOpportunity ? `${bestOpportunity.opportunityScore}/100` : 'N/A'}
              </span>
            </div>
            {bestOpportunity ? (
              <div>
                <div className="text-lg font-black text-white font-mono flex items-center justify-between">
                  <span>{bestOpportunity.symbol}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="text-[11px] font-bold mt-0.5 text-emerald-400 truncate">
                  {bestOpportunity.direction === 'BULLISH' ? '↑ Bullish Setup' : '↓ Bearish Setup'}
                </div>
              </div>
            ) : (
              <div className="text-sm font-semibold text-slate-500">None detected</div>
            )}
          </div>

          {/* Card 6: Market Status */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-[#0B101D] border border-[#182338] flex flex-col justify-between hover:border-slate-600 transition-all shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Stream Status</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                <span className="font-mono">{connectionStatus}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Zero synthetic lag
              </div>
            </div>
          </div>
        </section>

        {/* 4. MARKET HEATMAP PANEL (When in Grid View) */}
        {viewLayout === 'GRID' && (
          <section className="bg-[#0B101D] border border-[#182338] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
            {/* Heatmap Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#182338]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white tracking-wide">
                    MARKET HEATMAP
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 font-bold border border-blue-500/20">
                    {filteredInstruments.length} TILES
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual asset matrix color-coded by relative performance and predictive confluence
                </p>
              </div>

              {/* Heatmap Modes Selector */}
              <div className="flex items-center bg-[#070B14] p-1 rounded-lg border border-[#1E293B] shrink-0 self-start sm:self-auto">
                {(['PRICE_CHANGE', 'AI_SIGNAL', 'VOLATILITY', 'CUSTOM'] as HeatmapMode[]).map(mode => {
                  const label = 
                    mode === 'PRICE_CHANGE' ? 'Price Change' :
                    mode === 'AI_SIGNAL' ? 'AI Signal' :
                    mode === 'VOLATILITY' ? 'Volatility' : 'Opportunity';

                  return (
                    <button
                      key={mode}
                      onClick={() => setHeatmapMode(mode)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        heatmapMode === mode
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Heatmap Tiles Grid */}
            {filteredInstruments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {filteredInstruments.map(item => {
                  const isUp = item.changePercent24h >= 0;
                  const isBull = item.direction === 'BULLISH';
                  const isBear = item.direction === 'BEARISH';
                  const isFav = favorites.has(item.symbol);

                  // Determine tile color scheme according to active heatmap mode
                  let borderClass = 'border-[#182338] hover:border-slate-500';
                  let bgClass = 'bg-[#0E1526]';
                  let metricValue = `${isUp ? '+' : ''}${item.changePercent24h.toFixed(2)}%`;
                  let metricColor = isUp ? 'text-emerald-400' : 'text-rose-400';

                  if (heatmapMode === 'PRICE_CHANGE') {
                    if (item.changePercent24h > 1.0) {
                      bgClass = 'bg-emerald-950/40 hover:bg-emerald-900/50';
                      borderClass = 'border-emerald-500/40 hover:border-emerald-400';
                    } else if (item.changePercent24h > 0) {
                      bgClass = 'bg-emerald-950/20 hover:bg-emerald-900/30';
                      borderClass = 'border-emerald-600/30 hover:border-emerald-500';
                    } else if (item.changePercent24h < -1.0) {
                      bgClass = 'bg-rose-950/40 hover:bg-rose-900/50';
                      borderClass = 'border-rose-500/40 hover:border-rose-400';
                    } else {
                      bgClass = 'bg-rose-950/20 hover:bg-rose-900/30';
                      borderClass = 'border-rose-600/30 hover:border-rose-500';
                    }
                  } else if (heatmapMode === 'AI_SIGNAL') {
                    if (isBull) {
                      metricValue = `BULLISH ${item.confidence}%`;
                      metricColor = 'text-emerald-400';
                      bgClass = 'bg-emerald-950/30 hover:bg-emerald-900/40';
                      borderClass = 'border-emerald-500/40 hover:border-emerald-400';
                    } else if (isBear) {
                      metricValue = `BEARISH ${item.confidence}%`;
                      metricColor = 'text-rose-400';
                      bgClass = 'bg-rose-950/30 hover:bg-rose-900/40';
                      borderClass = 'border-rose-500/40 hover:border-rose-400';
                    } else {
                      metricValue = 'NEUTRAL';
                      metricColor = 'text-slate-400';
                      bgClass = 'bg-slate-900/40 hover:bg-slate-800/50';
                      borderClass = 'border-slate-700/50 hover:border-slate-500';
                    }
                  } else if (heatmapMode === 'VOLATILITY') {
                    metricValue = `${item.volatility} VOL`;
                    if (item.volatility === 'HIGH' || item.volatility === 'EXTREME') {
                      metricColor = 'text-amber-400';
                      bgClass = 'bg-amber-950/25 hover:bg-amber-900/35';
                      borderClass = 'border-amber-500/40 hover:border-amber-400';
                    } else {
                      metricColor = 'text-cyan-400';
                      bgClass = 'bg-blue-950/25 hover:bg-blue-900/35';
                      borderClass = 'border-blue-500/30 hover:border-blue-400';
                    }
                  } else {
                    metricValue = `SCORE ${item.opportunityScore}`;
                    metricColor = item.opportunityScore >= 75 ? 'text-cyan-300' : 'text-slate-300';
                    bgClass = item.opportunityScore >= 75 ? 'bg-cyan-950/30 hover:bg-cyan-900/40' : 'bg-[#0E1526]';
                    borderClass = item.opportunityScore >= 75 ? 'border-cyan-500/40' : 'border-[#182338]';
                  }

                  // Sparkline path calculation
                  const sparkPrices = item.sparkline;
                  const minSp = Math.min(...sparkPrices);
                  const maxSp = Math.max(...sparkPrices);
                  const spRange = maxSp - minSp || 1;
                  const spWidth = 70;
                  const spHeight = 22;
                  const points = sparkPrices.map((p, idx) => {
                    const x = (idx / (sparkPrices.length - 1)) * spWidth;
                    const y = spHeight - ((p - minSp) / spRange) * (spHeight - 4) - 2;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  }).join(' ');

                  return (
                    <div
                      key={item.symbol}
                      onClick={() => handleViewInstrument(item.symbol)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredTile({ item, x: rect.left, y: rect.bottom + 8 });
                      }}
                      onMouseLeave={() => setHoveredTile(null)}
                      className={`relative p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-sm ${bgClass} ${borderClass} group`}
                    >
                      {/* Top row: Symbol & Favorite Star */}
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono font-black text-sm text-white tracking-wide block">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block max-w-[95px]">
                            {item.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => toggleFavorite(item.symbol, e)}
                          className="p-1 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-3 h-3 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                        </button>
                      </div>

                      {/* Sparkline & Current Price */}
                      <div className="flex items-center justify-between gap-2 my-0.5">
                        <div className="font-mono text-xs font-bold text-slate-200">
                          {item.price.toFixed(item.digits)}
                        </div>
                        <svg width={spWidth} height={spHeight} className="overflow-visible shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <polyline
                            fill="none"
                            stroke={isUp ? '#10b981' : '#ef4444'}
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                        </svg>
                      </div>

                      {/* Bottom row: Mode metric + Direction pill */}
                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-slate-700/30">
                        <span className={`text-[11px] font-mono font-black ${metricColor}`}>
                          {metricValue}
                        </span>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                          isBull
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isBear
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isBull ? '↑ BULL' : isBear ? '↓ BEAR' : '→ NEUT'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Filter className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-sm font-semibold">No instruments match the selected filter.</p>
                <button
                  onClick={() => { setSelectedCategory('All Assets'); setOnlyFavorites(false); setSignalFilter('ALL'); setSearchQuery(''); }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* 5. MARKET INTELLIGENCE COLUMNS (SENTIMENT DONUT + FEAR & GREED + TOP OPPORTUNITIES) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column A: Market Sentiment Donut */}
          <div className="bg-[#0B101D] border border-[#182338] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  Market Sentiment
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131D31] text-slate-400">
                  {sentiment.total} ASSETS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Aggregate directional posture across scanned market
              </p>
            </div>

            {/* SVG Donut Chart */}
            <div className="py-4 flex items-center justify-center">
              <div className="relative w-40 h-40 flex items-center justify-center">
                {(() => {
                  const r = 58;
                  const c = 2 * Math.PI * r;
                  const bullLength = (sentiment.bullishPercent / 100) * c;
                  const bearLength = (sentiment.bearishPercent / 100) * c;
                  const neutLength = Math.max(0, c - bullLength - bearLength);

                  return (
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                      {/* Background circle */}
                      <circle cx="70" cy="70" r={r} stroke="#1A2438" strokeWidth="14" fill="transparent" />
                      {/* Bullish segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={r}
                        stroke="#10b981"
                        strokeWidth="14"
                        fill="transparent"
                        strokeDasharray={`${bullLength} ${c - bullLength}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />
                      {/* Bearish segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={r}
                        stroke="#ef4444"
                        strokeWidth="14"
                        fill="transparent"
                        strokeDasharray={`${bearLength} ${c - bearLength}`}
                        strokeDashoffset={`-${bullLength}`}
                        strokeLinecap="round"
                      />
                      {/* Neutral segment */}
                      <circle
                        cx="70"
                        cy="70"
                        r={r}
                        stroke="#64748b"
                        strokeWidth="14"
                        fill="transparent"
                        strokeDasharray={`${neutLength} ${c - neutLength}`}
                        strokeDashoffset={`-${bullLength + bearLength}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  );
                })()}

                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-white font-mono">
                    {sentiment.bullishPercent >= sentiment.bearishPercent 
                      ? `${sentiment.bullishPercent}%` 
                      : `${sentiment.bearishPercent}%`}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    sentiment.bullishPercent >= sentiment.bearishPercent 
                      ? 'text-emerald-400' 
                      : 'text-rose-400'
                  }`}>
                    {sentiment.bullishPercent >= sentiment.bearishPercent ? 'Bull Dominant' : 'Bear Dominant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#182338] text-center">
              <div className="p-1.5 rounded-lg bg-[#0E1526]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Bullish
                </div>
                <span className="font-mono text-xs font-bold text-white block mt-0.5">
                  {sentiment.bullishCount} ({sentiment.bullishPercent}%)
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#0E1526]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-400" /> Bearish
                </div>
                <span className="font-mono text-xs font-bold text-white block mt-0.5">
                  {sentiment.bearishCount} ({sentiment.bearishPercent}%)
                </span>
              </div>
              <div className="p-1.5 rounded-lg bg-[#0E1526]">
                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-slate-400" /> Neutral
                </div>
                <span className="font-mono text-xs font-bold text-white block mt-0.5">
                  {sentiment.neutralCount} ({sentiment.neutralPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Column B: TradeXpulse Market Sentiment Index (Fear & Greed) */}
          <div className="bg-[#0B101D] border border-[#182338] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  Sentiment Index
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 font-bold">
                  FEAR & GREED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-factor composite measuring breadth, momentum, and risk
              </p>
            </div>

            {/* Semicircular Radial Gauge */}
            <div className="py-3 flex flex-col items-center justify-center">
              <div className="relative w-48 h-26 flex items-center justify-center overflow-hidden">
                <svg className="w-48 h-48" viewBox="0 0 160 160">
                  {/* Arc Path (180 degrees) */}
                  <path
                    d="M 15 80 A 65 65 0 0 1 145 80"
                    fill="none"
                    stroke="#182338"
                    strokeWidth="14"
                    strokeLinecap="round"
                  />
                  {/* Active Gradient / Zone Arc */}
                  {(() => {
                    const angle = (fearGreed.score / 100) * 180;
                    const rad = (Math.PI / 180) * (180 - angle);
                    const nx = 80 - 65 * Math.cos(rad);
                    const ny = 80 - 65 * Math.sin(rad);
                    const isGreed = fearGreed.score >= 50;

                    return (
                      <>
                        <path
                          d="M 15 80 A 65 65 0 0 1 145 80"
                          fill="none"
                          stroke={isGreed ? '#10b981' : '#ef4444'}
                          strokeWidth="14"
                          strokeDasharray="204"
                          strokeDashoffset={204 - (fearGreed.score / 100) * 204}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                        {/* Needle dot indicator */}
                        <circle cx={nx} cy={ny} r="5" fill="#ffffff" stroke="#0B101D" strokeWidth="2" />
                      </>
                    );
                  })()}
                </svg>

                {/* Gauge readout */}
                <div className="absolute bottom-1 flex flex-col items-center leading-none">
                  <span className="text-2xl font-black text-white font-mono">
                    {fearGreed.score}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider mt-0.5 ${
                    fearGreed.score > 55 ? 'text-emerald-400' :
                    fearGreed.score < 45 ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {fearGreed.zone}
                  </span>
                </div>
              </div>

              {/* Zones Reference Bar */}
              <div className="flex justify-between w-full text-[9px] font-mono text-slate-500 px-3 mt-1">
                <span>0 Extreme Fear</span>
                <span>50 Neutral</span>
                <span>100 Greed</span>
              </div>
            </div>

            {/* Index Factors Breakdown */}
            <div className="space-y-1.5 pt-3 border-t border-[#182338] text-[11px]">
              <div className="flex items-center justify-between text-slate-400">
                <span>Breadth Confluence</span>
                <span className="font-mono font-bold text-slate-200">{fearGreed.breadthScore}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Momentum Strength</span>
                <span className="font-mono font-bold text-slate-200">{fearGreed.momentumScore}%</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Volatility Stability</span>
                <span className="font-mono font-bold text-slate-200">{fearGreed.volatilityScore}%</span>
              </div>
            </div>
          </div>

          {/* Column C: Top Ranked Opportunities */}
          <div className="bg-[#0B101D] border border-[#182338] rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Top Opportunities
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 font-bold">
                  AI RANKED
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Highest structural confluence and execution alignment
              </p>
            </div>

            {/* Opportunities List */}
            <div className="space-y-2 py-2">
              {topOpportunities.map((opp, index) => {
                const isBull = opp.direction === 'BULLISH';

                return (
                  <div
                    key={opp.symbol}
                    onClick={() => handleViewInstrument(opp.symbol)}
                    className="p-2 sm:p-2.5 rounded-xl bg-[#0E1526] hover:bg-[#121B32] border border-[#182338] hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-[#182338] text-slate-300 font-mono text-[10px] font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-mono font-black text-xs text-white group-hover:text-cyan-300 transition-colors block">
                          {opp.symbol}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {opp.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isBull 
                          ? 'bg-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {isBull ? '↑ Bullish' : '↓ Bearish'}
                      </span>

                      <div className="text-right">
                        <span className="font-mono text-xs font-black text-white">
                          {opp.opportunityScore}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-0.5">score</span>
                      </div>

                      <Eye className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#182338] text-center">
              <span className="text-[10px] text-slate-500">
                Click any asset to open instant institutional chart analysis
              </span>
            </div>
          </div>
        </section>

        {/* 6. ALL INSTRUMENTS TABLE (WITH SEARCH, FILTERS, SORTING, PAGINATION, EXPORT) */}
        <section className="bg-[#0B101D] border border-[#182338] rounded-2xl shadow-xl overflow-hidden space-y-0" id="all-instruments-table-container">
          {/* Table Toolbar */}
          <div className="p-4 sm:p-5 border-b border-[#182338] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                <span>ALL INSTRUMENTS</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({filteredInstruments.length} matched)
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete institutional asset table with multi-timeframe analytics
              </p>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Field */}
              <div className="relative min-w-[180px] sm:min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search symbol..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#070B14] border border-[#1E293B] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Signal Filter Dropdown */}
              <select
                value={signalFilter}
                onChange={(e) => setSignalFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[#070B14] border border-[#1E293B] text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="ALL">All Signals</option>
                <option value="BULLISH">Bullish Only</option>
                <option value="BEARISH">Bearish Only</option>
                <option value="NEUTRAL">Neutral Only</option>
              </select>

              {/* Timeframe Filter Dropdown */}
              <select
                value={timeframeFilter}
                onChange={(e) => setTimeframeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-lg bg-[#070B14] border border-[#1E293B] text-xs text-slate-300 font-semibold focus:outline-none focus:border-cyan-500/50 cursor-pointer"
              >
                <option value="ALL">All Timeframes</option>
                <option value="M1">M1 Scalp</option>
                <option value="M5">M5 Primary</option>
                <option value="M15">M15 Intraday</option>
                <option value="H1">H1 Trend</option>
                <option value="H4">H4 Swing</option>
                <option value="D1">D1 Macro</option>
              </select>

              {/* Column Visibility Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsColumnMenuOpen(!isColumnMenuOpen)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#070B14] border border-[#1E293B] hover:border-slate-500 text-xs text-slate-300 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Columns</span>
                </button>

                {isColumnMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#0E1526] border border-[#1E293B] p-2 shadow-2xl z-30 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1 block">Toggle Columns</span>
                    {Object.entries(visibleColumns).map(([colKey, isVis]) => (
                      <label 
                        key={colKey} 
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-slate-300 hover:bg-[#182338] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isVis}
                          onChange={() => toggleColumn(colKey)}
                          className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
                        />
                        <span className="capitalize">{colKey.replace('trend', 'Trend ')}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Export CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export filtered table as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Table Component */}
          <div className="overflow-x-auto min-w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#182338] bg-[#070B14]/60 text-slate-400 font-semibold">
                  <th className="py-3 px-3 w-8 text-center">
                    <Star className="w-3.5 h-3.5 mx-auto text-slate-600" />
                  </th>
                  <th 
                    onClick={() => handleSort('symbol')}
                    className="py-3 px-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Symbol</span>
                      {sortField === 'symbol' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  {visibleColumns.name && (
                    <th className="py-3 px-3">Name</th>
                  )}
                  {visibleColumns.price && (
                    <th 
                      onClick={() => handleSort('price')}
                      className="py-3 px-3 cursor-pointer hover:text-white text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Price</span>
                        {sortField === 'price' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                  )}
                  {visibleColumns.change24h && (
                    <th 
                      onClick={() => handleSort('changePercent24h')}
                      className="py-3 px-3 cursor-pointer hover:text-white text-right"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>24h Change</span>
                        {sortField === 'changePercent24h' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                  )}
                  {visibleColumns.signal && (
                    <th className="py-3 px-3 text-center">Signal</th>
                  )}
                  {visibleColumns.confidence && (
                    <th 
                      onClick={() => handleSort('confidence')}
                      className="py-3 px-3 cursor-pointer hover:text-white text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Confidence</span>
                        {sortField === 'confidence' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                  )}
                  {visibleColumns.trendH1 && (
                    <th className="py-3 px-3 text-center">Trend H1</th>
                  )}
                  {visibleColumns.trendH4 && (
                    <th className="py-3 px-3 text-center">Trend H4</th>
                  )}
                  {visibleColumns.volatility && (
                    <th className="py-3 px-3 text-center">Volatility</th>
                  )}
                  {visibleColumns.oppScore && (
                    <th 
                      onClick={() => handleSort('opportunityScore')}
                      className="py-3 px-3 cursor-pointer hover:text-white text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Opp Score</span>
                        {sortField === 'opportunityScore' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                  )}
                  {visibleColumns.lastUpdate && (
                    <th className="py-3 px-3 text-right">Last Update</th>
                  )}
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141C2E]">
                {paginatedInstruments.length > 0 ? (
                  paginatedInstruments.map(item => {
                    const isUp = item.changePercent24h >= 0;
                    const isBull = item.direction === 'BULLISH';
                    const isBear = item.direction === 'BEARISH';
                    const isFav = favorites.has(item.symbol);
                    const isSelected = item.symbol === activeSymbol;

                    return (
                      <tr
                        key={item.symbol}
                        className={`hover:bg-[#0E1628] transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-600/10' : ''
                        }`}
                        onClick={() => handleViewInstrument(item.symbol)}
                      >
                        {/* Star Favorite */}
                        <td 
                          className="py-3 px-3 text-center"
                          onClick={(e) => toggleFavorite(item.symbol, e)}
                        >
                          <Star className={`w-3.5 h-3.5 mx-auto transition-transform hover:scale-125 ${
                            isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-400'
                          }`} />
                        </td>

                        {/* Symbol */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-white">
                              {item.symbol}
                            </span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#131D31] text-cyan-300 font-semibold border border-blue-500/20">
                              {item.category}
                            </span>
                            {item.isCoreLive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Core Live Stream" />
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        {visibleColumns.name && (
                          <td className="py-3 px-3 text-slate-300 max-w-[150px] truncate">
                            {item.name}
                          </td>
                        )}

                        {/* Price */}
                        {visibleColumns.price && (
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                            {item.price.toFixed(item.digits)}
                          </td>
                        )}

                        {/* 24h Change */}
                        {visibleColumns.change24h && (
                          <td className="py-3 px-3 text-right font-mono font-bold">
                            <span className={`inline-flex items-center gap-0.5 ${
                              isUp ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                              <span>{isUp ? '+' : ''}{item.changePercent24h.toFixed(2)}%</span>
                            </span>
                          </td>
                        )}

                        {/* Signal */}
                        {visibleColumns.signal && (
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              isBull
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isBear
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {isBull ? '↑ BULLISH' : isBear ? '↓ BEARISH' : '→ NEUTRAL'}
                            </span>
                          </td>
                        )}

                        {/* Confidence */}
                        {visibleColumns.confidence && (
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-mono font-bold text-slate-200">
                                {item.confidence}%
                              </span>
                              <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    item.confidence >= 75 ? 'bg-emerald-400' :
                                    item.confidence >= 55 ? 'bg-cyan-400' : 'bg-slate-500'
                                  }`}
                                  style={{ width: `${item.confidence}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Trend H1 */}
                        {visibleColumns.trendH1 && (
                          <td className="py-3 px-3 text-center font-mono text-[11px]">
                            <span className={
                              item.trendH1 === 'BULLISH' ? 'text-emerald-400' :
                              item.trendH1 === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'
                            }>
                              {item.trendH1 === 'BULLISH' ? '↑ Bull' : item.trendH1 === 'BEARISH' ? '↓ Bear' : '→ Neut'}
                            </span>
                          </td>
                        )}

                        {/* Trend H4 */}
                        {visibleColumns.trendH4 && (
                          <td className="py-3 px-3 text-center font-mono text-[11px]">
                            <span className={
                              item.trendH4 === 'BULLISH' ? 'text-emerald-400' :
                              item.trendH4 === 'BEARISH' ? 'text-rose-400' : 'text-slate-400'
                            }>
                              {item.trendH4 === 'BULLISH' ? '↑ Bull' : item.trendH4 === 'BEARISH' ? '↓ Bear' : '→ Neut'}
                            </span>
                          </td>
                        )}

                        {/* Volatility */}
                        {visibleColumns.volatility && (
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                              item.volatility === 'HIGH' || item.volatility === 'EXTREME'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {item.volatility}
                            </span>
                          </td>
                        )}

                        {/* Opp Score */}
                        {visibleColumns.oppScore && (
                          <td className="py-3 px-3 text-center font-mono font-black text-cyan-300">
                            {item.opportunityScore}
                          </td>
                        )}

                        {/* Last Update */}
                        {visibleColumns.lastUpdate && (
                          <td className="py-3 px-3 text-right font-mono text-slate-400 text-[11px]">
                            {item.lastUpdate}
                          </td>
                        )}

                        {/* Action View */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleViewInstrument(item.symbol); }}
                            className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-cyan-300 hover:text-white border border-blue-500/40 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                          >
                            <span>View</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={13} className="py-12 text-center text-slate-500">
                      <div className="space-y-2">
                        <AlertTriangle className="w-6 h-6 mx-auto opacity-40" />
                        <p className="font-semibold text-sm">No instruments match your active criteria.</p>
                        <button
                          onClick={() => { setSearchQuery(''); setSignalFilter('ALL'); setSelectedCategory('All Assets'); }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold cursor-pointer hover:bg-blue-500"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Bar */}
          <div className="p-4 border-t border-[#182338] bg-[#070B14]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 rounded bg-[#0E1526] border border-[#1E293B] text-slate-200 focus:outline-none"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
              <span className="ml-2 font-mono">
                Showing {sortedInstruments.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedInstruments.length)} of {sortedInstruments.length}
              </span>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded bg-[#0E1526] border border-[#1E293B] hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded font-mono font-bold text-xs transition-all cursor-pointer ${
                    currentPage === idx + 1
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-[#0E1526] text-slate-400 hover:text-white border border-[#1E293B]'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-2.5 py-1 rounded bg-[#0E1526] border border-[#1E293B] hover:border-slate-500 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Hover Tooltip for Heatmap Tiles */}
      {hoveredTile && (
        <div
          className="fixed z-50 pointer-events-none p-3 rounded-xl bg-[#0F172A] border border-cyan-500/40 shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-xs text-slate-200 w-56 space-y-2 backdrop-blur animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: Math.min(window.innerWidth - 240, Math.max(12, hoveredTile.x)),
            top: Math.min(window.innerHeight - 260, hoveredTile.y)
          }}
        >
          <div className="flex items-start justify-between border-b border-slate-700/50 pb-1.5">
            <div>
              <span className="font-mono font-black text-sm text-white">
                {hoveredTile.item.symbol}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {hoveredTile.item.name}
              </span>
            </div>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              hoveredTile.item.direction === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {hoveredTile.item.direction}
            </span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Price:</span>
              <span className="font-bold text-white">{hoveredTile.item.price.toFixed(hoveredTile.item.digits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">24h Movement:</span>
              <span className={`font-bold ${hoveredTile.item.changePercent24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {hoveredTile.item.changePercent24h >= 0 ? '+' : ''}{hoveredTile.item.changePercent24h.toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Confidence:</span>
              <span className="font-bold text-cyan-300">{hoveredTile.item.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">H1 / H4 Trend:</span>
              <span className="font-bold text-slate-200">{hoveredTile.item.trendH1} / {hoveredTile.item.trendH4}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ATR14 / Volatility:</span>
              <span className="font-bold text-slate-200">{hoveredTile.item.volatility}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Opp Score:</span>
              <span className="font-bold text-cyan-400">{hoveredTile.item.opportunityScore}/100</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-slate-700/50 text-[10px] text-slate-500 flex justify-between">
            <span>{hoveredTile.item.lastUpdate}</span>
            <span className="text-cyan-400 font-semibold">Click to open chart</span>
          </div>
        </div>
      )}
    </div>
  );
};
