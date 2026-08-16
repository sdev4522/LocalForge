import React, { useState, useEffect } from 'react';
import { RotateCcw, Save, X, FileCode } from 'lucide-react';

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
          setContent(cfg?.content || '');
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
      setContent(updated?.content || '');
    } finally {
      setRollingBack(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="forge-panel p-6 max-w-4xl w-full border-[#262A34] shadow-2xl flex flex-col h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-[#262A34]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
              <FileCode className="w-5 h-5 text-[#3ED598]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#EDEAE3] text-base">Edit Raw Configuration</h3>
              <p className="text-xs font-mono text-[#3ED598]">/etc/nginx/conf.d/{siteName}</p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost p-1.5" aria-label="Close modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        {backups.length > 0 && (
          <div className="my-3 p-3 bg-[#0D0F14] rounded-xl border border-[#262A34] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#F5B94D] shrink-0" />
              <span className="text-[#ACAFB8] font-medium">Historical Backups (Last 5):</span>
              <select
                value={selectedBackup}
                onChange={(e) => setSelectedBackup(e.target.value)}
                className="px-2.5 py-1 bg-[#191C24] border border-[#262A34] rounded-lg font-mono text-[#EDEAE3] text-xs focus:outline-none"
                aria-label="Select historical config backup timestamp"
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
              className="btn-secondary text-xs py-1 px-3 text-[#F5B94D]"
              aria-label="Rollback config version"
            >
              {rollingBack ? 'Rolling back...' : 'Rollback Version'}
            </button>
          </div>
        )}

        <div className="flex-1 my-2 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-[#7B7F8B] font-medium text-xs">
              Loading configuration file...
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-4 bg-[#0D0F14] border border-[#262A34] rounded-xl font-mono text-xs text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D] resize-none leading-relaxed select-text"
              spellCheck={false}
              aria-label="Nginx raw configuration content"
            />
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#262A34]">
          <p className="text-[11px] text-[#7B7F8B] font-mono">
            Saving automatically runs `sudo nginx -t` syntax check before reload.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="btn-primary text-xs py-2 px-5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving & Validating...' : 'Save & Reload Nginx'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
