import React, { useState } from 'react';
import { X, Bell, Clock, ShieldCheck, Check } from 'lucide-react';
import { EconomicEvent } from '../../types';
import { EconomicCalendarService } from '../../services/economicCalendarService';

interface EconomicAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EconomicEvent | null;
  onAlertCreated?: (eventId: string, minutesBefore: number) => void;
}

export const EconomicAlertModal: React.FC<EconomicAlertModalProps> = ({
  isOpen,
  onClose,
  event,
  onAlertCreated,
}) => {
  const [minutesBefore, setMinutesBefore] = useState<number>(15);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [deviationAlert, setDeviationAlert] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen || !event) return null;

  const handleSave = () => {
    const calendarService = EconomicCalendarService.getInstance();
    calendarService.addAlert(event.id, minutesBefore, event.event);
    
    setIsSaved(true);
    if (onAlertCreated) {
      onAlertCreated(event.id, minutesBefore);
    }
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        id="economic-alert-modal"
        className="w-full max-w-md bg-[#0D1424] border border-[#1E293B] rounded-xl shadow-2xl p-5 text-slate-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Set Economic Data Alert</h3>
              <p className="text-[11px] text-slate-400">Receive real-time terminal audio & notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#1A2338] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Event Preview Banner */}
        <div className="my-4 p-3 rounded-lg bg-[#111A2E] border border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{event.flag}</span>
            <div>
              <div className="text-xs font-semibold text-white">{event.event}</div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{event.currency}</span>
                <span>•</span>
                <span>{event.timeUtc} UTC</span>
                <span>•</span>
                <span className={`${
                  event.impact === 'HIGH' ? 'text-red-400' : event.impact === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {event.impact} IMPACT
                </span>
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-[11px]">
            <div className="text-slate-500 text-[10px]">Forecast</div>
            <div className="text-cyan-300 font-bold">{event.forecast || '--'}</div>
          </div>
        </div>

        {/* Timing options */}
        <div className="space-y-3 mb-4">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Alert Trigger Timing
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'At Release', val: 0 },
              { label: '5m Before', val: 5 },
              { label: '15m Before', val: 15 },
              { label: '1h Before', val: 60 },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setMinutesBefore(opt.val)}
                className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                  minutesBefore === opt.val
                    ? 'bg-blue-600/20 border-blue-500 text-cyan-300 font-semibold shadow-[0_0_10px_rgba(56,189,248,0.15)]'
                    : 'bg-[#111A2E]/80 border-[#1B273F] text-slate-400 hover:text-slate-200 hover:bg-[#152038]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2 mb-5">
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#111A2E]/60 border border-[#1A253C] cursor-pointer hover:bg-[#131D33] transition-colors">
            <div>
              <div className="text-xs font-medium text-slate-200">Terminal Audio Chime</div>
              <div className="text-[10px] text-slate-400">Play institutional chime when release occurs</div>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-lg bg-[#111A2E]/60 border border-[#1A253C] cursor-pointer hover:bg-[#131D33] transition-colors">
            <div>
              <div className="text-xs font-medium text-slate-200">Consensus Deviation Spike Alert</div>
              <div className="text-[10px] text-slate-400">Highlight high volatility if Actual deviates from Forecast</div>
            </div>
            <input
              type="checkbox"
              checked={deviationAlert}
              onChange={(e) => setDeviationAlert(e.target.checked)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1E293B]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#142036] hover:bg-[#1A2B47] text-slate-300 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaved}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Alert Armed
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Arm Alert
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
