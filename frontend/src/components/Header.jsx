import React from 'react';
import { Search, Plus, Stethoscope } from 'lucide-react';

export function Header({
  onOpenCreateSiteModal,
  onOpenDiagnostics,
  onOpenCommandPalette,
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#191C24] border-b border-[#262A34] px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-lg">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6A3D] to-[#C9915B] p-0.5 shadow-md flex items-center justify-center">
          <div className="w-full h-full bg-[#12141A] rounded-[10px] flex items-center justify-center">
            <span className="font-mono font-black text-[#FF6A3D] text-lg">⚡</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-[#EDEAE3] text-lg tracking-tight">
              LocalForge
            </h1>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#8A3F26]/30 text-[#FF6A3D] border border-[#FF6A3D]/30">
              v1.3.0
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-[#ACAFB8]">
            <span>Fedora Native Stack</span>
            <span className="text-[#7B7F8B]">•</span>
            <span className="font-mono text-[11px] text-[#EDEAE3] bg-[#0D0F14] px-2 py-0.5 rounded border border-[#262A34]">
              API :4000
            </span>
          </div>
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCreateSiteModal}
          className="btn-primary flex items-center gap-2"
          aria-label="Create New Virtual Host Site"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>Create Site</span>
        </button>

        <button
          onClick={onOpenDiagnostics}
          className="btn-secondary flex items-center gap-2"
          aria-label="Run Integrity Diagnostics"
        >
          <Stethoscope className="w-4 h-4 text-[#5B9DFF] shrink-0" />
          <span className="hidden md:inline">Diagnostics</span>
        </button>

        <button
          onClick={onOpenCommandPalette}
          className="btn-secondary flex items-center gap-2 font-body"
          aria-label="Open Command Palette Search"
          title="Open Command Palette (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-[#ACAFB8] shrink-0" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="px-1.5 py-0.5 bg-[#0D0F14] text-[#ACAFB8] rounded text-[11px] font-mono border border-[#262A34]">
            Ctrl+K
          </kbd>
        </button>
      </div>
    </header>
  );
}
