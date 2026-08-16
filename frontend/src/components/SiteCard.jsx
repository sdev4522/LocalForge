import React, { useState } from 'react';
import { Globe, Power, Edit3, ShieldAlert, Trash2 } from 'lucide-react';

export function SiteCard({
  site,
  onToggleSite,
  onOpenConfigEditor,
  onFixPermissions,
  onDeleteSiteRequest,
}) {
  const [toggling, setToggling] = useState(false);
  const [fixing, setFixing] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleSite(site.name, !site.enabled);
    } finally {
      setToggling(false);
    }
  };

  const handleFix = async () => {
    setFixing(true);
    try {
      await onFixPermissions(site.name);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="p-3.5 bg-[#0D0F14] hover:bg-[#1F2330] rounded-xl border border-[#262A34] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-all duration-200">
      {/* Site Name & Status */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-[#12141A] border border-[#262A34] flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-[#3ED598]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-bold text-[#EDEAE3] text-xs sm:text-sm truncate">
              {site.name}
            </h4>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border shrink-0 ${
                site.enabled
                  ? 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
                  : 'bg-[#12141A] text-[#ACAFB8] border-[#262A34]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${site.enabled ? 'bg-[#3ED598]' : 'bg-[#7B7F8B]'}`} />
              {site.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => onOpenConfigEditor(site.name)}
          className="btn-secondary text-xs py-1 px-2.5 min-h-[36px]"
          aria-label={`Edit ${site.name} Nginx configuration`}
          title="Edit Raw Nginx Conf"
        >
          <Edit3 className="w-3.5 h-3.5 text-[#ACAFB8]" />
          <span>Edit</span>
        </button>

        <button
          disabled={fixing}
          onClick={handleFix}
          className="btn-secondary text-xs py-1 px-2.5 min-h-[36px]"
          aria-label={`Fix permissions and SELinux for ${site.name}`}
          title="Fix Permissions & SELinux Context"
        >
          <ShieldAlert className={`w-3.5 h-3.5 text-[#5B9DFF] ${fixing ? 'animate-spin' : ''}`} />
          <span>Perms</span>
        </button>

        <button
          disabled={toggling}
          onClick={handleToggle}
          className={`${site.enabled ? 'btn-secondary' : 'btn-primary'} text-xs py-1 px-2.5 min-h-[36px]`}
          aria-label={`${site.enabled ? 'Disable' : 'Enable'} site ${site.name}`}
        >
          <Power className={`w-3.5 h-3.5 ${toggling ? 'animate-spin' : ''}`} />
          <span>{site.enabled ? 'Disable' : 'Enable'}</span>
        </button>

        <button
          onClick={() => onDeleteSiteRequest(site.name)}
          className="btn-destructive p-2 min-h-[36px] min-w-[36px]"
          aria-label={`Delete virtual host ${site.name}`}
          title="Delete Virtual Host"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
