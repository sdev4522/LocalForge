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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="forge-panel p-6 max-w-2xl w-full border-[#262A34] shadow-2xl overflow-y-auto max-h-[85vh] space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#262A34]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-[#5B9DFF]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#EDEAE3] text-base">System Integrity Diagnostics</h3>
              <p className="text-xs text-[#ACAFB8]">Automated Stack Health & Dependency Check</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDiagnostics}
              className="btn-ghost p-1.5"
              aria-label="Re-run Diagnostics"
              title="Re-run Diagnostics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close modal">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="p-8 text-center text-[#7B7F8B] font-medium text-xs">
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
                      ? 'bg-[#3ED598]/10 border-[#3ED598]/30'
                      : isWarn
                      ? 'bg-[#F5B94D]/10 border-[#F5B94D]/30'
                      : 'bg-[#FF5C5C]/10 border-[#FF5C5C]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isOk && <CheckCircle2 className="w-5 h-5 text-[#3ED598]" />}
                      {isWarn && <AlertTriangle className="w-5 h-5 text-[#F5B94D]" />}
                      {!isOk && !isWarn && <XCircle className="w-5 h-5 text-[#FF5C5C]" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#7B7F8B]">
                        {item.category}
                      </span>
                      <h4 className="font-display font-bold text-[#EDEAE3] text-xs mt-0.5">{item.title}</h4>
                      <p className="text-[11px] text-[#ACAFB8] mt-1 font-mono">{item.detail}</p>
                    </div>
                  </div>

                  {item.fixAction === 'restart_php' && (
                    <button
                      onClick={() => onServiceAction('php-fpm', 'restart')}
                      className="btn-primary text-xs py-1.5 px-3 shrink-0"
                      aria-label="Start PHP-FPM Service"
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
