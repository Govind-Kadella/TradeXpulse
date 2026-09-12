import React, { useEffect } from 'react';
import { X, ExternalLink, Clock, Share2, Activity } from 'lucide-react';
import { MarketNewsArticle } from '../../types';

interface NewsArticleDetailModalProps {
  article: MarketNewsArticle | null;
  onClose: () => void;
}

export const NewsArticleDetailModal: React.FC<NewsArticleDetailModalProps> = ({
  article,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#0D1424] border border-[#1E293B] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-600/20 text-cyan-300 border border-blue-500/30">
              {article.category}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {article.publishedAt}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#152033] text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Article Image Banner */}
          {article.imageUrl && (
            <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-[#1B2537]">
              <img
                src={article.imageUrl}
                alt={article.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1424] via-transparent to-black/20" />
            </div>
          )}

          {/* Headline */}
          <h1 className="text-lg sm:text-xl font-black text-white leading-snug">
            {article.title}
          </h1>

          {/* Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-y border-[#1B2537]/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Source:</span>
              <span className="font-bold text-slate-200">{article.source}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Impact:</span>
                <span className={`font-bold font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                  article.impact === 'HIGH' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {article.impact}
                </span>
              </div>

              {article.sentiment && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Sentiment:</span>
                  <span className={`font-bold font-mono text-[10px] px-1.5 py-0.2 rounded border ${
                    article.sentiment === 'BULLISH' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                    article.sentiment === 'BEARISH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'
                  }`}>
                    {article.sentiment}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Callout */}
          <div className="p-3 rounded-lg bg-[#111A2B] border border-cyan-500/20 text-xs text-slate-300 leading-relaxed font-medium">
            {article.summary}
          </div>

          {/* Article Full Body */}
          {article.content && (
            <div className="text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3 font-sans">
              {article.content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {/* Affected Instruments */}
          {article.instruments && article.instruments.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block mb-1.5">
                Affected TradeXpulse Instruments
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {article.instruments.map((inst) => (
                  <span
                    key={inst}
                    className="px-2 py-1 rounded bg-[#111C30] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1"
                  >
                    <Activity className="w-3 h-3 text-cyan-400" />
                    {inst}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="p-4 border-t border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <span>Original Source ({article.source})</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1B2942] text-xs font-bold text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
