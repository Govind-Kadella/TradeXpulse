import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  MinusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Filter, 
  Search, 
  Star, 
  RefreshCw, 
  BarChart3, 
  ExternalLink, 
  ShieldCheck, 
  Sliders, 
  Activity, 
  Layers, 
  Calendar, 
  Bell, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Eye, 
  ChevronRight,
  Sparkles,
  Volume2,
  VolumeX,
  X
} from 'lucide-react';
import { 
  AISignal, 
  Timeframe, 
  MarketSymbol, 
  SignalAlertConfig, 
  MarketNewsItem, 
  SignalDirection 
} from '../types';
import { usePredictionState } from '../context/PredictionStateContext';
import { AiSignalService } from '../services/aiSignalService';
import { MarketNewsService } from '../services/marketNewsService';
import { MARKET_META } from '../services/marketDataService';
import { SignalCompactChart } from './SignalCompactChart';

type SignalTab = 'LIVE_SIGNALS' | 'SIGNAL_HISTORY' | 'AI_PERFORMANCE' | 'ALERT_SETTINGS';
type AnalysisTab = 'SUMMARY' | 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT';

export const AiSignalsView: React.FC = () => {
  const {
    setSymbol,
    setTimeframe,
    setView,
    connectionStatus,
    marketDataStatus,
    stageTradeFromPrediction
  } = usePredictionState();

  const signalService = useMemo(() => AiSignalService.getInstance(), []);
  const newsService = useMemo(() => MarketNewsService.getInstance(), []);

  // View States
  const [activeTab, setActiveTab] = useState<SignalTab>('LIVE_SIGNALS');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<AnalysisTab>('SUMMARY');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  // Filter Bar States
  const [assetFilter, setAssetFilter] = useState<string>('All Assets');
  const [timeframeFilter, setTimeframeFilter] = useState<Timeframe | 'ALL'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'BUY' | 'SELL' | 'NO_TRADE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);

  // History Tab Filters
  const [historyOutcomeFilter, setHistoryOutcomeFilter] = useState<string>('ALL');

  // Selected Signal for Modal & Featured Override
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [detailModalSignal, setDetailModalSignal] = useState<AISignal | null>(null);

  // Alert Settings State
  const [alertConfig, setAlertConfig] = useState<SignalAlertConfig>(() => signalService.getAlertConfig());
  const [alertTestNotification, setAlertTestNotification] = useState<string | null>(null);

  // UTC Live Clock State
  const [currentTimeUtc, setCurrentTimeUtc] = useState<string>('');
  const [currentDateUtc, setCurrentDateUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTimeUtc(`${hours}:${mins}:${secs} UTC`);

      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      setCurrentDateUtc(`${days[now.getUTCDay()]}, ${now.getUTCDate()} ${months[now.getUTCMonth()]} ${now.getUTCFullYear()}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Periodic Refresh / Generation Listener
  const handleGenerateInsights = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      signalService.generateActiveSignals();
      setLastRefreshTime(Date.now());
      setIsGenerating(false);
    }, 550);
  }, [signalService]);

  // Active Signals list
  const activeSignals = useMemo(() => {
    return signalService.getActiveSignals({
      symbol: assetFilter !== 'All Assets' ? assetFilter : undefined,
      timeframe: timeframeFilter,
      direction: directionFilter,
      search: searchQuery,
      favoritesOnly
    });
  }, [signalService, assetFilter, timeframeFilter, directionFilter, searchQuery, favoritesOnly, lastRefreshTime]);

  // Featured Signal
  const featuredSignal = useMemo(() => {
    if (selectedSignalId) {
      const found = activeSignals.find(s => s.id === selectedSignalId);
      if (found) return found;
    }
    return signalService.getFeaturedSignal();
  }, [signalService, activeSignals, selectedSignalId]);

  // Top Pairs (Ranked by qualityScore)
  const topSignalPairs = useMemo(() => {
    const actionable = signalService.getActiveSignals().filter(s => s.status === 'ACTIVE');
    return [...actionable]
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, 5);
  }, [signalService, lastRefreshTime]);

  // KPIs
  const kpis = useMemo(() => {
    return signalService.calculateKpis();
  }, [signalService, lastRefreshTime]);

  // Historical Signals
  const historicalSignals = useMemo(() => {
    return signalService.getHistoricalSignals({
      symbol: assetFilter !== 'All Assets' ? assetFilter : 'ALL',
      outcome: historyOutcomeFilter,
      timeframe: timeframeFilter !== 'ALL' ? timeframeFilter : 'ALL'
    });
  }, [signalService, assetFilter, historyOutcomeFilter, timeframeFilter, lastRefreshTime]);

  // Performance Stats
  const symbolStats = useMemo(() => signalService.getPerformanceBySymbol(), [signalService, lastRefreshTime]);
  const timeframeStats = useMemo(() => signalService.getPerformanceByTimeframe(), [signalService, lastRefreshTime]);

  // News items
  const recentNews = useMemo(() => {
    return newsService.getRecentNews(assetFilter !== 'All Assets' ? assetFilter : undefined);
  }, [newsService, assetFilter]);

  // Open Chart Navigation
  const handleOpenChart = (symbol: string, timeframe: Timeframe) => {
    if (['XAUUSD', 'EURJPY', 'EURUSD', 'GBPUSD'].includes(symbol)) {
      setSymbol(symbol as MarketSymbol);
    }
    setTimeframe(timeframe);
    setView('dashboard');
  };

  // Toggle favorite
  const handleToggleFavorite = (symbol: string) => {
    signalService.toggleFavorite(symbol);
    setLastRefreshTime(Date.now());
  };

  // Save alerts
  const handleSaveAlertConfig = (updated: SignalAlertConfig) => {
    setAlertConfig(updated);
    signalService.saveAlertConfig(updated);
  };

  const handleTestAlert = () => {
    setAlertTestNotification(`[AI ALERT TEST] XAUUSD M15: BUY signal triggered at 2,425.30 (92% Confidence). Stop: 2,420.80 | Target: 2,438.60.`);
    setTimeout(() => {
      setAlertTestNotification(null);
    }, 5000);
  };

  // Signal summary donut breakdown
  const summaryMetrics = useMemo(() => {
    const all = signalService.getActiveSignals();
    const buys = all.filter(s => s.direction === 'BUY').length;
    const sells = all.filter(s => s.direction === 'SELL').length;
    const watchlist = all.filter(s => s.direction === 'NO_TRADE' || s.status === 'CLOSED').length;
    const total = all.length || 1;
    return {
      buys,
      sells,
      watchlist,
      total: all.length,
      buyPct: Math.round((buys / total) * 100),
      sellPct: Math.round((sells / total) * 100),
      watchPct: Math.round((watchlist / total) * 100)
    };
  }, [signalService, lastRefreshTime]);

  const isLive = connectionStatus === 'LIVE';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070B14] overflow-y-auto select-none font-sans text-slate-100 pb-12">
      
      {/* Test Alert Toast */}
      {alertTestNotification && (
        <div className="fixed top-14 right-6 z-50 bg-[#0F172A] border border-cyan-500/60 shadow-[0_0_20px_rgba(56,189,248,0.25)] rounded-lg p-3.5 max-w-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-cyan-300 flex items-center justify-between">
              <span>TradeXpulse In-App Notification</span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
            <p className="text-slate-200 mt-1 font-mono">{alertTestNotification}</p>
          </div>
          <button 
            onClick={() => setAlertTestNotification(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="bg-[#0B101D] border-b border-[#1B2537] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-blue-600/20 border border-blue-500/30 text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-wider font-mono text-white flex items-center gap-2">
              AI SIGNALS
              <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase tracking-normal">
                Intelligence Engine
              </span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            AI-powered trade signals with technical, fundamental and sentiment analysis.
          </p>
        </div>

        {/* Live Market Analysis Status & UTC Clock */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0F172A] border border-[#1E293B]">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-bold text-slate-300 uppercase text-[11px]">
              {isLive ? 'Live Market Analysis' : `${marketDataStatus.connectionStatus} Stream`}
            </span>
            <span className="text-[10px] text-slate-500 font-sans">
              ({marketDataStatus.provider})
            </span>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <div className="text-sm font-bold text-cyan-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {currentTimeUtc || '12:00:00 UTC'}
            </div>
            <div className="text-[10px] text-slate-400 font-sans">
              {currentDateUtc}
            </div>
          </div>

          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            title="Re-run Market Scans"
            className="p-2 rounded-md bg-[#152033] hover:bg-[#1E2E48] border border-[#24344D] text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs & Filter Bar Row */}
      <div className="bg-[#090D18] border-b border-[#1B2537] px-6 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Functional Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            id="tab-live-signals"
            onClick={() => setActiveTab('LIVE_SIGNALS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'LIVE_SIGNALS'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Live Signals
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {activeSignals.filter(s => s.status === 'ACTIVE').length}
            </span>
          </button>

          <button
            id="tab-signal-history"
            onClick={() => setActiveTab('SIGNAL_HISTORY')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SIGNAL_HISTORY'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Signal History
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {historicalSignals.length}
            </span>
          </button>

          <button
            id="tab-ai-performance"
            onClick={() => setActiveTab('AI_PERFORMANCE')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'AI_PERFORMANCE'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            AI Performance
          </button>

          <button
            id="tab-alert-settings"
            onClick={() => setActiveTab('ALERT_SETTINGS')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ALERT_SETTINGS'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            Alert Settings
          </button>
        </div>

        {/* Filter Bar (Right) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Asset Dropdown */}
          <select
            value={assetFilter}
            onChange={e => setAssetFilter(e.target.value)}
            className="bg-[#121A2C] border border-[#1E293B] text-slate-200 rounded-md px-2.5 py-1.5 font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="All Assets">All Assets</option>
            <option value="XAUUSD">XAUUSD (Gold)</option>
            <option value="EURUSD">EURUSD (Euro)</option>
            <option value="GBPUSD">GBPUSD (Pound)</option>
            <option value="EURJPY">EURJPY (Yen)</option>
            <option value="US30">US30 (Dow)</option>
            <option value="BTCUSD">BTCUSD (Bitcoin)</option>
          </select>

          {/* Timeframe Dropdown (NO H5!) */}
          <select
            value={timeframeFilter}
            onChange={e => setTimeframeFilter(e.target.value as any)}
            className="bg-[#121A2C] border border-[#1E293B] text-slate-200 rounded-md px-2.5 py-1.5 font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Timeframes</option>
            <option value="M1">M1</option>
            <option value="M5">M5</option>
            <option value="M15">M15</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>

          {/* Signal Types */}
          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value as any)}
            className="bg-[#121A2C] border border-[#1E293B] text-slate-200 rounded-md px-2.5 py-1.5 font-sans focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">All Signal Types</option>
            <option value="BUY">BUY Only</option>
            <option value="SELL">SELL Only</option>
            <option value="NO_TRADE">NO TRADE / Standby</option>
          </select>

          {/* Generate AI Insights Button */}
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-[0_0_12px_rgba(56,189,248,0.25)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'ANALYZING MARKETS...' : 'Generate AI Insights'}
          </button>
        </div>
      </div>

      {/* 3. Six Top KPI Cards */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Active Signals */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Signals</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 my-1">
            {kpis.activeSignalsCount}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Real-time monitored
          </div>
        </div>

        {/* KPI 2: Win Rate (30 Days) */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Win Rate (30D)</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 my-1">
            {kpis.winRate30d !== null ? `${kpis.winRate30d}%` : 'N/A'}
          </div>
          <div className="text-[10px] text-slate-500">
            Completed historical targets
          </div>
        </div>

        {/* KPI 3: Average R:R */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Average R:R</div>
          <div className="text-2xl font-bold font-mono text-white my-1">
            {kpis.avgRiskReward}
          </div>
          <div className="text-[10px] text-slate-500">
            Calculated mathematical ratio
          </div>
        </div>

        {/* KPI 4: Total Signals (30 Days) */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Signals (30D)</div>
          <div className="text-2xl font-bold font-mono text-slate-200 my-1">
            {kpis.totalSignals30d}
          </div>
          <div className="text-[10px] text-slate-500">
            Audit ledger entries
          </div>
        </div>

        {/* KPI 5: AI Confidence */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">AI Confidence</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 my-1">
            {kpis.avgAiConfidence}%
          </div>
          <div className="text-[10px] text-slate-500">
            Model confluence level
          </div>
        </div>

        {/* KPI 6: Market Bias */}
        <div className="bg-[#0B101D] border border-[#1B2537] rounded-lg p-3 flex flex-col justify-between">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Market Bias</div>
          <div className={`text-xl font-bold font-mono my-1 flex items-center gap-1 ${
            kpis.marketBias === 'BULLISH' ? 'text-emerald-400' :
            kpis.marketBias === 'BEARISH' ? 'text-red-400' : 'text-slate-300'
          }`}>
            {kpis.marketBias === 'BULLISH' && <ArrowUpRight className="w-5 h-5" />}
            {kpis.marketBias === 'BEARISH' && <ArrowDownRight className="w-5 h-5" />}
            {kpis.marketBias}
          </div>
          <div className="text-[10px] text-slate-500">
            Aggregate institutional trend
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="px-6 space-y-5">
        
        {/* ==================================================================== */}
        {/* TAB 1: LIVE SIGNALS */}
        {/* ==================================================================== */}
        {activeTab === 'LIVE_SIGNALS' && (
          <>
            {/* Row 1: Featured AI Signal (Left) + Signal Summary & Top Pairs (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* FEATURED AI SIGNAL (8 cols) */}
              <div className="lg:col-span-8 bg-[#0B101D] border border-[#1B2537] rounded-xl p-5 flex flex-col justify-between shadow-lg">
                {featuredSignal ? (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1B2537]">
                      <div className="flex items-center gap-3">
                        {/* Direction Badge */}
                        <div className={`px-3 py-1 rounded font-mono font-bold text-sm flex items-center gap-1.5 ${
                          featuredSignal.direction === 'BUY' 
                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' :
                          featuredSignal.direction === 'SELL' 
                            ? 'bg-red-500/20 border border-red-500/50 text-red-400' :
                            'bg-slate-700/30 border border-slate-600 text-slate-400'
                        }`}>
                          {featuredSignal.direction === 'BUY' && <ArrowUpRight className="w-4 h-4" />}
                          {featuredSignal.direction === 'SELL' && <ArrowDownRight className="w-4 h-4" />}
                          {featuredSignal.direction}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold font-mono text-white">{featuredSignal.symbol}</h2>
                            <span className="text-xs text-slate-400">• {featuredSignal.displayName}</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Signal Quality: <strong className="text-cyan-300 font-mono">{featuredSignal.qualityScore}/100</strong> • {featuredSignal.confidence >= 80 ? 'High Confidence' : 'Moderate Confidence'}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenChart(featuredSignal.symbol, featuredSignal.timeframe)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#152033] hover:bg-[#1E2E48] border border-[#24344D] text-xs font-semibold text-slate-200 hover:text-white transition-colors cursor-pointer"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                          Open Chart
                        </button>
                        <button
                          onClick={() => setDetailModalSignal(featuredSignal)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-xs font-semibold text-cyan-300 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Full Analysis
                        </button>
                      </div>
                    </div>

                    {/* Numeric Level Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 my-4 text-xs font-mono">
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Entry Price</span>
                        <span className="font-bold text-cyan-300 text-sm">{featuredSignal.entry.toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-emerald-400 uppercase block font-sans">Take Profit 1</span>
                        <span className="font-bold text-emerald-400 text-sm">{(featuredSignal.takeProfits[0] ?? 0).toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-emerald-300 uppercase block font-sans">Take Profit 2</span>
                        <span className="font-bold text-emerald-300 text-sm">{(featuredSignal.takeProfits[1] ?? 0).toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-red-400 uppercase block font-sans">Stop Loss</span>
                        <span className="font-bold text-red-400 text-sm">{featuredSignal.stopLoss.toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Risk / Reward</span>
                        <span className="font-bold text-white text-sm">{featuredSignal.riskReward}</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Confidence</span>
                        <span className="font-bold text-cyan-400 text-sm">{featuredSignal.confidence}%</span>
                      </div>
                      <div className="bg-[#090D18] border border-[#1A2333] rounded p-2">
                        <span className="text-[10px] text-slate-400 uppercase block font-sans">Timeframe</span>
                        <span className="font-bold text-white text-sm">{featuredSignal.timeframe}</span>
                      </div>
                    </div>

                    {/* Featured Signal Compact Chart */}
                    <div className="mt-1">
                      <SignalCompactChart signal={featuredSignal} height={230} />
                    </div>

                    {/* Footer Info */}
                    <div className="mt-3 pt-2 border-t border-[#1B2537] flex flex-wrap items-center justify-between text-[11px] text-slate-400">
                      <div>
                        Generated: <span className="text-slate-200 font-mono">{new Date(featuredSignal.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC</span>
                        {' '}• Valid until: <span className="text-slate-200 font-mono">{new Date(featuredSignal.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC</span>
                      </div>
                      <div className="text-slate-400 italic">
                        {featuredSignal.invalidation}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="font-bold">No Active Signals Available</p>
                    <p className="text-xs text-slate-500 mt-1">Try running market insights or adjusting filter settings.</p>
                  </div>
                )}
              </div>

              {/* SIGNAL SUMMARY & TOP SIGNAL PAIRS (4 cols) */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                {/* SIGNAL SUMMARY PANEL */}
                <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
                    <span>SIGNAL SUMMARY</span>
                    <span className="text-[11px] font-mono text-cyan-400">{summaryMetrics.total} Active Monitored</span>
                  </h3>

                  <div className="flex items-center gap-4">
                    {/* SVG Donut */}
                    <div className="relative w-24 h-24 shrink-0">
                      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                        {/* Background ring */}
                        <circle cx="18" cy="18" r="14" fill="none" stroke="#152033" strokeWidth="4" />
                        
                        {/* BUY segment (emerald) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="4"
                          strokeDasharray={`${summaryMetrics.buyPct * 0.88} 88`}
                          strokeDashoffset="0"
                        />
                        {/* SELL segment (red) */}
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke="#EF4444"
                          strokeWidth="4"
                          strokeDasharray={`${summaryMetrics.sellPct * 0.88} 88`}
                          strokeDashoffset={`-${summaryMetrics.buyPct * 0.88}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-base font-bold font-mono text-white">{summaryMetrics.buys + summaryMetrics.sells}</span>
                        <span className="text-[8px] text-slate-400 uppercase">Signals</span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="flex-1 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          Buy Signals
                        </span>
                        <span className="font-mono font-bold text-white">{summaryMetrics.buys} ({summaryMetrics.buyPct}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-red-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-red-400"></span>
                          Sell Signals
                        </span>
                        <span className="font-mono font-bold text-white">{summaryMetrics.sells} ({summaryMetrics.sellPct}%)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                          <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                          Watchlist
                        </span>
                        <span className="font-mono font-bold text-slate-400">{summaryMetrics.watchlist}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TOP SIGNAL PAIRS */}
                <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      TOP SIGNAL PAIRS
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">By Quality Rank</span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {topSignalPairs.length > 0 ? (
                      topSignalPairs.map((sig, idx) => (
                        <div
                          key={sig.id}
                          onClick={() => setSelectedSignalId(sig.id)}
                          className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                            featuredSignal?.id === sig.id
                              ? 'bg-blue-600/15 border-blue-500/50 text-white'
                              : 'bg-[#090D18] border-[#182335] hover:bg-[#121A2C] text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-4 font-mono font-bold text-xs text-slate-500">{idx + 1}</span>
                            <div>
                              <div className="font-mono font-bold text-xs text-white">{sig.symbol}</div>
                              <div className="text-[10px] text-slate-400 font-sans">{sig.timeframe}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              sig.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                              sig.direction === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/30 text-slate-400'
                            }`}>
                              {sig.direction}
                            </span>
                            <span className="font-mono font-bold text-xs text-cyan-300">{sig.confidence}%</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500">
                        NO ACTIVE SIGNAL
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Row 2: Latest AI Signals Table (Left) + AI Analysis Panel (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LATEST AI SIGNALS TABLE (7 cols) */}
              <div className="lg:col-span-7 bg-[#0B101D] border border-[#1B2537] rounded-xl p-4 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      LATEST AI SIGNALS
                    </h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {activeSignals.length} Setups
                    </span>
                  </div>

                  {/* Search and Favorites toggle */}
                  <div className="flex items-center gap-2 text-xs">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search XAU, EUR..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="bg-[#090D18] border border-[#1E293B] rounded pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36"
                      />
                    </div>

                    <button
                      onClick={() => setFavoritesOnly(!favoritesOnly)}
                      className={`p-1.5 rounded border transition-colors cursor-pointer ${
                        favoritesOnly
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                          : 'bg-[#121A2C] border-[#1E293B] text-slate-400 hover:text-white'
                      }`}
                      title="Filter Favorites Only"
                    >
                      <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Signals Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#1B2537] text-[10px] text-slate-400 font-mono uppercase">
                        <th className="py-2 px-2">Time</th>
                        <th className="py-2 px-2">Symbol</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2">Entry</th>
                        <th className="py-2 px-2">TP</th>
                        <th className="py-2 px-2">SL</th>
                        <th className="py-2 px-2">Confidence</th>
                        <th className="py-2 px-2">Status</th>
                        <th className="py-2 px-1 text-center">Fav</th>
                        <th className="py-2 px-1 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#152033] font-mono">
                      {activeSignals.length > 0 ? (
                        activeSignals.map(sig => {
                          const digits = MARKET_META[sig.symbol as MarketSymbol]?.pricePrecision ?? 2;
                          return (
                            <tr 
                              key={sig.id}
                              className="hover:bg-[#121A2C] transition-colors group cursor-pointer"
                              onClick={() => setSelectedSignalId(sig.id)}
                            >
                              <td className="py-2 px-2 text-slate-400 text-[11px]">
                                {new Date(sig.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-2 px-2">
                                <div className="font-bold text-white">{sig.symbol}</div>
                                <div className="text-[10px] text-slate-400 font-sans">{sig.timeframe}</div>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sig.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                                  sig.direction === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/30 text-slate-400'
                                }`}>
                                  {sig.direction}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-slate-200">
                                {sig.entry.toFixed(digits)}
                              </td>
                              <td className="py-2 px-2 text-emerald-400">
                                {(sig.takeProfits[0] ?? 0).toFixed(digits)}
                              </td>
                              <td className="py-2 px-2 text-red-400">
                                {sig.stopLoss.toFixed(digits)}
                              </td>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <div 
                                      className="h-full bg-cyan-400 rounded-full"
                                      style={{ width: `${sig.confidence}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[11px] text-cyan-300 font-bold">{sig.confidence}%</span>
                                </div>
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold uppercase ${
                                  sig.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                                  sig.status === 'TARGET_HIT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                                  sig.status === 'STOP_HIT' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                                  'bg-slate-700/20 text-slate-400'
                                }`}>
                                  {sig.status}
                                </span>
                              </td>
                              <td className="py-2 px-1 text-center" onClick={e => { e.stopPropagation(); handleToggleFavorite(sig.symbol); }}>
                                <button className="p-1 hover:text-amber-400 text-slate-500 transition-colors">
                                  <Star className={`w-3.5 h-3.5 ${sig.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                                </button>
                              </td>
                              <td className="py-2 px-1 text-right" onClick={e => { e.stopPropagation(); setDetailModalSignal(sig); }}>
                                <button className="p-1 rounded bg-[#1A2333] hover:bg-blue-600/30 text-slate-300 hover:text-cyan-300 transition-colors">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-slate-500">
                            No signals match current filter criteria
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI ANALYSIS PANEL (5 cols) */}
              <div className="lg:col-span-5 bg-[#0B101D] border border-[#1B2537] rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-[#1B2537]">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        AI ANALYSIS
                      </h3>
                      {featuredSignal && (
                        <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.2 rounded bg-blue-500/20">
                          {featuredSignal.symbol}
                        </span>
                      )}
                    </div>

                    {/* Analysis Sub-Tabs */}
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        onClick={() => setActiveAnalysisTab('SUMMARY')}
                        className={`px-2 py-1 rounded transition-colors ${
                          activeAnalysisTab === 'SUMMARY' ? 'bg-[#1E293B] text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Summary
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('TECHNICAL')}
                        className={`px-2 py-1 rounded transition-colors ${
                          activeAnalysisTab === 'TECHNICAL' ? 'bg-[#1E293B] text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Technical
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('FUNDAMENTAL')}
                        className={`px-2 py-1 rounded transition-colors ${
                          activeAnalysisTab === 'FUNDAMENTAL' ? 'bg-[#1E293B] text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Fundamental
                      </button>
                      <button
                        onClick={() => setActiveAnalysisTab('SENTIMENT')}
                        className={`px-2 py-1 rounded transition-colors ${
                          activeAnalysisTab === 'SENTIMENT' ? 'bg-[#1E293B] text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sentiment
                      </button>
                    </div>
                  </div>

                  {/* Tab Body */}
                  <div className="mt-3 text-xs space-y-3">
                    {featuredSignal ? (
                      <>
                        {activeAnalysisTab === 'SUMMARY' && (
                          <div className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div className="bg-[#090D18] p-2 rounded border border-[#1A2333]">
                                <span className="text-slate-400 text-[10px] block">Primary Trend</span>
                                <span className="font-bold text-slate-100">{featuredSignal.reasoning.trend}</span>
                              </div>
                              <div className="bg-[#090D18] p-2 rounded border border-[#1A2333]">
                                <span className="text-slate-400 text-[10px] block">Market Structure</span>
                                <span className="font-bold text-slate-100">{featuredSignal.reasoning.marketStructure}</span>
                              </div>
                              <div className="bg-[#090D18] p-2 rounded border border-[#1A2333]">
                                <span className="text-slate-400 text-[10px] block">Key Support</span>
                                <span className="font-bold font-mono text-emerald-400">{featuredSignal.reasoning.keySupport.toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                              </div>
                              <div className="bg-[#090D18] p-2 rounded border border-[#1A2333]">
                                <span className="text-slate-400 text-[10px] block">Key Resistance</span>
                                <span className="font-bold font-mono text-red-400">{featuredSignal.reasoning.keyResistance.toFixed(MARKET_META[featuredSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
                              </div>
                            </div>

                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">AI Outlook</span>
                              <p className="text-slate-200 leading-relaxed font-sans">{featuredSignal.reasoning.outlook}</p>
                            </div>

                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase block mb-1">Structural Invalidation</span>
                              <p className="text-amber-300/90 text-[11px] font-mono">{featuredSignal.invalidation}</p>
                            </div>
                          </div>
                        )}

                        {activeAnalysisTab === 'TECHNICAL' && (
                          <div className="space-y-2.5">
                            {/* Bullish Evidence Checklist */}
                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                                Bullish Evidence Confluence
                              </span>
                              <ul className="space-y-1 text-[11px] text-slate-300">
                                {featuredSignal.evidence.bullishFactors.map((factor, idx) => (
                                  <li key={idx} className="flex items-center gap-1.5">
                                    <span className="text-emerald-400 font-bold">+</span>
                                    <span>{factor}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Bearish Evidence Checklist */}
                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block mb-1.5">
                                Bearish Evidence / Risk Warnings
                              </span>
                              <ul className="space-y-1 text-[11px] text-slate-300">
                                {featuredSignal.evidence.bearishFactors.length > 0 ? (
                                  featuredSignal.evidence.bearishFactors.map((factor, idx) => (
                                    <li key={idx} className="flex items-center gap-1.5">
                                      <span className="text-red-400 font-bold">-</span>
                                      <span>{factor}</span>
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-slate-500 italic">No conflicting higher-timeframe resistance detected</li>
                                )}
                              </ul>
                            </div>
                          </div>
                        )}

                        {activeAnalysisTab === 'FUNDAMENTAL' && (
                          <div className="space-y-2 text-[11px] text-slate-300">
                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Macroeconomic Context</span>
                              <p className="leading-relaxed">
                                Federal Reserve monetary guidance maintains focus on disinflation pace and labor market cooling. Real yields anchor institutional demand corridors across {featuredSignal.symbol}.
                              </p>
                            </div>
                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Policy Stance</span>
                              <p className="leading-relaxed">
                                Benchmark rates hold steady with financial conditions pricing gradual accommodation over the 6-month horizon.
                              </p>
                            </div>
                          </div>
                        )}

                        {activeAnalysisTab === 'SENTIMENT' && (
                          <div className="space-y-2.5 text-[11px]">
                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-slate-400 text-[10px] uppercase font-bold">Institutional Positioning</span>
                                <span className="font-mono font-bold text-cyan-300">68% Long / 32% Short</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                                <div className="bg-emerald-400 h-full" style={{ width: '68%' }}></div>
                                <div className="bg-red-400 h-full" style={{ width: '32%' }}></div>
                              </div>
                            </div>

                            <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Order Flow Sentiment</span>
                              <p className="text-slate-200 leading-relaxed font-sans">{featuredSignal.reasoning.sentiment}</p>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-500 py-6 text-center">Select a signal to inspect AI analysis.</p>
                    )}
                  </div>
                </div>

                {/* Footnote on AI Model Confidence */}
                <div className="mt-3 pt-2 border-t border-[#1B2537] text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Model Confidence represents algorithmic confluence strength, not guaranteed win certainty.</span>
                </div>
              </div>
            </div>

            {/* Row 3: RECENT MARKET NEWS PANEL */}
            <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    RECENT MARKET NEWS & MACROECONOMIC DRIVERS
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {recentNews.length} Verified Releases
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {recentNews.map(item => (
                  <div 
                    key={item.id} 
                    className="bg-[#090D18] border border-[#1A2333] rounded-lg p-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                        <span>{item.time}</span>
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            item.impact === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                            item.impact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400' :
                            'bg-slate-700/30 text-slate-400'
                          }`}>
                            {item.impact} IMPACT
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-bold ${
                            item.sentiment === 'Bullish' ? 'bg-emerald-500/20 text-emerald-400' :
                            item.sentiment === 'Bearish' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700/30 text-slate-400'
                          }`}>
                            {item.sentiment}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 line-clamp-2 mb-1">
                        {item.headline}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#152033] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span>{item.source}</span>
                      <div className="flex items-center gap-1">
                        {item.relatedSymbols.slice(0, 3).map(s => (
                          <span key={s} className="px-1 py-0.2 rounded bg-slate-800 text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ==================================================================== */}
        {/* TAB 2: SIGNAL HISTORY */}
        {/* ==================================================================== */}
        {activeTab === 'SIGNAL_HISTORY' && (
          <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1B2537]">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  HISTORICAL SIGNAL OUTCOME AUDIT LEDGER
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete transparent record of generated AI signals, target achievements, and stop hits.
                </p>
              </div>

              {/* History Filter Options */}
              <div className="flex items-center gap-2 text-xs">
                <select
                  value={historyOutcomeFilter}
                  onChange={e => setHistoryOutcomeFilter(e.target.value)}
                  className="bg-[#121A2C] border border-[#1E293B] text-slate-200 rounded px-2.5 py-1 font-sans focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="WIN">WIN (Target Hit)</option>
                  <option value="LOSS">LOSS (Stop Hit)</option>
                  <option value="BREAKEVEN">Breakeven</option>
                  <option value="EXPIRED">Expired</option>
                </select>
              </div>
            </div>

            {/* Historical Signals Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1B2537] text-[10px] text-slate-400 font-mono uppercase">
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Entry</th>
                    <th className="py-2.5 px-3">Exit Price</th>
                    <th className="py-2.5 px-3">R:R</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">P/L Points</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152033] font-mono">
                  {historicalSignals.length > 0 ? (
                    historicalSignals.map(sig => {
                      const isWin = sig.outcome?.result === 'WIN';
                      const isLoss = sig.outcome?.result === 'LOSS';
                      const digits = MARKET_META[sig.symbol as MarketSymbol]?.pricePrecision ?? 2;

                      return (
                        <tr key={sig.id} className="hover:bg-[#121A2C] transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                            {new Date(sig.generatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} {new Date(sig.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-white">{sig.symbol}</span>
                            <span className="text-[10px] text-slate-400 font-sans ml-1.5">{sig.timeframe}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sig.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' :
                              sig.direction === 'SELL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700/30 text-slate-400'
                            }`}>
                              {sig.direction}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-200">{sig.entry.toFixed(digits)}</td>
                          <td className="py-2.5 px-3 text-slate-200">{(sig.outcome?.exitPrice ?? sig.entry).toFixed(digits)}</td>
                          <td className="py-2.5 px-3 text-slate-300">{sig.riskReward}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                              isWin ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                              isLoss ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                              'bg-slate-700/30 text-slate-400'
                            }`}>
                              {sig.outcome?.result || 'CLOSED'}
                            </span>
                          </td>
                          <td className={`py-2.5 px-3 font-bold ${
                            isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-slate-400'
                          }`}>
                            {sig.outcome?.pnlPoints ? (sig.outcome.pnlPoints > 0 ? `+${sig.outcome.pnlPoints}` : `${sig.outcome.pnlPoints}`) : '0.00'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px]">{sig.outcome?.durationText || 'N/A'}</td>
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">{sig.confidence}%</td>
                          <td className="py-2.5 px-2 text-right">
                            <button
                              onClick={() => setDetailModalSignal(sig)}
                              className="px-2 py-1 rounded bg-[#1A2333] hover:bg-blue-600/30 text-slate-300 hover:text-cyan-300 transition-colors text-[11px]"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-500">
                        No historical signals match the filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 3: AI PERFORMANCE */}
        {/* ==================================================================== */}
        {activeTab === 'AI_PERFORMANCE' && (
          <div className="space-y-5">
            {/* Performance Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Completed</div>
                <div className="text-3xl font-bold font-mono text-white mt-1">
                  {historicalSignals.filter(s => s.outcome?.result === 'WIN' || s.outcome?.result === 'LOSS').length}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Evaluated trade signals</div>
              </div>

              <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall Win Rate</div>
                <div className="text-3xl font-bold font-mono text-emerald-400 mt-1">
                  {kpis.winRate30d !== null ? `${kpis.winRate30d}%` : 'N/A'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Target hit ratio</div>
              </div>

              <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Profit Factor</div>
                <div className="text-3xl font-bold font-mono text-cyan-300 mt-1">
                  2.42
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Gross wins vs gross losses</div>
              </div>

              <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Avg Holding Duration</div>
                <div className="text-3xl font-bold font-mono text-slate-200 mt-1">
                  4h 15m
                </div>
                <div className="text-[10px] text-slate-500 mt-1">From entry to exit hit</div>
              </div>
            </div>

            {/* Performance By Symbol Table */}
            <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-5 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                MODEL PERFORMANCE BY SYMBOL
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1B2537] text-[10px] text-slate-400 font-mono uppercase">
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Signals</th>
                      <th className="py-2.5 px-3">Wins</th>
                      <th className="py-2.5 px-3">Losses</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Average R:R</th>
                      <th className="py-2.5 px-3">Net P/L Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152033] font-mono">
                    {symbolStats.map(stat => (
                      <tr key={stat.symbol} className="hover:bg-[#121A2C] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-white">{stat.symbol}</td>
                        <td className="py-2.5 px-3 text-slate-300">{stat.signals}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{stat.wins}</td>
                        <td className="py-2.5 px-3 text-red-400 font-bold">{stat.losses}</td>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-cyan-300">
                            {stat.winRate !== null ? `${stat.winRate}%` : 'N/A'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{stat.avgRR}</td>
                        <td className={`py-2.5 px-3 font-bold ${stat.pnlPoints >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {stat.pnlPoints >= 0 ? `+${stat.pnlPoints}` : stat.pnlPoints}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance By Timeframe Table */}
            <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-5 shadow-lg">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                MODEL PERFORMANCE BY TIMEFRAME
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1B2537] text-[10px] text-slate-400 font-mono uppercase">
                      <th className="py-2.5 px-3">Timeframe</th>
                      <th className="py-2.5 px-3">Signals</th>
                      <th className="py-2.5 px-3">Wins</th>
                      <th className="py-2.5 px-3">Losses</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Avg Confidence</th>
                      <th className="py-2.5 px-3">Avg R:R</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152033] font-mono">
                    {timeframeStats.map(stat => (
                      <tr key={stat.timeframe} className="hover:bg-[#121A2C] transition-colors">
                        <td className="py-2.5 px-3 font-bold text-cyan-300">{stat.timeframe}</td>
                        <td className="py-2.5 px-3 text-slate-300">{stat.signals}</td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">{stat.wins}</td>
                        <td className="py-2.5 px-3 text-red-400 font-bold">{stat.losses}</td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {stat.winRate !== null ? `${stat.winRate}%` : 'N/A'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">{stat.avgConfidence > 0 ? `${stat.avgConfidence}%` : 'N/A'}</td>
                        <td className="py-2.5 px-3 text-slate-300">{stat.avgRR}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: ALERT SETTINGS */}
        {/* ==================================================================== */}
        {activeTab === 'ALERT_SETTINGS' && (
          <div className="bg-[#0B101D] border border-[#1B2537] rounded-xl p-6 shadow-lg max-w-3xl space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                SIGNAL NOTIFICATION & ALERT CONFIGURATION
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure real-time in-app notification triggers and audible alarms when new high-confidence signals are identified.
              </p>
            </div>

            <div className="space-y-4 text-xs font-sans">
              
              {/* Trigger Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#090D18] border border-[#1B2537] cursor-pointer hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={alertConfig.buySignals}
                    onChange={e => handleSaveAlertConfig({ ...alertConfig, buySignals: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">New BUY Signals</span>
                    <span className="text-[10px] text-slate-500">Alert on bullish setups</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#090D18] border border-[#1B2537] cursor-pointer hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={alertConfig.sellSignals}
                    onChange={e => handleSaveAlertConfig({ ...alertConfig, sellSignals: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">New SELL Signals</span>
                    <span className="text-[10px] text-slate-500">Alert on bearish setups</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[#090D18] border border-[#1B2537] cursor-pointer hover:border-slate-600">
                  <input
                    type="checkbox"
                    checked={alertConfig.highConfidenceOnly}
                    onChange={e => handleSaveAlertConfig({ ...alertConfig, highConfidenceOnly: e.target.checked })}
                    className="accent-cyan-500 w-4 h-4 rounded"
                  />
                  <div>
                    <span className="font-bold text-slate-200 block">High Confidence Only</span>
                    <span className="text-[10px] text-slate-500">Filters signals ≥ 80%</span>
                  </div>
                </label>
              </div>

              {/* Confidence Threshold Slider */}
              <div className="bg-[#090D18] border border-[#1B2537] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-300">Minimum Model Confidence Threshold</span>
                  <span className="font-mono font-bold text-cyan-300 text-sm">{alertConfig.minConfidence}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={alertConfig.minConfidence}
                  onChange={e => handleSaveAlertConfig({ ...alertConfig, minConfidence: parseInt(e.target.value) })}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>50% (Permissive)</span>
                  <span>70% (Standard)</span>
                  <span>90% (Strict Confluence)</span>
                </div>
              </div>

              {/* Supported Assets Checklist */}
              <div className="bg-[#090D18] border border-[#1B2537] rounded-lg p-4">
                <span className="font-semibold text-slate-300 block mb-2">Active Monitored Instruments</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['XAUUSD', 'EURUSD', 'GBPUSD', 'EURJPY', 'US30', 'BTCUSD'].map(sym => {
                    const isChecked = alertConfig.symbols.includes(sym);
                    return (
                      <label key={sym} className="flex items-center gap-2 cursor-pointer text-slate-300">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            const updated = e.target.checked
                              ? [...alertConfig.symbols, sym]
                              : alertConfig.symbols.filter(s => s !== sym);
                            handleSaveAlertConfig({ ...alertConfig, symbols: updated });
                          }}
                          className="accent-cyan-500 w-3.5 h-3.5 rounded"
                        />
                        <span className="font-mono font-bold text-xs">{sym}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Settings */}
              <div className="bg-[#090D18] border border-[#1B2537] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertConfig.inAppNotifications}
                      onChange={e => handleSaveAlertConfig({ ...alertConfig, inAppNotifications: e.target.checked })}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                    <span className="text-slate-200">In-App Floating Banner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertConfig.soundAlerts}
                      onChange={e => handleSaveAlertConfig({ ...alertConfig, soundAlerts: e.target.checked })}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                    <span className="text-slate-200">Audible Terminal Chime</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleTestAlert}
                  className="px-3 py-1.5 rounded bg-[#1A2333] hover:bg-[#25334D] text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-colors cursor-pointer"
                >
                  Test In-App Alert
                </button>
              </div>

              {/* Informational Architecture Disclaimer */}
              <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  Alert notifications are processed client-side against the live candlestick feed. When the model confidence crosses the configured threshold, floating terminal banners are dispatched instantly. External push notifications require active browser tab execution.
                </p>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ==================================================================== */}
      {/* 4. SIGNAL DETAIL MODAL / DRAWER */}
      {/* ==================================================================== */}
      {detailModalSignal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0B101D] border border-[#24344D] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
                  detailModalSignal.direction === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  detailModalSignal.direction === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  'bg-slate-700/30 text-slate-400'
                }`}>
                  {detailModalSignal.direction}
                </span>
                <div>
                  <h3 className="text-base font-bold text-white font-mono">{detailModalSignal.symbol}</h3>
                  <span className="text-xs text-slate-400 font-sans">{detailModalSignal.displayName} • {detailModalSignal.timeframe}</span>
                </div>
              </div>

              <button
                onClick={() => setDetailModalSignal(null)}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Level Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                <span className="text-[10px] text-slate-400 block font-sans">Entry Level</span>
                <span className="font-bold text-cyan-300 text-sm">{detailModalSignal.entry.toFixed(MARKET_META[detailModalSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
              </div>
              <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                <span className="text-[10px] text-emerald-400 block font-sans">Target (TP1)</span>
                <span className="font-bold text-emerald-400 text-sm">{(detailModalSignal.takeProfits[0] ?? 0).toFixed(MARKET_META[detailModalSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
              </div>
              <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                <span className="text-[10px] text-red-400 block font-sans">Stop Loss</span>
                <span className="font-bold text-red-400 text-sm">{detailModalSignal.stopLoss.toFixed(MARKET_META[detailModalSignal.symbol as MarketSymbol]?.pricePrecision ?? 2)}</span>
              </div>
              <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                <span className="text-[10px] text-slate-400 block font-sans">Risk / Reward</span>
                <span className="font-bold text-white text-sm">{detailModalSignal.riskReward}</span>
              </div>
            </div>

            {/* Invalidation & Confluences */}
            <div className="space-y-3 text-xs">
              <div className="bg-[#090D18] p-3 rounded-lg border border-[#1A2333]">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                  Structural Invalidation Condition
                </span>
                <p className="text-slate-200 font-mono leading-relaxed">{detailModalSignal.invalidation}</p>
              </div>

              <div className="bg-[#090D18] p-3 rounded-lg border border-[#1A2333]">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block mb-1.5">
                  Technical Reasoning & Confluence Factors
                </span>
                <ul className="space-y-1.5 text-slate-300">
                  {detailModalSignal.evidence.bullishFactors.map((f, i) => (
                    <li key={`b-${i}`} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {detailModalSignal.evidence.bearishFactors.map((f, i) => (
                    <li key={`r-${i}`} className="flex items-center gap-2">
                      <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                  <span className="text-[10px] text-slate-500 block uppercase">Macro Trend</span>
                  <span className="font-semibold text-slate-200">{detailModalSignal.evidence.higherTimeframeTrend}</span>
                </div>
                <div className="bg-[#090D18] p-2.5 rounded border border-[#1A2333]">
                  <span className="text-[10px] text-slate-500 block uppercase">Volatility State</span>
                  <span className="font-semibold text-slate-200">{detailModalSignal.evidence.volatility}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#1B2537] flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Signal ID: {detailModalSignal.id}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDetailModalSignal(null)}
                  className="px-3.5 py-1.5 rounded-md bg-[#152033] hover:bg-[#1E2E48] text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setDetailModalSignal(null);
                    handleOpenChart(detailModalSignal.symbol, detailModalSignal.timeframe);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Open in Interactive Chart
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
