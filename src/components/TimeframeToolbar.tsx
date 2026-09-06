import React, { useState } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { Timeframe } from '../types';
import { BarChart2, Layers, Bell, PlayCircle, Eye, SlidersHorizontal, Check, Clock } from 'lucide-react';

export const TimeframeToolbar: React.FC = () => {
  const { activeTimeframe, setTimeframe, overlayConfig, toggleOverlay, m5CountdownText, connectionStatus, marketDataStatus } = usePredictionState();
  const [activeModal, setActiveModal] = useState<'indicators' | 'templates' | 'alert' | 'replay' | null>(null);
  const [alertActive, setAlertActive] = useState<boolean>(false);
  const [replaySpeed, setReplaySpeed] = useState<string>('1x');

  const timeframes: { tf: Timeframe; label: string; isPrimary?: boolean }[] = [
    { tf: 'M1', label: 'M1' },
    { tf: 'M5', label: 'M5', isPrimary: true },
    { tf: 'M15', label: 'M15' },
    { tf: 'H1', label: 'H1' },
    { tf: 'H4', label: 'H4' },
    { tf: 'D1', label: 'D1' },
  ];

  return (
    <div className="h-10 border-b border-[#1F2937] bg-[#0E1421] px-4 flex items-center justify-between text-xs select-none shrink-0 relative z-20">
      {/* Timeframes & Quick Tools */}
      <div className="flex gap-1 h-full items-center">
        {timeframes.map((item) => {
          const isActive = activeTimeframe === item.tf;
          return (
            <button
              key={item.tf}
              id={`timeframe-btn-${item.tf.toLowerCase()}`}
              onClick={() => setTimeframe(item.tf)}
              className={`px-2.5 h-full text-[11px] font-bold transition-colors cursor-pointer flex items-center ${
                isActive
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-400/5'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {item.label}
              {item.isPrimary && (
                <span
                  title="Primary Decision Timeframe"
                  className="ml-1 w-1 h-1 rounded-full bg-blue-400"
                />
              )}
            </button>
          );
        })}

        <div className="w-[1px] h-4 bg-[#1F2937] mx-2"></div>

        {/* Indicators Button */}
        <div className="relative">
          <button
            id="toolbar-indicators-btn"
            onClick={() => setActiveModal(activeModal === 'indicators' ? null : 'indicators')}
            className={`px-2 py-1 flex items-center gap-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
              activeModal === 'indicators'
                ? 'bg-[#1D283D] text-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Indicators</span>
          </button>

          {/* Indicators Dropdown */}
          {activeModal === 'indicators' && (
            <div className="absolute left-0 mt-1 w-56 bg-[#0E1421] border border-[#1F2937] rounded-lg shadow-2xl p-2.5 z-40">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 pb-1 border-b border-[#1F2937]">
                Chart Overlays
              </div>
              <div className="space-y-1">
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#1D283D] p-1.5 rounded cursor-pointer">
                  <span>TradeXpulse Forecast</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showForecastPath}
                    onChange={() => toggleOverlay('showForecastPath')}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#1D283D] p-1.5 rounded cursor-pointer">
                  <span>Entry Zone Corridor</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showEntryZone}
                    onChange={() => toggleOverlay('showEntryZone')}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#1D283D] p-1.5 rounded cursor-pointer">
                  <span>SL & TP Targets</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showTargets}
                    onChange={() => toggleOverlay('showTargets')}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#1D283D] p-1.5 rounded cursor-pointer">
                  <span>Support & Resistance</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showSupportResistance}
                    onChange={() => toggleOverlay('showSupportResistance')}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between text-xs text-slate-300 hover:bg-[#1D283D] p-1.5 rounded cursor-pointer">
                  <span>Volume Profile</span>
                  <input
                    type="checkbox"
                    checked={overlayConfig.showVolume}
                    onChange={() => toggleOverlay('showVolume')}
                    className="w-4 h-4 accent-blue-500"
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
                ? 'bg-[#1D283D] text-blue-400'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {activeModal === 'templates' && (
            <div className="absolute left-0 mt-1 w-48 bg-[#0E1421] border border-[#1F2937] rounded-lg shadow-2xl p-2 z-40">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 pb-1 border-b border-[#1F2937]">
                Layout Templates
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 flex items-center justify-between"
                >
                  <span>TradeXpulse AI Pro</span>
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-[#1D283D]"
                >
                  Pure Price Action
                </button>
                <button
                  onClick={() => setActiveModal(null)}
                  className="w-full text-left px-2 py-1.5 rounded text-xs text-slate-300 hover:bg-[#1D283D]"
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
                ? 'bg-[#1D283D] text-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-[#1D283D]'
            }`}
          >
            <Bell className={`w-3.5 h-3.5 ${alertActive ? 'text-amber-400 fill-amber-400/30' : ''}`} />
            <span>Alerts</span>
          </button>

          {activeModal === 'alert' && (
            <div className="absolute left-0 mt-1 w-60 bg-[#0E1421] border border-[#1F2937] rounded-lg shadow-2xl p-3 z-40 text-xs text-slate-300">
              <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5" />
                AI Level Alert
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Notification armed for Limit Entry Zone touch and Invalidation breach.
              </p>
              <div className="px-2 py-1 rounded bg-[#121929] border border-[#1F2937] text-[10px] text-amber-300 font-mono">
                Status: {alertActive ? 'ARMED (Demo Mode)' : 'STANDBY'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Tools: M5 Countdown, Data Source Indicator & Replay */}
      <div className="flex items-center gap-2.5">
        {/* M5 Candle Close Countdown */}
        <div 
          id="toolbar-m5-countdown"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#131B2B] border border-[#1F2937] text-[10px] font-mono text-slate-300 select-none shadow-inner"
          title="Current M5 candle countdown to close"
        >
          <Clock className="w-3 h-3 text-blue-400 shrink-0" />
          <span className="font-bold text-slate-200">{m5CountdownText}</span>
        </div>

        {/* Small Data-Source Indicator */}
        <div 
          id="toolbar-data-source-indicator"
          className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-slate-400 px-1 border-l border-[#1F2937] pl-2.5"
          title={`Feed: ${marketDataStatus.provider}`}
        >
          <span className="text-slate-400">DATA: Twelve Data</span>
          <span className="text-slate-600">•</span>
          <span className={connectionStatus === 'LIVE' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
            STATUS: {connectionStatus}
          </span>
        </div>

        {/* Replay */}
        <div className="relative">
          <button
            id="toolbar-replay-btn"
            onClick={() => setActiveModal(activeModal === 'replay' ? null : 'replay')}
            className={`p-1.5 hover:bg-[#1D283D] rounded transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold ${
              activeModal === 'replay' ? 'bg-[#1D283D] text-emerald-400' : 'text-slate-400 hover:text-white'
            }`}
            title="Market Replay"
          >
            <PlayCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Replay</span>
          </button>

          {activeModal === 'replay' && (
            <div className="absolute right-0 mt-1 w-52 bg-[#0E1421] border border-[#1F2937] rounded-lg shadow-2xl p-2.5 z-40 text-xs">
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
                        : 'bg-[#1D283D] text-slate-300 hover:bg-[#26354f]'
                    }`}
                  >
                    {spd}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs text-center cursor-pointer transition-colors"
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
