import React, { useState, useRef } from 'react';
import { PredictionStateProvider, usePredictionState } from './context/PredictionStateContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TimeframeToolbar } from './components/TimeframeToolbar';
import { TradingChart } from './components/TradingChart';
import { RightAiPanel } from './components/RightAiPanel';
import { BottomMetrics } from './components/BottomMetrics';
import { ResizeDivider } from './components/ResizeDivider';
import { Footer } from './components/Footer';
import { MarketOverview } from './components/MarketOverview';
import { MarketMapView } from './components/MarketMapView';
import { AiSignalsView } from './components/AiSignalsView';
import { SettingsView } from './components/SettingsView';
import { ExecutionView } from './components/ExecutionView';
import { StrategyBuilderView } from './components/strategy/StrategyBuilderView';
import { BacktestView } from './components/strategy/BacktestView';

const MainLayout: React.FC = () => {
  const { activeView, isChartFullscreen } = usePredictionState();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Height split percentage for the upper chart workspace (persisted across sessions)
  const [chartHeightPercent, setChartHeightPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradexpulse_chart_split');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 25 && val <= 85) return val;
      }
    } catch {
      // ignore
    }
    return 65; // default 65% chart, 35% bottom metrics
  });

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070B14] text-[#F8FAFC] overflow-hidden font-sans selection:bg-cyan-500/30">
      {/* 1. Header with Brand, Market Selector & System Badges (Hidden in Fullscreen) */}
      {!isChartFullscreen && <Header />}

      {/* Main Body with Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative z-10">
        {/* Left Navigation Sidebar (Hidden in Fullscreen) */}
        {!isChartFullscreen && <Sidebar />}

        {/* Workspace Central Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Primary Timeframe & Tooling Toolbar (Only on Dashboard/Chart view) */}
          {activeView === 'dashboard' && <TimeframeToolbar />}

          {/* Dynamic Content Area */}
          <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden relative">
            {activeView === 'dashboard' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Area: Central Chart & Right AI Panel */}
                <div 
                  style={{ height: isChartFullscreen ? '100%' : `${chartHeightPercent}%` }}
                  className="flex flex-col lg:flex-row overflow-hidden min-h-0 shrink-0 transition-[height] duration-75 ease-out"
                >
                  {/* Central Candlestick Chart with TradeXpulse Forecast & Market Structure */}
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <TradingChart />
                  </div>

                  {/* Right TradeXpulse AI Analyst Panel (Hidden in Fullscreen) */}
                  {!isChartFullscreen && (
                    <div className="w-full lg:w-[320px] xl:w-[350px] shrink-0 border-t lg:border-t-0 border-[#1B2537]">
                      <RightAiPanel />
                    </div>
                  )}
                </div>

                {/* Draggable Divider Line (Hidden in Fullscreen) */}
                {!isChartFullscreen && (
                  <ResizeDivider 
                    containerRef={containerRef}
                    chartHeightPercent={chartHeightPercent}
                    onHeightChange={setChartHeightPercent}
                    minChartPx={350}
                    minBottomPx={160}
                  />
                )}

                {/* Bottom Metrics Bar (Hidden in Fullscreen) */}
                {!isChartFullscreen && (
                  <div 
                    style={{ height: `${100 - chartHeightPercent}%` }}
                    className="overflow-x-auto overflow-y-auto min-h-0 flex-1"
                  >
                    <BottomMetrics />
                  </div>
                )}
              </div>
            )}

            {activeView === 'marketMap' && <MarketOverview />}

            {activeView === 'aiSignals' && <AiSignalsView />}

            {activeView === 'execution' && <ExecutionView />}

            {activeView === 'strategyBuilder' && <StrategyBuilderView />}

            {activeView === 'backtest' && <BacktestView />}

            {activeView === 'settings' && <SettingsView />}
          </div>
        </div>
      </div>

      {/* Footer Status Bar (Hidden in Fullscreen) */}
      {!isChartFullscreen && <Footer />}
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

