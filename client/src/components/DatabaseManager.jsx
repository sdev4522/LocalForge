import React, { useState } from 'react';
import { Database, Plus, Download, Trash2, ShieldAlert, Key, ExternalLink } from 'lucide-react';

export function DatabaseManager({
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

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-bold text-slate-100 text-base">MariaDB Databases</h2>
            <p className="text-xs text-slate-400 font-mono">Local SQL Database Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!dbConfigured && (
            <button
              onClick={() => setConfigModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/80 text-amber-300 border border-amber-800/40 rounded-xl text-xs font-semibold transition"
            >
              <Key className="w-3.5 h-3.5" />
              Auth
            </button>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            Create DB
          </button>
        </div>
      </div>

      {/* Database List */}
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {databases.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-xs font-medium bg-slate-950/40 rounded-xl border border-slate-800/50">
            No user databases created yet in MariaDB
          </div>
        ) : (
          databases.map((db) => (
            <div
              key={db}
              className="p-3 bg-slate-900/60 hover:bg-slate-800/60 rounded-xl border border-slate-800/60 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-mono font-semibold text-slate-200 text-xs truncate">{db}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`/api/db/export/${db}`}
                  download={`${db}.sql`}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
                  title="Export SQL Dump"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setDropModalDb(db)}
                  className="p-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/40 rounded-lg text-xs transition"
                  title="Drop Database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create DB Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-blue-500/40 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-blue-400" /> Create MariaDB Database
            </h3>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  required
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="e.g. editxx_db"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Database User (Optional)
                </label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="Leave empty to match database name"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password (Optional)
                </label>
                <input
                  type="text"
                  value={dbPass}
                  onChange={(e) => setDbPass(e.target.value)}
                  placeholder="Default: password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingCreate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-rose-500/40 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-400 flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5" /> Drop Database
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to permanently drop database{' '}
              <span className="font-mono text-amber-300 font-bold">{dropModalDb}</span>? All tables and data will be destroyed.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Type <span className="font-mono text-slate-200 font-bold">{dropModalDb}</span> to confirm:
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={dropModalDb}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDropModalDb(null);
                  setTypedConfirm('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                disabled={typedConfirm !== dropModalDb}
                onClick={confirmDrop}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-40 shadow-lg shadow-rose-600/20"
              >
                Drop Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Config Modal */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-amber-500/40 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-amber-400" /> MariaDB Root Password
            </h3>

            <form onSubmit={handleConfigSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">User</label>
                <input
                  type="text"
                  value={credUser}
                  onChange={(e) => setCredUser(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={credPass}
                  onChange={(e) => setCredPass(e.target.value)}
                  placeholder="Root Password"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfigModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-amber-600/20"
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
