import React, { useState } from 'react';
import { 
  BarChart3, 
  Compass, 
  Zap, 
  Bookmark, 
  Calendar, 
  Database, 
  Sliders, 
  History, 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Crown,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { usePredictionState } from '../context/PredictionStateContext';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: 'dashboard' | 'marketMap' | 'execution' | 'settings';
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'chart', label: 'Chart', icon: BarChart3, view: 'dashboard' },
  { id: 'market-overview', label: 'Market Overview', icon: Compass, view: 'marketMap' },
  { id: 'ai-signals', label: 'AI Signals', icon: Zap },
  { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { id: 'news-calendar', label: 'News & Calendar', icon: Calendar },
  { id: 'economic-data', label: 'Economic Data', icon: Database },
  { id: 'strategy-builder', label: 'Strategy Builder', icon: Sliders },
  { id: 'backtest', label: 'Backtest', icon: History },
  { id: 'trade-journal', label: 'Trade Journal', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'learning-hub', label: 'Learning Hub', icon: GraduationCap },
];

export const Sidebar: React.FC = () => {
  const { activeView, setView } = usePredictionState();
  const [activeItem, setActiveItem] = useState<string>('chart');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const handleItemClick = (item: SidebarItem) => {
    setActiveItem(item.id);
    if (item.view) {
      setView(item.view);
    }
  };

  return (
    <aside 
      id="app-left-sidebar"
      className={`${isCollapsed ? 'w-14' : 'w-52 xl:w-56'} bg-[#0B101D] border-r border-[#1B2537] flex flex-col justify-between shrink-0 select-none font-sans z-20 text-slate-300 transition-all duration-200`}
    >
      {/* Navigation List */}
      <div className="py-2.5 px-2 flex-1 overflow-y-auto space-y-0.5">
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          {!isCollapsed && (
            <span className="text-[9px] font-bold tracking-widest text-slate-500 uppercase">
              Terminal Navigation
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1 rounded hover:bg-[#152033] text-slate-400 hover:text-white transition-colors cursor-pointer ml-auto"
          >
            {isCollapsed ? <PanelLeftOpen className="w-3.5 h-3.5" /> : <PanelLeftClose className="w-3.5 h-3.5" />}
          </button>
        </div>

        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isSelected = item.id === activeItem || (item.id === 'chart' && activeView === 'dashboard');

          return (
            <button
              key={item.id}
              id={`sidebar-item-${item.id}`}
              onClick={() => handleItemClick(item)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-1' : 'gap-2.5 px-2.5'} py-2 rounded-md text-xs font-semibold transition-all cursor-pointer text-left group ${
                isSelected
                  ? 'bg-blue-600/15 border border-blue-500/40 text-cyan-300 shadow-[0_0_12px_rgba(56,189,248,0.12)]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#121A2C] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1 tracking-wide">{item.label}</span>
                  {isSelected && (
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Upgrade to Pro Card (Only when expanded) */}
      {!isCollapsed ? (
        <div className="p-2.5 m-2 rounded-lg bg-gradient-to-b from-[#111A2E] to-[#0D1424] border border-blue-500/25 shadow-lg shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white tracking-wide">Upgrade to Pro</div>
              <div className="text-[9px] text-amber-400/90 font-mono font-semibold">PRO WORKSTATION</div>
            </div>
          </div>

          <ul className="space-y-1 mb-2.5 text-[10px] text-slate-300">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>More AI insights</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Advanced tools</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Priority support</span>
            </li>
          </ul>

          <button
            id="sidebar-upgrade-plans-btn"
            onClick={() => {}}
            className="w-full py-1.5 px-2 rounded bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-[11px] font-bold tracking-wide transition-all shadow-[0_0_12px_rgba(56,189,248,0.25)] flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>View Plans</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="p-2 flex justify-center shrink-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 cursor-pointer" title="Upgrade to Pro">
            <Crown className="w-4 h-4" />
          </div>
        </div>
      )}
    </aside>
  );
};
