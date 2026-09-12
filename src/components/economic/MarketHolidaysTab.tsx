import React, { useState, useEffect } from 'react';
import { CalendarDays, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { MarketHolidayItem } from '../../types';
import { DefaultEconomicDataProvider } from '../../services/economicDataProvider';

export const MarketHolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<MarketHolidayItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const provider = DefaultEconomicDataProvider.getInstance();
    provider.getMarketHolidays().then((data) => {
      setHolidays(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-mono">
        Loading Global Financial Market Holidays...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header Notice */}
      <div className="p-3 bg-blue-950/20 border border-blue-500/25 rounded-xl flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            During exchange closures, physical equity trading halts. Forex and Crypto markets remain active 24/7 with potential spread widening and reduced liquidity during Tokyo, London, and New York holidays.
          </span>
        </div>
      </div>

      {/* Holidays Table */}
      <div className="bg-[#0D1424] border border-[#1A253C] rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#1A253C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Upcoming Global Market Holidays & Early Closes
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {holidays.length} Upcoming Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#090E1A] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1A253C]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Country / Market</th>
                <th className="py-2.5 px-3">Holiday Observance</th>
                <th className="py-2.5 px-3 text-center">Market Status</th>
                <th className="py-2.5 px-3">Affected Instruments & Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151F33]">
              {holidays.map((h) => (
                <tr key={h.id} className="text-slate-300 hover:bg-[#121B2D] hover:text-white transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-300 text-xs">
                    {h.date}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{h.flag}</span>
                      <div>
                        <div className="font-semibold text-slate-200">{h.market}</div>
                        <div className="text-[10px] text-slate-500">{h.country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium">
                    {h.holiday}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        h.status === 'CLOSED'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : h.status === 'EARLY_CLOSE'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      }`}
                    >
                      {h.status === 'CLOSED'
                        ? 'Market Closed'
                        : h.status === 'EARLY_CLOSE'
                        ? 'Early Close'
                        : 'Banks Closed'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                    {h.affectedInstruments}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
