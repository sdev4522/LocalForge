import React, { useState, useEffect } from 'react';
import { Edit3, RotateCcw, Save, X, AlertTriangle, FileCode } from 'lucide-react';

export function ConfigEditorModal({
  isOpen,
  siteName,
  onClose,
  onFetchConfig,
  onSaveConfig,
  onFetchBackups,
  onRollbackBackup,
}) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [backups, setBackups] = useState([]);
  const [selectedBackup, setSelectedBackup] = useState('');
  const [rollingBack, setRollingBack] = useState(false);

  useEffect(() => {
    if (isOpen && siteName) {
      setLoading(true);
      Promise.all([onFetchConfig(siteName), onFetchBackups(siteName)])
        .then(([cfg, bckps]) => {
          setContent(cfg.content || '');
          setBackups(bckps || []);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, siteName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveConfig(siteName, content);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async () => {
    if (!selectedBackup) return;
    setRollingBack(true);
    try {
      await onRollbackBackup(siteName, selectedBackup);
      const updated = await onFetchConfig(siteName);
      setContent(updated.content || '');
    } finally {
      setRollingBack(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel p-6 rounded-2xl max-w-4xl w-full border border-slate-700/80 shadow-2xl flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Edit Raw Configuration</h3>
              <p className="text-xs font-mono text-emerald-400">/etc/nginx/conf.d/{siteName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Backups Rollback Bar */}
        {backups.length > 0 && (
          <div className="my-3 p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-slate-300 font-medium">Historical Backups (Last 5):</span>
              <select
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg font-mono text-slate-200 text-xs focus:outline-none"
              >
                <option value="">Select backup timestamp...</option>
                {backups.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <button
              disabled={!selectedBackup || rollingBack}
              onClick={handleRollback}
              className="px-3 py-1 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 border border-amber-800/40 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {rollingBack ? 'Rolling back...' : 'Rollback Version'}
            </button>
          </div>
        )}

        {/* Textarea Editor */}
        <div className="flex-1 my-2 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-medium">
              Loading configuration file...
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-black/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed select-text"
              spellCheck={false}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-500 font-mono">
            Saving automatically runs `sudo nginx -t` syntax check before reload.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-lg shadow-emerald-600/20"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving & Validating...' : 'Save & Reload Nginx'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
