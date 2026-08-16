import React, { useState } from 'react';
import { DatabaseCard } from './DatabaseCard';
import { Database, Plus, RefreshCw, Key, ExternalLink, ShieldAlert } from 'lucide-react';

export function MariaDBTab({
  databases,
  dbConfigured,
  onRefreshDbs,
  onCreateDb,
  onDropDb,
  onConfigureDb,
}) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dbName, setDbName] = useState('');
  const [dbUser, setDbUser] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  const [dropModalDb, setDropModalDb] = useState(null);
  const [typedConfirm, setTypedConfirm] = useState('');

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [credUser, setCredUser] = useState('root');
  const [credPass, setCredPass] = useState('');

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!dbName) return;
    setLoadingCreate(true);
    try {
      await onCreateDb(dbName, dbUser || dbName, dbPass || 'password');
      setCreateModalOpen(false);
      setDbName('');
      setDbUser('');
      setDbPass('');
    } finally {
      setLoadingCreate(false);
    }
  };

  const confirmDrop = async () => {
    if (!dropModalDb) return;
    if (typedConfirm !== dropModalDb) return;
    await onDropDb(dropModalDb);
    setDropModalDb(null);
    setTypedConfirm('');
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    await onConfigureDb(credUser, credPass);
    setConfigModalOpen(false);
  };

  const safeDatabases = Array.isArray(databases) ? databases : [];

  return (
    <div className="forge-panel p-5 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#262A34]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
            <Database className="w-5 h-5 text-[#5B9DFF]" />
          </div>
          <div>
            <h2 className="font-display font-bold text-[#EDEAE3] text-base">MariaDB Database Manager</h2>
            <p className="text-xs text-[#ACAFB8] font-mono">Local MySQL / MariaDB Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            aria-label="Open phpMyAdmin Web Console"
          >
            <span>phpMyAdmin</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#5B9DFF]" />
          </a>

          {!dbConfigured && (
            <button
              onClick={() => setConfigModalOpen(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 text-[#F5B94D]"
              aria-label="Configure Root Password"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Auth</span>
            </button>
          )}

          <button
            onClick={onRefreshDbs}
            className="btn-ghost p-2"
            aria-label="Refresh Databases List"
            title="Refresh Databases"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            aria-label="Create New MariaDB Database"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create DB</span>
          </button>
        </div>
      </div>

      {/* Grid of Databases */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
        {safeDatabases.length === 0 ? (
          <div className="col-span-full p-6 text-center space-y-3 bg-[#0D0F14] rounded-xl border border-[#262A34]">
            <Database className="w-8 h-8 text-[#7B7F8B] mx-auto" />
            <div>
              <p className="text-xs font-semibold text-[#EDEAE3]">No user databases created yet</p>
              <p className="text-[11px] text-[#ACAFB8] mt-0.5">
                Create a database and user with privileges in MariaDB.
              </p>
            </div>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="btn-primary text-xs py-1.5 px-3.5 mx-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Database</span>
            </button>
          </div>
        ) : (
          safeDatabases.map((db, idx) => {
            const dbNameStr = typeof db === 'object' && db !== null ? (db.name || '') : String(db || '');
            return (
              <DatabaseCard key={dbNameStr || idx} dbName={dbNameStr} onDropRequest={(name) => setDropModalDb(name)} />
            );
          })
        )}
      </div>

      {/* Create DB Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="forge-panel p-6 max-w-md w-full border-[#262A34] shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-[#EDEAE3] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#5B9DFF]" /> Create MariaDB Database
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g. editxx_db"
                  className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
                  Database User (Optional)
                </label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="Leave empty to match database name"
                  className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
                  Password (Optional)
                </label>
                <input
                  type="text"
                  value={dbPass}
                  onChange={(e) => setDbPass(e.target.value)}
                  placeholder="Default: password"
                  className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingCreate}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {loadingCreate ? 'Creating...' : 'Create Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drop DB Confirmation Modal */}
      {dropModalDb && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="forge-panel p-6 max-w-md w-full border-[#FF5C5C]/40 shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-[#FF5C5C] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" /> Permanent Drop Database
            </h3>
            <p className="text-xs text-[#ACAFB8] leading-relaxed">
              This will permanently drop the database{' '}
              <span className="font-mono text-[#F5B94D] font-bold">{dropModalDb}</span> and all its tables and data. This action cannot be undone.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-[#ACAFB8] mb-1">
                Type <span className="font-mono text-[#EDEAE3] font-bold">{dropModalDb}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={dropModalDb}
                className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF5C5C]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setDropModalDb(null);
                  setTypedConfirm('');
                }}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                disabled={typedConfirm !== dropModalDb}
                onClick={confirmDrop}
                className="btn-destructive text-xs py-2 px-4"
              >
                Drop Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Config Modal */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="forge-panel p-6 max-w-md w-full border-[#262A34] shadow-2xl space-y-4">
            <h3 className="text-lg font-display font-bold text-[#EDEAE3] flex items-center gap-2">
              <Key className="w-5 h-5 text-[#F5B94D]" /> MariaDB Root Credentials
            </h3>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">User</label>
                <input
                  type="text"
                  value={credUser}
                  onChange={(e) => setCredUser(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">Password</label>
                <input
                  type="password"
                  value={credPass}
                  onChange={(e) => setCredPass(e.target.value)}
                  placeholder="Root Password"
                  className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs py-2 px-4"
                >
                  Save Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
