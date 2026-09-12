import React, { useState, useEffect } from 'react';
import { EconomicEvent } from '../../types';
import { formatCountdown } from '../../utils/timeUtils';

interface UpcomingEventsTimelineProps {
  events: EconomicEvent[];
  onSelectEvent: (event: EconomicEvent) => void;
  onViewAllClick?: () => void;
}

export const UpcomingEventsTimeline: React.FC<UpcomingEventsTimelineProps> = ({
  events,
  onSelectEvent,
  onViewAllClick,
}) => {
  const [, setTick] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col rounded-xl bg-[#0B101D] border border-[#1B2537] p-3.5 shadow-sm">
      {/* Header: Title + View All */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]/80">
        <h3 className="text-sm font-bold text-white tracking-tight font-sans">
          Upcoming Events
        </h3>
        {onViewAllClick && (
          <button
            id="view-all-upcoming-events-btn"
            onClick={onViewAllClick}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
          >
            View All
          </button>
        )}
      </div>

      {/* Vertical Timeline */}
      <div className="mt-3 relative pl-1">
        {events.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            No upcoming events matching filter.
          </div>
        ) : (
          <div className="space-y-4 relative">
            {/* Continuous Vertical Timeline Line */}
            <div className="absolute left-[62px] top-2.5 bottom-2.5 w-[2px] bg-[#1F2C42]" />

            {events.slice(0, 5).map((evt) => {
              const countdown = formatCountdown(evt.timestamp);

              return (
                <div
                  key={evt.id}
                  id={`upcoming-timeline-item-${evt.id}`}
                  onClick={() => onSelectEvent(evt)}
                  className="group flex items-start gap-3.5 relative cursor-pointer"
                >
                  {/* Left: Dynamic Countdown */}
                  <div className="w-[52px] text-right font-mono text-[11px] font-bold text-slate-300 pt-0.5 shrink-0">
                    {countdown}
                  </div>

                  {/* Center: Timeline Node Dot */}
                  <div className="relative z-10 flex items-center justify-center pt-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0B101D] shadow-[0_0_8px_#ef4444] group-hover:scale-125 transition-transform" />
                  </div>

                  {/* Right: Event Info & Currency */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                          {evt.event}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] font-bold text-red-400 font-mono tracking-wider uppercase">
                            HIGH IMPACT
                          </span>
                        </div>
                      </div>

                      {/* Affected Currency */}
                      <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                        {evt.currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
