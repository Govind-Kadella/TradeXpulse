import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatHeaderDate, formatUtcTime } from '../../utils/timeUtils';

export const NewsPageHeader: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<string>(() => formatHeaderDate());
  const [currentTime, setCurrentTime] = useState<string>(() => formatUtcTime());

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDate(formatHeaderDate(now));
      setCurrentTime(formatUtcTime(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1B2537]">
      {/* Left: Title & Subtitle */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white font-sans">
          News & Calendar
        </h1>
        <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Stay informed with real-time market news and economic events. Understand the big picture and its impact on your trades.
        </p>
      </div>

      {/* Right: Live UTC Clock, Date & Tagline Quote */}
      <div className="flex items-center gap-3.5 self-start md:self-auto bg-[#0B101D] px-4 py-2.5 rounded-lg border border-[#1B2537] shadow-sm">
        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-cyan-400 shrink-0">
          <Clock className="w-4 h-4" />
        </div>

        <div className="flex flex-col text-right">
          <div className="flex items-center gap-1.5 justify-end text-xs text-slate-400 font-mono">
            <span>{currentDate}</span>
            <span className="text-slate-600">—</span>
            <span className="font-bold text-slate-200">{currentTime}</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
            <span className="italic text-slate-300">"Information moves markets."</span>
            <span className="text-cyan-400 font-semibold ml-1.5">— TradeXpulse</span>
          </div>
        </div>
      </div>
    </div>
  );
};
