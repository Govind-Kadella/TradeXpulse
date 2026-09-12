import React, { useState, useMemo, useCallback } from 'react';
import { NewsPageHeader } from './news/NewsPageHeader';
import { NewsTabBar, NewsTabType } from './news/NewsTabBar';
import { MarketNewsWorkspace } from './news/MarketNewsWorkspace';
import { EconomicCalendarWorkspace } from './news/EconomicCalendarWorkspace';
import { EventAnalysisWorkspace } from './news/EventAnalysisWorkspace';
import { AiInsightsWorkspace } from './news/AiInsightsWorkspace';
import { NewsSettingsWorkspace } from './news/NewsSettingsWorkspace';
import { EventDetailModal } from './news/EventDetailModal';
import { NewsArticleDetailModal } from './news/NewsArticleDetailModal';
import { SetAlertModal } from './news/SetAlertModal';

import { EconomicCalendarService } from '../services/economicCalendarService';
import { MarketNewsProvider } from '../services/marketNewsProvider';
import { 
  EconomicEvent, 
  MarketNewsArticle, 
  ImpactLevel, 
  EventCategory 
} from '../types';

export const NewsCalendarView: React.FC = () => {
  const calendarService = EconomicCalendarService.getInstance();
  const newsProvider = MarketNewsProvider.getInstance();

  // Tab State
  const [activeTab, setActiveTab] = useState<NewsTabType>('marketNews');

  // Filter States
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [impactFilter, setImpactFilter] = useState<ImpactLevel | 'ALL'>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Date Range State matching the screenshot (24 Aug 2026 — 30 Aug 2026)
  const [dateRangeText, setDateRangeText] = useState<string>('24 Aug 2026 — 30 Aug 2026');

  // Selection & Modal States
  // Selected event defaults to Fed Chair Powell Speech as highlighted in screenshot
  const [selectedEventId, setSelectedEventId] = useState<string | null>('evt_fed_powell_speech');
  const [articleModalTarget, setArticleModalTarget] = useState<MarketNewsArticle | null>(null);
  const [eventModalTarget, setEventModalTarget] = useState<EconomicEvent | null>(null);
  const [alertModalTarget, setAlertModalTarget] = useState<EconomicEvent | null>(null);

  // Trigger re-renders when alerts change
  const [alertVersion, setAlertVersion] = useState<number>(0);

  // Data queries
  const allArticles = useMemo(() => {
    return newsProvider.getArticles({
      category: 'ALL',
      currencies: selectedCurrencies,
      impact: impactFilter,
      searchQuery: searchQuery
    });
  }, [newsProvider, selectedCurrencies, impactFilter, searchQuery]);

  const allEvents = useMemo(() => {
    return calendarService.getEvents({
      currencies: selectedCurrencies,
      impact: impactFilter,
      eventType: eventTypeFilter,
      searchQuery: searchQuery
    });
  }, [calendarService, selectedCurrencies, impactFilter, eventTypeFilter, searchQuery]);

  const impactEvents = useMemo(() => {
    return calendarService.getMarketImpactEvents(5, selectedCurrencies);
  }, [calendarService, selectedCurrencies]);

  const upcomingEvents = useMemo(() => {
    return calendarService.getUpcomingHighImpactEvents(5, selectedCurrencies);
  }, [calendarService, selectedCurrencies]);

  const selectedEventObj = useMemo(() => {
    if (!selectedEventId) return allEvents[0] || null;
    return calendarService.getEventById(selectedEventId) || allEvents[0] || null;
  }, [calendarService, selectedEventId, allEvents]);

  // Alert check callback
  const isAlertSet = useCallback((eventId: string) => {
    return calendarService.isAlertSet(eventId);
  }, [calendarService, alertVersion]);

  // Handlers
  const handleSelectEvent = (event: EconomicEvent) => {
    setSelectedEventId(event.id);
    setEventModalTarget(event);
  };

  const handleOpenAlertModal = (event: EconomicEvent) => {
    setAlertModalTarget(event);
  };

  const handleAlertSaved = () => {
    setAlertVersion(v => v + 1);
  };

  const handlePrevDateRange = () => {
    setDateRangeText('17 Aug 2026 — 23 Aug 2026');
  };

  const handleNextDateRange = () => {
    setDateRangeText('31 Aug 2026 — 06 Sep 2026');
  };

  const handleTodayClick = () => {
    setDateRangeText('24 Aug 2026 — 30 Aug 2026');
  };

  return (
    <div className="flex-1 bg-[#060A14] min-h-screen text-slate-100 p-4 sm:p-6 lg:p-7 space-y-5 overflow-y-auto">
      {/* 1. Page Header */}
      <NewsPageHeader />

      {/* 2. Navigation Tab Bar */}
      <NewsTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Main Tab Workspaces */}
      {activeTab === 'marketNews' && (
        <MarketNewsWorkspace
          articles={allArticles}
          events={allEvents}
          impactEvents={impactEvents}
          upcomingEvents={upcomingEvents}
          selectedEventId={selectedEventId}
          onSelectArticle={setArticleModalTarget}
          onSelectEvent={handleSelectEvent}
          onOpenAlertModal={handleOpenAlertModal}
          isAlertSet={isAlertSet}
          selectedCurrencies={selectedCurrencies}
          onCurrenciesChange={setSelectedCurrencies}
          impactFilter={impactFilter}
          onImpactFilterChange={setImpactFilter}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={setEventTypeFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          dateRangeText={dateRangeText}
          onPrevDateRange={handlePrevDateRange}
          onNextDateRange={handleNextDateRange}
          onTodayClick={handleTodayClick}
          onViewAllNewsClick={() => setActiveTab('marketNews')}
          onViewAllImpactClick={() => setActiveTab('eventAnalysis')}
          onViewAllUpcomingClick={() => setActiveTab('economicCalendar')}
        />
      )}

      {activeTab === 'economicCalendar' && (
        <EconomicCalendarWorkspace
          events={allEvents}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          onOpenAlertModal={handleOpenAlertModal}
          isAlertSet={isAlertSet}
          selectedCurrencies={selectedCurrencies}
          onCurrenciesChange={setSelectedCurrencies}
          impactFilter={impactFilter}
          onImpactFilterChange={setImpactFilter}
          eventTypeFilter={eventTypeFilter}
          onEventTypeFilterChange={setEventTypeFilter}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />
      )}

      {activeTab === 'eventAnalysis' && (
        <EventAnalysisWorkspace
          events={allEvents}
          selectedEvent={selectedEventObj}
          onSelectEvent={(evt) => setSelectedEventId(evt.id)}
          onOpenAlertModal={handleOpenAlertModal}
          hasAlert={selectedEventObj ? isAlertSet(selectedEventObj.id) : false}
        />
      )}

      {activeTab === 'aiInsights' && (
        <AiInsightsWorkspace />
      )}

      {activeTab === 'newsSettings' && (
        <NewsSettingsWorkspace />
      )}

      {/* 4. Modals */}
      <EventDetailModal
        event={eventModalTarget}
        onClose={() => setEventModalTarget(null)}
        onOpenAlertModal={handleOpenAlertModal}
        hasAlert={eventModalTarget ? isAlertSet(eventModalTarget.id) : false}
      />

      <NewsArticleDetailModal
        article={articleModalTarget}
        onClose={() => setArticleModalTarget(null)}
      />

      <SetAlertModal
        event={alertModalTarget}
        onClose={() => setAlertModalTarget(null)}
        onAlertSaved={handleAlertSaved}
      />
    </div>
  );
};
