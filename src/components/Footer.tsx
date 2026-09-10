import React, { useState, useEffect } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';

export const Footer: React.FC = () => {
  const { connectionStatus, marketDataStatus } = usePredictionState();
  const [currentTime, setCurrentTime] = useState<string>('12:28:34 (UTC)');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const mins = String(now.getUTCMinutes()).padStart(2, '0');
      const secs = String(now.getUTCSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${mins}:${secs} (UTC)`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isLive = connectionStatus === 'LIVE' || marketDataStatus.connectionStatus === 'LIVE';

  return (
    <footer 
      id="app-bottom-status-bar"
      className="h-7 border-t border-[#1B2537] bg-[#080D18] px-4 flex items-center justify-between text-[10px] text-slate-400 select-none shrink-0 z-30 font-sans"
    >
      {/* Left: Brand Copyright */}
      <div className="flex items-center gap-2">
        <span className="font-extrabold tracking-wider text-slate-200 uppercase font-mono text-[9.5px]">
          TRADEXPULSE
        </span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400">
          © 2026 TradeXpulse. All rights reserved.
        </span>
      </div>

      {/* Right: Telemetry & Live UTC Clock */}
      <div className="flex items-center gap-3.5 font-mono text-[9.5px]">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]' : 'bg-amber-400'}`} />
          <span className="text-slate-300">Data: <strong className={isLive ? 'text-emerald-400' : 'text-amber-400'}>{isLive ? 'Live' : 'Simulated'}</strong></span>
        </div>

        <span className="text-slate-700">•</span>

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_#38bdf8]" />
          <span className="text-slate-300">AI Engine: <strong className="text-cyan-400">Active</strong></span>
        </div>

        <span className="text-slate-700">•</span>

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="text-slate-300">System: <strong className="text-slate-200">Normal</strong></span>
        </div>

        <span className="text-slate-700">•</span>

        <span className="text-slate-300 font-bold bg-[#111A2B] px-2 py-0.5 rounded border border-[#1F2B3E]">
          {currentTime}
        </span>
      </div>
    </footer>
  );
};
