import React, { useState, useEffect } from 'react';
import { 
  SlidersHorizontal, 
  Server, 
  Clock, 
  Bell, 
  Trash2, 
  Check, 
  RotateCcw,
  Volume2,
  Database
} from 'lucide-react';
import { EconomicCalendarService } from '../../services/economicCalendarService';
import { EventAlert } from '../../types';

export const NewsSettingsWorkspace: React.FC = () => {
  const calendarService = EconomicCalendarService.getInstance();
  const [alerts, setAlerts] = useState<EventAlert[]>([]);
  const [timezone, setTimezone] = useState<string>('UTC');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [defaultLeadTime, setDefaultLeadTime] = useState<number>(15);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setAlerts(calendarService.getAlerts());
  }, []);

  const handleDeleteAlert = (eventId: string) => {
    calendarService.removeAlert(eventId);
    setAlerts(calendarService.getAlerts());
    showToast('Alert removed.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Top Title */}
      <div className="p-4 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm">
        <h2 className="text-lg font-bold text-white font-sans">
          News & Calendar Settings
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure data providers, timezone synchronization, alert preferences, and active notification triggers.
        </p>
      </div>

      {toast && (
        <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* 1. Data Provider Status */}
      <div className="p-5 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <span>Macro Data Feed Architecture</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-[#0E1626] border border-[#1B2537] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Primary Economic Provider</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Refinitiv Institutional Macro Feeds
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Status: Demo Feed (Realistic Forward Calendar)</span>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-[#0E1626] border border-[#1B2537] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">News Aggregator Provider</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Operational
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Reuters / Bloomberg / Financial Times Multi-Wire
            </p>
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time polling: Enabled</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Timezone Configuration */}
      <div className="p-5 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Calendar Timezone Display</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { id: 'UTC', label: 'UTC (Coordinated Universal Time)', desc: 'Standard canonical reference for FX & central banks' },
            { id: 'EST', label: 'New York (EDT / EST)', desc: 'North American market session reference' },
            { id: 'GMT', label: 'London (BST / GMT)', desc: 'European banking session reference' },
            { id: 'JST', label: 'Tokyo (JST)', desc: 'Asia-Pacific market session reference' },
          ].map((tz) => (
            <label
              key={tz.id}
              onClick={() => {
                setTimezone(tz.id);
                showToast(`Timezone set to ${tz.id}`);
              }}
              className={`p-3 rounded-lg border cursor-pointer flex items-start gap-3 transition-colors ${
                timezone === tz.id
                  ? 'bg-blue-600/15 border-cyan-400/60'
                  : 'bg-[#0E1626] border-[#1B2537] hover:border-slate-600'
              }`}
            >
              <input
                type="radio"
                name="timezone"
                checked={timezone === tz.id}
                onChange={() => {}}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <span className="text-xs font-bold text-white block">{tz.label}</span>
                <span className="text-[11px] text-slate-400 block mt-0.5">{tz.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Notification & Sound Preferences */}
      <div className="p-5 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
          <Bell className="w-4 h-4 text-cyan-400" />
          <span>Alert Preferences</span>
        </h3>

        <div className="flex items-center justify-between p-3 rounded-lg bg-[#0E1626] border border-[#1B2537]">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-cyan-400" />
            <div>
              <span className="text-xs font-bold text-white block">Audible High-Impact Sound Chimes</span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Plays audio notification when event triggers</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              showToast(`Sound notifications ${!soundEnabled ? 'enabled' : 'disabled'}`);
            }}
            className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
              soundEnabled ? 'bg-blue-600' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              soundEnabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>
      </div>

      {/* 4. Active Saved Alerts */}
      <div className="p-5 rounded-xl bg-[#0B101D] border border-[#1B2537] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Configured Event Triggers ({alerts.length})</span>
          </h3>
        </div>

        {alerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-[#0E1626] rounded-lg border border-[#1B2537]">
            No event notification triggers active. Click the bell icon 🔔 next to any economic event in the calendar to schedule an alert.
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-[#0E1626] border border-[#1B2537] flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400">{alert.currency}</span>
                    <span className="text-xs font-bold text-white">{alert.eventTitle}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    Trigger: {alert.notifyMinutesBefore} minutes in advance
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteAlert(alert.eventId)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                  title="Remove Alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
