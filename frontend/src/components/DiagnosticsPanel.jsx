import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Wrench } from 'lucide-react';

export function DiagnosticsPanel({ onRunDiagnostics, onServiceAction }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const data = await onRunDiagnostics();
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-base">System Integrity Diagnostics</h2>
            <p className="text-xs text-slate-400">Automated stack health & dependency check</p>
          </div>
        </div>

        <button
          onClick={fetchDiagnostics}
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
          title="Re-run Diagnostics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium text-xs">
            Running automated stack integrity checks...
          </div>
        ) : (
          items.map((item, idx) => {
            const isOk = item.status === 'ok';
            const isWarn = item.status === 'warn';

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start justify-between gap-4 transition ${
                  isOk
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-rose-950/20 border-rose-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {isOk && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isWarn && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                    {!isOk && !isWarn && <XCircle className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {item.category}
                    </span>
                    <h4 className="font-bold text-slate-200 text-xs mt-0.5">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono">{item.detail}</p>
                  </div>
                </div>

                {item.fixAction === 'restart_php' && (
                  <button
                    onClick={() => onServiceAction('php-fpm', 'restart')}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shrink-0 transition flex items-center gap-1 shadow-md shadow-indigo-600/20"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Start PHP-FPM
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
