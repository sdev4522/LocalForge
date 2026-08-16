import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Wrench, X } from 'lucide-react';

export function DiagnosticsModal({
  isOpen,
  onClose,
  onRunDiagnostics,
  onServiceAction,
}) {
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
    if (isOpen) {
      fetchDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-2xl w-full border border-indigo-500/40 shadow-2xl overflow-y-auto max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">System Integrity Diagnostics</h3>
              <p className="text-xs text-slate-400">Automated stack health & dependency check</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
              title="Re-run Diagnostics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="py-4 space-y-3">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium">
              Running automated stack integrity checks...
            </div>
          ) : (
            items.map((item, idx) => {
              const isOk = item.status === 'ok';
              const isWarn = item.status === 'warn';

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition ${
                    isOk
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : isWarn
                      ? 'bg-amber-950/20 border-amber-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isOk && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                      {!isOk && !isWarn && <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          {item.category}
                        </span>
                      </div>
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
    </div>
  );
}
