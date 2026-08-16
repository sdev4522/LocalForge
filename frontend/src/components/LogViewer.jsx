import React, { useState, useRef, useEffect } from 'react';
import { ScrollText, Pause, Play, Trash2, Wifi } from 'lucide-react';
import { useSSE } from '../hooks/useSSE';

export function LogViewer() {
  const [logType, setLogType] = useState('error');
  const { data, status } = useSSE(`/api/logs/stream?type=${logType}&lines=100`);
  const [logLines, setLogLines] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    setLogLines([]);
  }, [logType]);

  useEffect(() => {
    if (!data || isPaused) return;

    let textLine = null;
    if (typeof data === 'string') {
      textLine = data;
    } else if (typeof data === 'object' && data !== null) {
      textLine = data.line || data.message || (typeof data.toString === 'function' ? data.toString() : null);
    }

    if (textLine && typeof textLine === 'string' && textLine.trim()) {
      setLogLines((prev) => [...prev, textLine].slice(-500));
    }
  }, [data, isPaused]);

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logLines, isPaused]);

  const clearLogs = () => setLogLines([]);
  const togglePause = () => setIsPaused((prev) => !prev);

  return (
    <div className="forge-panel overflow-hidden shadow-xl">
      <div className="p-4 border-b border-[#262A34] bg-[#191C24] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
            <ScrollText className="w-4 h-4 text-[#C9915B]" />
          </div>
          <div>
            <h3 className="font-display font-bold text-[#EDEAE3] text-sm">Real-Time Nginx Log Stream</h3>
            <p className="text-[11px] text-[#ACAFB8] font-mono">
              Live tail -f on /var/log/nginx/
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#0D0F14] p-1 rounded-xl border border-[#262A34]">
            <button
              onClick={() => setLogType('error')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                logType === 'error'
                  ? 'bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30'
                  : 'text-[#ACAFB8] hover:text-[#EDEAE3]'
              }`}
              aria-label="View Nginx Error Log"
            >
              Error Log
            </button>
            <button
              onClick={() => setLogType('access')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                logType === 'access'
                  ? 'bg-[#3ED598]/15 text-[#3ED598] border border-[#3ED598]/30'
                  : 'text-[#ACAFB8] hover:text-[#EDEAE3]'
              }`}
              aria-label="View Nginx Access Log"
            >
              Access Log
            </button>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border ${
              status === 'open'
                ? 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
                : status === 'connecting'
                ? 'bg-[#F5B94D]/10 text-[#F5B94D] border-[#F5B94D]/30 animate-pulse'
                : 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
            }`}
          >
            <Wifi className={`w-3 h-3 ${status === 'open' ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">
              {status === 'open' ? 'Live' : status === 'connecting' ? 'Reconnecting...' : 'Offline'}
            </span>
          </div>

          <button
            onClick={togglePause}
            className="btn-ghost p-2"
            aria-label={isPaused ? 'Resume Auto-Scroll' : 'Pause Auto-Scroll'}
            title={isPaused ? 'Resume Auto-Scroll' : 'Pause Auto-Scroll'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={clearLogs}
            className="btn-ghost p-2"
            aria-label="Clear Log Stream"
            title="Clear Log View"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#0D0F14] p-4 font-mono text-[11px] text-[#EDEAE3] h-72 overflow-y-auto leading-relaxed select-text">
        {logLines.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#7B7F8B] font-medium">
            Waiting for log stream events on `/var/log/nginx/{logType}.log`...
          </div>
        ) : (
          logLines.map((line, idx) => {
            const lineStr = String(line || '');
            const isErr = lineStr.includes('[error]') || lineStr.includes('[emerg]');
            const isWarn = lineStr.includes('[warn]');

            return (
              <div
                key={idx}
                className={`hover:bg-[#1F2330] px-1.5 py-0.5 rounded transition ${
                  isErr
                    ? 'text-[#FF5C5C] font-bold bg-[#FF5C5C]/10'
                    : isWarn
                    ? 'text-[#F5B94D]'
                    : 'text-[#EDEAE3]'
                }`}
              >
                <span className="text-[#7B7F8B] select-none mr-3 text-[11px]">
                  {String(idx + 1).padStart(3, '0')}
                </span>
                {lineStr}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
