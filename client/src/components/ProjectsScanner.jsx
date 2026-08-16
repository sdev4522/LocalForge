import React from 'react';
import { FolderGit2, Plus, RefreshCw, Layers } from 'lucide-react';

export function ProjectsScanner({
  projects,
  onRescan,
  onQuickCreateSite,
}) {
  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <FolderGit2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-base">Projects in ~/Projects</h2>
            <p className="text-xs text-slate-400 font-mono">
              Auto-detected local repositories
            </p>
          </div>
        </div>

        <button
          onClick={onRescan}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rescan
        </button>
      </div>

      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {projects.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-medium bg-slate-950/40 rounded-xl border border-slate-800/50">
            No projects detected in `~/Projects`
          </div>
        ) : (
          projects.map((p) => {
            const isLaravel = p.suggestedType === 'laravel';
            const isWordPress = p.suggestedType === 'wordpress';
            const isVite = p.suggestedType === 'vite-spa';
            const isProxy = p.suggestedType === 'proxy';

            return (
              <div
                key={p.name}
                className="p-3 bg-slate-900/60 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-base shrink-0">
                    {isLaravel ? '🚀' : isWordPress ? '📰' : isVite ? '⚡' : isProxy ? '🟢' : '📁'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-200 text-xs truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{p.path}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isLaravel
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                        : isWordPress
                        ? 'bg-blue-950/60 text-blue-300 border-blue-800/40'
                        : isVite
                        ? 'bg-purple-950/60 text-purple-300 border-purple-800/40'
                        : isProxy
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {p.framework}
                  </span>

                  <button
                    onClick={() => onQuickCreateSite(p)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition"
                  >
                    <Plus className="w-3 h-3" />
                    Site
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
