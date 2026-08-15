# ⚡ Local Development Stack Manager (`nginx-panel`)

A lightweight, native, Docker-free local development stack manager designed for **Fedora Linux**. It manages native system services including **Nginx**, **MariaDB Server**, **PHP 8.x (PHP-FPM)**, **phpMyAdmin**, **OpenSSL**, and `/etc/hosts` local domain routing without the overhead of containerized virtual machines or Docker containers.

---

## 🚦 Current Project State: **ENTERPRISE PRODUCTION-READY (v1.3.0)**

| Subsystem | Status | Description |
|---|---|---|
| **Backend Core Server** | 🟢 Active | Node.js + Express backend listening at `http://localhost:4000` with crash guards & 10s command timeouts |
| **Real-Time SSE Engine** | 🟢 Active | Server-Sent Events streaming CPU/RAM/service metrics (`/api/metrics/stream`) & live logs (`/api/logs/stream`) |
| **Config Rollback Engine** | 🟢 Active | Retains last 5 timestamped versions of every `.conf` file in `/etc/nginx/conf.d/.backups/` for 1-click rollback |
| **System Diagnostics** | 🟢 Active | Automated system integrity checks (`/api/diagnostics`) for syntax, sockets, credentials, & ports |
| **Systemd Supervisor** | 🟢 Active | User unit generator (`~/.config/systemd/user/nginx-panel.service`) with `Restart=on-failure` |
| **Typed Confirmations** | 🟢 Active | Requires typed target name verification for dropping DBs or deleting Nginx sites |
| **Activity Timeline** | 🟢 Active | Collapsible timeline drawer recording user & system actions with timestamps |

---

## 📂 Project Directory & File Structure

```
nginx-panel/
├── package.json               # Node.js project metadata & dependencies (express, systeminformation, cors)
├── package-lock.json          # Exact dependency lockfile
├── server.js                  # Complete Node.js Express backend server (SSE streams, system commands, config rollbacks)
├── .db_config.json            # Stored MariaDB root credentials (auto-generated)
├── project.md                 # Full project documentation & technical specifications
└── public/                    # Frontend Web Assets
    └── index.html             # Single-page Raycast/Herd style UI dashboard with real-time SSE streams
```

---

## 🛠️ One-Time Setup Requirement (`visudo`)

To enable passwordless system management for Nginx, MariaDB, `/etc/hosts`, and SSL certificates, run this command once in your Fedora terminal:

```bash
echo 'sdev ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/systemctl, /usr/bin/chmod, /usr/bin/chown, /usr/bin/mysql, /usr/bin/mariadb, /usr/bin/mariadb-dump, /usr/bin/rm, /usr/bin/mv, /usr/bin/chcon, /usr/bin/tail, /usr/bin/tee, /usr/bin/openssl' | sudo tee /etc/sudoers.d/nginx-panel
sudo chmod 0440 /etc/sudoers.d/nginx-panel
```

### Auto-Recovery Supervisor (Systemd User Unit)

To enable automatic restart on failure and auto-start on boot:

```bash
systemctl --user daemon-reload
systemctl --user enable --now nginx-panel.service
```

---

## 📡 Complete API Specification

| Method | Endpoint | Query / Body Parameters | Description |
|---|---|---|---|
| `GET` | `/api/health` | - | Health check: binary presence (`nginx`, `mariadb`, `php-fpm`, `openssl`), write permissions, temp cleanup |
| `GET` | `/api/diagnostics` | - | Automated integrity checks (Nginx syntax, PHP socket, MariaDB auth, Port 80) |
| `GET` | `/api/metrics/stream` | - | **SSE Stream**: Pushes CPU %, Real RAM, and service status every 2 seconds |
| `GET` | `/api/logs/stream` | `?type=error\|access&lines=50` | **SSE Stream**: Live `tail -f` log streaming directly to client |
| `GET` | `/api/systemd/unit` | - | Generates user-level `nginx-panel.service` unit file & setup instructions |
| `GET` | `/api/metrics` | - | Returns CPU load %, total RAM, real used RAM, and available RAM |
| `GET` | `/api/scanned-projects` | - | Auto-detects project folders in `~/Projects` with framework badges |
| `GET` | `/api/services-status` | - | Returns systemd active status for `nginx`, `mariadb`, and `php-fpm` |
| `POST` | `/api/service` | `{ service, action }` | Controls systemd services (`start`, `stop`, `restart`) with post-action verification |
| `GET` | `/api/sites` | - | Lists Nginx `.conf` and `.disabled` files in `/etc/nginx/conf.d/` |
| `GET` | `/api/sites/backups/:name` | - | Lists historical timestamped backups (last 5) for a virtual host |
| `POST` | `/api/sites/config/rollback` | `{ siteName, backupFile }` | Restores a specific backup file with `nginx -t` validation & reload |
| `POST` | `/api/sites/create` | `{ siteName, domain, rootPath, port, siteType, enableSsl, autoHosts }` | Generates Nginx virtual host with SSL & hosts mapping |
| `POST` | `/api/sites/toggle` | `{ siteName, enable }` | Enables or disables Nginx site file extension |
| `DELETE` | `/api/sites/:name` | - | Deletes Nginx `.conf` file and reloads Nginx |
| `GET` | `/api/sites/config/:name` | - | Fetches raw Nginx `.conf` file content |
| `POST` | `/api/sites/config/save` | `{ siteName, content }` | Saves Nginx config with `nginx -t` validation & rollback |
| `POST` | `/api/sites/fix-permissions` | `{ rootPath }` | Sets `chmod 775` & SELinux context on `storage/` and `bootstrap/cache/` |
| `POST` | `/api/laravel/artisan` | `{ rootPath, command }` | Runs permitted Artisan commands (`migrate`, `db:seed`, `cache:clear`, etc.) |
| `GET` | `/api/hosts/check` | `?domain=app.local` | Checks if a domain is mapped in `/etc/hosts` |
| `POST` | `/api/hosts/add` | `{ domain }` | Appends `127.0.0.1 <domain>` to `/etc/hosts` |
| `POST` | `/api/ssl/generate` | `{ domain }` | Generates self-signed SSL certs via `openssl` |
| `GET` | `/api/db/config` | - | Returns DB root user and password existence status |
| `POST` | `/api/db/config` | `{ user, pass }` | Tests and saves MariaDB root credentials |
| `POST` | `/api/db/create` | `{ dbName, dbUser, dbPass }` | Creates MariaDB database & user with granted privileges |
| `GET` | `/api/db/list` | - | Lists non-system user databases in MariaDB |
| `DELETE` | `/api/db/:name` | - | Drops a MariaDB database |
| `GET` | `/api/db/export/:name` | - | Downloads a `.sql` backup dump file |
| `GET` | `/api/php/info` | - | Reports active PHP CLI version, memory limit, and extensions |
| `GET` | `/api/logs` | `?type=error\|access&lines=50` | Tails Nginx `error.log` or `access.log` |

---

## 🚀 Running the Stack Manager

```bash
cd /home/sdev/Projects/nginx-panel
node server.js
```

Access the panel at **http://localhost:4000**. Press **`Ctrl+K`** to open the Raycast global search command palette.
