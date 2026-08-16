import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, AlertTriangle } from 'lucide-react';

export function ArtisanRunner({ laravelProjects, onRunArtisan }) {
  const safeProjects = Array.isArray(laravelProjects) ? laravelProjects : [];
  const [selectedPath, setSelectedPath] = useState(
    safeProjects.length > 0 ? safeProjects[0].path : ''
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
    <div className="forge-panel p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-3 pb-3 border-b border-[#262A34]">
        <div className="w-9 h-9 rounded-xl bg-[#0D0F14] border border-[#262A34] flex items-center justify-center">
          <Terminal className="w-5 h-5 text-[#FF6A3D]" />
        </div>
        <div>
          <h2 className="font-display font-bold text-[#EDEAE3] text-base">Laravel Artisan Terminal</h2>
          <p className="text-xs text-[#ACAFB8] font-mono">Safe Local CLI Command Runner</p>
        </div>
      </div>

      <form onSubmit={handleRun} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
            Target Laravel Project *
          </label>
          <select
            value={selectedPath}
            onChange={(e) => setSelectedPath(e.target.value)}
            className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
            aria-label="Select target Laravel project"
          >
            {safeProjects.length === 0 ? (
              <option value="">No Laravel projects detected in ~/Projects</option>
            ) : (
              safeProjects.map((p) => (
                <option key={p.path} value={p.path}>
                  {p.name} ({p.path})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
              Select Command *
            </label>
            <select
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
              aria-label="Select Artisan command to execute"
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
              <label className="block text-xs font-semibold text-[#ACAFB8] mb-1">
                Custom Command
              </label>
              <input
                type="text"
                value={customCommand}
                onChange={(e) => setCustomCommand(e.target.value)}
                placeholder="e.g. migrate:rollback"
                className="w-full px-3 py-2 bg-[#0D0F14] border border-[#262A34] rounded-xl text-xs font-mono text-[#EDEAE3] focus:outline-none focus:border-[#FF6A3D]"
                aria-label="Custom permitted artisan command"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={running || !selectedPath}
          className="btn-primary w-full justify-center py-2 text-xs"
          aria-label="Execute Artisan Command"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Executing Command...' : 'Execute Command'}</span>
        </button>
      </form>

      {output && (
        <div className="mt-4 pt-3 border-t border-[#262A34]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-[#EDEAE3] flex items-center gap-1.5">
              {output.success ? (
                <CheckCircle2 className="w-4 h-4 text-[#3ED598]" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#FF5C5C]" />
              )}
              Execution Console Output
            </span>
          </div>

          <pre className="p-3 bg-[#0D0F14] rounded-xl border border-[#262A34] font-mono text-[11px] text-[#EDEAE3] overflow-x-auto max-h-48 leading-normal select-text">
            {output.output || output.error || 'Command finished with no output.'}
          </pre>
        </div>
      )}
    </div>
  );
}
