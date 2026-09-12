import React, { useState, useEffect } from 'react';
import { Activity, Search, TrendingUp, TrendingDown, Minus, Filter, ArrowUpDown } from 'lucide-react';
import { KeyIndicator } from '../../types';
import { DefaultEconomicDataProvider } from '../../services/economicDataProvider';

export const KeyIndicatorsTab: React.FC = () => {
  const [indicators, setIndicators] = useState<KeyIndicator[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const provider = DefaultEconomicDataProvider.getInstance();
    provider.getKeyIndicators().then((data) => {
      setIndicators(data);
      setIsLoading(false);
    });
  }, []);

  const categories = [
    { id: 'ALL', label: 'All Indicators' },
    { id: 'INFLATION', label: 'Inflation' },
    { id: 'GROWTH', label: 'Growth (GDP)' },
    { id: 'EMPLOYMENT', label: 'Employment' },
    { id: 'CONSUMER', label: 'Consumer' },
    { id: 'MANUFACTURING', label: 'Manufacturing / PMI' },
    { id: 'HOUSING', label: 'Housing' },
    { id: 'TRADE', label: 'Trade' },
  ];

  const filteredIndicators = indicators.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.currency.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-mono">
        Loading Global Macroeconomic Key Indicators...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0D1424] border border-[#1A253C] rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-[#121B2D] text-slate-400 hover:text-slate-200 hover:bg-[#18233A]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search indicator or country..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#0B101D] border border-[#1E293B] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Indicators Table */}
      <div className="bg-[#0D1424] border border-[#1A253C] rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#1A253C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Macroeconomic Indicator Monitor
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Showing {filteredIndicators.length} of {indicators.length} indicators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#090E1A] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1A253C]">
                <th className="py-2.5 px-3">Indicator</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Country / Currency</th>
                <th className="py-2.5 px-3 text-right">Latest</th>
                <th className="py-2.5 px-3 text-right">Forecast</th>
                <th className="py-2.5 px-3 text-right">Previous</th>
                <th className="py-2.5 px-3 text-center">Trend</th>
                <th className="py-2.5 px-3 text-center">Impact</th>
                <th className="py-2.5 px-3 text-right">Next Release</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151F33]">
              {filteredIndicators.map((ind) => (
                <tr
                  key={ind.id}
                  className="text-slate-300 hover:bg-[#121B2D] hover:text-white transition-colors"
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-100">
                    {ind.name}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-semibold bg-[#162033] text-slate-300 border border-[#212E46]">
                      {ind.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{ind.flag}</span>
                      <span className="text-slate-300">{ind.country}</span>
                      <span className="text-[10px] font-mono text-slate-500">({ind.currency})</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-cyan-300 text-sm">
                    {ind.latest}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {ind.forecast || '--'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {ind.previous || '--'}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {ind.trend === 'UP' ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-400 font-mono text-[10px]">
                        <TrendingUp className="w-3 h-3" /> UP
                      </span>
                    ) : ind.trend === 'DOWN' ? (
                      <span className="inline-flex items-center gap-0.5 text-red-400 font-mono text-[10px]">
                        <TrendingDown className="w-3 h-3" /> DOWN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-slate-400 font-mono text-[10px]">
                        <Minus className="w-3 h-3" /> STABLE
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        ind.impact === 'HIGH'
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : ind.impact === 'MEDIUM'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {ind.impact}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                    {ind.releaseDate}
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
