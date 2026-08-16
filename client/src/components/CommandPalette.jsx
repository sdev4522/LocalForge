import React, { useState, useEffect } from 'react';
import { Search, Server, Database, Code2, Plus, Stethoscope, Activity, ExternalLink, ShieldAlert, Terminal } from 'lucide-react';

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCreateSiteModal,
  onServiceAction,
  onOpenDiagnostics,
  onToggleActivityDrawer,
  onFixAllPermissions,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: 'create_site',
      title: 'Create New Virtual Host Site',
      subtitle: 'Setup domain, root directory, preset & SSL cert',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      run: () => onOpenCreateSiteModal(),
    },
    {
      id: 'restart_nginx',
      title: 'Restart Nginx Engine',
      subtitle: 'Systemd service restart',
      icon: <Server className="w-4 h-4 text-emerald-400" />,
      run: () => onServiceAction('nginx', 'restart'),
    },
    {
      id: 'restart_mariadb',
      title: 'Restart MariaDB Database Server',
      subtitle: 'Systemd service restart',
      icon: <Database className="w-4 h-4 text-blue-400" />,
      run: () => onServiceAction('mariadb', 'restart'),
    },
    {
      id: 'restart_php',
      title: 'Restart PHP-FPM 8.x Engine',
      subtitle: 'Systemd Unix socket reload',
      icon: <Code2 className="w-4 h-4 text-indigo-400" />,
      run: () => onServiceAction('php-fpm', 'restart'),
    },
    {
      id: 'phpmyadmin',
      title: 'Open phpMyAdmin Web Console',
      subtitle: 'http://localhost:8080',
      icon: <ExternalLink className="w-4 h-4 text-blue-400" />,
      run: () => window.open('http://localhost:8080', '_blank'),
    },
    {
      id: 'diagnostics',
      title: 'Run System Integrity Diagnostics',
      subtitle: 'Syntax, sockets, auth, port checks',
      icon: <Stethoscope className="w-4 h-4 text-indigo-400" />,
      run: () => onOpenDiagnostics(),
    },
    {
      id: 'timeline',
      title: 'Toggle Activity Timeline Drawer',
      subtitle: 'View recent stack activity logs',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      run: () => onToggleActivityDrawer(),
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // open
        }
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(filtered.length, 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(filtered.length, 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="glass-panel rounded-2xl max-w-xl w-full border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800 bg-slate-900/60">
          <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action (e.g. restart, site, db)..."
            className="w-full py-3.5 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Action List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 font-medium">
              No matching stack commands found
            </div>
          ) : (
            filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  item.run();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-colors ${
                  idx === selectedIndex
                    ? 'bg-slate-800 text-slate-100'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center border border-slate-800">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-slate-200">{item.title}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{item.subtitle}</p>
                  </div>
                </div>
                {idx === selectedIndex && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Press ↵
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
