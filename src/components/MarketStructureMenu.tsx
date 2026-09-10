import React, { useRef, useEffect } from 'react';
import { usePredictionState } from '../context/PredictionStateContext';
import { ChartOverlayConfig } from '../types';
import { 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Sliders, 
  ShieldCheck, 
  Zap, 
  GitCommit, 
  Box, 
  Layers, 
  Activity, 
  Compass,
  X
} from 'lucide-react';

interface MarketStructureMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ItemDefinition {
  id: string;
  key: keyof ChartOverlayConfig;
  label: string;
  badge?: string;
  badgeColor?: string;
  description?: string;
}

interface CategoryDefinition {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: ItemDefinition[];
}

export const MarketStructureMenu: React.FC<MarketStructureMenuProps> = ({ isOpen, onClose }) => {
  const { overlayConfig, toggleOverlay, selectAllMarketStructure, clearAllMarketStructure } = usePredictionState();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: CategoryDefinition[] = [
    {
      id: 'price-action',
      title: 'PRICE ACTION (Single-Candle)',
      icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
      items: [
        { id: 'pa-doji', key: 'showPatternDoji', label: 'Doji', badge: '≤8% body' },
        { id: 'pa-hammer', key: 'showPatternHammer', label: 'Hammer', badge: 'Reversal' },
        { id: 'pa-inv-hammer', key: 'showPatternInvertedHammer', label: 'Inverted Hammer', badge: 'Reversal' },
        { id: 'pa-shooting-star', key: 'showPatternShootingStar', label: 'Shooting Star', badge: 'Rejection' },
        { id: 'pa-hanging-man', key: 'showPatternHangingMan', label: 'Hanging Man', badge: 'Warning' },
        { id: 'pa-pin-bar', key: 'showPatternPinBar', label: 'Pin Bar', badge: '≥66% wick' },
        { id: 'pa-marubozu', key: 'showPatternMarubozu', label: 'Marubozu', badge: '≥85% body' },
        { id: 'pa-spinning-top', key: 'showPatternSpinningTop', label: 'Spinning Top', badge: 'Indecision' },
      ],
    },
    {
      id: 'two-candle',
      title: 'TWO-CANDLE PATTERNS',
      icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
      items: [
        { id: 'tc-bull-engulf', key: 'showPatternBullishEngulfing', label: 'Bullish Engulfing', badgeColor: 'text-emerald-400' },
        { id: 'tc-bear-engulf', key: 'showPatternBearishEngulfing', label: 'Bearish Engulfing', badgeColor: 'text-rose-400' },
        { id: 'tc-bull-harami', key: 'showPatternBullishHarami', label: 'Bullish Harami', badgeColor: 'text-emerald-400' },
        { id: 'tc-bear-harami', key: 'showPatternBearishHarami', label: 'Bearish Harami', badgeColor: 'text-rose-400' },
        { id: 'tc-piercing', key: 'showPatternPiercingLine', label: 'Piercing Line', badge: '>50% body' },
        { id: 'tc-dark-cloud', key: 'showPatternDarkCloudCover', label: 'Dark Cloud Cover', badge: '>50% body' },
        { id: 'tc-tweezer-top', key: 'showPatternTweezerTop', label: 'Tweezer Top', badge: 'High rejection' },
        { id: 'tc-tweezer-bot', key: 'showPatternTweezerBottom', label: 'Tweezer Bottom', badge: 'Low defense' },
      ],
    },
    {
      id: 'multi-candle',
      title: 'MULTI-CANDLE PATTERNS',
      icon: <Activity className="w-3.5 h-3.5 text-purple-400" />,
      items: [
        { id: 'mc-morn-star', key: 'showPatternMorningStar', label: 'Morning Star', badgeColor: 'text-emerald-400' },
        { id: 'mc-eve-star', key: 'showPatternEveningStar', label: 'Evening Star', badgeColor: 'text-rose-400' },
        { id: 'mc-white-soldiers', key: 'showPatternThreeWhiteSoldiers', label: 'Three White Soldiers', badgeColor: 'text-emerald-400' },
        { id: 'mc-black-crows', key: 'showPatternThreeBlackCrows', label: 'Three Black Crows', badgeColor: 'text-rose-400' },
        { id: 'mc-inside-up', key: 'showPatternThreeInsideUp', label: 'Three Inside Up', badgeColor: 'text-emerald-400' },
        { id: 'mc-inside-down', key: 'showPatternThreeInsideDown', label: 'Three Inside Down', badgeColor: 'text-rose-400' },
        { id: 'mc-outside-up', key: 'showPatternThreeOutsideUp', label: 'Three Outside Up', badgeColor: 'text-emerald-400' },
        { id: 'mc-outside-down', key: 'showPatternThreeOutsideDown', label: 'Three Outside Down', badgeColor: 'text-rose-400' },
      ],
    },
    {
      id: 'market-structure',
      title: 'MARKET STRUCTURE (SMC)',
      icon: <GitCommit className="w-3.5 h-3.5 text-emerald-400" />,
      items: [
        { id: 'ms-bos', key: 'showMS_BOS', label: 'BOS (Break of Structure)', badge: 'Close verified' },
        { id: 'ms-choch', key: 'showMS_CHoCH', label: 'CHoCH (Change of Character)', badge: 'Regime shift' },
        { id: 'ms-coc', key: 'showMS_CoC', label: 'CoC (Continuation of Character)' },
        { id: 'ms-swings', key: 'showMS_Swings', label: 'Swing Highs / Lows', badge: 'Fractal pivot' },
        { id: 'ms-hh-hl', key: 'showMS_HH_HL', label: 'HH / HL (Bullish Sequence)' },
        { id: 'ms-lh-ll', key: 'showMS_LH_LL', label: 'LH / LL (Bearish Sequence)' },
      ],
    },
    {
      id: 'fvg',
      title: 'FAIR VALUE GAPS (FVG)',
      icon: <Box className="w-3.5 h-3.5 text-cyan-400" />,
      items: [
        { id: 'fvg-bull', key: 'showFVG_Bullish', label: 'Bullish FVG', badgeColor: 'text-emerald-400' },
        { id: 'fvg-bear', key: 'showFVG_Bearish', label: 'Bearish FVG', badgeColor: 'text-rose-400' },
        { id: 'fvg-mitigated', key: 'showFVG_Mitigated', label: 'Mitigated FVG', badge: 'Filled / Retested' },
      ],
    },
    {
      id: 'order-blocks',
      title: 'ORDER BLOCKS (OB)',
      icon: <Compass className="w-3.5 h-3.5 text-amber-400" />,
      items: [
        { id: 'ob-bull', key: 'showOB_Bullish', label: 'Bullish OB / Demand', badgeColor: 'text-sky-400' },
        { id: 'ob-bear', key: 'showOB_Bearish', label: 'Bearish OB / Supply', badgeColor: 'text-amber-400' },
        { id: 'ob-mitigated', key: 'showOB_Mitigated', label: 'Mitigated OB', badge: 'Breached' },
      ],
    },
    {
      id: 'liquidity',
      title: 'LIQUIDITY',
      icon: <Activity className="w-3.5 h-3.5 text-indigo-400" />,
      items: [
        { id: 'liq-sweeps', key: 'showLiq_Sweeps', label: 'Liquidity Sweep', badge: 'Turtle Soup / Wick' },
        { id: 'liq-eqh', key: 'showLiq_EQH', label: 'Equal Highs (EQH)', badge: 'Buy-Side pool' },
        { id: 'liq-eql', key: 'showLiq_EQL', label: 'Equal Lows (EQL)', badge: 'Sell-Side pool' },
      ],
    },
    {
      id: 'support-resistance',
      title: 'SUPPORT / RESISTANCE',
      icon: <Sliders className="w-3.5 h-3.5 text-emerald-400" />,
      items: [
        { id: 'sr-support', key: 'showSR_Support', label: 'Support Line & Levels', badgeColor: 'text-emerald-400' },
        { id: 'sr-resistance', key: 'showSR_Resistance', label: 'Resistance Line & Levels', badgeColor: 'text-rose-400' },
      ],
    },
  ];

  // Calculate active count
  let activeCount = 0;
  categories.forEach(cat => {
    cat.items.forEach(item => {
      if (overlayConfig[item.key]) activeCount++;
    });
  });

  return (
    <div
      ref={menuRef}
      id="market-structure-dropdown-panel"
      className="absolute left-0 sm:left-auto top-full mt-1.5 w-80 sm:w-96 max-h-[82vh] bg-[#0A0F1A] border border-[#1F2937] rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden text-slate-200 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Header */}
      <div className="p-3 border-b border-[#1F2937] bg-[#0E1524] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Market Structure
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {activeCount} Active
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Strict OHLC verified price action & SMC overlays
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1D283D] transition-colors"
          title="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Global Actions: Select All / Clear All */}
      <div className="px-3 py-2 border-b border-[#1F2937] bg-[#0B111D] flex items-center justify-between shrink-0 gap-2">
        <button
          id="ms-select-all-btn"
          onClick={selectAllMarketStructure}
          className="flex-1 py-1 px-2.5 rounded bg-[#131B2B] hover:bg-blue-600/20 border border-[#1F2937] hover:border-blue-500/40 text-[11px] font-medium text-slate-200 hover:text-blue-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
          <span>Select All</span>
        </button>

        <button
          id="ms-clear-all-btn"
          onClick={clearAllMarketStructure}
          className="flex-1 py-1 px-2.5 rounded bg-[#131B2B] hover:bg-rose-600/20 border border-[#1F2937] hover:border-rose-500/40 text-[11px] font-medium text-slate-300 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Clear All</span>
        </button>
      </div>

      {/* Categories & Toggle List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-3.5 custom-scrollbar">
        {categories.map(cat => (
          <div key={cat.id} className="space-y-1">
            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-[#0E1524]/60 rounded">
              {cat.icon}
              <span>{cat.title}</span>
            </div>

            <div className="grid grid-cols-1 gap-0.5">
              {cat.items.map(item => {
                const isChecked = !!overlayConfig[item.key];
                return (
                  <label
                    key={item.id}
                    id={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleOverlay(item.key);
                    }}
                    className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer select-none ${
                      isChecked
                        ? 'bg-blue-500/10 text-white font-medium'
                        : 'text-slate-300 hover:bg-[#131B2B] hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="text-blue-400 shrink-0">
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400 fill-blue-500/20" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`text-[9.5px] font-mono shrink-0 px-1.5 py-0.5 rounded bg-[#131B2B] border border-[#1F2937] ${item.badgeColor || 'text-slate-400'}`}>
                        {item.badge}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-2 border-t border-[#1F2937] bg-[#0E1524] flex items-center justify-between text-[10px] text-slate-400 shrink-0 font-mono">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Strict OHLC Validation Active</span>
        </div>
        <span className="text-slate-500">Tick-aware</span>
      </div>
    </div>
  );
};
