import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarn = toast.type === 'warn';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex items-start gap-3 transition-all duration-300 transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-100'
                : isError
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-100'
                : isWarn
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-100'
                : 'bg-slate-900/80 border-slate-700 text-slate-100'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <XCircle className="w-5 h-5 text-rose-400" />}
              {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {!isSuccess && !isError && !isWarn && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm leading-tight">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs opacity-90 mt-1 leading-normal break-words">{toast.message}</p>
              )}
              {toast.details && (
                <pre className="mt-2 text-[11px] p-2 rounded bg-black/40 font-mono overflow-x-auto max-h-32 opacity-80">
                  {toast.details}
                </pre>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
