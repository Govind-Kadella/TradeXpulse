import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Volume2, VolumeX, Check } from 'lucide-react';
import { EconomicEvent } from '../../types';
import { EconomicCalendarService } from '../../services/economicCalendarService';

interface SetAlertModalProps {
  event: EconomicEvent | null;
  onClose: () => void;
  onAlertSaved: () => void;
}

export const SetAlertModal: React.FC<SetAlertModalProps> = ({
  event,
  onClose,
  onAlertSaved,
}) => {
  const calendarService = EconomicCalendarService.getInstance();
  const [minutesBefore, setMinutesBefore] = useState<number>(15);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAlreadySet, setIsAlreadySet] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      const existing = calendarService.isAlertSet(event.id);
      setIsAlreadySet(existing);
    }
  }, [event, calendarService]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!event) return null;

  const handleSave = () => {
    calendarService.setAlert({
      eventId: event.id,
      eventName: event.event,
      currency: event.currency,
      impact: event.impact,
      eventTime: event.timestamp,
      leadTimeMinutes: minutesBefore,
      soundEnabled: soundEnabled
    });

    setToastMessage(`Alert set for ${minutesBefore}m before ${event.event}!`);
    setTimeout(() => {
      onAlertSaved();
      onClose();
    }, 900);
  };

  const handleRemove = () => {
    calendarService.removeAlert(event.id);
    setToastMessage(`Alert removed for ${event.event}.`);
    setTimeout(() => {
      onAlertSaved();
      onClose();
    }, 900);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-[#0D1424] border border-[#1E293B] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden text-slate-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Event Notification Alert</h3>
              <p className="text-[11px] text-slate-400">TradeXpulse Macro Risk Monitor</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#152033] text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Target Event Callout */}
          <div className="p-3 rounded-lg bg-[#090E1A] border border-[#1B2537]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400">{event.flag} {event.currency}</span>
              <span className="text-[10px] font-mono text-slate-400">{event.date} {event.timeUtc} UTC</span>
            </div>
            <h4 className="text-sm font-bold text-white mt-1">{event.event}</h4>
          </div>

          {/* Lead Time Selection */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-2 font-mono uppercase tracking-wider">
              Notify Me In Advance:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '5 min', mins: 5 },
                { label: '15 min', mins: 15 },
                { label: '30 min', mins: 30 },
                { label: '1 hour', mins: 60 },
                { label: '2 hours', mins: 120 },
                { label: '1 day', mins: 1440 },
              ].map((opt) => (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setMinutesBefore(opt.mins)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    minutesBefore === opt.mins
                      ? 'bg-blue-600 text-white border border-cyan-400/50 shadow-sm'
                      : 'bg-[#111A2B] hover:bg-[#152033] text-slate-300 border border-[#1B2537]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Notification Toggle */}
          <div className="pt-2 border-t border-[#1B2537]/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <span className="text-xs font-medium text-slate-300">Audible Audio Chime</span>
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${
                soundEnabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Toast feedback */}
          {toastMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1B2537] bg-[#0A0F1D] flex items-center justify-between">
          {isAlreadySet ? (
            <button
              onClick={handleRemove}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-colors cursor-pointer"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Cancel Alert</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-[#152033] hover:bg-[#1B2942] text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              {isAlreadySet ? 'Update Alert' : 'Save Alert'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
