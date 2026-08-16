import React, { useState, useEffect, useCallback } from 'react';
import { useSSE } from './hooks/useSSE';
import { apiFetch } from './api/fetchHelper';
import { Header } from './components/Header';
import { ServiceTile } from './components/ServiceTile';
import { SystemMetricsCard } from './components/SystemMetricsCard';
import { VirtualHostsTab } from './components/VirtualHostsTab';
import { MariaDBTab } from './components/MariaDBTab';
import { ProjectsScanner } from './components/ProjectsScanner';
import { LogViewer } from './components/LogViewer';
import { ArtisanRunner } from './components/ArtisanRunner';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { CommandPalette } from './components/CommandPalette';
import { CreateSiteModal } from './components/CreateSiteModal';
import { ConfigEditorModal } from './components/ConfigEditorModal';
import { ToastContainer } from './components/Toast';

export function App() {
  // SSE Stream for Hardware Metrics & Service Status
  const { data: metricsData, status: sseStatus } = useSSE('/api/metrics/stream');
  const metrics = metricsData?.services ? metricsData : null;
  const [initialServices, setInitialServices] = useState({ nginx: true, mariadb: true, phpFpm: true });

  const loadServicesStatus = useCallback(async () => {
    try {
      const data = await apiFetch('/api/services-status');
      if (data) setInitialServices({
        nginx: data.nginx ?? false,
        mariadb: data.mariadb ?? false,
        phpFpm: data.phpFpm ?? false,
      });
    } catch (err) {}
  }, []);

  const services = metrics?.services || initialServices;

  // Component Data State
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [databases, setDatabases] = useState([]);
  const [dbConfigured, setDbConfigured] = useState(true);
  const [toasts, setToasts] = useState([]);

  // Modals State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [createSiteModalOpen, setCreateSiteModalOpen] = useState(false);
  const [selectedProjectForSite, setSelectedProjectForSite] = useState(null);
  const [configEditorModalOpen, setConfigEditorModalOpen] = useState(false);
  const [editingSiteName, setEditingSiteName] = useState(null);
  const [diagnosticsModalOpen, setDiagnosticsModalOpen] = useState(false);

  // Toast Handler - Auto dismiss success after 4s, errors stay until dismissed
  const showToast = useCallback((title, message, type = 'info', details = null) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, message, type, details }]);

    if (type !== 'error') {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Data Loaders
  const loadSites = useCallback(async () => {
    try {
      const data = await apiFetch('/api/sites');
      if (Array.isArray(data)) setSites(data);
    } catch (err) {
      showToast('Failed to load sites', 'Could not retrieve virtual hosts from /etc/nginx/conf.d/', 'error', err.message);
    }
  }, [showToast]);

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiFetch('/api/scanned-projects');
      if (Array.isArray(data)) setProjects(data);
    } catch (err) {
      showToast('Failed to scan projects', 'Could not read projects directory ~/Projects', 'error', err.message);
    }
  }, [showToast]);

  const loadDatabases = useCallback(async () => {
    try {
      const [dbs, cfg] = await Promise.all([
        apiFetch('/api/db/list'),
        apiFetch('/api/db/config'),
      ]);
      if (Array.isArray(dbs)) setDatabases(dbs);
      setDbConfigured(cfg?.configured ?? true);
    } catch (err) {
      console.error('Error loading databases:', err);
    }
  }, []);

  useEffect(() => {
    loadServicesStatus();
    loadSites();
    loadProjects();
    loadDatabases();
  }, [loadServicesStatus, loadSites, loadProjects, loadDatabases]);

  // Service Actions (Start / Stop / Restart)
  const handleServiceAction = async (service, action) => {
    try {
      const data = await apiFetch('/api/service', {
        method: 'POST',
        body: { service, action },
      });
      showToast('Service Action', data.message, 'success');
      loadServicesStatus();
    } catch (err) {
      showToast(`Failed to ${action} ${service}`, `Command execution failed for ${service}`, 'error', err.details || err.message);
    }
  };

  // Virtual Host Site Actions
  const handleCreateSite = async (payload) => {
    try {
      const data = await apiFetch('/api/sites/create', {
        method: 'POST',
        body: payload,
      });
      showToast('Site Created', data.message, 'success');
      loadSites();
    } catch (err) {
      showToast('Site Creation Failed', 'Failed to generate Nginx configuration or SSL cert', 'error', err.details || err.message);
    }
  };

  const handleToggleSite = async (siteName, enable) => {
    try {
      const data = await apiFetch('/api/sites/toggle', {
        method: 'POST',
        body: { siteName, enable },
      });
      showToast('Site Status Updated', data.message, 'success');
      loadSites();
    } catch (err) {
      showToast('Toggle Failed', `Nginx syntax check or rename failed for ${siteName}`, 'error', err.details || err.message);
    }
  };

  const handleFixPermissions = async (siteName) => {
    const rootPath = `/home/sdev/Projects/${siteName.replace(/\.conf$/, '').replace(/\.disabled$/, '')}`;
    try {
      const data = await apiFetch('/api/sites/fix-permissions', {
        method: 'POST',
        body: { rootPath },
      });
      showToast('Permissions Fixed', data.message, 'success');
    } catch (err) {
      showToast('Permissions Fix Failed', 'Failed to run chmod/chcon on document root', 'error', err.details || err.message);
    }
  };

  const handleDeleteSite = async (siteName) => {
    try {
      const data = await apiFetch(`/api/sites/${siteName}`, { method: 'DELETE' });
      showToast('Site Deleted', data.message, 'success');
      loadSites();
    } catch (err) {
      showToast('Delete Failed', `Could not delete ${siteName} from /etc/nginx/conf.d/`, 'error', err.details || err.message);
    }
  };

  // Raw Config Editor Actions
  const fetchConfig = async (siteName) => {
    return await apiFetch(`/api/sites/config/${siteName}`);
  };

  const saveConfig = async (siteName, content) => {
    try {
      const data = await apiFetch('/api/sites/config/save', {
        method: 'POST',
        body: { siteName, content },
      });
      showToast('Config Saved', data.message, 'success');
      loadSites();
    } catch (err) {
      showToast('Config Save Failed', 'Nginx syntax test failed with edited configuration', 'error', err.details || err.message);
    }
  };

  const fetchBackups = async (siteName) => {
    return await apiFetch(`/api/sites/backups/${siteName}`);
  };

  const rollbackBackup = async (siteName, backupFile) => {
    try {
      const data = await apiFetch('/api/sites/config/rollback', {
        method: 'POST',
        body: { siteName, backupFile },
      });
      showToast('Rollback Successful', data.message, 'success');
      loadSites();
    } catch (err) {
      showToast('Rollback Failed', 'Failed to restore configuration backup', 'error', err.details || err.message);
    }
  };

  // MariaDB Actions
  const handleCreateDb = async (dbName, dbUser, dbPass) => {
    try {
      const data = await apiFetch('/api/db/create', {
        method: 'POST',
        body: { dbName, dbUser, dbPass },
      });
      showToast('Database Created', data.message, 'success');
      loadDatabases();
    } catch (err) {
      showToast('DB Creation Failed', 'Could not execute SQL CREATE DATABASE query', 'error', err.details || err.message);
    }
  };

  const handleDropDb = async (dbName) => {
    try {
      const data = await apiFetch(`/api/db/${dbName}`, { method: 'DELETE' });
      showToast('Database Dropped', data.message, 'success');
      loadDatabases();
    } catch (err) {
      showToast('Drop DB Failed', `Could not drop database ${dbName}`, 'error', err.details || err.message);
    }
  };

  const handleConfigureDb = async (user, pass) => {
    try {
      const data = await apiFetch('/api/db/config', {
        method: 'POST',
        body: { user, pass },
      });
      showToast('DB Auth Saved', data.message, 'success');
      loadDatabases();
    } catch (err) {
      showToast('DB Auth Failed', 'Invalid root credentials for MariaDB', 'error');
    }
  };

  // Artisan & Diagnostics Handlers
  const handleRunArtisan = async (rootPath, command) => {
    return await apiFetch('/api/laravel/artisan', {
      method: 'POST',
      body: { rootPath, command },
    });
  };

  const runDiagnostics = async () => {
    return await apiFetch('/api/diagnostics');
  };

  const laravelProjects = projects.filter((p) => p && p.suggestedType === 'laravel');

  return (
    <div className="min-h-screen bg-[#12141A] text-[#EDEAE3] flex flex-col selection:bg-[#FF6A3D]/30 selection:text-[#FF6A3D]">
      {/* Header Bar */}
      <Header
        onOpenCreateSiteModal={() => {
          setSelectedProjectForSite(null);
          setCreateSiteModalOpen(true);
        }}
        onOpenDiagnostics={() => setDiagnosticsModalOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Single-Page Bento Grid Dashboard */}
      <main className="flex-1 px-4 lg:px-8 py-6 w-full mx-auto space-y-6">
        {/* Bento Row 1: Core System Services Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <ServiceTile
            id="nginx"
            name="Nginx Engine"
            subtitle="Web & Reverse Proxy"
            icon="nginx"
            online={services?.nginx ?? false}
            details={{ label: 'Ports: 80, 443', value: '/etc/nginx/conf.d/' }}
            onAction={handleServiceAction}
          />

          <ServiceTile
            id="mariadb"
            name="MariaDB Server"
            subtitle="SQL Database Engine"
            icon="mariadb"
            online={services?.mariadb ?? false}
            details={{ label: 'Port: 3306', value: 'MariaDB 11.8' }}
            phpMyAdminLink={true}
            onAction={handleServiceAction}
          />

          <ServiceTile
            id="php-fpm"
            name="PHP-FPM 8.x"
            subtitle="FastCGI Process Manager"
            icon="php"
            online={services?.phpFpm ?? false}
            details={{ label: 'FastCGI Socket', value: '/run/php-fpm/' }}
            onAction={handleServiceAction}
          />
        </section>

        {/* Bento Row 2: 12-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Span 7): Virtual Hosts Manager & Live Nginx Log Streamer */}
          <div className="lg:col-span-7 space-y-6">
            <VirtualHostsTab
              sites={sites}
              onRefresh={loadSites}
              onOpenCreateSiteModal={() => {
                setSelectedProjectForSite(null);
                setCreateSiteModalOpen(true);
              }}
              onOpenConfigEditor={(name) => {
                setEditingSiteName(name);
                setConfigEditorModalOpen(true);
              }}
              onToggleSite={handleToggleSite}
              onFixPermissions={handleFixPermissions}
              onDeleteSite={handleDeleteSite}
            />

            <LogViewer />
          </div>

          {/* Right Column (Span 5): System Metrics, Projects, MariaDB & Artisan */}
          <div className="lg:col-span-5 space-y-6">
            <SystemMetricsCard
              metrics={metrics}
              sseStatus={sseStatus}
            />

            <ProjectsScanner
              projects={projects}
              onRescan={loadProjects}
              onQuickCreateSite={(proj) => {
                setSelectedProjectForSite(proj);
                setCreateSiteModalOpen(true);
              }}
            />

            <MariaDBTab
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

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenCreateSiteModal={() => {
          setSelectedProjectForSite(null);
          setCreateSiteModalOpen(true);
        }}
        onServiceAction={handleServiceAction}
      />

      {/* Virtual Host Modal */}
      <CreateSiteModal
        isOpen={createSiteModalOpen}
        initialProject={selectedProjectForSite}
        onClose={() => {
          setCreateSiteModalOpen(false);
          setSelectedProjectForSite(null);
        }}
        onCreateSite={handleCreateSite}
      />

      {/* Raw Config Editor Modal */}
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

      {/* System Integrity Diagnostics Modal */}
      <DiagnosticsModal
        isOpen={diagnosticsModalOpen}
        onClose={() => setDiagnosticsModalOpen(false)}
        onRunDiagnostics={runDiagnostics}
        onServiceAction={handleServiceAction}
      />

      {/* Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
