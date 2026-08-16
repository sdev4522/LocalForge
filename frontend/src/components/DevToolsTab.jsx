import React from 'react';
import { LogViewer } from './LogViewer';
import { ArtisanRunner } from './ArtisanRunner';
import { DiagnosticsPanel } from './DiagnosticsPanel';

export function DevToolsTab({
  laravelProjects,
  onRunArtisan,
  onRunDiagnostics,
  onServiceAction,
}) {
  return (
    <div className="space-y-6">
      {/* Real-time Logs Tailing */}
      <LogViewer />

      {/* Grid Split: Artisan & Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArtisanRunner
          laravelProjects={laravelProjects}
          onRunArtisan={onRunArtisan}
        />

        <DiagnosticsPanel
          onRunDiagnostics={onRunDiagnostics}
          onServiceAction={onServiceAction}
        />
      </div>
    </div>
  );
}
