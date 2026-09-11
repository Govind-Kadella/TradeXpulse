import React, { useState, useRef } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { Timeframe } from '../types';
import { TEMPLATE_LIST } from '../services/templateService';
import { ToolbarDropdown } from './ToolbarDropdown';
import { 
  BarChart2, 
  Layers, 
  Bell, 
  PlayCircle, 
  Eye, 
  EyeOff, 
  Check, 
  Clock, 
  ChevronDown, 
  Activity,
  Crosshair,
  MousePointer,
  PenTool,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MarketStructureMenu } from './MarketStructureMenu';

export const TimeframeToolbar: React.FC = () => {
  const { 
    activeSymbol,
    setSymbol,
    activeTimeframe, 
    setTimeframe, 
    overlayConfig, 
    toggleOverlay, 
    isMarketStructureEnabled,
    isMarketPredictionEnabled,
    toggleMarketPrediction,
    activeDropdown,
    setActiveDropdown,
    m5CountdownText, 
    connectionStatus, 
    marketDataStatus,
    zoomIn,
    zoomOut,
    resetView,
    isChartFullscreen,
    toggleChartFullscreen,
    activeTemplate,
    applyTemplate
  } = usePredictionState();

  const [alertActive, setAlertActive] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<string>('1x');
  const [activeCursorTool, setActiveCursorTool] = useState<'pointer' | 'draw'>('pointer');

  // Button anchor references for accurate portal positioning
  const toolbarRef = useRef<HTMLDivElement>(null);
  const fullscreenSymbolBtnRef = useRef<HTMLButtonElement>(null);
  const indicatorsBtnRef = useRef<HTMLButtonElement>(null);
  const templatesBtnRef = useRef<HTMLButtonElement>(null);
  const alertsBtnRef = useRef<HTMLButtonElement>(null);
  const marketStructureBtnRef = useRef<HTMLButtonElement>(null);
  const marketPredictionBtnRef = useRef<HTMLButtonElement>(null);
  const replayBtnRef = useRef<HTMLButtonElement>(null);

  const timeframes: { tf: Timeframe; label: string; isPrimary?: boolean }[] = [
    { tf: 'M1', label: 'M1' },
    { tf: 'M5', label: 'M5', isPrimary: true },
    { tf: 'M15', label: 'M15' },
    { tf: 'H1', label: '1H' },
    { tf: 'H4', label: '4H' },
    { tf: 'D1', label: '1D' },
  ];

  const markets = [
    { symbol: 'XAUUSD', label: 'XAUUSD', sub: 'Gold' },
    { symbol: 'EURUSD', label: 'EURUSD', sub: 'EUR / USD' },
    { symbol: 'GBPUSD', label: 'GBPUSD', sub: 'GBP / USD' },
    { symbol: 'EURJPY', label: 'EURJPY', sub: 'EUR / JPY' },
  ];

  return (
    <div
      ref={toolbarRef}
      id="timeframe-toolbar"
      className="h-10 border-b border-[#1B2537] bg-[#0A0F1D] px-3 flex items-center justify-between text-xs select-none shrink-0 relative z-20 font-sans"
    >
      {/* Left: Timeframe Selectors + Feature Dropdowns */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Fullscreen Mode Quick Symbol Selector */}
        {isChartFullscreen && (
          <div className="relative shrink-0 mr-1">
            <button
              ref={fullscreenSymbolBtnRef}
              id="toolbar-fullscreen-symbol-btn"
              onClick={() => setActiveDropdown(activeDropdown === 'symbol' ? null : 'symbol')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded bg-[#111A2B] hover:bg-[#172338] border text-xs font-mono font-bold transition-all cursor-pointer ${
                activeDropdown === 'symbol'
                  ? 'border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'border-[#1F2C40] text-slate-200'
              }`}
              title="Select Currency Pair (Fullscreen)"
              aria-expanded={activeDropdown === 'symbol'}
            >
              <span className="text-cyan-400">{activeSymbol}</span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                  activeDropdown === 'symbol' ? 'rotate-180 text-cyan-400' : ''
                }`}
              />
            </button>

            <ToolbarDropdown
              id="symbol"
              triggerRef={fullscreenSymbolBtnRef}
              isOpen={activeDropdown === 'symbol'}
              onClose={() => setActiveDropdown(null)}
              className="w-48 p-1"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1 border-b border-[#1F2C40] flex items-center justify-between">
                <span>Select Symbol</span>
                <span className="text-[9px] font-mono text-cyan-400 font-semibold">{markets.length} Pairs</span>
              </div>
              <div className="space-y-0.5">
                {markets.map((m) => {
                  const isSelected = activeSymbol === m.symbol;
                  return (
                    <button
                      key={m.symbol}
                      id={`toolbar-fs-symbol-option-${m.symbol.toLowerCase()}`}
                      onClick={() => {
                        setSymbol(m.symbol as any);
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
                        {m.sub && <span className="text-[10px] text-slate-500 font-sans">({m.sub})</span>}
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </ToolbarDropdown>
          </div>
        )}

        {/* Timeframe Buttons Container */}
        <div className="flex items-center bg-[#070B14] p-0.5 rounded border border-[#1B2537]">
          {timeframes.map((item) => {
            const isActive = activeTimeframe === item.tf;
            return (
              <button
                key={item.tf}
                id={`timeframe-btn-${item.tf.toLowerCase()}`}
                onClick={() => setTimeframe(item.tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-all flex items-center cursor-pointer ${
                  isActive
                    ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
                {item.isPrimary && (
                  <span
                    title="Primary Decision Timeframe"
                    className="ml-1 w-1 h-1 rounded-full bg-cyan-400"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-[1px] h-4 bg-[#1B2537] mx-1.5 shrink-0"></div>

        {/* Action Controls & Dropdowns */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Indicators Button */}
          <div className="relative">
            <button
              ref={indicatorsBtnRef}
              id="toolbar-indicators-btn"
              onClick={() => setActiveDropdown(activeDropdown === 'indicators' ? null : 'indicators')}
              className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer select-none ${
                activeDropdown === 'indicators'
                  ? 'bg-[#152033] text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
              }`}
              aria-expanded={activeDropdown === 'indicators'}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Indicators</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  activeDropdown === 'indicators' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                }`}
              />
            </button>

            <ToolbarDropdown
              id="indicators"
              triggerRef={indicatorsBtnRef}
              isOpen={activeDropdown === 'indicators'}
              onClose={() => setActiveDropdown(null)}
              className="w-56 p-2.5"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-[#1F2C40]">
                Technical Overlays
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>TradeXpulse Forecast</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showForecastPath}
                    onChange={() => toggleOverlay('showForecastPath')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>Entry Zone Corridor</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showEntryZone}
                    onChange={() => toggleOverlay('showEntryZone')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>SL & TP Targets</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showTargets}
                    onChange={() => toggleOverlay('showTargets')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>Support & Resistance</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showSupportResistance}
                    onChange={() => toggleOverlay('showSupportResistance')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>Volume Profile</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showVolume}
                    onChange={() => toggleOverlay('showVolume')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#152033] p-1.5 rounded cursor-pointer">
                  <span>EMA Ribbon (20/50/200)</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showEMAs}
                    onChange={() => toggleOverlay('showEMAs')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>
            </ToolbarDropdown>
          </div>

          {/* Templates Button */}
          <div className="relative">
            <button
              ref={templatesBtnRef}
              id="toolbar-templates-btn"
              onClick={() => setActiveDropdown(activeDropdown === 'templates' ? null : 'templates')}
              className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer select-none ${
                activeDropdown === 'templates'
                  ? 'bg-[#152033] text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
              }`}
              aria-expanded={activeDropdown === 'templates'}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Templates</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  activeDropdown === 'templates' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                }`}
              />
            </button>

            <ToolbarDropdown
              id="templates"
              triggerRef={templatesBtnRef}
              isOpen={activeDropdown === 'templates'}
              onClose={() => setActiveDropdown(null)}
              className="w-56 p-2"
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-[#1F2C40] flex items-center justify-between">
                <span>Layout Templates</span>
                {activeTemplate === 'CUSTOM' && (
                  <span className="text-[9px] font-mono text-amber-400 px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 font-semibold">
                    Custom
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {TEMPLATE_LIST.map((tmpl) => {
                  const isActive = activeTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      id={`template-btn-${tmpl.id.toLowerCase().replace(/_/g, '-')}`}
                      onClick={() => {
                        applyTemplate(tmpl.id);
                        setActiveDropdown(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 font-semibold shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-[#152033] border border-transparent'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="leading-tight">{tmpl.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5 group-hover:text-slate-300">
                          {tmpl.badge}
                        </span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </ToolbarDropdown>
          </div>

          {/* Alert Button */}
          <div className="relative">
            <button
              ref={alertsBtnRef}
              id="toolbar-alert-btn"
              onClick={() => {
                setAlertActive(!alertActive);
                setActiveDropdown(activeDropdown === 'alerts' ? null : 'alerts');
              }}
              className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer select-none ${
                alertActive
                  ? 'bg-[#152033] text-amber-400'
                  : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
              }`}
              aria-expanded={activeDropdown === 'alerts'}
            >
              <Bell className={`w-3.5 h-3.5 ${alertActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
              <span>Alerts</span>
            </button>

            <ToolbarDropdown
              id="alerts"
              triggerRef={alertsBtnRef}
              isOpen={activeDropdown === 'alerts'}
              onClose={() => setActiveDropdown(null)}
              className="w-60 p-3 text-xs text-slate-300"
            >
              <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                AI Level Alert
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Notification armed for Limit Entry Zone touch and Invalidation breach.
              </p>
              <div className="px-2 py-1 rounded bg-[#111A2B] border border-[#1F2C40] text-[10px] text-amber-300 font-mono">
                Status: {alertActive ? 'ARMED (Active)' : 'STANDBY'}
              </div>
            </ToolbarDropdown>
          </div>

          <div className="w-[1px] h-4 bg-[#1B2537] mx-1.5"></div>

          {/* TOP-LEVEL CONTROL: Market Structure Dropdown Trigger */}
          <div className="relative">
            <button
              ref={marketStructureBtnRef}
              id="toolbar-market-structure-dropdown-btn"
              onClick={() => setActiveDropdown(activeDropdown === 'marketStructure' ? null : 'marketStructure')}
              title="Market Structure: Open granular price action & SMC indicators menu"
              className={`px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer select-none ${
                activeDropdown === 'marketStructure' || isMarketStructureEnabled
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : 'bg-[#111A2B] border-[#1B2537] text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              aria-expanded={activeDropdown === 'marketStructure'}
            >
              <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Market Structure</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  activeDropdown === 'marketStructure' ? 'rotate-180 text-purple-300' : 'text-slate-400'
                }`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isMarketStructureEnabled
                    ? 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.9)] ring-2 ring-purple-400/20'
                    : 'bg-slate-600'
                }`}
              />
            </button>

            {/* Granular Market Structure Menu (renders in shared portal) */}
            <MarketStructureMenu
              isOpen={activeDropdown === 'marketStructure'}
              onClose={() => setActiveDropdown(null)}
              triggerRef={marketStructureBtnRef}
            />
          </div>

          {/* TOP-LEVEL CONTROL: Market Prediction Dropdown */}
          <div className="relative">
            <button
              ref={marketPredictionBtnRef}
              id="toolbar-market-prediction-dropdown-btn"
              onClick={() => setActiveDropdown(activeDropdown === 'marketPrediction' ? null : 'marketPrediction')}
              title="Market Prediction: Open AI forecast projections & target lines menu"
              className={`px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer select-none ${
                activeDropdown === 'marketPrediction' || isMarketPredictionEnabled
                  ? 'bg-blue-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                  : 'bg-[#111A2B] border-[#1B2537] text-slate-300 hover:text-white hover:border-slate-500'
              }`}
              aria-expanded={activeDropdown === 'marketPrediction'}
            >
              {isMarketPredictionEnabled ? (
                <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              )}
              <span>Market Prediction</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${
                  activeDropdown === 'marketPrediction' ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                }`}
              />
              <span
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  isMarketPredictionEnabled
                    ? 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] ring-2 ring-cyan-400/20'
                    : 'bg-slate-600'
                }`}
              />
            </button>

            <ToolbarDropdown
              id="marketPrediction"
              triggerRef={marketPredictionBtnRef}
              isOpen={activeDropdown === 'marketPrediction'}
              onClose={() => setActiveDropdown(null)}
              className="w-72 p-0 overflow-hidden"
            >
              <div className="p-3 border-b border-[#1F2937] bg-[#0E1524] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Market Prediction
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      isMarketPredictionEnabled
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isMarketPredictionEnabled ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>
                <button
                  id="mp-toggle-active-btn"
                  onClick={toggleMarketPrediction}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors cursor-pointer ${
                    isMarketPredictionEnabled
                      ? 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isMarketPredictionEnabled ? 'Mute' : 'Enable'}
                </button>
              </div>

              <div className="p-3 space-y-2 text-xs">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  AI Prediction Components
                </div>
                <label className="flex items-center justify-between p-1.5 rounded text-slate-300 hover:bg-[#152033] cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">AI Forecast Path</span>
                    <span className="text-[10px] text-slate-400">Projected trajectory curve</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showForecastPath}
                    onChange={() => toggleOverlay('showForecastPath')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded text-slate-300 hover:bg-[#152033] cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">Entry Zone Corridor</span>
                    <span className="text-[10px] text-slate-400">Optimal limit entry bands</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showEntryZone}
                    onChange={() => toggleOverlay('showEntryZone')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>

                <label className="flex items-center justify-between p-1.5 rounded text-slate-300 hover:bg-[#152033] cursor-pointer">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">SL & TP Targets</span>
                    <span className="text-[10px] text-slate-400">Dynamic institutional levels</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showTargets}
                    onChange={() => toggleOverlay('showTargets')}
                    className="w-4 h-4 accent-cyan-500"
                  />
                </label>
              </div>

              <div className="p-2 border-t border-[#1F2937] bg-[#0A0F1A] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>AI Inference Engine</span>
                <span className="text-cyan-400">Live M5 Sync</span>
              </div>
            </ToolbarDropdown>
          </div>
        </div>
      </div>

      {/* Right: Chart Controls (Crosshair, Cursor, Drawing, Zoom, Reset, Fullscreen) & M5 Countdown */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* M5 Candle Close Countdown */}
        <div 
          id="toolbar-m5-countdown"
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded bg-[#111A2B] border border-[#1B2537] text-[10px] font-mono text-slate-300 select-none shadow-inner"
          title="Current M5 candle countdown to close"
        >
          <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="font-bold text-slate-200">{m5CountdownText}</span>
        </div>

        <div className="h-4 w-[1px] bg-[#1B2537] hidden sm:block"></div>

        {/* Compact Chart Controls Toolbar */}
        <div className="flex items-center gap-0.5 bg-[#111A2B] border border-[#1B2537] p-0.5 rounded-md text-slate-400">
          <button
            id="toolbar-cursor-pointer-btn"
            onClick={() => setActiveCursorTool('pointer')}
            title="Pointer / Select Tool"
            className={`p-1 rounded cursor-pointer transition-colors ${
              activeCursorTool === 'pointer' ? 'bg-[#172338] text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-crosshair-btn"
            onClick={() => toggleOverlay('showCrosshair')}
            title="Crosshair"
            className={`p-1 rounded cursor-pointer transition-colors ${
              overlayConfig.showCrosshair ? 'bg-[#172338] text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-draw-tool-btn"
            onClick={() => setActiveCursorTool('draw')}
            title="Drawing / Measurement Tool"
            className={`p-1 rounded cursor-pointer transition-colors ${
              activeCursorTool === 'draw' ? 'bg-[#172338] text-cyan-400' : 'hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-[#1B2537] mx-0.5"></div>
          <button
            id="toolbar-zoom-in-btn"
            onClick={() => zoomIn()}
            title="Zoom In"
            className="p-1 rounded hover:text-slate-200 hover:bg-[#172338] cursor-pointer transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-zoom-out-btn"
            onClick={() => zoomOut()}
            title="Zoom Out"
            className="p-1 rounded hover:text-slate-200 hover:bg-[#172338] cursor-pointer transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-reset-view-btn"
            onClick={resetView}
            title="Reset Chart View"
            className="p-1 rounded hover:text-slate-200 hover:bg-[#172338] cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-3 bg-[#1B2537] mx-0.5"></div>
          <button
            id="toolbar-fullscreen-btn"
            onClick={toggleChartFullscreen}
            title={isChartFullscreen ? "Exit Fullscreen" : "Fullscreen Chart"}
            className={`p-1 rounded cursor-pointer transition-colors ${
              isChartFullscreen ? 'bg-cyan-500/20 text-cyan-300' : 'hover:text-slate-200 hover:bg-[#172338]'
            }`}
          >
            {isChartFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Replay Button */}
        <div className="relative">
          <button
            ref={replayBtnRef}
            id="toolbar-replay-btn"
            onClick={() => setActiveDropdown(activeDropdown === 'replay' ? null : 'replay')}
            className={`p-1 px-1.5 hover:bg-[#152033] rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
              activeDropdown === 'replay' ? 'bg-[#152033] text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Market Replay"
            aria-expanded={activeDropdown === 'replay'}
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          <ToolbarDropdown
            id="replay"
            triggerRef={replayBtnRef}
            isOpen={activeDropdown === 'replay'}
            onClose={() => setActiveDropdown(null)}
            align="right"
            className="w-52 p-2.5 text-xs"
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Simulation Replay Speed
            </div>
            <div className="grid grid-cols-3 gap-1 mb-2">
              {['0.5x', '1x', '3x'].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setReplaySpeed(spd)}
                  className={`py-1 rounded text-center font-mono ${
                    replaySpeed === spd
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-[#152033] text-slate-300 hover:bg-[#202d44]'
                  }`}
                >
                  {spd}
                </button>
              ))}
            </div>
            <button
              onClick={() => setActiveDropdown(null)}
              className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs text-center cursor-pointer transition-colors"
            >
              Replay From Swing Low
            </button>
          </ToolbarDropdown>
        </div>
      </div>
    </div>
  );
};
