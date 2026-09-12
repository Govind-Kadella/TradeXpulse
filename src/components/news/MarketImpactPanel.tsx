import React, { useState, useEffect } from 'react';
import { ArrowRight, Flame } from 'lucide-react';
import { EconomicEvent } from '../../types';
import { formatCountdown } from '../../utils/timeUtils';

interface MarketImpactPanelProps {
  events: EconomicEvent[];
  onSelectEvent: (event: EconomicEvent) => void;
  onViewAllClick?: () => void;
}

export const MarketImpactPanel: React.FC<MarketImpactPanelProps> = ({
  events,
  onSelectEvent,
  onViewAllClick,
}) => {
  const [, setTick] = useState<number>(0);

  // Re-render every second so countdowns tick smoothly
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col rounded-xl bg-[#0B101D] border border-[#1B2537] p-3.5 shadow-sm">
      {/* Panel Header: Title + View All */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]/80">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
          <span>Market Impact</span>
        </h3>
        {onViewAllClick && (
          <button
            id="view-all-market-impact-btn"
            onClick={onViewAllClick}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            View All
          </button>
        )}
      </div>

      {/* High-Impact Events List */}
      <div className="mt-3 space-y-2.5">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No high-impact events pending for selected currencies.
          </div>
        ) : (
          events.slice(0, 5).map((evt) => {
            const countdown = formatCountdown(evt.timestamp);

            return (
              <div
                key={evt.id}
                id={`market-impact-item-${evt.id}`}
                onClick={() => onSelectEvent(evt)}
                className="group p-2.5 rounded-lg bg-[#0E1526] hover:bg-[#131D33] border border-[#1A253A] hover:border-cyan-500/40 transition-all cursor-pointer flex items-center justify-between gap-2"
              >
                {/* Left: Flag/Emblem + Event Name + Currency */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-[#131E35] border border-blue-500/20 flex items-center justify-center text-base shrink-0">
                    {evt.flag}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                      {evt.event}
                    </h4>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {evt.currency}
                    </div>
                  </div>
                </div>

                {/* Right: High Impact Tag + Countdown */}
                <div className="flex flex-col items-end shrink-0 gap-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide">
                    High
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-200">
                    {countdown}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
