import React from 'react';
import { Cpu, HardDrive, Search, Activity, Stethoscope, Wifi, ShieldAlert } from 'lucide-react';

export function Header({
  metrics,
  onOpenCommandPalette,
  onOpenDiagnostics,
  onToggleActivityDrawer,
}) {
  const cpuNum = parseFloat(metrics.cpuLoad) || 0;
  const memNum = parseFloat(metrics.memPercent) || 0;

  return (
    <header className="sticky top-0 z-30 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-[#0b0f19] rounded-[10px] flex items-center justify-center">
            <span className="font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 text-lg">
              ⚡
            </span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-base lg:text-lg tracking-tight">
              Fedora Stack Manager
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.3.0
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Native Nginx, MariaDB & PHP 8.x Engine
          </p>
        </div>
      </div>

      {/* Real-time Hardware Stream Meters */}
      <div className="flex items-center gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800/80">
        {/* CPU Meter */}
        <div className="flex items-center gap-2.5 px-2">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="w-24 sm:w-28">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium text-[11px]">CPU</span>
              <span className="font-mono font-semibold text-slate-200 text-[11px]">{metrics.cpuLoad}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  cpuNum > 85
                    ? 'bg-rose-500'
                    : cpuNum > 60
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(cpuNum, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 hidden sm:block" />

        {/* RAM Meter */}
        <div className="flex items-center gap-2.5 px-2">
          <HardDrive className="w-4 h-4 text-teal-400 shrink-0" />
          <div className="w-28 sm:w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400 font-medium text-[11px]">RAM ({metrics.usedMem}G)</span>
              <span className="font-mono font-semibold text-slate-200 text-[11px]">{metrics.memPercent}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  memNum > 85
                    ? 'bg-rose-500'
                    : memNum > 60
                    ? 'bg-amber-500'
                    : 'bg-teal-400'
                }`}
                style={{ width: `${Math.min(memNum, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* SSE Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border ${
            metrics.connected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
          title={metrics.connected ? 'Live SSE Metrics Streaming' : 'Reconnecting to SSE server...'}
        >
          <Wifi className={`w-3 h-3 ${metrics.connected ? 'animate-pulse' : ''}`} />
          <span className="hidden md:inline">{metrics.connected ? 'SSE Live' : 'Disconnected'}</span>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        {/* Raycast Search Command Palette Button */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 px-3 py-2 rounded-xl border border-slate-800 text-xs font-medium transition shadow-sm"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Search actions...</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Diagnostics Button */}
        <button
          onClick={onOpenDiagnostics}
          className="flex items-center gap-1.5 bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 px-3 py-2 rounded-xl text-xs font-semibold transition"
          title="Run Integrity Diagnostics"
        >
          <Stethoscope className="w-4 h-4 text-indigo-400" />
          <span className="hidden md:inline">Diagnostics</span>
        </button>

        {/* Activity Timeline Drawer Trigger */}
        <button
          onClick={onToggleActivityDrawer}
          className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800/80 text-slate-300 border border-slate-800 px-3 py-2 rounded-xl text-xs font-semibold transition"
          title="View Activity Timeline"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline">Timeline</span>
        </button>
      </div>
    </header>
  );
}
