import React, { useState, useMemo } from 'react';
import { BacktestTrade, MarketSymbol } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Shield, 
  Target, 
  Info,
  CheckCircle2,
  XCircle,
  Activity,
  Layers
} from 'lucide-react';

interface BacktestTradeListTabProps {
  trades: BacktestTrade[];
  symbol: MarketSymbol;
}

type SortField = 'tradeNumber' | 'pnl' | 'entryTime' | 'rMultiple' | 'durationMinutes';
type SortOrder = 'asc' | 'desc';

export const BacktestTradeListTab: React.FC<BacktestTradeListTabProps> = ({ trades, symbol }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<'ALL' | 'WIN' | 'LOSS' | 'BREAKEVEN'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('tradeNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter and sort
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      // Outcome
      if (outcomeFilter !== 'ALL' && t.outcome !== outcomeFilter) return false;
      // Direction
      if (directionFilter !== 'ALL' && t.direction !== directionFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesNumber = t.tradeNumber.toString().includes(query);
        const matchesReason = t.exitReason.toLowerCase().includes(query);
        const matchesEntry = t.entryReason.toLowerCase().includes(query);
        const matchesOutcome = t.outcome.toLowerCase().includes(query);
        if (!matchesNumber && !matchesReason && !matchesEntry && !matchesOutcome) return false;
      }
      return true;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (sortField === 'tradeNumber') {
        valA = a.tradeNumber;
        valB = b.tradeNumber;
      }
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [trades, outcomeFilter, directionFilter, searchQuery, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredTrades.length / pageSize));
  const paginatedTrades = filteredTrades.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // CSV Export functionality
  const handleExportCsv = () => {
    if (trades.length === 0) return;
    const headers = [
      'TradeNumber',
      'Symbol',
      'Direction',
      'EntryTime',
      'ExitTime',
      'EntryPrice',
      'ExitPrice',
      'StopLoss',
      'TakeProfit',
      'Lots',
      'NetPnL',
      'PnLPercent',
      'RMultiple',
      'Outcome',
      'ExitReason',
      'DurationMinutes',
      'MFE',
      'MAE'
    ];

    const rows = trades.map(t => [
      t.tradeNumber,
      t.symbol,
      t.direction,
      new Date(t.entryTime).toISOString(),
      new Date(t.exitTime).toISOString(),
      t.entryPrice,
      t.exitPrice,
      t.stopLoss,
      t.takeProfit,
      t.lots,
      t.pnl,
      t.pnlPercent,
      t.rMultiple,
      t.outcome,
      t.exitReason,
      t.durationMinutes,
      t.mfe,
      t.mae
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tradexpulse_backtest_${symbol}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0E1526] border border-[#1E293B]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search trade #, exit trigger, condition..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-[#131B2E] border border-[#1E293B] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Outcome Filter */}
          <div className="flex items-center bg-[#131B2E] p-0.5 rounded-lg border border-[#1E293B]">
            {(['ALL', 'WIN', 'LOSS', 'BREAKEVEN'] as const).map(out => (
              <button
                key={out}
                onClick={() => {
                  setOutcomeFilter(out);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  outcomeFilter === out
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {out === 'ALL' ? 'All Outcomes' : out === 'WIN' ? 'Wins' : out === 'LOSS' ? 'Losses' : 'BE'}
              </button>
            ))}
          </div>

          {/* Direction Filter */}
          <div className="flex items-center bg-[#131B2E] p-0.5 rounded-lg border border-[#1E293B]">
            {(['ALL', 'BUY', 'SELL'] as const).map(dir => (
              <button
                key={dir}
                onClick={() => {
                  setDirectionFilter(dir);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                  directionFilter === dir
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dir === 'ALL' ? 'All Sides' : dir === 'BUY' ? 'Long' : 'Short'}
              </button>
            ))}
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCsv}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#131B2E] hover:bg-[#1C263D] border border-[#1E293B] text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Download verified trade records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Trade Records Table */}
      <div className="rounded-xl bg-[#0E1526] border border-[#1E293B] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#11192E] border-b border-[#1E293B] text-slate-400 font-semibold select-none">
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('tradeNumber')}
                >
                  <div className="flex items-center gap-1">
                    <span>#</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Side</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('entryTime')}
                >
                  <div className="flex items-center gap-1">
                    <span>Entry Time & Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Exit Time & Price</th>
                <th className="py-3 px-4">SL / TP</th>
                <th className="py-3 px-4">Lots</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center gap-1">
                    <span>Net P/L ($)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('rMultiple')}
                >
                  <div className="flex items-center gap-1">
                    <span>R:R</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('durationMinutes')}
                >
                  <div className="flex items-center gap-1">
                    <span>Duration</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Exit Trigger</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#182338]">
              {paginatedTrades.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    No simulated trades match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedTrades.map(trade => {
                  const isExpanded = expandedTradeId === trade.id;
                  const isWin = trade.pnl > 0;
                  const isLoss = trade.pnl < 0;

                  return (
                    <React.Fragment key={trade.id}>
                      <tr 
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className={`hover:bg-[#131B2E] transition-colors cursor-pointer ${
                          isExpanded ? 'bg-[#141E34]' : ''
                        }`}
                      >
                        {/* Trade # */}
                        <td className="py-3 px-4 font-mono font-medium text-slate-300">
                          #{trade.tradeNumber}
                        </td>

                        {/* Direction */}
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            trade.direction === 'BUY'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {trade.direction === 'BUY' ? 'LONG' : 'SHORT'}
                          </span>
                        </td>

                        {/* Entry */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-200 font-semibold">{trade.entryPrice}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(trade.entryTime).toLocaleDateString()} {new Date(trade.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* Exit */}
                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-200 font-semibold">{trade.exitPrice}</div>
                          <div className="text-[10px] text-slate-500">
                            {new Date(trade.exitTime).toLocaleDateString()} {new Date(trade.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        {/* SL / TP */}
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          <div className="text-rose-400/90">SL: {trade.stopLoss}</div>
                          <div className="text-emerald-400/90">TP: {trade.takeProfit}</div>
                        </td>

                        {/* Lots */}
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {trade.lots}
                        </td>

                        {/* Net PnL */}
                        <td className="py-3 px-4 font-mono">
                          <div className={`font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'}`}>
                            {isWin ? '+' : ''}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-[10px] ${isWin ? 'text-emerald-400/80' : isLoss ? 'text-rose-400/80' : 'text-slate-500'}`}>
                            {isWin ? '+' : ''}{trade.pnlPercent}%
                          </div>
                        </td>

                        {/* R:R Multiple */}
                        <td className="py-3 px-4 font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                            trade.rMultiple >= 1.5 
                              ? 'bg-emerald-500/15 text-emerald-300' 
                              : trade.rMultiple > 0 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {trade.rMultiple >= 0 ? '+' : ''}{trade.rMultiple}R
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {trade.durationMinutes >= 60
                            ? `${Math.floor(trade.durationMinutes / 60)}h ${trade.durationMinutes % 60}m`
                            : `${trade.durationMinutes}m`}
                        </td>

                        {/* Exit Reason */}
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-slate-300 bg-[#151F33] px-2 py-0.5 rounded border border-[#1E293B]">
                            {trade.exitReason}
                          </span>
                        </td>

                        {/* Expand Trigger */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Trade Detail Card */}
                      {isExpanded && (
                        <tr className="bg-[#0B111F] border-b border-[#1E293B]">
                          <td colSpan={11} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                              {/* Trade Execution Anatomy */}
                              <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B] space-y-2">
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  <Shield className="w-3.5 h-3.5 text-cyan-400" />
                                  Excursion Anatomy
                                </div>
                                <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                                  <div className="flex justify-between">
                                    <span>Max Favorable (MFE):</span>
                                    <span className="text-emerald-400">+{trade.mfe} pts</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Max Adverse (MAE):</span>
                                    <span className="text-rose-400">-{trade.mae} pts</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Commission Paid:</span>
                                    <span className="text-slate-300">${trade.commission}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Slippage Deducted:</span>
                                    <span className="text-slate-300">{trade.slippage} pts</span>
                                  </div>
                                </div>
                              </div>

                              {/* Entry Conditions Trigger Breakdown */}
                              <div className="p-3 rounded-lg bg-[#11192C] border border-[#1E293B] space-y-2 md:col-span-2">
                                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                                  Entry Signal Verification & Conditions
                                </div>
                                <div className="text-[11px] text-slate-300">
                                  {trade.entryConditionsMet && trade.entryConditionsMet.length > 0 ? (
                                    <ul className="space-y-1">
                                      {trade.entryConditionsMet.map((c, i) => (
                                        <li key={i} className="flex items-center gap-1.5 text-slate-300">
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                          <span>{c}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-slate-400">{trade.entryReason || 'Standard condition group satisfied on closed bar.'}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#1E293B] bg-[#0E1526] text-xs text-slate-400">
          <div>
            Showing <strong className="text-slate-200">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong className="text-slate-200">{Math.min(currentPage * pageSize, filteredTrades.length)}</strong> of{' '}
            <strong className="text-slate-200">{filteredTrades.length}</strong> trades
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded border border-[#1E293B] bg-[#131B2E] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-slate-300 font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded border border-[#1E293B] bg-[#131B2E] text-slate-300 hover:text-white disabled:opacity-40 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
