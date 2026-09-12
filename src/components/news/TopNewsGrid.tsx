import React from 'react';
import { ArrowRight, Clock, ExternalLink } from 'lucide-react';
import { MarketNewsArticle, NewsCategory } from '../../types';

interface TopNewsGridProps {
  articles: MarketNewsArticle[];
  onSelectArticle: (article: MarketNewsArticle) => void;
  onViewAllClick?: () => void;
  selectedCategory?: NewsCategory | 'ALL';
  onCategoryChange?: (category: NewsCategory | 'ALL') => void;
}

export const TopNewsGrid: React.FC<TopNewsGridProps> = ({
  articles,
  onSelectArticle,
  onViewAllClick,
}) => {
  const getCategoryBadgeClass = (category: NewsCategory) => {
    switch (category) {
      case 'FOREX':
        return 'bg-blue-600/30 text-blue-300 border-blue-500/40';
      case 'COMMODITIES':
        return 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40';
      case 'ECONOMY':
        return 'bg-sky-600/30 text-sky-300 border-sky-500/40';
      case 'MARKETS':
        return 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40';
      case 'CENTRAL BANKS':
        return 'bg-purple-600/30 text-purple-300 border-purple-500/40';
      case 'CRYPTO':
        return 'bg-amber-600/30 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'HIGH':
        return <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide">High</span>;
      case 'MEDIUM':
        return <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wide">Medium</span>;
      default:
        return <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase tracking-wide">Low</span>;
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('Reuters')) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#FF8000] flex items-center justify-center text-[9px] font-black text-white shrink-0">
          R
        </div>
      );
    }
    if (source.includes('Bloomberg')) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#1A1A1A] border border-slate-600 flex items-center justify-center text-[9px] font-black text-white shrink-0">
          B
        </div>
      );
    }
    if (source.includes('Financial Times') || source.includes('FT')) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#F5DFD5] flex items-center justify-center text-[9px] font-black text-[#0D7680] shrink-0">
          FT
        </div>
      );
    }
    if (source.includes('CNBC')) {
      return (
        <div className="w-4 h-4 rounded-full bg-[#003865] border border-cyan-400/40 flex items-center justify-center text-[8px] font-bold text-cyan-300 shrink-0">
          CNBC
        </div>
      );
    }
    return (
      <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[9px] text-slate-300 shrink-0">
        N
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top News Section Title & Action */}
      <div className="flex items-center justify-between">
        <h2 className="text-base lg:text-lg font-bold text-white tracking-tight flex items-center gap-2 font-sans">
          <span>Top News</span>
        </h2>

        {onViewAllClick && (
          <button
            id="view-all-news-btn"
            onClick={onViewAllClick}
            className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer group"
          >
            <span>View All News</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* 4-Card Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {articles.slice(0, 4).map((article) => (
          <div
            key={article.id}
            id={`top-news-card-${article.id}`}
            onClick={() => onSelectArticle(article)}
            className="group flex flex-col rounded-xl bg-[#0D1424] hover:bg-[#111A2E] border border-[#1B2537] hover:border-cyan-500/40 transition-all duration-150 cursor-pointer overflow-hidden shadow-sm hover:shadow-[0_4px_20px_rgba(56,189,248,0.1)]"
          >
            {/* Card Thumbnail Image */}
            <div className="relative h-36 w-full overflow-hidden bg-[#0A0E1A]">
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0E1626] to-[#0A0E1A] text-slate-600">
                  <Clock className="w-8 h-8 opacity-40" />
                </div>
              )}

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1424] via-transparent to-black/30" />

              {/* Top Category Badge & Time */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono shadow-sm ${getCategoryBadgeClass(article.category)}`}>
                  {article.category}
                </span>
                <span className="text-[10px] font-medium text-slate-200 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded font-mono">
                  {article.publishedAt}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed font-sans">
                  {article.summary}
                </p>
              </div>

              {/* Footer: Source + Impact */}
              <div className="pt-2 border-t border-[#1B2537]/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getSourceIcon(article.source)}
                  <span className="text-xs text-slate-300 font-medium truncate max-w-[120px]">
                    {article.source}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {getImpactBadge(article.impact)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
