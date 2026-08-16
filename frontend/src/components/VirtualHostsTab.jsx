import React, { useState } from 'react';
import { SiteCard } from './SiteCard';
import { Globe, Plus, RefreshCw, ShieldAlert, Search } from 'lucide-react';

export function VirtualHostsTab({
  sites,
  onRefresh,
  onOpenCreateSiteModal,
  onOpenConfigEditor,
  onToggleSite,
  onFixPermissions,
  onDeleteSite,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [deleteModalSite, setDeleteModalSite] = useState(null);
  const [typedConfirm, setTypedConfirm] = useState('');

  const safeSites = Array.isArray(sites) ? sites : [];
  const filteredSites = safeSites.filter((s) =>
    s && s.name && s.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const confirmDelete = async () => {
    if (!deleteModalSite) return;
    if (typedConfirm !== deleteModalSite) return;
    await onDeleteSite(deleteModalSite);
    setDeleteModalSite(null);
    setTypedConfirm('');
  };

  return (
    <div className="forge-panel p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262A34]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#3ED598]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[#EDEAE3] text-base">Active Virtual Hosts</h2>
            <p className="text-xs text-[#ACAFB8] font-mono">
              Directory: <span className="text-[#3ED598]">/etc/nginx/conf.d/</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#ACAFB8] absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter sites..."
              className="pl-8 pr-3 py-1.5 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D] w-36 sm:w-44"
              aria-label="Filter virtual host sites"
            />
          </div>

          <button
            onClick={onRefresh}
            className="btn-ghost p-2"
            aria-label="Refresh Virtual Host Sites"
            title="Refresh Sites"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenCreateSiteModal}
            className="btn-primary text-xs py-1.5 px-3"
            aria-label="Create New Virtual Host Site"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Site</span>
          </button>
        </div>
      </div>

      {/* Sites Vertical List */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
        {filteredSites.length === 0 ? (
          <div className="p-6 text-center space-y-3 bg-[#0D0F14] rounded-xl border border-[#262A34]">
            <Globe className="w-8 h-8 text-[#7B7F8B] mx-auto" />
            <div>
              <p className="text-xs font-semibold text-[#EDEAE3]">No virtual host configuration files found</p>
              <p className="text-[11px] text-[#ACAFB8] mt-0.5">
                {sites.length === 0
                  ? 'Get started by creating your first Nginx domain virtual host.'
                  : 'No virtual host matches your search query.'}
              </p>
            </div>
            {sites.length === 0 && (
              <button
                onClick={onOpenCreateSiteModal}
                className="btn-primary text-xs py-1.5 px-3.5 mx-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Site</span>
              </button>
            )}
          </div>
        ) : (
          filteredSites.map((site) => (
            <SiteCard
              key={site.name}
              site={site}
              onToggleSite={onToggleSite}
              onOpenConfigEditor={onOpenConfigEditor}
              onFixPermissions={onFixPermissions}
              onDeleteSiteRequest={(name) => setDeleteModalSite(name)}
            />
          ))
        )}
      </div>

      {/* Deletion Modal */}
      {deleteModalSite && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="forge-panel p-6 max-w-md w-full border-[#FF5C5C]/40 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-[#FF5C5C] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Permanent Delete Virtual Host
            </h3>
            <p className="text-xs text-[#ACAFB8] leading-relaxed">
              This will permanently delete the configuration file{' '}
              <span className="font-mono text-[#F5B94D] font-bold">{deleteModalSite}</span> from `/etc/nginx/conf.d/` and reload Nginx.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#ACAFB8] mb-1">
                Type <span className="font-mono text-[#EDEAE3] font-bold">{deleteModalSite}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={deleteModalSite}
                className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF5C5C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDeleteModalSite(null);
                  setTypedConfirm('');
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                disabled={typedConfirm !== deleteModalSite}
                onClick={confirmDelete}
                className="btn-destructive text-xs py-2 px-4"
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
