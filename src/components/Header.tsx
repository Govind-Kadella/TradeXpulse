import React from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { MarketSymbol, ActiveView } from '../types';
import { Settings, Compass, LayoutDashboard, Sliders } from 'lucide-react';

export const Header: React.FC = () => {
  const { activeSymbol, setSymbol, activeView, setView, connectionStatus, marketDataStatus } = usePredictionState();

  const markets: { symbol: MarketSymbol; label: string; sub?: string }[] = [
    { symbol: 'XAUUSD', label: 'XAUUSD', sub: 'Gold' },
    { symbol: 'EURJPY', label: 'EURJPY' },
    { symbol: 'EURUSD', label: 'EURUSD' },
    { symbol: 'GBPUSD', label: 'GBPUSD' },
  ];

  const getStatusDotColor = () => {
    switch (connectionStatus) {
      case 'LIVE':
        return 'bg-emerald-400 shadow-[0_0_8px_#34d399]';
      case 'DEMO':
        return 'bg-amber-400 shadow-[0_0_8px_#f59e0b]';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'bg-blue-400 shadow-[0_0_8px_#3b82f6]';
      case 'OFFLINE':
      default:
        return 'bg-red-400 shadow-[0_0_8px_#ef4444]';
    }
  };

  const getStatusTextColor = () => {
    switch (connectionStatus) {
      case 'LIVE':
        return 'text-emerald-300';
      case 'DEMO':
        return 'text-amber-300';
      case 'CONNECTING':
      case 'RECONNECTING':
        return 'text-blue-300';
      case 'OFFLINE':
      default:
        return 'text-red-400';
    }
  };

  return (
    <header className="h-14 border-b border-[#1F2937] flex items-center justify-between px-4 sm:px-6 bg-[#0E1421] select-none z-30 relative shrink-0 font-sans">
      {/* Left: Brand Identity & Nav */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-header-logo"
        >
          {/* Custom TradeXpulse Hex-Pulse Emblem */}
          <div className="relative flex items-center justify-center w-8 h-8 rounded bg-[#1D283D] border border-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.2)] group-hover:border-blue-400 transition-all">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
              TRADEXPULSE
            </span>
            <span className="text-[10px] text-blue-400 font-bold tracking-widest uppercase mt-0.5">
              AI MARKET ANALYST
            </span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-[#1F2937] mx-1 sm:mx-2 hidden md:block"></div>

        {/* Minimal Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1" id="main-nav-tabs">
          <button
            id="nav-dashboard-tab"
            onClick={() => setView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-[#1D283D] border border-blue-500/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            id="nav-marketmap-tab"
            onClick={() => setView('marketMap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeView === 'marketMap'
                ? 'bg-[#1D283D] border border-blue-500/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Market Map
          </button>
          <button
            id="nav-settings-tab"
            onClick={() => setView('settings')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-all cursor-pointer ${
              activeView === 'settings'
                ? 'bg-[#1D283D] border border-blue-500/50 text-white'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Settings
          </button>
        </nav>
      </div>

      {/* Center: Market Selector (Strictly 4 supported markets: XAUUSD, EURJPY, EURUSD, GBPUSD) */}
      <nav className="flex items-center gap-1.5" id="market-selector-group">
        {markets.map((m) => {
          const isSelected = activeSymbol === m.symbol;
          return (
            <button
              key={m.symbol}
              id={`market-select-${m.symbol.toLowerCase()}`}
              onClick={() => setSymbol(m.symbol)}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600/20 border border-blue-500 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-[#1D283D] border border-transparent'
              }`}
            >
              <span>{m.label}</span>
              {m.sub && (
                <span className={`text-[10px] px-1 py-0.2 rounded font-sans ${
                  isSelected ? 'bg-blue-500/30 text-blue-200' : 'bg-[#1F2937] text-slate-400'
                }`}>
                  {m.sub}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Explicitly "● MARKET DATA" + Demo Feed Badge + Settings / Profile */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div 
          className="flex items-center gap-2 bg-[#0A0E17] border border-[#1F2937] px-2.5 py-1 rounded-full cursor-default"
          id="market-data-status-badge"
          title={`Data Provider: ${marketDataStatus.provider} | Status: ${connectionStatus}`}
        >
          <span className={`h-2 w-2 rounded-full ${getStatusDotColor()} animate-pulse`}></span>
          <span className="text-[10px] font-black text-slate-200 tracking-wider uppercase hidden sm:inline">
            DATA: Twelve Data
          </span>
          <span className={`text-[9px] font-mono font-bold border-l border-[#1F2937] pl-2 ${getStatusTextColor()}`}>
            STATUS: {connectionStatus}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2.5">
          <button
            id="header-settings-button"
            onClick={() => setView('settings')}
            title="Analytics & Display Settings"
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div
            id="header-profile-icon"
            title="TradeXpulse Analyst"
            className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-[#1F2937] hover:ring-blue-500 cursor-pointer transition-all"
          >
            TX
          </div>
        </div>
      </div>
    </header>
  );
};
