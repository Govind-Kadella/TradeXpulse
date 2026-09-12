import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Bell, 
  ChevronDown, 
  X,
  Filter
} from 'lucide-react';
import { 
  EconomicEvent, 
  ImpactLevel, 
  EventCategory 
} from '../../types';

interface EconomicCalendarTableProps {
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
  dateRangeText: string;
  onPrevDateRange: () => void;
  onNextDateRange: () => void;
  onTodayClick: () => void;
}

export const EconomicCalendarTable: React.FC<EconomicCalendarTableProps> = ({
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
  dateRangeText,
  onPrevDateRange,
  onNextDateRange,
  onTodayClick,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Visual Impact Indicator Bars matching the uploaded screenshot:
  // High = 3 red bars
  // Medium = 2 amber bars
  // Low = 1 blue bar
  const renderImpactBars = (impact: ImpactLevel) => {
    return (
      <div className="flex items-center gap-0.5" title={`Impact: ${impact}`}>
        <span className={`w-1 h-3 rounded-xs ${impact === 'HIGH' ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`} />
        <span className={`w-1 h-3 rounded-xs ${impact === 'HIGH' ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : impact === 'MEDIUM' ? 'bg-amber-500' : 'bg-slate-700/50'}`} />
        <span className={`w-1 h-3 rounded-xs ${impact === 'HIGH' ? 'bg-red-500 shadow-[0_0_4px_#ef4444]' : 'bg-slate-700/50'}`} />
      </div>
    );
  };

  // Pagination calculation
  const totalEvents = events.length;
  const totalPages = Math.max(1, Math.ceil(totalEvents / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentEvents = events.slice(startIndex, startIndex + pageSize);

  return (
    <div className="flex flex-col rounded-xl bg-[#0B101D] border border-[#1B2537] overflow-hidden shadow-sm">
      {/* Top Header: Section Title + Date Range Selector */}
      <div className="p-3.5 border-b border-[#1B2537] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0D1424]">
        <h2 className="text-base font-bold text-white font-sans tracking-tight">
          Economic Calendar
        </h2>

        {/* Date Range Selector & Nav Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111A2B] border border-[#1B2537] text-xs font-mono text-slate-200">
            <CalendarIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>{dateRangeText}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              id="calendar-prev-btn"
              onClick={onPrevDateRange}
              title="Previous Range"
              className="p-1.5 rounded-md hover:bg-[#152033] border border-[#1B2537] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              id="calendar-next-btn"
              onClick={onNextDateRange}
              title="Next Range"
              className="p-1.5 rounded-md hover:bg-[#152033] border border-[#1B2537] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            id="calendar-today-btn"
            onClick={onTodayClick}
            className="px-2.5 py-1.5 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-cyan-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filter Bar: Currencies, Impact, Event Types, Search Input */}
      <div className="p-3 border-b border-[#1B2537] bg-[#090E1A] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Dropdown Selector */}
          <div className="relative">
            <select
              id="calendar-currency-filter"
              value={selectedCurrencies.length === 1 ? selectedCurrencies[0] : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') {
                  onCurrenciesChange([]);
                } else {
                  onCurrenciesChange([val]);
                }
              }}
              className="appearance-none bg-[#111A2B] hover:bg-[#152033] border border-[#1B2537] text-xs font-medium text-slate-200 pl-3 pr-7 py-1.5 rounded-lg cursor-pointer outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Currencies</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="JPY">JPY — Japanese Yen</option>
              <option value="AUD">AUD — Australian Dollar</option>
              <option value="CAD">CAD — Canadian Dollar</option>
              <option value="CHF">CHF — Swiss Franc</option>
              <option value="NZD">NZD — New Zealand Dollar</option>
              <option value="CNY">CNY — Chinese Yuan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Impact Level Selector */}
          <div className="relative">
            <select
              id="calendar-impact-filter"
              value={impactFilter}
              onChange={(e) => onImpactFilterChange(e.target.value as ImpactLevel | 'ALL')}
              className="appearance-none bg-[#111A2B] hover:bg-[#152033] border border-[#1B2537] text-xs font-medium text-slate-200 pl-3 pr-7 py-1.5 rounded-lg cursor-pointer outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Impact Levels</option>
              <option value="HIGH">High Impact Only</option>
              <option value="MEDIUM">Medium Impact</option>
              <option value="LOW">Low Impact</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>

          {/* Event Type Selector */}
          <div className="relative">
            <select
              id="calendar-event-type-filter"
              value={eventTypeFilter}
              onChange={(e) => onEventTypeFilterChange(e.target.value as EventCategory | 'ALL')}
              className="appearance-none bg-[#111A2B] hover:bg-[#152033] border border-[#1B2537] text-xs font-medium text-slate-200 pl-3 pr-7 py-1.5 rounded-lg cursor-pointer outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Event Types</option>
              <option value="CENTRAL_BANK">Central Banks / Speeches</option>
              <option value="INFLATION">Inflation / CPI</option>
              <option value="EMPLOYMENT">Employment / NFP</option>
              <option value="GDP">GDP / Economic Growth</option>
              <option value="MANUFACTURING">Manufacturing / Orders</option>
              <option value="HOUSING">Housing Market</option>
              <option value="CONSUMER">Consumer Sentiment</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Search Events Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            id="calendar-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search events..."
            className="w-full bg-[#111A2B] border border-[#1B2537] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2 top-2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#1B2537] bg-[#0A0F1D] text-slate-400 font-mono text-[11px] select-none">
              <th className="py-2.5 px-3 font-semibold">Time (UTC)</th>
              <th className="py-2.5 px-3 font-semibold">Currency</th>
              <th className="py-2.5 px-3 font-semibold">Impact</th>
              <th className="py-2.5 px-3 font-semibold">Event</th>
              <th className="py-2.5 px-3 font-semibold text-right">Actual</th>
              <th className="py-2.5 px-3 font-semibold text-right">Forecast</th>
              <th className="py-2.5 px-3 font-semibold text-right">Previous</th>
              <th className="py-2.5 px-3 font-semibold text-center w-12">Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#152033]">
            {currentEvents.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="w-6 h-6 text-slate-600" />
                    <span className="text-xs font-semibold">No economic events match your current filters.</span>
                    <button
                      onClick={() => {
                        onCurrenciesChange([]);
                        onImpactFilterChange('ALL');
                        onEventTypeFilterChange('ALL');
                        onSearchQueryChange('');
                      }}
                      className="text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      Reset filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentEvents.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                const hasAlert = isAlertSet(evt.id);

                return (
                  <tr
                    key={evt.id}
                    id={`calendar-row-${evt.id}`}
                    onClick={() => onSelectEvent(evt)}
                    className={`group transition-colors cursor-pointer select-none font-sans ${
                      isSelected
                        ? 'bg-blue-600/15 border-l-2 border-l-cyan-400 text-white'
                        : 'hover:bg-[#111A2B]/80 text-slate-300'
                    }`}
                  >
                    {/* Time (UTC) */}
                    <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-slate-400 group-hover:text-slate-200">
                      <span>{evt.date.split('-').slice(1).join('/')} </span>
                      <span className="font-semibold text-slate-300">{evt.timeUtc}</span>
                    </td>

                    {/* Currency */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-200">
                        <span className="text-sm">{evt.flag}</span>
                        <span>{evt.currency}</span>
                      </div>
                    </td>

                    {/* Impact Bars */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {renderImpactBars(evt.impact)}
                    </td>

                    {/* Event Name */}
                    <td className="py-2.5 px-3 font-medium text-slate-100 group-hover:text-cyan-300 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-xs md:max-w-md">{evt.event}</span>
                        {isSelected && (
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            SELECTED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actual */}
                    <td className="py-2.5 px-3 font-mono text-right text-slate-400">
                      {evt.actual ? (
                        <span className="font-bold text-emerald-400">{evt.actual}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>

                    {/* Forecast */}
                    <td className="py-2.5 px-3 font-mono text-right text-slate-400">
                      {evt.forecast ? (
                        <span>{evt.forecast}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>

                    {/* Previous */}
                    <td className="py-2.5 px-3 font-mono text-right text-slate-400">
                      {evt.previous ? (
                        <span>{evt.previous}</span>
                      ) : (
                        <span className="text-slate-600">--</span>
                      )}
                    </td>

                    {/* Alert Button */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        id={`alert-btn-${evt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAlertModal(evt);
                        }}
                        title={hasAlert ? "Alert Active (Click to edit)" : "Set Event Alert"}
                        className={`p-1 rounded hover:bg-[#152033] transition-colors cursor-pointer ${
                          hasAlert ? 'text-amber-400' : 'text-slate-500 hover:text-slate-200'
                        }`}
                      >
                        <Bell className={`w-3.5 h-3.5 ${hasAlert ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{totalEvents === 0 ? 0 : startIndex + 1}</span> to{' '}
          <span className="font-semibold text-slate-200">{Math.min(startIndex + pageSize, totalEvents)}</span> of{' '}
          <span className="font-semibold text-slate-200">{totalEvents}</span> events
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="p-1 rounded hover:bg-[#152033] disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-6 h-6 rounded text-xs font-mono font-semibold transition-colors ${
                safePage === pageNum
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-[#152033]'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="p-1 rounded hover:bg-[#152033] disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
