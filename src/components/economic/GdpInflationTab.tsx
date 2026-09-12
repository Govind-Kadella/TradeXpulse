import React, { useState, useEffect } from 'react';
import { BarChart, ArrowUpRight, ArrowDownRight, Flame, Globe2 } from 'lucide-react';
import { GdpInflationItem } from '../../types';
import { DefaultEconomicDataProvider } from '../../services/economicDataProvider';

export const GdpInflationTab: React.FC = () => {
  const [data, setData] = useState<GdpInflationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const provider = DefaultEconomicDataProvider.getInstance();
    provider.getGdpInflationData().then((res) => {
      setData(res);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-mono">
        Loading Global GDP Growth & Inflation Heatmap...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Average G10 GDP Growth (YoY)</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">+1.85%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Average G10 Headline CPI (YoY)</div>
            <div className="text-lg font-bold text-amber-300 font-mono mt-0.5">2.52%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Target Convergence Rate</div>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">75% of G10 &lt; 2.8%</div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Global GDP & Inflation Table */}
      <div className="bg-[#0D1424] border border-[#1A253C] rounded-xl overflow-hidden shadow-lg">
        <div className="px-4 py-3 border-b border-[#1A253C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Cross-Country Growth & Inflation Comparative Table
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Updated Q3 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="bg-[#090E1A] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1A253C]">
                <th className="py-2.5 px-3">Country</th>
                <th className="py-2.5 px-3">Currency</th>
                <th className="py-2.5 px-3 text-right">GDP (YoY)</th>
                <th className="py-2.5 px-3 text-right">GDP (QoQ)</th>
                <th className="py-2.5 px-3 text-right">Headline CPI</th>
                <th className="py-2.5 px-3 text-right">Core CPI</th>
                <th className="py-2.5 px-3 text-right">Core PCE</th>
                <th className="py-2.5 px-3 text-right">PPI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151F33]">
              {data.map((item) => (
                <tr key={item.id} className="text-slate-300 hover:bg-[#121B2D] hover:text-white transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-100 flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <span>{item.country}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">
                    {item.currency}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    item.gdpGrowthYoY > 2.0 ? 'text-emerald-400' : item.gdpGrowthYoY > 0 ? 'text-slate-200' : 'text-red-400'
                  }`}>
                    {item.gdpGrowthYoY > 0 ? `+${item.gdpGrowthYoY.toFixed(1)}%` : `${item.gdpGrowthYoY.toFixed(1)}%`}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {item.gdpGrowthQoQ > 0 ? `+${item.gdpGrowthQoQ.toFixed(1)}%` : `${item.gdpGrowthQoQ.toFixed(1)}%`}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                    item.cpiYoY > 3.0 ? 'text-red-400' : item.cpiYoY <= 2.2 ? 'text-emerald-400' : 'text-amber-300'
                  }`}>
                    {item.cpiYoY.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {item.coreCpiYoY.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-cyan-300 font-bold">
                    {item.corePceYoY > 0 ? `${item.corePceYoY.toFixed(1)}%` : '--'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {item.ppiYoY > 0 ? `+${item.ppiYoY.toFixed(1)}%` : `${item.ppiYoY.toFixed(1)}%`}
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
