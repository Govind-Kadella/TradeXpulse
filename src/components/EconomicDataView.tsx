import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Calendar,
  Clock,
  Globe,
  Filter,
  RefreshCw,
  Download,
  Bell,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Layers,
  Percent,
  Activity,
  BarChart,
  CalendarDays,
  ExternalLink,
  Landmark
} from 'lucide-react';
import { EconomicEvent, ImpactLevel, MarketSymbol } from '../types';
import { DefaultEconomicDataProvider } from '../services/economicDataProvider';
import { EconomicCalendarService } from '../services/economicCalendarService';
import { TIMEZONE_OPTIONS, convertTimeToTimezone } from '../utils/timezoneUtils';
import { usePredictionState } from '../context/PredictionStateContext';
import { CountryFilterModal, COUNTRIES } from './economic/CountryFilterModal';
import { EconomicAlertModal } from './economic/EconomicAlertModal';
import { EventHistoricalChart } from './economic/EventHistoricalChart';
import { CentralBanksTab } from './economic/CentralBanksTab';
import { KeyIndicatorsTab } from './economic/KeyIndicatorsTab';
import { InterestRatesTab } from './economic/InterestRatesTab';
import { GdpInflationTab } from './economic/GdpInflationTab';
import { MarketHolidaysTab } from './economic/MarketHolidaysTab';

export type EconomicTabId = 
  | 'calendar'
  | 'central-banks'
  | 'key-indicators'
  | 'interest-rates'
  | 'gdp-inflation'
  | 'holidays';

export const EconomicDataView: React.FC = () => {
  const { setSymbol, setView } = usePredictionState();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<EconomicTabId>('calendar');

  // Filters State
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>(
    COUNTRIES.map((c) => c.currency)
  );
  const [selectedImpact, setSelectedImpact] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'today' | 'tomorrow' | 'this_week' | 'next_week' | 'all'>('today');
  const [currentDateStr, setCurrentDateStr] = useState<string>('2026-08-24');

  // Timezone & Refresh State
  const [selectedTimezone, setSelectedTimezone] = useState<string>('UTC');
  const [isTimezoneDropdownOpen, setIsTimezoneDropdownOpen] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number>(Date.now());

  // Modals State
  const [isCountryModalOpen, setIsCountryModalOpen] = useState<boolean>(false);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState<boolean>(false);

  // Data State
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('evt_us_core_pce_mom_canon');
  const [historicalRange, setHistoricalRange] = useState<string>('1Y');
  const [alertSuccessMsg, setAlertSuccessMsg] = useState<string | null>(null);

  const dataProvider = useMemo(() => DefaultEconomicDataProvider.getInstance(), []);
  const calendarService = useMemo(() => EconomicCalendarService.getInstance(), []);

  // Fetch Events
  const loadEvents = () => {
    const filters = {
      currencies: selectedCurrencies,
      impact: selectedImpact !== 'ALL' ? (selectedImpact as ImpactLevel) : undefined,
      eventType: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      searchQuery: searchQuery.trim() || undefined,
    };
    dataProvider.getEvents(filters).then((loaded) => {
      setEvents(loaded);
      // If currently selected event is not in filtered list, select first available
      if (loaded.length > 0 && !loaded.some((e) => e.id === selectedEventId)) {
        setSelectedEventId(loaded[0].id);
      }
    });
  };

  useEffect(() => {
    loadEvents();
  }, [selectedCurrencies, selectedImpact, selectedCategory, searchQuery, lastRefreshedAt]);

  // Auto-refresh countdown timer
  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          setLastRefreshedAt(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Live ticking countdown for upcoming high impact events
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Format remaining time for upcoming events
  const formatTimeRemaining = (targetTs: number) => {
    const diff = targetTs - nowTimestamp;
    if (diff <= 0) return 'Released';
    const totalMinutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    const remMinutes = totalMinutes % 60;

    if (days > 0) {
      return `in ${days}d ${remHours}h`;
    }
    return `in ${hours}h ${remMinutes}m`;
  };

  // Selected event details
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  // Time conversion for selected event
  const selectedEventTime = useMemo(() => {
    if (!selectedEvent) return { formattedTime: '--:--', formattedDate: '2026-08-24' };
    return convertTimeToTimezone(selectedEvent.date, selectedEvent.timeUtc, selectedTimezone);
  }, [selectedEvent, selectedTimezone]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (!events.length) return;

    const headers = ['Time (UTC)', 'Currency', 'Country', 'Event', 'Actual', 'Forecast', 'Previous', 'Impact'];
    const rows = events.map((e) => [
      `"${e.timeUtc}"`,
      `"${e.currency}"`,
      `"${e.country}"`,
      `"${e.event.replace(/"/g, '""')}"`,
      `"${e.actual || ''}"`,
      `"${e.forecast || ''}"`,
      `"${e.previous || ''}"`,
      `"${e.impact}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradexpulse_economic_data_${currentDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Switch active symbol and navigate to chart
  const handleInstrumentClick = (sym: MarketSymbol) => {
    setSymbol(sym);
  };

  // Upcoming high impact list
  const upcomingHighImpact = useMemo(() => {
    return [
      { id: 'evt_fed_decision_upcoming', name: 'Fed Rate Decision', currency: 'USD', targetTs: nowTimestamp + 3.533 * 3600000 },
      { id: 'evt_cpi_upcoming', name: 'U.S. CPI m/m', currency: 'USD', targetTs: nowTimestamp + 28 * 3600000 },
      { id: 'evt_ecb_press_conf', name: 'ECB Press Conference', currency: 'EUR', targetTs: nowTimestamp + 49 * 3600000 },
      { id: 'evt_us_nfp', name: 'U.S. NFP', currency: 'USD', targetTs: nowTimestamp + 99 * 3600000 },
      { id: 'evt_boe_rate_decision', name: 'BoE Interest Rate Decision', currency: 'GBP', targetTs: nowTimestamp + 126 * 3600000 },
    ];
  }, [nowTimestamp]);

  return (
    <div 
      id="economic-data-workspace"
      className="flex flex-col flex-1 h-full min-h-0 bg-[#070B14] text-slate-200 overflow-y-auto font-sans"
    >
      {/* Alert Success Banner */}
      {alertSuccessMsg && (
        <div className="bg-emerald-500/20 border-b border-emerald-500/40 px-4 py-2 text-xs text-emerald-300 font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{alertSuccessMsg}</span>
          </div>
          <button onClick={() => setAlertSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Top Header */}
      <header className="px-4 py-3 bg-[#0A101D] border-b border-[#162135] shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-cyan-400">
                <Database className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-wide text-white font-sans uppercase">
                Economic Data
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Global macroeconomic indicators, central bank policies, and financial calendars
            </p>
          </div>

          {/* Right Action Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filter Countries Button */}
            <button
              id="filter-countries-button"
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#16233D] text-slate-300 hover:text-white border border-[#1D2B44] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>Filter Countries ({selectedCurrencies.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Timezone Dropdown */}
            <div className="relative">
              <button
                id="timezone-selector-button"
                type="button"
                onClick={() => setIsTimezoneDropdownOpen(!isTimezoneDropdownOpen)}
                className="px-2.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#16233D] text-slate-300 hover:text-white border border-[#1D2B44] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Timezone: {selectedTimezone === 'America/New_York' ? 'EDT' : selectedTimezone === 'UTC' ? 'UTC (00:00)' : selectedTimezone}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {isTimezoneDropdownOpen && (
                <div 
                  id="timezone-dropdown-menu"
                  className="absolute right-0 mt-1 w-56 bg-[#0D1424] border border-[#1E293B] rounded-xl shadow-2xl py-1.5 z-40 text-xs text-slate-300 animate-in fade-in duration-100"
                >
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#1A253C] mb-1">
                    Select Display Timezone
                  </div>
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <button
                      key={tz.id}
                      type="button"
                      onClick={() => {
                        setSelectedTimezone(tz.id);
                        setIsTimezoneDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center justify-between transition-colors ${
                        selectedTimezone === tz.id
                          ? 'bg-blue-600/20 text-cyan-300 font-semibold'
                          : 'hover:bg-[#152033] hover:text-white'
                      }`}
                    >
                      <span>{tz.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{tz.abbr}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Data: Live Status Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0B1220] border border-[#18253A] font-mono text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="font-semibold text-emerald-400">Data: Live</span>
              <span className="text-slate-500 hidden sm:inline">(ForexFactory)</span>
            </div>

            {/* Auto Refresh */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-all text-xs font-medium cursor-pointer ${
                autoRefresh
                  ? 'bg-blue-600/15 border-blue-500/40 text-cyan-300'
                  : 'bg-[#111A2E] border-[#1D2B44] text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span>Auto-Refresh: {autoRefresh ? `ON (${refreshCountdown}s)` : 'OFF'}</span>
            </button>

            {/* Export CSV */}
            <button
              id="export-csv-button"
              type="button"
              onClick={handleExportCSV}
              className="px-2.5 py-1.5 rounded-lg bg-[#111A2E] hover:bg-[#16233D] text-slate-300 hover:text-white border border-[#1D2B44] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Set Alert Button */}
            <button
              id="set-alert-header-button"
              type="button"
              onClick={() => setIsAlertModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Set Alert</span>
            </button>
          </div>
        </div>

        {/* Primary Tabs Row */}
        <div className="flex items-center gap-1 mt-3 overflow-x-auto border-t border-[#162135] pt-2">
          {[
            { id: 'calendar', label: 'Economic Calendar', icon: Calendar },
            { id: 'central-banks', label: 'Central Banks', icon: Landmark },
            { id: 'key-indicators', label: 'Key Indicators', icon: Activity },
            { id: 'interest-rates', label: 'Interest Rates', icon: Percent },
            { id: 'gdp-inflation', label: 'GDP & Inflation', icon: BarChart },
            { id: 'holidays', label: 'Holidays', icon: CalendarDays },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`economic-tab-${tab.id}`}
                type="button"
                onClick={() => setActiveTab(tab.id as EconomicTabId)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isTabActive
                    ? 'bg-blue-600/20 border border-blue-500/40 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.1)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2E] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isTabActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="p-3 sm:p-4 flex-1 min-h-0">
        {/* TAB 1: ECONOMIC CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Sub-Filters Bar */}
            <div className="p-3 bg-[#0A101D] border border-[#162135] rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              {/* Date Presets + Calendar Navigator */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#111A2E] p-0.5 rounded-lg border border-[#1E2B44]">
                  {[
                    { id: 'today', label: 'Today' },
                    { id: 'tomorrow', label: 'Tomorrow' },
                    { id: 'this_week', label: 'This Week' },
                    { id: 'next_week', label: 'Next Week' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setDatePreset(p.id as any)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        datePreset === p.id
                          ? 'bg-blue-600 text-white font-semibold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Calendar Navigator */}
                <div className="flex items-center bg-[#111A2E] px-2 py-1 rounded-lg border border-[#1E2B44] text-xs font-mono text-slate-300">
                  <button 
                    type="button" 
                    title="Previous Day"
                    className="p-0.5 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-semibold text-white">24 Aug 2026</span>
                  <button 
                    type="button" 
                    title="Next Day"
                    className="p-0.5 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Impact & Category Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Impact Filter */}
                <div className="flex items-center bg-[#111A2E] px-2 py-1 rounded-lg border border-[#1E2B44] text-xs">
                  <span className="text-slate-500 mr-1.5 text-[11px]">Impact:</span>
                  <select
                    value={selectedImpact}
                    onChange={(e) => setSelectedImpact(e.target.value)}
                    aria-label="Filter by impact level"
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="ALL" className="bg-[#0D1424]">All Impact</option>
                    <option value="HIGH" className="bg-[#0D1424]">High Only</option>
                    <option value="MEDIUM" className="bg-[#0D1424]">Medium & High</option>
                    <option value="LOW" className="bg-[#0D1424]">Low Only</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex items-center bg-[#111A2E] px-2 py-1 rounded-lg border border-[#1E2B44] text-xs">
                  <span className="text-slate-500 mr-1.5 text-[11px]">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    aria-label="Filter by event category"
                    className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="ALL" className="bg-[#0D1424]">All Categories</option>
                    <option value="INFLATION" className="bg-[#0D1424]">Inflation</option>
                    <option value="CENTRAL_BANK" className="bg-[#0D1424]">Central Bank</option>
                    <option value="EMPLOYMENT" className="bg-[#0D1424]">Employment</option>
                    <option value="CONSUMER" className="bg-[#0D1424]">Consumer</option>
                    <option value="MANUFACTURING" className="bg-[#0D1424]">Manufacturing</option>
                    <option value="HOUSING" className="bg-[#0D1424]">Housing</option>
                    <option value="TRADE" className="bg-[#0D1424]">Trade</option>
                  </select>
                </div>

                {/* Search Input */}
                <div className="relative min-w-[180px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search events..."
                    className="w-full pl-8 pr-2.5 py-1 bg-[#111A2E] border border-[#1E2B44] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Reset Filters */}
                {(selectedImpact !== 'ALL' || selectedCategory !== 'ALL' || searchQuery || selectedCurrencies.length < COUNTRIES.length) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImpact('ALL');
                      setSelectedCategory('ALL');
                      setSearchQuery('');
                      setSelectedCurrencies(COUNTRIES.map((c) => c.currency));
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* DUAL COLUMN WORKSPACE */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
              {/* LEFT COLUMN: EVENTS SCHEDULE TABLE (~68% width) */}
              <div className="lg:col-span-8 bg-[#0A101D] border border-[#162135] rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-2.5 bg-[#090E1A] border-b border-[#162135] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      Economic Releases Schedule
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {events.length} Events on Schedule
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="bg-[#080C16] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#162135]">
                        <th className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>Time ({selectedTimezone === 'America/New_York' ? 'EDT' : selectedTimezone === 'UTC' ? 'UTC' : 'Local'})</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2">Currency</th>
                        <th className="py-2.5 px-3">Event Name</th>
                        <th className="py-2.5 px-3 text-right">Actual</th>
                        <th className="py-2.5 px-3 text-right">Forecast</th>
                        <th className="py-2.5 px-3 text-right">Previous</th>
                        <th className="py-2.5 px-3 text-center">Impact</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#121A2C]">
                      {events.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-mono text-xs">
                            No economic events found matching the current filter criteria.
                          </td>
                        </tr>
                      ) : (
                        events.map((evt) => {
                          const isSelected = selectedEvent?.id === evt.id;
                          const convTime = convertTimeToTimezone(evt.date, evt.timeUtc, selectedTimezone);

                          return (
                            <tr
                              key={evt.id}
                              id={`economic-event-row-${evt.id}`}
                              onClick={() => setSelectedEventId(evt.id)}
                              className={`cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-600/15 border-l-2 border-blue-500 text-white font-medium shadow-[inset_0_0_12px_rgba(56,189,248,0.06)]'
                                  : 'text-slate-300 hover:bg-[#0F172A] hover:text-white'
                              }`}
                            >
                              {/* Time */}
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-300 whitespace-nowrap">
                                {convTime.formattedTime}
                              </td>

                              {/* Flag & Currency */}
                              <td className="py-2.5 px-2 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-base leading-none">{evt.flag}</span>
                                  <span className="font-mono font-bold text-slate-300 text-[11px]">{evt.currency}</span>
                                </div>
                              </td>

                              {/* Event Name */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2">
                                  <span className={`font-semibold ${isSelected ? 'text-cyan-300' : 'text-slate-100'}`}>
                                    {evt.event}
                                  </span>
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                                  )}
                                </div>
                              </td>

                              {/* Actual */}
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-sm">
                                {evt.actual ? (
                                  <span className="text-emerald-400">{evt.actual}</span>
                                ) : (
                                  <span className="text-slate-500 font-normal">--</span>
                                )}
                              </td>

                              {/* Forecast */}
                              <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                                {evt.forecast || '--'}
                              </td>

                              {/* Previous */}
                              <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                                {evt.previous || '--'}
                              </td>

                              {/* Impact Badge */}
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    evt.impact === 'HIGH'
                                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                      : evt.impact === 'MEDIUM'
                                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                      : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                                  }`}
                                >
                                  {evt.impact}
                                </span>
                              </td>

                              {/* Action Icon */}
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  title="Set Alert for this event"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedEventId(evt.id);
                                    setIsAlertModalOpen(true);
                                  }}
                                  className="p-1 rounded hover:bg-[#1C283F] text-slate-400 hover:text-cyan-300 transition-colors"
                                >
                                  {evt.alertType === 'DOCUMENT' ? (
                                    <FileText className="w-3.5 h-3.5" />
                                  ) : (
                                    <Bell className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT COLUMN: EVENT DETAILS & UPCOMING HIGH IMPACT (~32% width) */}
              <div className="lg:col-span-4 space-y-3.5">
                {/* Card 1: UPCOMING HIGH-IMPACT EVENTS */}
                <div 
                  id="upcoming-high-impact-card"
                  className="bg-[#0A101D] border border-[#162135] rounded-xl p-3.5 shadow-xl"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[#162135]">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                        Upcoming High-Impact Events
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">Next 7 Days</span>
                  </div>

                  <div className="space-y-2">
                    {upcomingHighImpact.map((item) => {
                      const timeRem = formatTimeRemaining(item.targetTs);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            const found = events.find((e) => e.id === item.id);
                            if (found) setSelectedEventId(found.id);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#0E1524] hover:bg-[#131D33] border border-[#182338] transition-all cursor-pointer text-xs group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                              HIGH
                            </span>
                            <div>
                              <div className="font-semibold text-slate-200 group-hover:text-white">
                                {item.name}
                              </div>
                              <div className="text-[10px] font-mono text-slate-400">
                                {item.currency}
                              </div>
                            </div>
                          </div>
                          <div className="text-right font-mono text-cyan-300 font-bold text-[11px]">
                            {timeRem}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: EVENT DETAILS (Selected Event) */}
                {selectedEvent ? (
                  <div 
                    id="selected-event-details-card"
                    className="bg-[#0A101D] border border-[#162135] rounded-xl p-4 shadow-xl space-y-3.5"
                  >
                    {/* Event Details Header */}
                    <div className="flex items-start justify-between pb-3 border-b border-[#162135]">
                      <div className="flex items-start gap-2.5">
                        <span className="text-2xl mt-0.5">{selectedEvent.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-white tracking-wide">
                              {selectedEvent.event}
                            </h2>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{selectedEvent.country} ({selectedEvent.currency})</span>
                            <span>•</span>
                            <span className="text-cyan-300 font-semibold">{selectedEventTime.formattedTime} ({selectedTimezone})</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          selectedEvent.impact === 'HIGH'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : selectedEvent.impact === 'MEDIUM'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        }`}
                      >
                        {selectedEvent.impact}
                      </span>
                    </div>

                    {/* Description */}
                    <div className="text-xs text-slate-300 leading-relaxed bg-[#0E1524] p-3 rounded-lg border border-[#182338]">
                      {selectedEvent.description}
                    </div>

                    {/* Consensus Metrics Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-[#0E1524] border border-[#182338] rounded-lg text-center font-mono">
                        <div className="text-[10px] text-slate-400 uppercase">Actual</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">
                          {selectedEvent.actual || '--'}
                        </div>
                      </div>

                      <div className="p-2 bg-[#0E1524] border border-[#182338] rounded-lg text-center font-mono">
                        <div className="text-[10px] text-slate-400 uppercase">Forecast</div>
                        <div className="text-sm font-bold text-cyan-300 mt-0.5">
                          {selectedEvent.forecast || '--'}
                        </div>
                      </div>

                      <div className="p-2 bg-[#0E1524] border border-[#182338] rounded-lg text-center font-mono">
                        <div className="text-[10px] text-slate-400 uppercase">Previous</div>
                        <div className="text-sm font-bold text-slate-400 mt-0.5">
                          {selectedEvent.previous || '--'}
                        </div>
                      </div>
                    </div>

                    {/* Historical Chart */}
                    <EventHistoricalChart
                      eventName={selectedEvent.event}
                      data={selectedEvent.historicalData || []}
                      range={historicalRange}
                      onRangeChange={setHistoricalRange}
                    />

                    {/* Affected Instruments */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Market Impact & Related Instruments
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { symbol: 'XAUUSD', price: '$2,512.40', change: '+0.65%', isUp: true },
                          { symbol: 'EURUSD', price: '1.0892', change: '+0.22%', isUp: true },
                          { symbol: 'USDJPY', price: '144.15', change: '-0.38%', isUp: false },
                          { symbol: 'BTCUSD', price: '$64,250', change: '+1.15%', isUp: true },
                        ].map((inst) => (
                          <button
                            key={inst.symbol}
                            type="button"
                            onClick={() => handleInstrumentClick(inst.symbol as MarketSymbol)}
                            title={`Switch workspace to ${inst.symbol}`}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#0E1524] hover:bg-[#142036] border border-[#182338] transition-colors cursor-pointer text-left"
                          >
                            <div>
                              <div className="text-xs font-bold text-white font-mono">{inst.symbol}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{inst.price}</div>
                            </div>
                            <div className={`text-[10px] font-mono font-bold ${inst.isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                              {inst.change}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* AI Macro Insight (If Available) */}
                    {selectedEvent.aiAnalysis && (
                      <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/25 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-bold uppercase">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI Macro Insights</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {selectedEvent.aiAnalysis.interpretation}
                        </p>
                      </div>
                    )}

                    {/* Bottom Action: Create Event Alert */}
                    <button
                      type="button"
                      onClick={() => setIsAlertModalOpen(true)}
                      className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Create Event Alert</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CENTRAL BANKS */}
        {activeTab === 'central-banks' && <CentralBanksTab />}

        {/* TAB 3: KEY INDICATORS */}
        {activeTab === 'key-indicators' && <KeyIndicatorsTab />}

        {/* TAB 4: INTEREST RATES */}
        {activeTab === 'interest-rates' && <InterestRatesTab />}

        {/* TAB 5: GDP & INFLATION */}
        {activeTab === 'gdp-inflation' && <GdpInflationTab />}

        {/* TAB 6: HOLIDAYS */}
        {activeTab === 'holidays' && <MarketHolidaysTab />}
      </div>

      {/* MODALS */}
      <CountryFilterModal
        isOpen={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        selectedCurrencies={selectedCurrencies}
        onChange={setSelectedCurrencies}
      />

      <EconomicAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        event={selectedEvent}
        onAlertCreated={(eventId, mins) => {
          setAlertSuccessMsg(`Alert set for "${selectedEvent?.event}" (${mins === 0 ? 'At Release' : `${mins}m before`})`);
          setTimeout(() => setAlertSuccessMsg(null), 5000);
        }}
      />
    </div>
  );
};
