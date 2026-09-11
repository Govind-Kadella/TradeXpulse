import React, { useState, useRef } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { MarketSymbol } from '../types';
import { ToolbarDropdown } from './ToolbarDropdown';
import { 
  Compass, 
  LayoutDashboard, 
  Sliders, 
  ShieldCheck, 
  Search, 
  Bell, 
  Moon, 
  Sun,
  ChevronDown,
  Check,
  Zap,
  History,
  Cpu
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    activeSymbol, 
    setSymbol, 
    activeView, 
    setView, 
    activeDropdown,
    setActiveDropdown
  } = usePredictionState();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);
  const symbolBtnRef = useRef<HTMLButtonElement>(null);

  const markets: { symbol: MarketSymbol; label: string; sub?: string }[] = [
    { symbol: 'XAUUSD', label: 'XAUUSD', sub: 'Gold' },
    { symbol: 'EURUSD', label: 'EURUSD', sub: 'EUR / USD' },
    { symbol: 'GBPUSD', label: 'GBPUSD', sub: 'GBP / USD' },
    { symbol: 'EURJPY', label: 'EURJPY', sub: 'EUR / JPY' },
  ];

  return (
    <header className="h-13 border-b border-[#1B2537] flex items-center justify-between px-3 sm:px-4 bg-[#0A0E1A] select-none z-30 relative shrink-0 font-sans">
      {/* Left: Brand Identity & Nav Tabs */}
      <div className="flex items-center gap-3 xl:gap-5">
        <div 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
          id="brand-header-logo"
        >
          {/* TradeXpulse Pulse Emblem */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-md bg-[#131D31] border border-cyan-500/40 shadow-[0_0_12px_rgba(56,189,248,0.25)] group-hover:border-cyan-400 transition-all">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#38bdf8]"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-wider text-white leading-tight">
              TRADEXPULSE
            </span>
            <span className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase">
              AI MARKET ANALYST
            </span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-[#1B2537] hidden md:block"></div>

        {/* Global Navigation Tabs: Dashboard, Market Map, AI Signals, Strategy Builder, Backtest, Execution, Settings */}
        <nav className="hidden lg:flex items-center gap-1" id="main-nav-tabs">
          <button
            id="nav-dashboard-tab"
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            id="nav-marketmap-tab"
            onClick={() => setView('marketMap')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'marketMap'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Market Map
          </button>
          <button
            id="nav-aisignals-tab"
            onClick={() => setView('aiSignals')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'aiSignals'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            AI Signals
          </button>
          <button
            id="nav-strategybuilder-tab"
            onClick={() => setView('strategyBuilder')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'strategyBuilder'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Strategy Builder
          </button>
          <button
            id="nav-backtest-tab"
            onClick={() => setView('backtest')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'backtest'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            Backtest
          </button>
          <button
            id="nav-execution-tab"
            onClick={() => setView('execution')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'execution'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Execution
          </button>
          <button
            id="nav-settings-tab"
            onClick={() => setView('settings')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2C]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Settings
          </button>
        </nav>
      </div>

      {/* Center/Right: Symbol Quick Switcher + Search Field */}
      <div className="flex items-center gap-3">
        {/* Quick Symbol Switcher Pill */}
        <div className="relative">
          <button
            ref={symbolBtnRef}
            id="header-active-symbol-btn"
            onClick={() => setActiveDropdown(activeDropdown === 'symbol' ? null : 'symbol')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111A2B] hover:bg-[#172338] border text-xs font-mono font-bold transition-all cursor-pointer ${
              activeDropdown === 'symbol'
                ? 'border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                : 'border-[#1F2C40] text-slate-200'
            }`}
            title="Select Currency Pair or Asset"
            aria-expanded={activeDropdown === 'symbol'}
          >
            <span className="text-cyan-400">{activeSymbol}</span>
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${activeDropdown === 'symbol' ? 'rotate-180 text-cyan-400' : ''}`} />
          </button>

          <ToolbarDropdown
            id="symbol"
            triggerRef={symbolBtnRef}
            isOpen={activeDropdown === 'symbol'}
            onClose={() => setActiveDropdown(null)}
            className="w-48 p-1"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-[#1F2C40] flex items-center justify-between">
              <span>Select Symbol</span>
              <span className="text-[9px] font-mono text-cyan-400 font-semibold">{markets.length} Pairs</span>
            </div>
            <div className="space-y-0.5">
              {markets.map(m => {
                const isSelected = activeSymbol === m.symbol;
                return (
                  <button
                    key={m.symbol}
                    id={`header-symbol-option-${m.symbol.toLowerCase()}`}
                    onClick={() => {
                      setSymbol(m.symbol);
                      setActiveDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-bold' 
                        : 'text-slate-300 hover:text-white hover:bg-[#152033] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{m.label}</span>
                      {m.sub && <span className="text-[10px] text-slate-500 font-sans">{m.sub}</span>}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </ToolbarDropdown>
        </div>

        {/* Search Symbols Input */}
        <div className="relative hidden md:block">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111A2B] border transition-all ${
            isSearchFocused ? 'border-cyan-500/60 shadow-[0_0_12px_rgba(56,189,248,0.15)] ring-1 ring-cyan-500/30' : 'border-[#1B2537]'
          }`}>
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search symbols..."
              className="bg-transparent border-none outline-none text-xs text-slate-200 placeholder:text-slate-500 w-36 lg:w-44 font-sans"
            />
            <span className="text-[9.5px] font-mono font-bold text-slate-500 bg-[#0B101D] px-1.5 py-0.5 rounded border border-[#1B2537]">
              ⌘K
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls: Theme Toggle, Notifications with Badge, User / Trading Pro with Pro Plan badge */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Light/Dark Mode Toggle */}
        <button
          id="header-theme-toggle-btn"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Dark Theme Active" : "Light Theme"}
          className="p-1.5 rounded-md hover:bg-[#131D31] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            id="header-notifications-btn"
            title="Notifications & Alerts"
            className="p-1.5 rounded-md hover:bg-[#131D31] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-pulse"></span>
          </button>
        </div>

        <div className="h-6 w-[1px] bg-[#1B2537] mx-0.5"></div>

        {/* User / Avatar & Trading Pro Plan Badge */}
        <div 
          id="header-user-profile-badge"
          onClick={() => setView('settings')}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[#121A2C] border border-transparent hover:border-[#1B2537] cursor-pointer transition-all"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-[10px] font-black text-white ring-1 ring-cyan-500/40 shadow-sm">
            TX
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 leading-tight">
              Trading Pro
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono font-extrabold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-tighter leading-none">
                PRO PLAN
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
