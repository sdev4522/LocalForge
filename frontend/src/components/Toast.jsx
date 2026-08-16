import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export function ToastContainer({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  // Show max 1 toast at a time (most recent queue item)
  const currentToast = toasts[toasts.length - 1];

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#3ED598] shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#FF5C5C] shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#F5B94D] shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#5B9DFF] shrink-0" />;
    }
  };

  const getBorder = (type) => {
    switch (type) {
      case 'success':
        return 'border-[#3ED598]/40';
      case 'error':
        return 'border-[#FF5C5C]/40';
      case 'warning':
        return 'border-[#F5B94D]/40';
      default:
        return 'border-[#5B9DFF]/40';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full">
      <div
        key={currentToast.id}
        className={`forge-panel p-4 shadow-2xl flex items-start justify-between gap-3 border ${getBorder(
          currentToast.type
        )} transition-all duration-300`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {getIcon(currentToast.type)}
          <div className="min-w-0">
            <h4 className="font-display font-bold text-[#EDEAE3] text-xs">
              {currentToast.title}
            </h4>
            <p className="text-xs text-[#ACAFB8] mt-0.5 leading-snug">
              {currentToast.message}
            </p>
            {currentToast.details && (
              <pre className="text-[11px] font-mono text-[#7B7F8B] mt-1.5 p-2 bg-[#0D0F14] rounded-lg border border-[#262A34] overflow-x-auto select-text">
                {currentToast.details}
              </pre>
            )}
          </div>
        </div>

        <button
          onClick={() => removeToast(currentToast.id)}
          className="btn-ghost p-1 text-[#7B7F8B] hover:text-[#EDEAE3]"
          aria-label="Dismiss toast notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
