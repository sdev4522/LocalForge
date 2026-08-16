import React, { useState, useRef, useEffect } from 'react';
import { ScrollText, Pause, Play, Trash2, Wifi } from 'lucide-react';
import { useLogsSSE } from '../hooks/useLogsSSE';

export function LogViewer() {
  const [logType, setLogType] = useState('error');
  const { logLines, connected, isPaused, togglePause, clearLogs } = useLogsSSE(logType, 100);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines, isPaused]);

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Real-Time Nginx Log Stream</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Live tail -f on /var/log/nginx/
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLogType('error')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                logType === 'error'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Error Log
            </button>
            <button
              onClick={() => setLogType('access')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                logType === 'access'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Access Log
            </button>
          </div>

          {/* Stream Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
              connected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <Wifi className={`w-3 h-3 ${connected ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Pause / Resume */}
          <button
            onClick={togglePause}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title={isPaused ? 'Resume Auto-Scroll' : 'Pause Auto-Scroll'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Clear Log Buffer */}
          <button
            onClick={clearLogs}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
            title="Clear Log View"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="bg-black/90 p-4 font-mono text-[11px] text-slate-300 h-64 overflow-y-auto leading-relaxed select-text">
        {logLines.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-600 font-medium">
            Waiting for log stream events on `/var/log/nginx/{logType}.log`...
          </div>
        ) : (
          logLines.map((line, idx) => (
            <div
              key={idx}
              className={`hover:bg-white/5 px-1 py-0.5 rounded transition ${
                line.includes('[error]') || line.includes('[emerg]')
                  ? 'text-rose-400 font-bold bg-rose-950/20'
                  : line.includes('[warn]')
                  ? 'text-amber-300'
                  : 'text-slate-300'
              }`}
            >
              <span className="text-slate-600 select-none mr-3 text-[10px]">
                {String(idx + 1).padStart(3, '0')}
              </span>
              {line}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
