import React from 'react';
import { PredictionStateProvider, usePredictionState } from './context/PredictionStateContext';
import { Header } from './components/Header';
import { TimeframeToolbar } from './components/TimeframeToolbar';
import { TradingChart } from './components/TradingChart';
import { RightAiPanel } from './components/RightAiPanel';
import { BottomMetrics } from './components/BottomMetrics';
import { MarketMapView } from './components/MarketMapView';
import { SettingsView } from './components/SettingsView';

const MainLayout: React.FC = () => {
  const { activeView } = usePredictionState();

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0A0E17] text-[#F8FAFC] overflow-hidden font-sans selection:bg-blue-500/30">
      {/* 1. Header with Brand, Market Selector & System Badges */}
      <Header />

      {/* 2. Primary Timeframe & Tooling Toolbar */}
      <TimeframeToolbar />

      {/* 3. Main Dynamic Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {activeView === 'dashboard' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Main Stage: Central Chart & Right AI Panel */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
              {/* Central Candlestick Chart with TradeXpulse Forecast Overlay */}
              <div className="flex-1 flex flex-col min-h-[360px] lg:min-h-0 overflow-hidden">
                <TradingChart />
              </div>

              {/* Right TradeXpulse AI Analyst Panel */}
              <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 border-t lg:border-t-0 border-[#1F2937]">
                <RightAiPanel />
              </div>
            </div>

            {/* Bottom 4 Clean Information Cards */}
            <div className="shrink-0 overflow-x-auto">
              <BottomMetrics />
            </div>
          </div>
        )}

        {activeView === 'marketMap' && <MarketMapView />}

        {activeView === 'settings' && <SettingsView />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <PredictionStateProvider>
      <MainLayout />
    </PredictionStateProvider>
  );
}
