import React from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { Sliders, Shield, Eye, Cpu } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { overlayConfig, toggleOverlay, setView } = usePredictionState();

  return (
    <div className="flex-1 bg-[#0A0E17] p-6 overflow-y-auto select-none" id="settings-view">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="border-b border-[#1F2937] pb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              <h1 className="text-lg font-display font-extrabold text-white">
                TRADEXPULSE CONFIGURATION
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize chart analytical overlay layers, simulation speed, and analyst interface settings.
            </p>
          </div>

          <button
            onClick={() => setView('dashboard')}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>

        {/* Section 1: Chart Overlay Controls */}
        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Eye className="w-4 h-4 text-blue-400" />
            Chart & Overlay Layers
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded bg-[#1D283D]/40 border border-[#1F2937] cursor-pointer hover:border-blue-500/40 transition-colors">
              <div>
                <div className="font-semibold text-white">AI Forecast Trajectory</div>
                <div className="text-[11px] text-slate-400">Display predicted price path and waypoint nodes</div>
              </div>
              <input
                type="checkbox"
                checked={overlayConfig.showForecastPath}
                onChange={() => toggleOverlay('showForecastPath')}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded bg-[#1D283D]/40 border border-[#1F2937] cursor-pointer hover:border-blue-500/40 transition-colors">
              <div>
                <div className="font-semibold text-white">Limit Entry Zone Corridor</div>
                <div className="text-[11px] text-slate-400">Highlight Buy/Sell Limit institutional range</div>
              </div>
              <input
                type="checkbox"
                checked={overlayConfig.showEntryZone}
                onChange={() => toggleOverlay('showEntryZone')}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded bg-[#1D283D]/40 border border-[#1F2937] cursor-pointer hover:border-blue-500/40 transition-colors">
              <div>
                <div className="font-semibold text-white">Stop Loss & Take Profit Levels</div>
                <div className="text-[11px] text-slate-400">Render SL, TP1, TP2, TP3 lines and tags</div>
              </div>
              <input
                type="checkbox"
                checked={overlayConfig.showTargets}
                onChange={() => toggleOverlay('showTargets')}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded bg-[#1D283D]/40 border border-[#1F2937] cursor-pointer hover:border-blue-500/40 transition-colors">
              <div>
                <div className="font-semibold text-white">Support & Resistance Lines</div>
                <div className="text-[11px] text-slate-400">Mark institutional swing floor and ceiling</div>
              </div>
              <input
                type="checkbox"
                checked={overlayConfig.showSupportResistance}
                onChange={() => toggleOverlay('showSupportResistance')}
                className="w-4 h-4 accent-blue-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded bg-[#1D283D]/40 border border-[#1F2937] cursor-pointer hover:border-blue-500/40 transition-colors">
              <div>
                <div className="font-semibold text-white">Sub-Chart Volume Profile</div>
                <div className="text-[11px] text-slate-400">Show volume histogram bars at bottom of chart</div>
              </div>
              <input
                type="checkbox"
                checked={overlayConfig.showVolume}
                onChange={() => toggleOverlay('showVolume')}
                className="w-4 h-4 accent-blue-600"
              />
            </label>
          </div>
        </div>

        {/* Section 2: Architecture & Analysis Engine Configuration */}
        <div className="bg-[#0E1421] border border-[#1F2937] rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Cpu className="w-4 h-4 text-blue-400" />
            Analysis Engine Parameters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded bg-[#1D283D]/40 border border-[#1F2937]">
              <div className="text-slate-400 font-mono text-[11px]">Primary Decision TF</div>
              <div className="text-white font-bold text-sm mt-1">M5 (5-Minute)</div>
              <div className="text-[10px] text-slate-500 mt-1">Default decision timeframe</div>
            </div>

            <div className="p-3 rounded bg-[#1D283D]/40 border border-[#1F2937]">
              <div className="text-slate-400 font-mono text-[11px]">Forecast Horizon</div>
              <div className="text-white font-bold text-sm mt-1">+18 to +28 Bars</div>
              <div className="text-[10px] text-slate-500 mt-1">Dynamic expansion path</div>
            </div>

            <div className="p-3 rounded bg-[#1D283D]/40 border border-[#1F2937]">
              <div className="text-slate-400 font-mono text-[11px]">Uncertainty Logic</div>
              <div className="text-white font-bold text-sm mt-1">NO TRADE Trigger</div>
              <div className="text-[10px] text-slate-500 mt-1">Refuses forced Buy/Sell</div>
            </div>
          </div>
        </div>

        {/* Section 3: Legal & Regulatory Architecture Notice */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-5 space-y-2">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm font-display">
            <Shield className="w-4 h-4 text-blue-400" />
            ARCHITECTURAL MANDATES & DISCLAIMER
          </div>
          <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
            <p>
              <strong>TradeXpulse</strong> is an AI Market Analyst and market-forecast visualization application built for market research, institutional structural analysis, and visual forecasting.
            </p>
            <p className="text-slate-400">
              <strong>Strict Scope Limitations:</strong> TradeXpulse is an AI Market Analyst application for market research and visual forecasting. All price series, analytical levels, and forecast paths presented in this build are simulated demonstration data for visualization and research purposes only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
