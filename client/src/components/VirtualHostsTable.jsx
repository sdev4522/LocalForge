import React, { useState } from 'react';
import { Globe, Plus, RefreshCw, Edit3, ShieldAlert, Trash2, Power, CheckCircle, Lock } from 'lucide-react';

export function VirtualHostsTable({
  sites,
  onRefresh,
  onOpenCreateSiteModal,
  onOpenConfigEditor,
  onToggleSite,
  onFixPermissions,
  onDeleteSite,
}) {
  const [togglingSite, setTogglingSite] = useState(null);
  const [fixingPermsSite, setFixingPermsSite] = useState(null);
  const [deleteModalSite, setDeleteModalSite] = useState(null);
  const [typedConfirm, setTypedConfirm] = useState('');

  const handleToggle = async (siteName, targetState) => {
    setTogglingSite(siteName);
    try {
      await onToggleSite(siteName, targetState);
    } finally {
      setTogglingSite(null);
    }
  };

  const handleFixPerms = async (siteName) => {
    setFixingPermsSite(siteName);
    try {
      await onFixPermissions(siteName);
    } finally {
      setFixingPermsSite(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteModalSite) return;
    if (typedConfirm !== deleteModalSite) return;
    await onDeleteSite(deleteModalSite);
    setDeleteModalSite(null);
    setTypedConfirm('');
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-slate-800/80">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-base">Active Nginx Virtual Hosts</h2>
            <p className="text-xs text-slate-400 font-mono">
              Configuration Directory: <span className="text-emerald-400">/etc/nginx/conf.d/</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={onOpenCreateSiteModal}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            New Site
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-5">Virtual Host / Conf</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sites.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-500 font-medium">
                  No virtual host `.conf` files found in `/etc/nginx/conf.d/`
                </td>
              </tr>
            ) : (
              sites.map((s) => {
                const isToggling = togglingSite === s.name;
                const isFixing = fixingPermsSite === s.name;

                return (
                  <tr key={s.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-semibold text-slate-100">
                      {s.name}
                    </td>

                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          s.enabled
                            ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            s.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        {s.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right space-x-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => onOpenConfigEditor(s.name)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
                        title="Edit Raw Nginx Conf"
                      >
                        <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                        Edit
                      </button>

                      {/* Fix Perms Button */}
                      <button
                        disabled={isFixing}
                        onClick={() => handleFixPerms(s.name)}
                        className="px-2.5 py-1 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/40 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                        title="Fix Permissions & SELinux Context"
                      >
                        <ShieldAlert className={`w-3.5 h-3.5 inline mr-1 ${isFixing ? 'animate-spin' : ''}`} />
                        Perms
                      </button>

                      {/* Toggle Enable/Disable Button */}
                      <button
                        disabled={isToggling}
                        onClick={() => handleToggle(s.name, !s.enabled)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                          s.enabled
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            : 'bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <Power className={`w-3.5 h-3.5 inline mr-1 ${isToggling ? 'animate-spin' : ''}`} />
                        {s.enabled ? 'Disable' : 'Enable'}
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteModalSite(s.name)}
                        className="px-2 py-1 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 rounded-lg text-xs font-semibold transition"
                        title="Delete Virtual Host"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Typed Confirmation Deletion Modal */}
      {deleteModalSite && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-rose-500/40 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5" /> Delete Virtual Host
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-mono text-amber-300 font-bold">{deleteModalSite}</span>?
              This will remove the configuration file from `/etc/nginx/conf.d/` and reload Nginx.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Type <span className="font-mono text-slate-200 font-bold">{deleteModalSite}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={deleteModalSite}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteModalSite(null);
                  setTypedConfirm('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                disabled={typedConfirm !== deleteModalSite}
                onClick={confirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-lg shadow-rose-600/20"
              >
                Delete Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
