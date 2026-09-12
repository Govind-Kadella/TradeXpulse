import React from 'react';
import { X, Check, Globe } from 'lucide-react';

interface CountryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrencies: string[];
  onChange: (currencies: string[]) => void;
}

export const COUNTRIES = [
  { currency: 'USD', country: 'United States', flag: '🇺🇸', group: 'G10' },
  { currency: 'EUR', country: 'Eurozone', flag: '🇪🇺', group: 'G10' },
  { currency: 'GBP', country: 'United Kingdom', flag: '🇬🇧', group: 'G10' },
  { currency: 'JPY', country: 'Japan', flag: '🇯🇵', group: 'G10' },
  { currency: 'CNY', country: 'China', flag: '🇨🇳', group: 'Major' },
  { currency: 'AUD', country: 'Australia', flag: '🇦🇺', group: 'G10' },
  { currency: 'CAD', country: 'Canada', flag: '🇨🇦', group: 'G10' },
  { currency: 'CHF', country: 'Switzerland', flag: '🇨🇭', group: 'G10' },
  { currency: 'NZD', country: 'New Zealand', flag: '🇳🇿', group: 'G10' },
  { currency: 'INR', country: 'India', flag: '🇮🇳', group: 'Emerging' },
  { currency: 'BRL', country: 'Brazil', flag: '🇧🇷', group: 'Emerging' },
  { currency: 'KRW', country: 'South Korea', flag: '🇰🇷', group: 'Major' },
];

export const CountryFilterModal: React.FC<CountryFilterModalProps> = ({
  isOpen,
  onClose,
  selectedCurrencies,
  onChange,
}) => {
  if (!isOpen) return null;

  const toggleCurrency = (currency: string) => {
    if (selectedCurrencies.includes(currency)) {
      if (selectedCurrencies.length === 1) return; // Keep at least one
      onChange(selectedCurrencies.filter((c) => c !== currency));
    } else {
      onChange([...selectedCurrencies, currency]);
    }
  };

  const selectAll = () => {
    onChange(COUNTRIES.map((c) => c.currency));
  };

  const selectG10 = () => {
    onChange(COUNTRIES.filter((c) => c.group === 'G10').map((c) => c.currency));
  };

  const selectMajorThree = () => {
    onChange(['USD', 'EUR', 'GBP']);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        id="country-filter-modal"
        className="w-full max-w-md bg-[#0D1424] border border-[#1E293B] rounded-xl shadow-2xl p-5 text-slate-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Filter Countries & Currencies</h3>
              <p className="text-[11px] text-slate-400">Select regions to display in the economic calendar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2338] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 py-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Presets:</span>
          <button
            type="button"
            onClick={selectAll}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#162032] hover:bg-[#1E2C44] text-slate-300 hover:text-white border border-[#23314B] transition-colors"
          >
            All ({COUNTRIES.length})
          </button>
          <button
            type="button"
            onClick={selectG10}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#162032] hover:bg-[#1E2C44] text-slate-300 hover:text-white border border-[#23314B] transition-colors"
          >
            G10 Economies
          </button>
          <button
            type="button"
            onClick={selectMajorThree}
            className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#162032] hover:bg-[#1E2C44] text-slate-300 hover:text-white border border-[#23314B] transition-colors"
          >
            USD / EUR / GBP
          </button>
        </div>

        {/* Country Grid */}
        <div className="grid grid-cols-2 gap-2 my-2 max-h-64 overflow-y-auto pr-1">
          {COUNTRIES.map((item) => {
            const isSelected = selectedCurrencies.includes(item.currency);
            return (
              <button
                key={item.currency}
                type="button"
                onClick={() => toggleCurrency(item.currency)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/50 text-white font-semibold'
                    : 'bg-[#111A2E]/60 border-[#1B273F] text-slate-400 hover:text-slate-200 hover:bg-[#142038]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base leading-none">{item.flag}</span>
                  <div>
                    <div className="text-[12px]">{item.country}</div>
                    <div className="text-[10px] font-mono text-slate-400">{item.currency}</div>
                  </div>
                </div>
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-blue-500 border-blue-400 text-white'
                      : 'border-slate-600 bg-slate-800/40 text-transparent'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1E293B]">
          <span className="text-[11px] text-slate-400">
            {selectedCurrencies.length} countries selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
