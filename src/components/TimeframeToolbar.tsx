import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { Timeframe } from '../types';
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
    activeTimeframe, 
    setTimeframe, 
    overlayConfig, 
    toggleOverlay, 
    isMarketStructureEnabled,
    isMarketPredictionEnabled,
    toggleMarketPrediction,
    m5CountdownText, 
    connectionStatus, 
    marketDataStatus,
    zoomIn,
    zoomOut,
    resetView,
    isChartFullscreen,
    toggleChartFullscreen
  } = usePredictionState();
  const [activeModal, setActiveModal] = useState<'indicators' | 'templates' | 'alert' | 'replay' | 'marketStructure' | null>(null);
  const [alertActive, setAlertActive] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<string>('1x');
  const [activeCursorTool, setActiveCursorTool] = useState<'pointer' | 'draw'>('pointer');

  const timeframes: { tf: Timeframe; label: string; isPrimary?: boolean }[] = [
    { tf: 'M1', label: 'M1' },
    { tf: 'M5', label: 'M5', isPrimary: true },
    { tf: 'M15', label: 'M15' },
    { tf: 'H1', label: 'H1' },
    { tf: 'H4', label: 'H4' },
    { tf: 'D1', label: 'D1' },
  ];

  return (
    <div className="h-10 border-b border-[#1B2537] bg-[#0A0F1D] px-3 flex items-center justify-between text-xs select-none shrink-0 relative z-30 font-sans">
      {/* Timeframes & Quick Tools */}
      <div className="flex gap-1 h-full items-center overflow-x-auto no-scrollbar">
        {timeframes.map((item) => {
          const isActive = activeTimeframe === item.tf;
          return (
            <button
              key={item.tf}
              id={`timeframe-btn-${item.tf.toLowerCase()}`}
              onClick={() => setTimeframe(item.tf)}
              className={`px-2.5 h-full text-[11px] font-bold transition-all cursor-pointer flex items-center ${
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

        <div className="w-[1px] h-4 bg-[#1B2537] mx-1.5"></div>

        {/* Indicators Button */}
        <div className="relative">
          <button
            id="toolbar-indicators-btn"
            onClick={() => setActiveModal(activeModal === 'indicators' ? null : 'indicators')}
            className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
              activeModal === 'indicators'
                ? 'bg-[#152033] text-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Indicators</span>
          </button>

          {/* Indicators Dropdown */}
          {activeModal === 'indicators' && (
            <div className="absolute left-0 mt-1 w-56 bg-[#0E1524] border border-[#1F2C40] rounded-lg shadow-2xl p-2.5 z-40">
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
            </div>
          )}
        </div>

        {/* Templates Button */}
        <div className="relative">
          <button
            id="toolbar-templates-btn"
            onClick={() => setActiveModal(activeModal === 'templates' ? null : 'templates')}
            className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
              activeModal === 'templates'
                ? 'bg-[#152033] text-cyan-400'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {activeModal === 'templates' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#0E1524] border border-[#1F2C40] rounded-lg shadow-2xl p-2 z-40">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-[#1F2C40]">
                Layout Templates
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-between"
                >
                  <span>TradeXpulse AI Pro</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-[#152033]"
                >
                  Pure Price Action
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-[#152033]"
                >
                  Institutional Levels
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alert Button */}
        <div className="relative">
          <button
            id="toolbar-alert-btn"
            onClick={() => {
              setAlertActive(!alertActive);
              setActiveModal(activeModal === 'alert' ? null : 'alert');
            }}
            className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
              alertActive
                ? 'bg-[#152033] text-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-[#121A2B]'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${alertActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
            <span>Alerts</span>
          </button>

          {activeModal === 'alert' && (
            <div className="absolute left-0 mt-1 w-60 bg-[#0E1524] border border-[#1F2C40] rounded-lg shadow-2xl p-3 z-40 text-xs text-slate-300">
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
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-[#1B2537] mx-1.5"></div>

        {/* TOP-LEVEL CONTROL: Market Structure Dropdown Trigger */}
        <div className="relative">
          <button
            id="toolbar-market-structure-dropdown-btn"
            onClick={() => setActiveModal(activeModal === 'marketStructure' ? null : 'marketStructure')}
            title="Market Structure: Open granular price action & SMC indicators menu"
            className={`px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer select-none ${
              activeModal === 'marketStructure' || isMarketStructureEnabled
                ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                : 'bg-[#111A2B] border-[#1B2537] text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Market Structure</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${activeModal === 'marketStructure' ? 'rotate-180 text-purple-300' : 'text-slate-400'}`} />
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                isMarketStructureEnabled
                  ? 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.9)] ring-2 ring-purple-400/20'
                  : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Granular Market Structure Menu */}
          <MarketStructureMenu
            isOpen={activeModal === 'marketStructure'}
            onClose={() => setActiveModal(null)}
          />
        </div>

        {/* TOP-LEVEL CONTROL: Market Prediction Toggle */}
        <button
          id="toolbar-market-prediction-toggle"
          onClick={toggleMarketPrediction}
          title={isMarketPredictionEnabled ? "Market Prediction: Active (Click to Hide AI Projections & Target Lines)" : "Market Prediction: Hidden (Click to Show AI Projections & Target Lines)"}
          className={`px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded border transition-all cursor-pointer select-none ${
            isMarketPredictionEnabled
              ? 'bg-blue-950/40 border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
              : 'bg-[#111A2B] border-[#1B2537] text-slate-300 hover:text-white hover:border-slate-500'
          }`}
        >
          {isMarketPredictionEnabled ? (
            <Eye className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          )}
          <span>Market Prediction</span>
          <span
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              isMarketPredictionEnabled
                ? 'bg-cyan-400 shadow-[0_0_6px_rgba(56,189,248,0.9)] ring-2 ring-cyan-400/20'
                : 'bg-slate-600'
            }`}
          />
        </button>
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
            id="toolbar-replay-btn"
            onClick={() => setActiveModal(activeModal === 'replay' ? null : 'replay')}
            className={`p-1 px-1.5 hover:bg-[#152033] rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
              activeModal === 'replay' ? 'bg-[#152033] text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Market Replay"
          >
            <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {activeModal === 'replay' && (
            <div className="absolute right-0 mt-1 w-52 bg-[#0E1524] border border-[#1F2C40] rounded-lg shadow-2xl p-2.5 z-40 text-xs">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Simulation Replay Speed
              </div>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {['0.5x', '1x', '3x'].map(spd => (
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
                onClick={() => setActiveModal(null)}
                className="w-full py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs text-center cursor-pointer transition-colors"
              >
                Replay From Swing Low
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

