import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

export function ArtisanRunner({ laravelProjects, onRunArtisan }) {
  const [selectedPath, setSelectedPath] = useState(
    laravelProjects.length > 0 ? laravelProjects[0].path : ''
  );
  const [command, setCommand] = useState('migrate');
  const [customCommand, setCustomCommand] = useState('');
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);

  const presetCommands = [
    { label: 'php artisan migrate', value: 'migrate' },
    { label: 'php artisan db:seed', value: 'db:seed' },
    { label: 'php artisan cache:clear', value: 'cache:clear' },
    { label: 'php artisan route:clear', value: 'route:clear' },
    { label: 'php artisan config:clear', value: 'config:clear' },
    { label: 'php artisan storage:link', value: 'storage:link' },
    { label: 'php artisan key:generate', value: 'key:generate' },
  ];

  const handleRun = async (e) => {
    e.preventDefault();
    const finalCmd = command === 'custom' ? customCommand : command;
    if (!selectedPath || !finalCmd) return;

    setRunning(true);
    setOutput(null);

    try {
      const res = await onRunArtisan(selectedPath, finalCmd);
      setOutput(res);
    } catch (err) {
      setOutput({ success: false, error: err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Terminal className="w-5 h-5 text-rose-400" />
        </div>
        <div>
          <h2 className="font-bold text-slate-100 text-base">Laravel Artisan Terminal</h2>
          <p className="text-xs text-slate-400 font-mono">Safe local CLI command runner</p>
        </div>
      </div>

      <form onSubmit={handleRun} className="space-y-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 mb-1">
            Target Laravel Project *
          </label>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
          >
            {laravelProjects.length === 0 ? (
              <option value="">No Laravel projects detected in ~/Projects</option>
            ) : (
              laravelProjects.map((p) => (
                <option key={p.path} value={p.path}>
                  {p.name} ({p.path})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Select Command *
            </label>
            <select
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
            >
              {presetCommands.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
              <option value="custom">Custom permitted command...</option>
            </select>
          </div>

          {command === 'custom' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Custom Command
              </label>
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder="e.g. migrate:rollback"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={running || !selectedPath}
          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
          {running ? 'Running Artisan Command...' : 'Execute Command'}
        </button>
      </form>

      {/* Execution Output Console */}
      {output && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              {output.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              Output Result
            </span>
          </div>

          <pre className="p-3 bg-black/70 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto max-h-48 leading-normal">
            {output.output || output.error || 'Command finished with no output.'}
          </pre>
        </div>
      )}
    </div>
  );
}
