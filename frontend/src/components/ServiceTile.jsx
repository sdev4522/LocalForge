import React, { useState } from 'react';
import { Play, Square, RotateCw, ExternalLink, Server, Database, Code2 } from 'lucide-react';

export function ServiceTile({
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

  const handleAction = async (action) => {
    setLoadingAction(action);
    try {
      await onAction(id, action);
    } finally {
      setLoadingAction(null);
    }
  };

  const renderIcon = () => {
    if (icon === 'nginx') return <Server className="w-5 h-5 text-[#3ED598]" />;
    if (icon === 'mariadb') return <Database className="w-5 h-5 text-[#5B9DFF]" />;
    return <Code2 className="w-5 h-5 text-[#C9915B]" />;
  };

  return (
    <div className="forge-panel p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-200">
      <div>
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center shadow-inner">
              {renderIcon()}
            </div>
            <div>
              <h3 className="font-display font-bold text-[#EDEAE3] text-sm tracking-tight">{name}</h3>
              <p className="text-[11px] text-[#ACAFB8] font-body">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                online ? 'bg-[#3ED598] pulse-green' : 'bg-[#FF5C5C] pulse-red'
              }`}
            />
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                online
                  ? 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
                  : 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
              }`}
            >
              {online ? 'ONLINE' : 'STOPPED'}
            </span>
          </div>
        </div>

        {/* Details Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#ACAFB8] mb-5 bg-[#0D0F14] p-2.5 rounded-xl border border-[#262A34]">
          <span>{details.label}</span>
          <span className="text-[#EDEAE3] font-semibold">{details.value}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#262A34]">
        <div className="flex items-center gap-2">
          {online ? (
            <button
              disabled={!!loadingAction}
              onClick={() => handleAction('stop')}
              className="btn-destructive text-xs py-1.5 px-3 min-h-[36px]"
              aria-label={`Stop ${name} service`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>{loadingAction === 'stop' ? 'Stopping...' : 'Stop'}</span>
            </button>
          ) : (
            <button
              disabled={!!loadingAction}
              onClick={() => handleAction('start')}
              className="btn-primary text-xs py-1.5 px-3.5 min-h-[36px]"
              aria-label={`Start ${name} service`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{loadingAction === 'start' ? 'Starting...' : 'Start'}</span>
            </button>
          )}

          <button
            disabled={!!loadingAction}
            onClick={() => handleAction('restart')}
            className="btn-secondary text-xs py-1.5 px-3 min-h-[36px]"
            aria-label={`Restart ${name} service`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingAction === 'restart' ? 'animate-spin' : ''}`} />
            <span>{loadingAction === 'restart' ? 'Restarting...' : 'Restart'}</span>
          </button>
        </div>

        {phpMyAdminLink && online && (
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs py-1.5 px-3 min-h-[36px] flex items-center gap-1.5"
            aria-label="Open phpMyAdmin Web Console"
          >
            <span>phpMyAdmin</span>
            <ExternalLink className="w-3 h-3 text-[#5B9DFF]" />
          </a>
        )}
      </div>
    </div>
  );
}
