import React, { useState, useEffect, useCallback } from 'react';
import { useMetricsSSE } from './hooks/useMetricsSSE';
import { Header } from './components/Header';
import { ServiceCard } from './components/ServiceCard';
import { VirtualHostsTable } from './components/VirtualHostsTable';
import { ProjectsScanner } from './components/ProjectsScanner';
import { DatabaseManager } from './components/DatabaseManager';
import { ArtisanRunner } from './components/ArtisanRunner';
import { LogViewer } from './components/LogViewer';
import { CommandPalette } from './components/CommandPalette';
import { CreateSiteModal } from './components/CreateSiteModal';
import { ConfigEditorModal } from './components/ConfigEditorModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { ActivityDrawer } from './components/ActivityDrawer';
import { ToastContainer } from './components/Toast';

export function App() {
  const metrics = useMetricsSSE();

  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [activities, setActivities] = useState([]);

  // Modals & Drawers state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [createSiteModalOpen, setCreateSiteModalOpen] = useState(false);
  const [selectedProjectForSite, setSelectedProjectForSite] = useState(null);
  const [configEditorModalOpen, setConfigEditorModalOpen] = useState(false);
  const [editingSiteName, setEditingSiteName] = useState(null);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);
  const [activityDrawerOpen, setActivityDrawerOpen] = useState(false);

  // Toast Helper
  const showToast = useCallback((title, message, type = 'info', details = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, details }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Log Activity
  const logActivity = useCallback((action, text) => {
    const newAct = {
      id: Date.now() + Math.random(),
      action,
      text,
      time: new Date().toLocaleTimeString(),
    };
    setActivities((prev) => [newAct, ...prev].slice(0, 50));
  }, []);

  // Fetch API Data
  const loadSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      if (Array.isArray(data)) setSites(data);
    } catch (err) {
      showToast('Failed to load sites', err.message, 'error');
    }
  }, [showToast]);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/scanned-projects');
      const data = await res.json();
      if (Array.isArray(data)) setProjects(data);
    } catch (err) {
      showToast('Failed to scan projects', err.message, 'error');
    }
  }, [showToast]);

  const loadDatabases = useCallback(async () => {
    try {
      const [dbRes, cfgRes] = await Promise.all([
        fetch('/api/db/list'),
        fetch('/api/db/config'),
      ]);
      const dbs = await dbRes.json();
      const cfg = await cfgRes.json();
      if (Array.isArray(dbs)) setDatabases(dbs);
      setDbConfigured(cfg.configured ?? true);
    } catch (err) {
      console.error('Error loading databases:', err);
    }
  }, []);

  useEffect(() => {
    loadSites();
    loadProjects();
    loadDatabases();
  }, [loadSites, loadProjects, loadDatabases]);

  // Service Control Action
  const handleServiceAction = async (service, action) => {
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, action }),
      });
      const data = await res.json();
      if (data.error) {
        showToast(`Failed to ${action} ${service}`, data.error, 'error', data.details);
      } else {
        showToast('Service Updated', data.message, 'success');
        logActivity('Service Action', `${service} was ${action}ed.`);
      }
    } catch (err) {
      showToast('Service Error', err.message, 'error');
    }
  };

  // Virtual Host Handlers
  const handleCreateSite = async (payload) => {
    try {
      const res = await fetch('/api/sites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.error) {
        showToast('Site Creation Failed', data.error, 'error', data.details);
      } else {
        showToast('Site Created', data.message, 'success');
        logActivity('Site Created', `Created ${payload.siteName}.conf (${payload.domain})`);
        loadSites();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleToggleSite = async (siteName, enable) => {
    try {
      const res = await fetch('/api/sites/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteName, enable }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('Toggle Failed', data.error, 'error', data.details);
      } else {
        showToast('Site Toggled', data.message, 'success');
        logActivity('Site Toggled', `${siteName} ${enable ? 'enabled' : 'disabled'}.`);
        loadSites();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleFixPermissions = async (siteName) => {
    const site = sites.find((s) => s.name === siteName);
    const rootPath = `/home/sdev/Projects/${siteName.replace(/\.conf$/, '').replace(/\.disabled$/, '')}`;

    try {
      const res = await fetch('/api/sites/fix-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath }),
      });
      const data = await res.json();
      if (data.error) {
        showToast('Permissions Fix Failed', data.error, 'error', data.details);
      } else {
        showToast('Permissions & SELinux Fixed', data.message, 'success');
        logActivity('Permissions Fixed', `Updated storage permissions on ${rootPath}`);
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDeleteSite = async (siteName) => {
    try {
      const res = await fetch(`/api/sites/${siteName}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) {
        showToast('Delete Failed', data.error, 'error', data.details);
      } else {
        showToast('Site Deleted', data.message, 'success');
        logActivity('Site Deleted', `Deleted virtual host ${siteName}`);
        loadSites();
      }
    } catch (err) {
      showToast('Error', err.message, 'error');
    }
  };

  // Raw Config Editor Handlers
  const fetchConfig = async (siteName) => {
    const res = await fetch(`/api/sites/config/${siteName}`);
    return await res.json();
  };

  const saveConfig = async (siteName, content) => {
    const res = await fetch('/api/sites/config/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName, content }),
    });
    const data = await res.json();
    if (data.error) {
      showToast('Save Failed', data.error, 'error', data.details);
    } else {
      showToast('Config Saved', data.message, 'success');
      logActivity('Config Edit', `Saved changes to ${siteName}`);
      loadSites();
    }
  };

  const fetchBackups = async (siteName) => {
    const res = await fetch(`/api/sites/backups/${siteName}`);
    return await res.json();
  };

  const rollbackBackup = async (siteName, backupFile) => {
    const res = await fetch('/api/sites/config/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteName, backupFile }),
    });
    const data = await res.json();
    if (data.error) {
      showToast('Rollback Failed', data.error, 'error', data.details);
    } else {
      showToast('Rollback Successful', data.message, 'success');
      logActivity('Rollback', `Rolled back ${siteName} to ${backupFile}`);
      loadSites();
    }
  };

  // Database Handlers
  const handleCreateDb = async (dbName, dbUser, dbPass) => {
    const res = await fetch('/api/db/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dbName, dbUser, dbPass }),
    });
    const data = await res.json();
    if (data.error) {
      showToast('DB Creation Failed', data.error, 'error', data.details);
    } else {
      showToast('Database Created', data.message, 'success');
      logActivity('DB Created', `Created database ${dbName}`);
      loadDatabases();
    }
  };

  const handleDropDb = async (dbName) => {
    const res = await fetch(`/api/db/${dbName}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.error) {
      showToast('Drop DB Failed', data.error, 'error', data.details);
    } else {
      showToast('Database Dropped', data.message, 'success');
      logActivity('DB Dropped', `Dropped database ${dbName}`);
      loadDatabases();
    }
  };

  const handleConfigureDb = async (user, pass) => {
    const res = await fetch('/api/db/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, pass }),
    });
    const data = await res.json();
    if (data.error) {
      showToast('Auth Config Failed', data.error, 'error');
    } else {
      showToast('DB Auth Saved', data.message, 'success');
      loadDatabases();
    }
  };

  // Artisan Handler
  const handleRunArtisan = async (rootPath, command) => {
    const res = await fetch('/api/laravel/artisan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rootPath, command }),
    });
    const data = await res.json();
    if (data.success) {
      logActivity('Artisan Command', `Ran php artisan ${command}`);
    }
    return data;
  };

  // Diagnostics Handler
  const runDiagnostics = async () => {
    const res = await fetch('/api/diagnostics');
    return await res.json();
  };

  const laravelProjects = projects.filter((p) => p.suggestedType === 'laravel');

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navigation Header */}
      <Header
        metrics={metrics}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
        onToggleActivityDrawer={() => setActivityDrawerOpen((prev) => !prev)}
      />

      {/* Main Content Layout */}
      <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Service Control Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ServiceCard
            id="nginx"
            name="Nginx Engine"
            subtitle="Web & Reverse Proxy"
            icon="nginx"
            online={metrics.services.nginx}
            details={{ label: 'Ports: 80, 443', value: '/etc/nginx/conf.d/' }}
            onAction={handleServiceAction}
          />

          <ServiceCard
            id="mariadb"
            name="MariaDB Server"
            subtitle="SQL Database Engine"
            icon="mariadb"
            online={metrics.services.mariadb}
            details={{ label: 'Port: 3306', value: 'MariaDB 11.8' }}
            phpMyAdminLink={true}
            onAction={handleServiceAction}
          />

          <ServiceCard
            id="php-fpm"
            name="PHP-FPM 8.x"
            subtitle="FastCGI Process Manager"
            icon="php"
            online={metrics.services.phpFpm}
            details={{ label: 'FastCGI Socket', value: '/run/php-fpm/' }}
            onAction={handleServiceAction}
          />
        </section>

        {/* Main Workspace Split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Virtual Hosts Table & Log Stream) - 2 Spans */}
          <div className="lg:col-span-2 space-y-6">
            <VirtualHostsTable
              sites={sites}
              onRefresh={loadSites}
              onOpenCreateSiteModal={() => {
                setSelectedProjectForSite(null);
                setCreateSiteModalOpen(true);
              }}
              onOpenConfigEditor={(siteName) => {
                setEditingSiteName(siteName);
                setConfigEditorModalOpen(true);
              }}
              onToggleSite={handleToggleSite}
              onFixPermissions={handleFixPermissions}
              onDeleteSite={handleDeleteSite}
            />

            <LogViewer />
          </div>

          {/* Right Column (Projects, Database Manager, Artisan) - 1 Span */}
          <div className="space-y-6">
            <ProjectsScanner
              projects={projects}
              onRescan={loadProjects}
              onQuickCreateSite={(proj) => {
                setSelectedProjectForSite(proj);
                setCreateSiteModalOpen(true);
              }}
            />

            <DatabaseManager
              databases={databases}
              dbConfigured={dbConfigured}
              onRefreshDbs={loadDatabases}
              onCreateDb={handleCreateDb}
              onDropDb={handleDropDb}
              onConfigureDb={handleConfigureDb}
            />

            <ArtisanRunner
              laravelProjects={laravelProjects}
              onRunArtisan={handleRunArtisan}
            />
          </div>
        </div>
      </main>

      {/* Global Modals & Drawers */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenCreateSiteModal={() => {
          setSelectedProjectForSite(null);
          setCreateSiteModalOpen(true);
        }}
        onServiceAction={handleServiceAction}
        onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
        onToggleActivityDrawer={() => setActivityDrawerOpen((prev) => !prev)}
        onFixAllPermissions={() => handleFixPermissions('editxx.conf')}
      />

      <CreateSiteModal
        isOpen={createSiteModalOpen}
        initialProject={selectedProjectForSite}
        onClose={() => {
          setCreateSiteModalOpen(false);
          setSelectedProjectForSite(null);
        }}
        onCreateSite={handleCreateSite}
      />

      <ConfigEditorModal
        isOpen={configEditorModalOpen}
        siteName={editingSiteName}
        onClose={() => {
          setConfigEditorModalOpen(false);
          setEditingSiteName(null);
        }}
        onFetchConfig={fetchConfig}
        onSaveConfig={saveConfig}
        onFetchBackups={fetchBackups}
        onRollbackBackup={rollbackBackup}
      />

      <DiagnosticsModal
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        onRunDiagnostics={runDiagnostics}
        onServiceAction={handleServiceAction}
      />

      <ActivityDrawer
        isOpen={activityDrawerOpen}
        onClose={() => setActivityDrawerOpen(false)}
        activities={activities}
        onClearActivities={() => setActivities([])}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
