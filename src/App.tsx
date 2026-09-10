import React, { useState, useEffect, useRef } from 'react';
import { PredictionStateProvider, usePredictionState } from './context/PredictionStateContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { TimeframeToolbar } from './components/TimeframeToolbar';
import { TradingChart } from './components/TradingChart';
import { RightAiPanel } from './components/RightAiPanel';
import { BottomMetrics } from './components/BottomMetrics';
import { Footer } from './components/Footer';
import { MarketMapView } from './components/MarketMapView';
import { SettingsView } from './components/SettingsView';
import { ExecutionView } from './components/ExecutionView';

const MainLayout: React.FC = () => {
  const { activeView, isChartFullscreen } = usePredictionState();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Height split percentage for the upper chart workspace (persisted across sessions)
  const [chartHeightPercent, setChartHeightPercent] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tradexpulse_chart_split');
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 30 && val <= 85) return val;
      }
    } catch {
      // ignore
    }
    return 65; // default 65% chart, 35% bottom metrics
  });

  const [isResizing, setIsResizing] = useState<boolean>(false);

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = rect.height;
      if (totalH <= 0) return;

      const currentY = clientY - rect.top;
      const newPercent = (currentY / totalH) * 100;

      // Ensure minimum usable chart height (350px) and bottom panel height (160px)
      const minPercent = Math.max(28, (350 / totalH) * 100);
      const maxPercent = Math.min(85, ((totalH - 160) / totalH) * 100);

      const clamped = Math.max(minPercent, Math.min(maxPercent, newPercent));
      setChartHeightPercent(clamped);
      try {
        localStorage.setItem('tradexpulse_chart_split', clamped.toFixed(1));
      } catch {
        // ignore
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientY);
      }
    };

    const onEnd = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMoveThrottled);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', handleTouchThrottled, { passive: false });
    window.addEventListener('touchend', onEnd);

    function handleMoveThrottled(e: MouseEvent) {
      onMouseMove(e);
    }
    function handleTouchThrottled(e: TouchEvent) {
      e.preventDefault();
      onTouchMove(e);
    }

    return () => {
      window.removeEventListener('mousemove', handleMoveThrottled);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', handleTouchThrottled);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isResizing]);

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#070B14] text-[#F8FAFC] overflow-hidden font-sans selection:bg-cyan-500/30 ${isResizing ? 'cursor-row-resize select-none' : ''}`}>
      {/* 1. Header with Brand, Market Selector & System Badges (Hidden in Fullscreen) */}
      {!isChartFullscreen && <Header />}

      {/* Main Body with Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        {/* Left Navigation Sidebar (Hidden in Fullscreen) */}
        {!isChartFullscreen && <Sidebar />}

        {/* Workspace Central Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Primary Timeframe & Tooling Toolbar */}
          <TimeframeToolbar />

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
                  <div
                    id="chart-bottom-resizer"
                    onMouseDown={handleResizeStart}
                    onTouchStart={handleResizeStart}
                    className="relative w-full h-[9px] -my-[4px] cursor-row-resize flex items-center select-none shrink-0 z-10 group bg-transparent"
                  >
                    {/* The ONLY visible element: ONE simple thin horizontal line */}
                    <div className="w-full h-px bg-[#1B2537] group-hover:bg-[#2E405E] group-active:bg-cyan-500/70 transition-colors pointer-events-none" />
                  </div>
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

            {activeView === 'marketMap' && <MarketMapView />}

            {activeView === 'execution' && <ExecutionView />}

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

