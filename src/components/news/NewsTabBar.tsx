import React from 'react';
import { 
  Newspaper, 
  Calendar, 
  Target, 
  Sparkles, 
  SlidersHorizontal 
} from 'lucide-react';

export type NewsTabType = 'marketNews' | 'economicCalendar' | 'eventAnalysis' | 'aiInsights' | 'newsSettings';

interface NewsTabBarProps {
  activeTab: NewsTabType;
  onTabChange: (tab: NewsTabType) => void;
}

export const NewsTabBar: React.FC<NewsTabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: NewsTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'marketNews', label: 'Market News', icon: Newspaper },
    { id: 'economicCalendar', label: 'Economic Calendar', icon: Calendar },
    { id: 'eventAnalysis', label: 'Event Analysis', icon: Target },
    { id: 'aiInsights', label: 'AI Insights', icon: Sparkles },
    { id: 'newsSettings', label: 'News Settings', icon: SlidersHorizontal },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            id={`news-tab-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-blue-600/20 border border-blue-500/50 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#111A2B] border border-transparent'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
            )}
          </button>
        );
      })}
    </div>
  );
};
