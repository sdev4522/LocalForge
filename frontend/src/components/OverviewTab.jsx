import React from 'react';
import { ServiceTile } from './ServiceTile';
import { FolderGit2, RefreshCw, Plus, Globe, ExternalLink, Edit3, Power, Layers } from 'lucide-react';

export function OverviewTab({
  services,
  projects,
  sites,
  onServiceAction,
  onRescanProjects,
  onQuickCreateSite,
  onToggleSite,
  onOpenConfigEditor,
  onNavigateTab,
}) {
  return (
    <div className="space-y-6">
      {/* Bento Row 1: System Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ServiceTile
          id="nginx"
          name="Nginx Engine"
          subtitle="Web & Reverse Proxy"
          icon="nginx"
          online={services?.nginx ?? false}
          details={{ label: 'Ports: 80, 443', value: '/etc/nginx/conf.d/' }}
          onAction={onServiceAction}
        />

        <ServiceTile
          id="mariadb"
          name="MariaDB Server"
          subtitle="SQL Database Engine"
          icon="mariadb"
          online={services?.mariadb ?? false}
          details={{ label: 'Port: 3306', value: 'MariaDB 11.8' }}
          phpMyAdminLink={true}
          onAction={onServiceAction}
        />

        <ServiceTile
          id="php-fpm"
          name="PHP-FPM 8.x"
          subtitle="FastCGI Process Manager"
          icon="php"
          online={services?.phpFpm ?? false}
          details={{ label: 'FastCGI Socket', value: '/run/php-fpm/' }}
          onAction={onServiceAction}
        />
      </section>

      {/* Bento Row 2: Grid Split for Virtual Hosts & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento Box Left: Active Virtual Hosts Quick Card (Span 7) */}
        <section className="lg:col-span-7 bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-100 text-base">Active Virtual Hosts</h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Configured in <span className="text-emerald-400">/etc/nginx/conf.d/</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateTab('vhosts')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                View All ({sites.length}) →
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {sites.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-medium bg-slate-950/40 rounded-xl border border-slate-800/50">
                  No virtual host files found in `/etc/nginx/conf.d/`
                </div>
              ) : (
                sites.slice(0, 5).map((s) => (
                  <div
                    key={s.name}
                    className="p-3 bg-slate-900/60 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          s.enabled ? 'bg-emerald-400 pulse-green' : 'bg-slate-500'
                        }`}
                      />
                      <span className="font-mono font-semibold text-slate-200 text-xs truncate">
                        {s.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onOpenConfigEditor(s.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        <Edit3 className="w-3 h-3 inline mr-1" />
                        Edit
                      </button>

                      <button
                        onClick={() => onToggleSite(s.name, !s.enabled)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                          s.enabled
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <Power className="w-3 h-3 inline mr-1" />
                        {s.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Bento Box Right: Local Projects Auto-Detector (Span 5) */}
        <section className="lg:col-span-5 bento-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-100 text-base">Projects in ~/Projects</h2>
                  <p className="text-xs text-slate-400 font-mono">Auto-detected repositories</p>
                </div>
              </div>

              <button
                onClick={onRescanProjects}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                title="Rescan Directory"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {projects.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-medium bg-slate-950/40 rounded-xl border border-slate-800/50">
                  No project directories found in `~/Projects`
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
                        <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-base shrink-0 border border-slate-800">
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
        </section>
      </div>
    </div>
  );
}
