import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Download, 
  Filter, 
  Bell, 
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { EconomicEvent, ImpactLevel, EventCategory } from '../../types';
import { formatCountdown } from '../../utils/timeUtils';

interface EconomicCalendarWorkspaceProps {
  events: EconomicEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: EconomicEvent) => void;
  onOpenAlertModal: (event: EconomicEvent) => void;
  isAlertSet: (eventId: string) => boolean;
  selectedCurrencies: string[];
  onCurrenciesChange: (currencies: string[]) => void;
  impactFilter: ImpactLevel | 'ALL';
  onImpactFilterChange: (impact: ImpactLevel | 'ALL') => void;
  eventTypeFilter: EventCategory | 'ALL';
  onEventTypeFilterChange: (eventType: EventCategory | 'ALL') => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export const EconomicCalendarWorkspace: React.FC<EconomicCalendarWorkspaceProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onOpenAlertModal,
  isAlertSet,
  selectedCurrencies,
  onCurrenciesChange,
  impactFilter,
  onImpactFilterChange,
  eventTypeFilter,
  onEventTypeFilterChange,
  searchQuery,
  onSearchQueryChange,
}) => {
  const [selectedDayTab, setSelectedDayTab] = useState<string>('ALL');

  // Days present in the dataset
  const uniqueDates = Array.from(new Set(events.map(e => e.date))) as string[];
  uniqueDates.sort();

  const filteredByDay = selectedDayTab === 'ALL' 
    ? events 
    : events.filter(e => e.date === selectedDayTab);

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'TimeUTC', 'Currency', 'Impact', 'Event', 'Actual', 'Forecast', 'Previous'];
    const rows = filteredByDay.map(e => [
      e.id,
      e.date,
      e.timeUtc,
      e.currency,
      e.impact,
      `"${e.event.replace(/"/g, '""')}"`,
      e.actual || '',
      e.forecast || '',
      e.previous || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TradeXpulse_Economic_Calendar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Banner & Control Strip */}
      <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white font-sans">
            Full Economic Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Institutional macro data release schedule, forecasts, historical deviations, and affected instruments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111A2B] hover:bg-[#152033] border border-[#1B2537] text-xs font-semibold text-cyan-300 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Day-by-Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDayTab('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            selectedDayTab === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-[#0E1626] text-slate-400 hover:text-white border border-[#1B2537]'
          }`}
        >
          All Days ({events.length})
        </button>

        {uniqueDates.map(date => {
          const count = events.filter(e => e.date === date).length;
          const d = new Date(date);
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
          const label = `${dayName} ${date.split('-').slice(1).join('/')}`;

          return (
            <button
              key={date}
              onClick={() => setSelectedDayTab(date)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedDayTab === date
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#0E1626] text-slate-400 hover:text-white border border-[#1B2537]'
              }`}
            >
              <span>{label}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-black/40 text-slate-300">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Expanded Table */}
      <div className="rounded-xl bg-[#0B101D] border border-[#1B2537] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#1B2537] bg-[#0A0F1D] text-slate-400 font-mono text-[11px] select-none">
                <th className="py-3 px-4 font-semibold">Time (UTC)</th>
                <th className="py-3 px-3 font-semibold">Currency</th>
                <th className="py-3 px-3 font-semibold">Impact</th>
                <th className="py-3 px-4 font-semibold">Event Description</th>
                <th className="py-3 px-3 font-semibold text-right">Actual</th>
                <th className="py-3 px-3 font-semibold text-right">Forecast</th>
                <th className="py-3 px-3 font-semibold text-right">Previous</th>
                <th className="py-3 px-4 font-semibold">TradeXpulse Instruments</th>
                <th className="py-3 px-3 font-semibold text-center w-14">Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#152033]">
              {filteredByDay.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No economic events found for this day or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredByDay.map(evt => {
                  const isSelected = selectedEventId === evt.id;
                  const hasAlert = isAlertSet(evt.id);

                  return (
                    <tr
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className={`group transition-colors cursor-pointer select-none ${
                        isSelected 
                          ? 'bg-blue-600/15 border-l-2 border-l-cyan-400 text-white' 
                          : 'hover:bg-[#111A2B]/80 text-slate-300'
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap text-slate-400 group-hover:text-slate-200">
                        <span>{evt.date} </span>
                        <span className="font-bold text-slate-200">{evt.timeUtc}</span>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-200">
                          <span className="text-sm">{evt.flag}</span>
                          <span>{evt.currency}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase font-mono ${
                          evt.impact === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          evt.impact === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        }`}>
                          {evt.impact}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-100 group-hover:text-cyan-300 transition-colors">
                        <div className="truncate max-w-sm">{evt.event}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-xs">{evt.category}</div>
                      </td>

                      <td className="py-3 px-3 font-mono text-right text-slate-400">
                        {evt.actual ? <span className="font-bold text-emerald-400">{evt.actual}</span> : '--'}
                      </td>

                      <td className="py-3 px-3 font-mono text-right text-slate-400">
                        {evt.forecast || '--'}
                      </td>

                      <td className="py-3 px-3 font-mono text-right text-slate-400">
                        {evt.previous || '--'}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 flex-wrap">
                          {evt.affectedInstruments.map(inst => (
                            <span key={inst} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#131E35] text-cyan-300 border border-cyan-500/20">
                              {inst}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenAlertModal(evt);
                          }}
                          className={`p-1 rounded hover:bg-[#152033] transition-colors cursor-pointer ${
                            hasAlert ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'
                          }`}
                        >
                          <Bell className={`w-3.5 h-3.5 ${hasAlert ? 'fill-amber-400' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
