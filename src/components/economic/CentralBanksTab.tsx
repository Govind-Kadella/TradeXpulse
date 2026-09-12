import React, { useState, useEffect } from 'react';
import { Landmark, Calendar, TrendingUp, TrendingDown, Minus, Info, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { CentralBankInfo } from '../../types';
import { DefaultEconomicDataProvider } from '../../services/economicDataProvider';

export const CentralBanksTab: React.FC = () => {
  const [banks, setBanks] = useState<CentralBankInfo[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>('fed');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const provider = DefaultEconomicDataProvider.getInstance();
    provider.getCentralBankData().then((data) => {
      setBanks(data);
      setIsLoading(false);
    });
  }, []);

  const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500 text-xs font-mono">
        Loading Central Bank Policy Matrix...
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header bar / Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Highest G10 Policy Rate</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">5.50% <span className="text-xs text-slate-400">(USD Fed)</span></div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> Peak rate cycle regime
          </div>
        </div>

        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Lowest G10 Policy Rate</div>
          <div className="text-lg font-bold text-white font-mono mt-0.5">0.10% <span className="text-xs text-slate-400">(JPY BoJ)</span></div>
          <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Normalization underway
          </div>
        </div>

        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Next Central Bank Decision</div>
          <div className="text-lg font-bold text-cyan-300 font-mono mt-0.5">Fed FOMC</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-blue-400" /> Sep 17-18, 2026
          </div>
        </div>

        <div className="p-3 bg-[#0B1220] border border-[#182337] rounded-lg">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Global Monetary Stance</div>
          <div className="text-lg font-bold text-purple-300 mt-0.5">Data Dependent Easing</div>
          <div className="text-[10px] text-slate-400 mt-1">
            8 of 10 banks eyeing cuts in H2
          </div>
        </div>
      </div>

      {/* Main Grid: Central Banks Table + Selected Bank Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Central Banks List */}
        <div className="lg:col-span-8 bg-[#0D1424] border border-[#1A253C] rounded-xl overflow-hidden shadow-lg">
          <div className="px-4 py-3 border-b border-[#1A253C] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                G10 Central Bank Policy Matrix
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {banks.length} Major Authorities Tracked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#090E1A] text-slate-400 text-[10px] uppercase tracking-wider border-b border-[#1A253C]">
                  <th className="py-2.5 px-3">Central Bank</th>
                  <th className="py-2.5 px-3">Currency</th>
                  <th className="py-2.5 px-3 text-right">Current Rate</th>
                  <th className="py-2.5 px-3 text-right">Previous</th>
                  <th className="py-2.5 px-3 text-center">Stance</th>
                  <th className="py-2.5 px-3">Next Meeting</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#151F33]">
                {banks.map((bank) => {
                  const isSelected = selectedBank?.id === bank.id;
                  return (
                    <tr
                      key={bank.id}
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/15 text-white font-medium'
                          : 'text-slate-300 hover:bg-[#121B2D] hover:text-white'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{bank.flag}</span>
                          <div>
                            <div className="font-semibold">{bank.name}</div>
                            <div className="text-[10px] text-slate-500">{bank.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                        {bank.currency}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                        {bank.currentRate.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-400 text-xs">
                        {bank.previousRate.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            bank.policyStance === 'HAWKISH'
                              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                              : bank.policyStance === 'DOVISH'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {bank.policyStance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {bank.nextMeeting}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBankId(bank.id);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-[#152033] text-slate-300 hover:text-white hover:bg-[#1B2942]'
                          }`}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Bank Deep Dive */}
        {selectedBank && (
          <div className="lg:col-span-4 space-y-3">
            <div className="p-4 bg-[#0D1424] border border-[#1A253C] rounded-xl shadow-lg">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A253C]">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedBank.flag}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{selectedBank.name}</h4>
                    <span className="text-[11px] font-mono text-slate-400">{selectedBank.country} ({selectedBank.currency})</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Policy Rate</div>
                  <div className="text-base font-mono font-bold text-cyan-300">
                    {selectedBank.currentRate.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Policy commentary */}
              <div className="my-3 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  Policy Assessment & Outlook
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#0B101D] p-2.5 rounded-lg border border-[#162135]">
                  {selectedBank.commentary}
                </p>
              </div>

              {/* AI Macro Analysis */}
              <div className="mt-3 p-3 rounded-lg bg-blue-950/25 border border-blue-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    AI Institutional Bias
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    selectedBank.aiAnalysis.bias === 'BULLISH'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : selectedBank.aiAnalysis.bias === 'BEARISH'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedBank.aiAnalysis.bias}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <strong className="text-white">Observation:</strong> {selectedBank.aiAnalysis.fact}
                </div>
                <div className="text-[11px] text-slate-400">
                  <strong className="text-slate-200">Market Transmission:</strong> {selectedBank.aiAnalysis.interpretation}
                </div>
              </div>

              {/* Rate History sequence */}
              <div className="mt-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Historical Trajectory
                </div>
                <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
                  {selectedBank.rateHistory.map((h, i) => (
                    <div key={i} className="flex-1 min-w-[50px] bg-[#090E1A] p-1.5 rounded text-center border border-[#151F33]">
                      <div className="text-[9px] text-slate-500 font-mono">{h.date}</div>
                      <div className="text-xs font-mono font-bold text-white mt-0.5">{h.rate.toFixed(2)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
