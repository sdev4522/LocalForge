import React, { useState, useEffect } from 'react';
import { Plus, Globe, Folder, ShieldCheck, Cpu } from 'lucide-react';

export function CreateSiteModal({
  isOpen,
  initialProject = null,
  onClose,
  onCreateSite,
}) {
  const [siteName, setSiteName] = useState('');
  const [domain, setDomain] = useState('');
  const [rootPath, setRootPath] = useState('');
  const [port, setPort] = useState('80');
  const [siteType, setSiteType] = useState('laravel');
  const [enableSsl, setEnableSsl] = useState(true);
  const [autoHosts, setAutoHosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialProject) {
      setSiteName(initialProject.name || '');
      setDomain(`${initialProject.name || 'app'}.local`);
      setRootPath(initialProject.path || '');
      setSiteType(initialProject.suggestedType || 'laravel');
    } else {
      setSiteName('');
      setDomain('');
      setRootPath('/home/sdev/Projects/');
      setSiteType('laravel');
    }
  }, [initialProject, isOpen]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setSiteName(val);
    if (!initialProject) {
      const clean = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setDomain(clean ? `${clean}.local` : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!siteName || !domain || !rootPath) return;

    setSubmitting(true);
    try {
      await onCreateSite({
        siteName,
        domain,
        rootPath,
        port: parseInt(port, 10) || 80,
        siteType,
        enableSsl,
        autoHosts,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-emerald-500/30 shadow-2xl overflow-y-auto max-h-[90vh]">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-emerald-400" /> Create Nginx Virtual Host
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Site Identifier *
            </label>
            <input
              type="text"
              required
              value={siteName}
              onChange={handleNameChange}
              placeholder="e.g. editxx"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Domain Name *
            </label>
            <input
              type="text"
              required
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g. editxx.local"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Document Root Directory *
            </label>
            <input
              type="text"
              required
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              placeholder="/home/sdev/Projects/my-app"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Preset Framework *
              </label>
              <select
                value={siteType}
                onChange={(e) => setSiteType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="laravel">Laravel PHP</option>
                <option value="vite-spa">Vite SPA (React/Vue)</option>
                <option value="wordpress">WordPress</option>
                <option value="static">Static HTML</option>
                <option value="proxy">Reverse Proxy (Node/Next)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="80"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={enableSsl}
                onChange={(e) => setEnableSsl(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
              />
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Generate Self-Signed SSL Certificate (HTTPS / TLS v1.3)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={autoHosts}
                onChange={(e) => setAutoHosts(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
              />
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Auto-map 127.0.0.1 to /etc/hosts</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              {submitting ? 'Creating Site & SSL...' : 'Create Virtual Host'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
