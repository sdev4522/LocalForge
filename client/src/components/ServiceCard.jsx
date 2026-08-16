import React, { useState } from 'react';
import { Play, Square, RotateCw, ExternalLink, Server, Database, Code2 } from 'lucide-react';

export function ServiceCard({
  id,
  name,
  subtitle,
  icon,
  online,
  details,
  phpMyAdminLink = false,
  onAction,
}) {
  const [loadingAction, setLoadingAction] = useState(null);

  const handleActionClick = async (action) => {
    setLoadingAction(action);
    try {
      await onAction(id, action);
    } finally {
      setLoadingAction(null);
    }
  };

  const getIcon = () => {
    if (icon === 'nginx') return <Server className="w-5 h-5 text-emerald-400" />;
    if (icon === 'mariadb') return <Database className="w-5 h-5 text-blue-400" />;
    return <Code2 className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="glass-card p-5 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
      {/* Background Accent Glow */}
      <div
        className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-opacity ${
          online ? 'bg-emerald-500/10 opacity-100' : 'bg-rose-500/10 opacity-70'
        }`}
      />

      <div>
        {/* Title Bar & Status Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm tracking-tight">{name}</h3>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                online
                  ? 'bg-emerald-500 pulse-green'
                  : 'bg-rose-500 pulse-red'
              }`}
            />
            <span
              className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                online
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-400 border-rose-500/30'
              }`}
            >
              {online ? 'ONLINE' : 'STOPPED'}
            </span>
          </div>
        </div>

        {/* Details & Metadata Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 mb-5 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60">
          <span>{details.label}</span>
          <span className="text-slate-300 font-semibold">{details.value}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2">
          {online ? (
            <button
              disabled={!!loadingAction}
              onClick={() => handleActionClick('stop')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              <Square className="w-3.5 h-3.5" />
              {loadingAction === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
          ) : (
            <button
              disabled={!!loadingAction}
              onClick={() => handleActionClick('start')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {loadingAction === 'start' ? 'Starting...' : 'Start'}
            </button>
          )}

          <button
            disabled={!!loadingAction}
            onClick={() => handleActionClick('restart')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 rounded-xl text-xs font-semibold transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingAction === 'restart' ? 'animate-spin' : ''}`} />
            {loadingAction === 'restart' ? 'Restarting...' : 'Restart'}
          </button>
        </div>

        {phpMyAdminLink && online && (
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-950/50 hover:bg-blue-900/60 text-blue-300 border border-blue-800/40 rounded-xl text-xs font-semibold transition"
          >
            <span>phpMyAdmin</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
