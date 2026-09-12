import React from 'react';
import { TopNewsGrid } from './TopNewsGrid';
import { EconomicCalendarTable } from './EconomicCalendarTable';
import { MarketImpactPanel } from './MarketImpactPanel';
import { CurrencyFilterPanel } from './CurrencyFilterPanel';
import { UpcomingEventsTimeline } from './UpcomingEventsTimeline';
import { 
  EconomicEvent, 
  MarketNewsArticle, 
  ImpactLevel, 
  EventCategory 
} from '../../types';

interface MarketNewsWorkspaceProps {
  articles: MarketNewsArticle[];
  events: EconomicEvent[];
  impactEvents: EconomicEvent[];
  upcomingEvents: EconomicEvent[];
  selectedEventId: string | null;
  onSelectArticle: (article: MarketNewsArticle) => void;
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
  onViewAllNewsClick: () => void;
  onViewAllImpactClick: () => void;
  onViewAllUpcomingClick: () => void;
}

export const MarketNewsWorkspace: React.FC<MarketNewsWorkspaceProps> = ({
  articles,
  events,
  impactEvents,
  upcomingEvents,
  selectedEventId,
  onSelectArticle,
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
  onViewAllNewsClick,
  onViewAllImpactClick,
  onViewAllUpcomingClick,
}) => {
  return (
    <div className="flex flex-col gap-6">
      {/* 1. TOP NEWS ROW (4 Cards matching the uploaded screenshot) */}
      <TopNewsGrid
        articles={articles}
        onSelectArticle={onSelectArticle}
        onViewAllClick={onViewAllNewsClick}
      />

      {/* 2. MAIN 2-COLUMN SECTION: CALENDAR TABLE (LEFT) + RIGHT PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Economic Calendar (8 cols on large screens) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <EconomicCalendarTable
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={onSelectEvent}
            onOpenAlertModal={onOpenAlertModal}
            isAlertSet={isAlertSet}
            selectedCurrencies={selectedCurrencies}
            onCurrenciesChange={onCurrenciesChange}
            impactFilter={impactFilter}
            onImpactFilterChange={onImpactFilterChange}
            eventTypeFilter={eventTypeFilter}
            onEventTypeFilterChange={onEventTypeFilterChange}
            searchQuery={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
            dateRangeText={dateRangeText}
            onPrevDateRange={onPrevDateRange}
            onNextDateRange={onNextDateRange}
            onTodayClick={onTodayClick}
          />
        </div>

        {/* Right Column: 3 Panels (4 cols on large screens) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Panel A: Market Impact */}
          <MarketImpactPanel
            events={impactEvents}
            onSelectEvent={onSelectEvent}
            onViewAllClick={onViewAllImpactClick}
          />

          {/* Panel B: Currency Filter */}
          <CurrencyFilterPanel
            selectedCurrencies={selectedCurrencies}
            onCurrenciesChange={onCurrenciesChange}
          />

          {/* Panel C: Upcoming Events Timeline */}
          <UpcomingEventsTimeline
            events={upcomingEvents}
            onSelectEvent={onSelectEvent}
            onViewAllClick={onViewAllUpcomingClick}
          />
        </div>
      </div>
    </div>
  );
};
