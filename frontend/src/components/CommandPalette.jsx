import React, { useState, useEffect } from 'react';
import { Search, Server, Database, Code2, Plus, Globe, ExternalLink } from 'lucide-react';

export function CommandPalette({
  isOpen,
  onClose,
  onOpenCreateSiteModal,
  onServiceAction,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: 'create_site',
      title: 'Create New Virtual Host Site',
      subtitle: 'Setup domain, root directory, preset & SSL cert',
      icon: <Plus className="w-4 h-4 text-[#3ED598]" />,
      run: () => onOpenCreateSiteModal(),
    },
    {
      id: 'restart_nginx',
      title: 'Restart Nginx Engine',
      subtitle: 'Systemd service restart',
      icon: <Server className="w-4 h-4 text-[#3ED598]" />,
      run: () => onServiceAction('nginx', 'restart'),
    },
    {
      id: 'restart_mariadb',
      title: 'Restart MariaDB Database Server',
      subtitle: 'Systemd service restart',
      icon: <Database className="w-4 h-4 text-[#5B9DFF]" />,
      run: () => onServiceAction('mariadb', 'restart'),
    },
    {
      id: 'restart_php',
      title: 'Restart PHP-FPM 8.x Engine',
      subtitle: 'Systemd Unix socket reload',
      icon: <Code2 className="w-4 h-4 text-[#C9915B]" />,
      run: () => onServiceAction('php-fpm', 'restart'),
    },
    {
      id: 'phpmyadmin',
      title: 'Open phpMyAdmin Web Console',
      subtitle: 'http://localhost:8080',
      icon: <ExternalLink className="w-4 h-4 text-[#5B9DFF]" />,
      run: () => window.open('http://localhost:8080', '_blank'),
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="forge-panel max-w-xl w-full border-[#262A34] shadow-2xl overflow-hidden">
        <div className="flex items-center px-4 border-b border-[#262A34] bg-[#0D0F14]">
          <Search className="w-4 h-4 text-[#ACAFB8] shrink-0 mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search action..."
            className="w-full py-3.5 bg-transparent text-xs font-body text-[#EDEAE3] placeholder-[#7B7F8B] focus:outline-none"
            aria-label="Search actions input"
          />
          <kbd className="px-2 py-0.5 bg-[#191C24] text-[#ACAFB8] rounded text-[11px] font-mono border border-[#262A34]">
            ESC
          </kbd>
        </div>

        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#7B7F8B] font-medium">
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
                    ? 'bg-[#1F2330] text-[#EDEAE3]'
                    : 'text-[#ACAFB8] hover:bg-[#1F2330]/50'
                }`}
                aria-label={`Execute action ${item.title}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0D0F14] flex items-center justify-center border border-[#262A34]">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-xs text-[#EDEAE3]">{item.title}</h4>
                    <p className="text-[11px] text-[#7B7F8B] font-mono">{item.subtitle}</p>
                  </div>
                </div>
                {idx === selectedIndex && (
                  <span className="text-[11px] font-mono text-[#FF6A3D] bg-[#8A3F26]/30 px-2 py-0.5 rounded border border-[#FF6A3D]/30">
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
