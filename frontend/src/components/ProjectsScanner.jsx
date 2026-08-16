import React from 'react';
import { FolderGit2, Plus, RefreshCw } from 'lucide-react';

export function ProjectsScanner({ projects, onRescan, onQuickCreateSite }) {
  const safeProjects = Array.isArray(projects) ? projects : [];

  return (
    <div className="forge-panel p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#262A34]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
            <FolderGit2 className="w-5 h-5 text-[#C9915B]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[#EDEAE3] text-base">Projects in ~/Projects</h2>
            <p className="text-xs text-[#ACAFB8] font-mono">Auto-detected Repositories</p>
          </div>
        </div>

        <button
          onClick={onRescan}
          className="btn-ghost p-2"
          aria-label="Rescan Projects Directory"
          title="Rescan Directory"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {safeProjects.length === 0 ? (
          <div className="p-6 text-center space-y-2 bg-[#0D0F14] rounded-xl border border-[#262A34]">
            <FolderGit2 className="w-8 h-8 text-[#7B7F8B] mx-auto" />
            <p className="text-xs font-semibold text-[#EDEAE3]">No project repositories detected in ~/Projects</p>
            <p className="text-[11px] text-[#ACAFB8]">Clone or create a project folder in ~/Projects to auto-detect.</p>
          </div>
        ) : (
          safeProjects.map((p) => {
            if (!p || !p.name) return null;
            const isLaravel = p.suggestedType === 'laravel';
            const isWordPress = p.suggestedType === 'wordpress';
            const isVite = p.suggestedType === 'vite-spa';
            const isProxy = p.suggestedType === 'proxy';

            return (
              <div
                key={p.name}
                className="p-3 bg-[#0D0F14] hover:bg-[#1F2330] rounded-xl border border-[#262A34] flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#12141A] flex items-center justify-center text-base shrink-0 border border-[#262A34]">
                    {isLaravel ? '🚀' : isWordPress ? '📰' : isVite ? '⚡' : isProxy ? '🟢' : '📁'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-display font-bold text-[#EDEAE3] text-xs truncate">{p.name}</h4>
                    <p className="text-[11px] text-[#7B7F8B] font-mono truncate">{p.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      isLaravel
                        ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border-[#FF5C5C]/30'
                        : isWordPress
                        ? 'bg-[#5B9DFF]/10 text-[#5B9DFF] border-[#5B9DFF]/30'
                        : isVite
                        ? 'bg-[#C9915B]/10 text-[#C9915B] border-[#C9915B]/30'
                        : isProxy
                        ? 'bg-[#3ED598]/10 text-[#3ED598] border-[#3ED598]/30'
                        : 'bg-[#12141A] text-[#ACAFB8] border-[#262A34]'
                    }`}
                  >
                    {p.framework}
                  </span>

                  <button
                    onClick={() => onQuickCreateSite(p)}
                    className="btn-primary text-xs py-1 px-2.5 min-h-[32px]"
                    aria-label={`Create virtual host site for ${p.name}`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Site</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
