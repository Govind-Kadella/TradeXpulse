import React, { useState, useEffect } from 'react';
import { Percent, TrendingDown, TrendingUp, Minus, BarChart3, AlertCircle } from 'lucide-react';
import { InterestRateItem } from '../../types';
import { DefaultEconomicDataProvider } from '../../services/economicDataProvider';

export const InterestRatesTab: React.FC = () => {
  const [rates, setRates] = useState<InterestRateItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const provider = DefaultEconomicDataProvider.getInstance();
    provider.getInterestRateData().then((data) => {
      setRates(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-mono">
        Loading Global Interest Rates Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Sovereign Benchmark Yields */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { name: 'US 10Y Yield', yieldVal: '4.22%', change: '-0.04%', isDown: true },
          { name: 'US 2Y Yield', yieldVal: '4.18%', change: '-0.06%', isDown: true },
          { name: 'German Bund 10Y', yieldVal: '2.41%', change: '-0.02%', isDown: true },
          { name: 'UK Gilt 10Y', yieldVal: '4.15%', change: '+0.01%', isDown: false },
          { name: 'Japan JGB 10Y', yieldVal: '0.98%', change: '+0.03%', isDown: false },
        ].map((item, idx) => (
          <div key={idx} className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">{item.name}</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{item.yieldVal}</div>
            <div className={`text-[10px] font-mono mt-0.5 ${item.isDown ? 'text-emerald-400' : 'text-red-400'}`}>
              {item.change} (1D)
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Rates Table + FedWatch Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Global Policy Rates Table */}
        <div className="lg:col-span-8 bg-[#0D1424] border border-[#1A253C] rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-[#1A253C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Benchmark Policy Rates Matrix
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              G10 & Major Global Central Banks
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#090E1A] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1A253C]">
                  <th className="py-2.5 px-3">Country / Authority</th>
                  <th className="py-2.5 px-3">Currency</th>
                  <th className="py-2.5 px-3 text-right">Current Rate</th>
                  <th className="py-2.5 px-3 text-right">Previous</th>
                  <th className="py-2.5 px-3 text-center">Last Decision</th>
                  <th className="py-2.5 px-3 text-right">Next Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151F33]">
                {rates.map((item) => (
                  <tr key={item.id} className="text-slate-300 hover:bg-[#121B2D] hover:text-white transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.flag}</span>
                        <div>
                          <div className="font-semibold text-slate-100">{item.country}</div>
                          <div className="text-[10px] text-slate-500">{item.centralBank}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                      {item.currency}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                      {item.currentRate.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-xs">
                      {item.previousRate.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          item.direction === 'CUT'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : item.direction === 'HIKE'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                            : 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                        }`}
                      >
                        {item.direction === 'CUT' && <TrendingDown className="w-3 h-3" />}
                        {item.direction === 'HIKE' && <TrendingUp className="w-3 h-3" />}
                        {item.direction === 'HOLD' && <Minus className="w-3 h-3" />}
                        {item.lastChange}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-[11px]">
                      {item.nextDecision}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FedWatch / Rate Probability Matrix */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 bg-[#0D1424] border border-[#1A253C] rounded-xl shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A253C]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  FOMC Target Rate Probability
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Sep 2026 Meeting</span>
            </div>

            <div className="my-3 space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-300">25 bps Cut (5.00% - 5.25%)</span>
                  <span className="text-cyan-300 font-bold">68.0%</span>
                </div>
                <div className="w-full h-2 bg-[#121B2D] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '68%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-300">Hold at Peak (5.25% - 5.50%)</span>
                  <span className="text-amber-400 font-bold">20.0%</span>
                </div>
                <div className="w-full h-2 bg-[#121B2D] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '20%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-mono">
                  <span className="text-slate-300">50 bps Jumbo Cut (4.75% - 5.00%)</span>
                  <span className="text-purple-400 font-bold">12.0%</span>
                </div>
                <div className="w-full h-2 bg-[#121B2D] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '12%' }} />
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0B101D] border border-[#162135] text-[11px] text-slate-400 leading-relaxed flex items-start gap-2 mt-4">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Derived from CME FedWatch 30-Day Fed Funds futures pricing. Market indicates strong base-case conviction for gradual easing cycles.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
