import React from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../../services/economicCalendarService';

interface CurrencyFilterPanelProps {
  selectedCurrencies: string[];
  onCurrenciesChange: (currencies: string[]) => void;
}

export const CurrencyFilterPanel: React.FC<CurrencyFilterPanelProps> = ({
  selectedCurrencies,
  onCurrenciesChange,
}) => {
  const isAllSelected = selectedCurrencies.length === 0;

  const handleToggleAll = () => {
    onCurrenciesChange([]);
  };

  const handleToggleCurrency = (code: string) => {
    if (isAllSelected) {
      // Transition from All to just this one
      onCurrenciesChange([code]);
    } else {
      if (selectedCurrencies.includes(code)) {
        const next = selectedCurrencies.filter(c => c !== code);
        onCurrenciesChange(next); // if empty, acts as all
      } else {
        onCurrenciesChange([...selectedCurrencies, code]);
      }
    }
  };

  const col1 = SUPPORTED_CURRENCIES.slice(0, 4); // USD, EUR, GBP, JPY
  const col2 = SUPPORTED_CURRENCIES.slice(4); // AUD, CAD, CHF, NZD, CNY

  return (
    <div className="flex flex-col rounded-xl bg-[#0B101D] border border-[#1B2537] p-3.5 shadow-sm">
      {/* Header: Title + Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1B2537]/80">
        <h3 className="text-sm font-bold text-white tracking-tight font-sans">
          Currency Filter
        </h3>
        <button
          id="reset-currency-filter-btn"
          onClick={handleToggleAll}
          className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Main Checkbox: All Currencies */}
      <div className="mt-3">
        <label 
          className="flex items-center gap-2 cursor-pointer select-none group py-1"
          onClick={handleToggleAll}
        >
          <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
            isAllSelected 
              ? 'bg-blue-600 border-blue-500 text-white' 
              : 'border-slate-600 group-hover:border-slate-400 bg-[#0E1526]'
          }`}>
            {isAllSelected && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className={`text-xs font-bold transition-colors ${
            isAllSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
          }`}>
            All Currencies
          </span>
        </label>
      </div>

      {/* 2-Column Currency Grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-[#1B2537]/50">
        {/* Column 1 */}
        <div className="space-y-1.5">
          {col1.map(cur => {
            const isChecked = !isAllSelected && selectedCurrencies.includes(cur.code);
            return (
              <label
                key={cur.code}
                id={`currency-checkbox-${cur.code.toLowerCase()}`}
                onClick={() => handleToggleCurrency(cur.code)}
                className="flex items-center gap-2 cursor-pointer select-none group py-0.5"
              >
                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  isChecked 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'border-slate-600 group-hover:border-slate-400 bg-[#0E1526]'
                }`}>
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs shrink-0">{cur.flag}</span>
                  <span className={`text-[11px] font-mono font-semibold transition-colors truncate ${
                    isChecked ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {cur.code} <span className="text-[10px] text-slate-500 font-sans">{cur.name}</span>
                  </span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Column 2 */}
        <div className="space-y-1.5">
          {col2.map(cur => {
            const isChecked = !isAllSelected && selectedCurrencies.includes(cur.code);
            return (
              <label
                key={cur.code}
                id={`currency-checkbox-${cur.code.toLowerCase()}`}
                onClick={() => handleToggleCurrency(cur.code)}
                className="flex items-center gap-2 cursor-pointer select-none group py-0.5"
              >
                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                  isChecked 
                    ? 'bg-blue-600 border-blue-500 text-white' 
                    : 'border-slate-600 group-hover:border-slate-400 bg-[#0E1526]'
                }`}>
                  {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs shrink-0">{cur.flag}</span>
                  <span className={`text-[11px] font-sans font-medium transition-colors truncate ${
                    isChecked ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {cur.name}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
