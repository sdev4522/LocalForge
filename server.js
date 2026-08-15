const express = require('express');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const si = require('systeminformation');

const app = express();
const PORT = 4000;
const NGINX_CONF_DIR = '/etc/nginx/conf.d';
const NGINX_BACKUP_DIR = path.join(NGINX_CONF_DIR, '.backups');
const NGINX_SSL_DIR = path.join(__dirname, 'ssl');
const USER_HOME = os.homedir();
const PROJECTS_BASE_DIR = path.join(USER_HOME, 'Projects');
const DB_CONFIG_FILE = path.join(__dirname, '.db_config.json');

// Process-level crash guards to keep the server process alive
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception caught by guard:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection caught by guard:', reason);
});

app.use(express.json({ limit: '15mb' }));
app.use(express.static('public'));

// Ensure required directories exist
[NGINX_SSL_DIR, NGINX_BACKUP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    exec(`sudo mkdir -p "${dir}"`, () => {});
  }
});

// Cleanup stale temporary SQL and config files on startup
const cleanupStaleTempFiles = () => {
  try {
    const tmpFiles = fs.readdirSync('/tmp');
    tmpFiles.forEach(file => {
      if (file.startsWith('query_') || file.startsWith('mariadb_') || file.startsWith('edit_') || file.startsWith('test_')) {
        const filePath = path.join('/tmp', file);
        try {
          const stats = fs.statSync(filePath);
          if (Date.now() - stats.mtimeMs > 5 * 60 * 1000) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {}
      }
    });
  } catch (e) {}
};
cleanupStaleTempFiles();

// Load stored DB credentials if present
let dbConfig = { user: 'root', pass: '' };
if (fs.existsSync(DB_CONFIG_FILE)) {
  try {
    const raw = fs.readFileSync(DB_CONFIG_FILE, 'utf8');
    dbConfig = JSON.parse(raw);
  } catch (e) {}
}

// System Command Runner with configurable timeout & buffer safety
const runCommand = (cmd, cwd = PROJECTS_BASE_DIR, timeout = 10000) => {
  return new Promise((resolve) => {
    exec(cmd, { cwd, maxBuffer: 15 * 1024 * 1024, timeout }, (error, stdout, stderr) => {
      if (error) {
        if (error.killed) {
          resolve({ success: false, error: `Command timed out after ${timeout}ms: ${cmd}` });
        } else {
          resolve({ success: false, error: (stderr || stdout || error.message).trim(), code: error.code });
        }
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });
  });
};

// MariaDB SQL execution helper using temporary SQL file and options file
const execSqlScript = async (sqlContent, customConfig = null) => {
  const cfg = customConfig || dbConfig;
  const tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const tempSqlPath = `/tmp/query_${tempId}.sql`;
  const tempCnfPath = `/tmp/mariadb_${tempId}.cnf`;

  try {
    fs.writeFileSync(tempSqlPath, sqlContent, 'utf8');

    let res;
    if (cfg.pass) {
      const cnfContent = `[client]\nuser="${cfg.user || 'root'}"\npassword="${cfg.pass.replace(/"/g, '\\"')}"\n`;
      fs.writeFileSync(tempCnfPath, cnfContent, 'utf8');
      fs.chmodSync(tempCnfPath, 0o600);

      res = await runCommand(`mariadb --defaults-extra-file=${tempCnfPath} < ${tempSqlPath}`);
      if (!res.success && res.error.includes('command not found')) {
        res = await runCommand(`mysql --defaults-extra-file=${tempCnfPath} < ${tempSqlPath}`);
      }
    } else {
      res = await runCommand(`sudo mariadb < ${tempSqlPath}`);
      if (!res.success && (res.error.includes('command not found') || res.error.includes('Access denied'))) {
        let resSudoMysql = await runCommand(`sudo mysql < ${tempSqlPath}`);
        if (resSudoMysql.success) res = resSudoMysql;
      }
      if (!res.success && res.error.includes('password is required')) {
        res = await runCommand(`mariadb < ${tempSqlPath}`);
      }
    }

    if (!res.success) {
      if (res.error.includes('Access denied for user')) {
        return {
          success: false,
          error: `MariaDB Access Denied for user '${cfg.user || 'root'}'.`,
          details: `MariaDB root user requires a password or socket authentication.\n\nSolution: Click "⚙️ DB Password" in the panel and enter your MariaDB root password.`
        };
      }
      if (res.error.includes('password is required')) {
        return {
          success: false,
          error: 'Sudo permission required for MariaDB root socket.',
          details: 'Please run the visudo setup command in your terminal.'
        };
      }
      return { success: false, error: res.error };
    }

    return { success: true, output: res.output };
  } catch (err) {
    return { success: false, error: err.message };
  } finally {
    if (fs.existsSync(tempSqlPath)) try { fs.unlinkSync(tempSqlPath); } catch (e) {}
    if (fs.existsSync(tempCnfPath)) try { fs.unlinkSync(tempCnfPath); } catch (e) {}
  }
};

// 5-Version Config Backup Helper
const saveConfigBackup = async (siteName) => {
  const cleanName = path.basename(siteName);
  const targetPath = path.join(NGINX_CONF_DIR, cleanName);
  if (!fs.existsSync(targetPath)) return;

  await runCommand(`sudo mkdir -p "${NGINX_BACKUP_DIR}"`);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `${cleanName}_${timestamp}.conf`;
  const backupPath = path.join(NGINX_BACKUP_DIR, backupFileName);

  await runCommand(`sudo cp "${targetPath}" "${backupPath}"`);

  try {
    const files = fs.readdirSync(NGINX_BACKUP_DIR);
    const siteBackups = files
      .filter(f => f.startsWith(cleanName + '_'))
      .sort((a, b) => b.localeCompare(a));

    if (siteBackups.length > 5) {
      for (let i = 5; i < siteBackups.length; i++) {
        await runCommand(`sudo rm -f "${path.join(NGINX_BACKUP_DIR, siteBackups[i])}"`);
      }
    }
  } catch (e) {}
};

// Restores the most recent backup for siteName if available
const restoreLatestBackup = async (siteName) => {
  const cleanName = path.basename(siteName);
  const targetPath = path.join(NGINX_CONF_DIR, cleanName);
  try {
    if (!fs.existsSync(NGINX_BACKUP_DIR)) return false;
    const files = fs.readdirSync(NGINX_BACKUP_DIR);
    const siteBackups = files
      .filter(f => f.startsWith(cleanName + '_'))
      .sort((a, b) => b.localeCompare(a));

    if (siteBackups.length === 0) return false;
    const latestBackupPath = path.join(NGINX_BACKUP_DIR, siteBackups[0]);
    const restoreRes = await runCommand(`sudo cp "${latestBackupPath}" "${targetPath}"`);
    if (!restoreRes.success) return false;
    await runCommand('sudo nginx -t');
    return true;
  } catch (e) {
    return false;
  }
};

// Helper: Check if domain is already mapped in /etc/hosts
const isDomainMappedInHosts = (domain) => {
  try {
    const hostsContent = fs.readFileSync('/etc/hosts', 'utf8');
    const regex = new RegExp(`(^|\\s)${domain.replace(/\./g, '\\.')}(\\s|$)`, 'm');
    return regex.test(hostsContent);
  } catch (e) {
    return false;
  }
};

// Async Jobs Store & Pruning Task
const jobs = new Map();

setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  for (const [jobId, job] of jobs.entries()) {
    if ((job.status === 'completed' || job.status === 'failed') && (now - job.createdAt > ONE_HOUR)) {
      jobs.delete(jobId);
    }
  }
}, 10 * 60 * 1000);

const createJob = (type, payload) => {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const job = {
    id: jobId,
    type,
    payload,
    status: 'pending',
    progress: 0,
    result: null,
    error: null,
    createdAt: Date.now()
  };
  jobs.set(jobId, job);
  return job;
};

// --- 1. Health & Startup Diagnostics ---
app.get('/api/health', async (req, res) => {
  try {
    const [nginx, mariadb, phpFpm, openssl] = await Promise.all([
      runCommand('which nginx'),
      runCommand('which mariadb || which mysql'),
      runCommand('which php-fpm'),
      runCommand('which openssl')
    ]);

    const writableDir = fs.existsSync(NGINX_CONF_DIR);

    res.json({
      status: 'healthy',
      binaries: {
        nginx: nginx.success,
        mariadb: mariadb.success,
        phpFpm: phpFpm.success,
        openssl: openssl.success
      },
      writable: { nginxConfDir: writableDir },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

app.get('/api/diagnostics', async (req, res) => {
  const diagnostics = [];

  const nginxCheck = await runCommand('sudo nginx -t');
  diagnostics.push({
    category: 'Nginx Syntax',
    status: nginxCheck.success ? 'ok' : 'error',
    title: nginxCheck.success ? 'Nginx Configuration Syntax OK' : 'Nginx Configuration Syntax Error',
    detail: nginxCheck.success ? 'All Nginx virtual host files are syntactically valid.' : nginxCheck.error,
    fixAction: null
  });

  const socketPath = '/run/php-fpm/www.sock';
  const socketExists = fs.existsSync(socketPath);
  diagnostics.push({
    category: 'PHP-FPM Socket',
    status: socketExists ? 'ok' : 'error',
    title: socketExists ? 'PHP FastCGI Socket Accessible' : 'PHP-FPM Unix Socket Missing',
    detail: socketExists ? `/run/php-fpm/www.sock is active.` : `Socket file ${socketPath} not found. Start php-fpm service.`,
    fixAction: socketExists ? null : 'restart_php'
  });

  const dbTest = await execSqlScript('SELECT 1;');
  diagnostics.push({
    category: 'MariaDB Access',
    status: dbTest.success ? 'ok' : 'warn',
    title: dbTest.success ? 'MariaDB Authentication OK' : 'MariaDB Auth Credentials Required',
    detail: dbTest.success ? 'Connected successfully to MariaDB engine.' : (dbTest.error || 'Root password required.'),
    fixAction: dbTest.success ? null : 'configure_db_pass'
  });

  const port80 = await runCommand("ss -tulpn | grep ':80 ' || true");
  diagnostics.push({
    category: 'Network Ports',
    status: port80.output ? 'ok' : 'warn',
    title: port80.output ? 'Port 80 (HTTP) Active' : 'Port 80 Unused',
    detail: port80.output ? 'Port 80 is listening for HTTP traffic.' : 'No process currently bound to port 80.',
    fixAction: null
  });

  res.json(diagnostics);
});

// --- 2. Real Active Metrics SSE Stream ---
const sseMetricsClients = new Set();

app.get('/api/metrics/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseMetricsClients.add(res);

  req.on('close', () => {
    sseMetricsClients.delete(res);
  });
});

setInterval(async () => {
  if (sseMetricsClients.size === 0) return;

  try {
    const [cpu, mem, nginx, mariadb, phpFpm] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      runCommand('systemctl is-active nginx'),
      runCommand('systemctl is-active mariadb'),
      runCommand('systemctl is-active php-fpm')
    ]);

    const realUsedBytes = mem.total - mem.available;
    const totalGB = (mem.total / (1024 ** 3)).toFixed(2);
    const usedGB = (realUsedBytes / (1024 ** 3)).toFixed(2);
    const availableGB = (mem.available / (1024 ** 3)).toFixed(2);
    const memPercent = ((realUsedBytes / mem.total) * 100).toFixed(1);

    const payload = JSON.stringify({
      cpuLoad: cpu.currentLoad.toFixed(1),
      totalMem: totalGB,
      usedMem: usedGB,
      availableMem: availableGB,
      memPercent,
      services: {
        nginx: nginx.output === 'active',
        mariadb: mariadb.output === 'active',
        phpFpm: phpFpm.output === 'active'
      },
      timestamp: Date.now()
    });

    sseMetricsClients.forEach(client => {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch (e) {
        sseMetricsClients.delete(client);
      }
    });
  } catch (e) {}
}, 2000);

// --- 3. Live Log Viewer SSE Stream Tailing ---
app.get('/api/logs/stream', (req, res) => {
  const type = req.query.type === 'access' ? 'access' : 'error';
  const numLines = Math.min(Math.max(parseInt(req.query.lines, 10) || 50, 10), 300);
  const logPath = type === 'access' ? '/var/log/nginx/access.log' : '/var/log/nginx/error.log';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const tailProc = spawn('sudo', ['tail', '-f', '-n', String(numLines), logPath]);

  tailProc.on('error', (err) => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    } catch (e) {}
  });

  tailProc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      try {
        res.write(`data: ${JSON.stringify({ type: 'error', message: `tail process exited with code ${code}` })}\n\n`);
        res.end();
      } catch (e) {}
    }
  });

  tailProc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      try {
        res.write(`data: ${JSON.stringify({ type, line })}\n\n`);
      } catch (e) {}
    });
  });

  tailProc.stderr.on('data', (data) => {
    try {
      res.write(`data: ${JSON.stringify({ type, error: data.toString().trim() })}\n\n`);
    } catch (e) {}
  });

  req.on('close', () => {
    tailProc.kill('SIGTERM');
  });
});

// --- 4. Async Jobs Status API ---
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// --- 5. Systemd User Supervisor Generator ---
app.get('/api/systemd/unit', (req, res) => {
  const unitContent = `[Unit]
Description=Local Nginx Stack Manager Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/sdev/Projects/nginx-panel
ExecStart=/usr/bin/node /home/sdev/Projects/nginx-panel/server.js
Restart=on-failure
RestartSec=3

[Install]
WantedBy=default.target`;

  const userUnitDir = path.join(USER_HOME, '.config/systemd/user');
  const userUnitPath = path.join(userUnitDir, 'nginx-panel.service');

  let written = false;
  try {
    fs.mkdirSync(userUnitDir, { recursive: true });
    fs.writeFileSync(userUnitPath, unitContent, 'utf8');
    written = true;
  } catch (e) {}

  res.json({
    success: true,
    unitPath: userUnitPath,
    written,
    content: unitContent,
    instructions: [
      'systemctl --user daemon-reload',
      'systemctl --user enable --now nginx-panel.service',
      'systemctl --user status nginx-panel.service'
    ]
  });
});

// --- 6. Metrics, Projects, & Services Endpoints ---
app.get('/api/metrics', async (req, res) => {
  try {
    const [cpu, mem] = await Promise.all([si.currentLoad(), si.mem()]);
    const realUsedBytes = mem.total - mem.available;
    res.json({
      cpuLoad: cpu.currentLoad.toFixed(1),
      totalMem: (mem.total / (1024 ** 3)).toFixed(2),
      usedMem: (realUsedBytes / (1024 ** 3)).toFixed(2),
      availableMem: (mem.available / (1024 ** 3)).toFixed(2),
      memPercent: ((realUsedBytes / mem.total) * 100).toFixed(1)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ports', async (req, res) => {
  const result = await runCommand("ss -tulpn | grep LISTEN | awk '{print $5}' | sed 's/.*://' | sort -n | uniq");
  if (!result.success) return res.json([80, 443, 3000, 4000, 8080]);
  const ports = result.output.split('\n').map(p => parseInt(p, 10)).filter(p => !isNaN(p));
  res.json(ports);
});

app.get('/api/scanned-projects', (req, res) => {
  try {
    if (!fs.existsSync(PROJECTS_BASE_DIR)) return res.json([]);
    const items = fs.readdirSync(PROJECTS_BASE_DIR, { withFileTypes: true });
    const folders = items
      .filter(item => item.isDirectory() && item.name !== 'nginx-panel' && !item.name.startsWith('.'))
      .map(item => {
        const fullPath = path.join(PROJECTS_BASE_DIR, item.name);
        let framework = 'Static HTML / Generic';
        let suggestedType = 'static';

        if (fs.existsSync(path.join(fullPath, 'artisan')) || fs.existsSync(path.join(fullPath, 'composer.json'))) {
          framework = 'Laravel PHP';
          suggestedType = 'laravel';
        } else if (fs.existsSync(path.join(fullPath, 'wp-config.php'))) {
          framework = 'WordPress';
          suggestedType = 'wordpress';
        } else if (fs.existsSync(path.join(fullPath, 'package.json'))) {
          try {
            const pkg = JSON.parse(fs.readFileSync(path.join(fullPath, 'package.json'), 'utf8'));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (deps.next || deps.nuxt || deps.express || deps.fastify || deps.nest) {
              framework = deps.next ? 'Next.js Proxy' : 'Node.js Server';
              suggestedType = 'proxy';
            } else if (deps.vite || deps['react-scripts'] || deps.vue) {
              framework = 'Vite SPA';
              suggestedType = 'vite-spa';
            }
          } catch (e) {}
        }

        return { name: item.name, fullPath, framework, suggestedType };
      });
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/services-status', async (req, res) => {
  const [nginx, mariadb, phpFpm] = await Promise.all([
    runCommand('systemctl is-active nginx'),
    runCommand('systemctl is-active mariadb'),
    runCommand('systemctl is-active php-fpm')
  ]);
  res.json({
    nginx: nginx.output === 'active',
    mariadb: mariadb.output === 'active',
    phpFpm: phpFpm.output === 'active'
  });
});

app.post('/api/service', async (req, res) => {
  const { service, action } = req.body;
  if (!['nginx', 'mariadb', 'php-fpm'].includes(service) || !['start', 'stop', 'restart'].includes(action)) {
    return res.status(400).json({ error: 'Invalid service or action parameter' });
  }

  await runCommand(`sudo systemctl ${action} ${service}`);
  const verify = await runCommand(`systemctl is-active ${service}`);
  const active = verify.output === 'active';

  res.json({
    success: true,
    service,
    action,
    active,
    message: `${service} ${action}ed. Current state: ${active ? 'ONLINE' : 'STOPPED'}`
  });
});

// --- 7. Domain Resolver & Local SSL Generator ---
app.get('/api/hosts/check', (req, res) => {
  const domain = req.query.domain;
  if (!domain) return res.status(400).json({ error: 'Domain required' });
  res.json({ mapped: isDomainMappedInHosts(domain), domain, ip: '127.0.0.1' });
});

app.post('/api/hosts/add', async (req, res) => {
  const { domain } = req.body;
  if (!domain || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain name' });
  }
  if (isDomainMappedInHosts(domain)) {
    return res.json({ success: true, message: `Domain \`${domain}\` is already mapped to 127.0.0.1.` });
  }
  const result = await runCommand(`echo "127.0.0.1 ${domain}" | sudo tee -a /etc/hosts`);
  if (!result.success) return res.status(500).json({ error: 'Failed to write to /etc/hosts', details: result.error });
  res.json({ success: true, message: `Domain \`${domain}\` mapped to 127.0.0.1!` });
});

app.post('/api/ssl/generate', async (req, res) => {
  const { domain } = req.body;
  if (!domain || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return res.status(400).json({ error: 'Invalid domain name' });
  }

  const job = createJob('ssl_generate', { domain });
  res.json({ success: true, jobId: job.id, message: 'SSL generation started in background' });

  (async () => {
    job.status = 'running';
    job.progress = 30;

    const certPath = path.join(NGINX_SSL_DIR, `${domain}.crt`);
    const keyPath = path.join(NGINX_SSL_DIR, `${domain}.key`);
    if (!fs.existsSync(NGINX_SSL_DIR)) {
      fs.mkdirSync(NGINX_SSL_DIR, { recursive: true });
    }
    
    const sslCmd = `openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/CN=${domain}/O=LocalDevStack"`;
    const result = await runCommand(sslCmd);

    if (result.success) {
      job.status = 'completed';
      job.progress = 100;
      job.result = { certPath, keyPath, message: `SSL Certificate generated for ${domain}` };
    } else {
      job.status = 'failed';
      job.error = result.error;
    }
  })();
});

// --- 8. Nginx Site Management & Backups ---
app.get('/api/sites', (req, res) => {
  fs.readdir(NGINX_CONF_DIR, (err, files) => {
    if (err) return res.status(500).json({ error: err.message });
    const confFiles = files.filter(f => f.endsWith('.conf') || f.endsWith('.conf.disabled'));
    const sites = confFiles.map(file => ({
      name: file,
      enabled: file.endsWith('.conf')
    }));
    res.json(sites);
  });
});

app.get('/api/sites/backups/:name', (req, res) => {
  const cleanName = path.basename(req.params.name);
  try {
    if (!fs.existsSync(NGINX_BACKUP_DIR)) return res.json([]);
    const files = fs.readdirSync(NGINX_BACKUP_DIR);
    const siteBackups = files
      .filter(f => f.startsWith(cleanName + '_'))
      .sort((a, b) => b.localeCompare(a));
    res.json(siteBackups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sites/config/rollback', async (req, res) => {
  const { siteName, backupFile } = req.body;
  if (!siteName || !backupFile) return res.status(400).json({ error: 'Site name and backup file required' });

  const cleanSite = path.basename(siteName);
  const cleanBackup = path.basename(backupFile);
  const targetPath = path.join(NGINX_CONF_DIR, cleanSite);
  const backupPath = path.join(NGINX_BACKUP_DIR, cleanBackup);

  if (!fs.existsSync(backupPath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }

  await saveConfigBackup(cleanSite);

  const restoreRes = await runCommand(`sudo cp "${backupPath}" "${targetPath}"`);
  if (!restoreRes.success) {
    return res.status(500).json({ error: 'Failed to restore backup file', details: restoreRes.error });
  }

  const testRes = await runCommand('sudo nginx -t');
  if (!testRes.success) {
    return res.status(400).json({ error: 'Restored backup failed Nginx syntax check', details: testRes.error });
  }

  await runCommand('sudo systemctl reload nginx');
  res.json({ success: true, message: `Rolled back ${cleanSite} to ${cleanBackup} successfully!` });
});

app.post('/api/sites/create', async (req, res) => {
  const { siteName, domain, rootPath, port, siteType, enableSsl, autoHosts } = req.body;
  if (!siteName || !domain || !rootPath) {
    return res.status(400).json({ error: 'Site name, domain, and root path are required.' });
  }

  const cleanSiteName = siteName.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanSiteName) return res.status(400).json({ error: 'Invalid site name format.' });

  const targetPath = path.join(NGINX_CONF_DIR, `${cleanSiteName}.conf`);
  const siteExisted = fs.existsSync(targetPath);

  if (siteExisted) {
    await saveConfigBackup(`${cleanSiteName}.conf`);
  }

  let sslBlock = '';
  let listenBlock = `listen ${port || 80};`;

  if (enableSsl) {
    const certPath = path.join(NGINX_SSL_DIR, `${domain}.crt`);
    const keyPath = path.join(NGINX_SSL_DIR, `${domain}.key`);

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      if (!fs.existsSync(NGINX_SSL_DIR)) {
        fs.mkdirSync(NGINX_SSL_DIR, { recursive: true });
      }
      await runCommand(`openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -subj "/CN=${domain}/O=LocalDevStack"`);
    }

    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      return res.status(500).json({ error: `Failed to generate SSL certificate files for ${domain}.` });
    }

    listenBlock = `listen 80;\n    listen 443 ssl;\n    http2 on;`;
    sslBlock = `\n    ssl_certificate ${certPath};\n    ssl_certificate_key ${keyPath};\n    ssl_protocols TLSv1.2 TLSv1.3;\n    ssl_ciphers HIGH:!aNULL:!MD5;`;
  }

  let confContent = '';
  if (siteType === 'laravel') {
    confContent = `server {
    ${listenBlock}
    server_name ${domain};
    root ${rootPath}/public;
    index index.php index.html;
    ${sslBlock}

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}`;
  } else if (siteType === 'vite-spa') {
    confContent = `server {
    ${listenBlock}
    server_name ${domain};
    root ${rootPath}/dist;
    index index.html;
    ${sslBlock}

    location / {
        try_files $uri $uri/ /index.html;
    }
}`;
  } else if (siteType === 'wordpress') {
    confContent = `server {
    ${listenBlock}
    server_name ${domain};
    root ${rootPath};
    index index.php index.html;
    ${sslBlock}

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:/run/php-fpm/www.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}`;
  } else if (siteType === 'static') {
    confContent = `server {
    ${listenBlock}
    server_name ${domain};
    root ${rootPath};
    index index.html index.htm;
    ${sslBlock}

    location / {
        try_files $uri $uri/ =404;
    }
}`;
  } else {
    confContent = `server {
    ${listenBlock}
    server_name ${domain};
    ${sslBlock}

    location / {
        proxy_pass http://127.0.0.1:${port || 3000};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`;
  }

  const tempPath = `/tmp/${cleanSiteName}.conf`;

  try {
    fs.writeFileSync(tempPath, confContent, 'utf8');
    const mvRes = await runCommand(`sudo mv "${tempPath}" "${targetPath}"`);
    if (!mvRes.success) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: 'Failed to save configuration file', details: mvRes.error });
    }

    const testResult = await runCommand('sudo nginx -t');
    if (!testResult.success) {
      if (siteExisted) {
        const restored = await restoreLatestBackup(`${cleanSiteName}.conf`);
        return res.status(400).json({ error: 'Nginx Syntax Check Failed', details: testResult.error, restored });
      } else {
        await runCommand(`sudo rm -f "${targetPath}"`);
        return res.status(400).json({ error: 'Nginx Syntax Check Failed', details: testResult.error, restored: false });
      }
    }

    if (siteType === 'laravel' || siteType === 'wordpress') {
      await runCommand(`mkdir -p "${rootPath}/storage" "${rootPath}/bootstrap/cache" 2>/dev/null || true`);
      await runCommand(`sudo chmod -R 775 "${rootPath}" && (sudo chcon -R -t httpd_sys_rw_content_t "${rootPath}" 2>/dev/null || true)`, PROJECTS_BASE_DIR, 60000);
    }

    if (autoHosts && domain !== 'localhost' && !isDomainMappedInHosts(domain)) {
      await runCommand(`echo "127.0.0.1 ${domain}" | sudo tee -a /etc/hosts`);
    }

    await runCommand('sudo systemctl reload nginx');
    res.json({ success: true, message: `Site ${cleanSiteName}.conf created & active!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sites/toggle', async (req, res) => {
  const { siteName, enable } = req.body;
  if (!siteName || typeof enable !== 'boolean') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const cleanName = path.basename(siteName);
  const currentPath = path.join(NGINX_CONF_DIR, cleanName);
  let newPath = '';

  if (enable && cleanName.endsWith('.disabled')) {
    newPath = path.join(NGINX_CONF_DIR, cleanName.replace('.disabled', ''));
  } else if (!enable && cleanName.endsWith('.conf')) {
    newPath = path.join(NGINX_CONF_DIR, `${cleanName}.disabled`);
  } else {
    return res.json({ success: true, message: 'No state change required.' });
  }

  await saveConfigBackup(cleanName);
  const mvRes = await runCommand(`sudo mv "${currentPath}" "${newPath}"`);
  if (!mvRes.success) return res.status(500).json({ error: 'Failed to toggle site status', details: mvRes.error });

  const testRes = await runCommand('sudo nginx -t');
  if (!testRes.success) {
    await runCommand(`sudo mv "${newPath}" "${currentPath}"`);
    return res.status(400).json({ error: 'Nginx syntax test failed after enabling site', details: testRes.error });
  }

  await runCommand('sudo systemctl reload nginx');
  res.json({ success: true, message: `Site ${enable ? 'enabled' : 'disabled'} successfully!` });
});

app.delete('/api/sites/:name', async (req, res) => {
  const cleanName = path.basename(req.params.name);
  await saveConfigBackup(cleanName);

  const rmRes = await runCommand(`sudo rm -f "${path.join(NGINX_CONF_DIR, cleanName)}"`);
  if (!rmRes.success) return res.status(500).json({ error: 'Failed to delete site configuration', details: rmRes.error });

  await runCommand('sudo systemctl reload nginx');
  res.json({ success: true, message: `Site ${cleanName} deleted successfully!` });
});

app.get('/api/sites/config/:name', (req, res) => {
  const cleanName = path.basename(req.params.name);
  const filePath = path.join(NGINX_CONF_DIR, cleanName);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Configuration file not found' });
  try {
    res.json({ success: true, name: cleanName, content: fs.readFileSync(filePath, 'utf8') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sites/config/save', async (req, res) => {
  const { siteName, content } = req.body;
  if (!siteName || content === undefined) return res.status(400).json({ error: 'Site name and content required' });

  const cleanName = path.basename(siteName);
  const targetPath = path.join(NGINX_CONF_DIR, cleanName);
  const tempPath = `/tmp/edit_${cleanName}`;

  await saveConfigBackup(cleanName);

  try {
    fs.writeFileSync(tempPath, content, 'utf8');
    const mvRes = await runCommand(`sudo mv "${tempPath}" "${targetPath}"`);
    if (!mvRes.success) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      return res.status(500).json({ error: 'Failed to update configuration file', details: mvRes.error });
    }

    const testRes = await runCommand('sudo nginx -t');
    if (!testRes.success) {
      const restored = await restoreLatestBackup(cleanName);
      return res.status(400).json({ success: false, error: 'Nginx syntax validation failed.', details: testRes.error, restored });
    }

    await runCommand('sudo systemctl reload nginx');
    res.json({ success: true, message: 'Configuration saved & Nginx reloaded!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 9. Laravel Helpers & PHP Inspector ---
app.post('/api/sites/fix-permissions', async (req, res) => {
  const { rootPath } = req.body;
  if (!rootPath) return res.status(400).json({ error: 'Root path is required.' });
  const cmd = `mkdir -p "${rootPath}/storage" "${rootPath}/bootstrap/cache" && sudo chmod -R 775 "${rootPath}/storage" "${rootPath}/bootstrap/cache" && (sudo chcon -R -t httpd_sys_rw_content_t "${rootPath}/storage" "${rootPath}/bootstrap/cache" 2>/dev/null || true)`;
  const result = await runCommand(cmd, PROJECTS_BASE_DIR, 60000);
  if (!result.success) return res.status(500).json({ error: 'Failed to set permissions', details: result.error });
  res.json({ success: true, message: `Laravel storage/cache permissions & SELinux context applied` });
});

app.post('/api/laravel/artisan', async (req, res) => {
  const { rootPath, command } = req.body;
  if (!rootPath || !command) return res.status(400).json({ error: 'Root path and command required.' });

  const allowedCmds = ['migrate', 'db:seed', 'cache:clear', 'config:clear', 'route:list', 'key:generate', 'storage:link', 'optimize:clear'];
  const baseCmd = command.split(' ')[0];
  if (!allowedCmds.includes(baseCmd)) return res.status(400).json({ error: 'Command not permitted.' });

  const result = await runCommand(`php artisan ${command}`, rootPath, 60000);
  res.json({ success: result.success, output: result.output || result.error });
});

app.get('/api/php/info', async (req, res) => {
  try {
    const [ver, mods, memLimit] = await Promise.all([
      runCommand('php -v | head -n 1'),
      runCommand('php -m'),
      runCommand('php -r "echo ini_get(\'memory_limit\');"')
    ]);
    const extensions = (mods.output || '').split('\n').map(e => e.trim()).filter(Boolean);
    res.json({
      success: true,
      version: ver.output || 'PHP 8.x',
      memoryLimit: memLimit.output || '128M',
      extensionsCount: extensions.length,
      hasPdoMysql: extensions.includes('pdo_mysql'),
      hasMbstring: extensions.includes('mbstring'),
      hasGd: extensions.includes('gd'),
      hasXml: extensions.includes('xml'),
      hasCurl: extensions.includes('curl'),
      hasZip: extensions.includes('zip')
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 10. Database Manager & Async Export ---
app.get('/api/db/config', (req, res) => {
  res.json({ user: dbConfig.user || 'root', hasPassword: !!dbConfig.pass });
});

app.post('/api/db/config', async (req, res) => {
  const { user, pass } = req.body;
  const testConfig = { user: user || 'root', pass: pass || '' };
  const testRes = await execSqlScript('SELECT 1;', testConfig);
  if (!testRes.success) {
    return res.status(400).json({ error: 'Database Connection Test Failed', details: testRes.details || testRes.error });
  }
  dbConfig = testConfig;
  try {
    fs.writeFileSync(DB_CONFIG_FILE, JSON.stringify(dbConfig, null, 2), 'utf8');
  } catch (err) {}
  res.json({ success: true, message: 'MariaDB credentials saved & verified!' });
});

app.post('/api/db/create', async (req, res) => {
  const { dbName, dbUser, dbPass } = req.body;
  if (!dbName || !dbUser || !dbPass) return res.status(400).json({ error: 'Database name, user, and password required.' });
  if (!/^[a-zA-Z0-9_]+$/.test(dbName) || !/^[a-zA-Z0-9_]+$/.test(dbUser)) {
    return res.status(400).json({ error: 'Database and username must contain only letters, numbers, underscores.' });
  }

  const escapedPass = dbPass.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const sql = `CREATE DATABASE IF NOT EXISTS \`${dbName}\`; CREATE USER IF NOT EXISTS '${dbUser}'@'localhost' IDENTIFIED BY '${escapedPass}'; GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'localhost'; FLUSH PRIVILEGES;`;

  const result = await execSqlScript(sql);
  if (!result.success) return res.status(400).json({ error: 'Database Setup Failed', details: result.details || result.error });
  res.json({ success: true, message: `Database \`${dbName}\` and user \`${dbUser}\` created!` });
});

app.get('/api/db/list', async (req, res) => {
  const sql = `SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys') ORDER BY schema_name ASC;`;
  const result = await execSqlScript(sql);
  if (!result.success) return res.status(400).json({ error: result.error || 'Failed to list databases', details: result.details || result.error });
  const lines = result.output.split('\n').map(l => l.trim()).filter(Boolean);
  const dbs = lines.filter(line => line !== 'schema_name').map(name => ({ name }));
  res.json(dbs);
});

app.delete('/api/db/:name', async (req, res) => {
  const dbName = req.params.name;
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) return res.status(400).json({ error: 'Invalid database name' });
  const sql = `DROP DATABASE IF EXISTS \`${dbName}\`;`;
  const result = await execSqlScript(sql);
  if (!result.success) return res.status(400).json({ error: `Failed to drop database ${dbName}`, details: result.details || result.error });
  res.json({ success: true, message: `Database \`${dbName}\` dropped!` });
});

// Async DB Export (.sql dump download) with 120s timeout
app.get('/api/db/export/:name', async (req, res) => {
  const dbName = req.params.name;
  if (!/^[a-zA-Z0-9_]+$/.test(dbName)) return res.status(400).json({ error: 'Invalid database name' });

  const tempId = Date.now();
  const dumpPath = `/tmp/export_${dbName}_${tempId}.sql`;
  const cnfPath = `/tmp/cnf_export_${tempId}.cnf`;

  try {
    let dumpCmd = '';
    if (dbConfig.pass) {
      const cnfContent = `[client]\nuser="${dbConfig.user || 'root'}"\npassword="${dbConfig.pass.replace(/"/g, '\\"')}"\n`;
      fs.writeFileSync(cnfPath, cnfContent, 'utf8');
      fs.chmodSync(cnfPath, 0o600);
      dumpCmd = `mariadb-dump --defaults-extra-file=${cnfPath} ${dbName} > ${dumpPath}`;
    } else {
      dumpCmd = `sudo mariadb-dump ${dbName} > ${dumpPath}`;
    }

    const result = await runCommand(dumpCmd, PROJECTS_BASE_DIR, 120000);
    if (!result.success && !fs.existsSync(dumpPath)) {
      return res.status(400).json({ error: 'Failed to export database dump', details: result.error });
    }

    res.download(dumpPath, `${dbName}_${new Date().toISOString().slice(0, 10)}.sql`, () => {
      if (fs.existsSync(dumpPath)) try { fs.unlinkSync(dumpPath); } catch (e) {}
      if (fs.existsSync(cnfPath)) try { fs.unlinkSync(cnfPath); } catch (e) {}
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- 11. Logs & Legacy Tailing ---
app.get('/api/logs', async (req, res) => {
  const type = req.query.type === 'access' ? 'access' : 'error';
  const numLines = Math.min(Math.max(parseInt(req.query.lines, 10) || 50, 10), 300);
  const logPath = type === 'access' ? '/var/log/nginx/access.log' : '/var/log/nginx/error.log';

  let result = await runCommand(`sudo tail -n ${numLines} ${logPath}`);
  if (!result.success && result.error.includes('password is required')) {
    try {
      if (fs.existsSync(logPath)) {
        const fileContent = fs.readFileSync(logPath, 'utf8');
        const linesArr = fileContent.trim().split('\n').slice(-numLines);
        return res.json({ success: true, logType: type, logPath, content: linesArr.join('\n') });
      }
    } catch (e) {}
    return res.status(500).json({ error: 'Sudo password required for Nginx logs.' });
  }
  res.json({ success: true, logType: type, logPath, content: result.output });
});

app.listen(PORT, () => {
  console.log(`🚀 Nginx Stack Manager live at http://localhost:${PORT}`);
});
