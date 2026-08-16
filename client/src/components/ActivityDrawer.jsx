import React from 'react';
import { Activity, X, Trash2, Clock } from 'lucide-react';

export function ActivityDrawer({
  isOpen,
  onClose,
  activities,
  onClearActivities,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="glass-panel w-full max-w-md h-full border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-sm">Activity Timeline</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearActivities}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              title="Clear Timeline"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timeline Items */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {activities.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs font-medium">
              No activity recorded in this session
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-start gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>{act.action}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {act.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-medium leading-snug">{act.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
