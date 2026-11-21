# ⚡ LocalForge — Native Linux Dev Stack Manager (Nginx, MariaDB, PHP-FPM)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform: Linux](https://img.shields.io/badge/platform-Fedora%20%7C%20Ubuntu%20%7C%20Arch-FCC624?logo=linux&logoColor=black)](#-supported-linux-distributions)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![GitHub stars](https://img.shields.io/github/stars/sdev4522/LocalForge?style=social)](https://github.com/sdev4522/LocalForge)

> **A fast, lightweight, Docker-free local development stack manager built specifically for Linux (Fedora, Ubuntu/Debian, Arch Linux).**

LocalForge directly manages your native Linux web server infrastructure (`Nginx`, `MariaDB`, `PHP-FPM 8.x`) with **zero container overhead**, near-zero RAM usage, and instant local domain resolution (`.local`).

It is a lightweight alternative to XAMPP, Laragon, Laravel Herd / Valet and Docker for **local PHP and Laravel development on Linux**: a web dashboard and a `localforge` CLI to create Nginx virtual hosts, manage MySQL/MariaDB databases, issue local HTTPS certificates and tail logs.

---

## 🚀 Why LocalForge?

- **⚡ Zero Container Overhead**: Runs native system binaries directly. No Docker desktop battery drain or heavy virtual memory overhead.
- **🐧 Native Linux Support**: First-class support for **Fedora**, **Ubuntu / Debian**, and **Arch Linux** with automated distro detection.
- **🔒 Automated Local HTTPS**: Generates self-signed TLS v1.3 SSL certificates (`/CN=app.local`) and configures Nginx automatically.
- **🌐 Instant `/etc/hosts` Mapping**: Automatically maps local domain names (e.g. `myapp.local`) to `127.0.0.1`.
- **🛠️ Built-in Tooling**: Integrated Laravel Artisan terminal runner, raw Nginx configuration editor with automatic rollback on syntax failure, real-time log streamer, and MariaDB manager.

---

## 💻 Supported Linux Distributions

| Distro Family | Package Manager | Status |
| :--- | :--- | :--- |
| **Fedora Linux** | `dnf` | 🟢 Fully Verified |
| **Ubuntu / Debian** | `apt` | 🟢 Fully Verified |
| **Arch Linux** | `pacman` | 🟡 Multi-Distro Ready (*Needs Real-System Verification*) |

---

## 🛠️ One-Command Installation

Clone the repository and run the installer script:

```bash
git clone https://github.com/sdev4522/LocalForge.git
cd LocalForge
./install.sh
```

Or register the command globally via npm:

```bash
npm install -g .
```

---

## 🎮 Command-Line Interface (`localforge`)

LocalForge includes a single-command CLI launcher:

```bash
# Launch LocalForge (starts background engine & opens browser UI at http://localhost:4000)
localforge

# Check engine status and active PID
localforge status

# Stop the LocalForge background process cleanly
localforge stop

# Re-run the first-run interactive setup wizard
localforge setup

# Run the platform diagnostic doctor (prints resolved paths & binary locations)
localforge doctor
```

---

## ✨ Features

- **🍱 Clean Bento Grid Dashboard**: Monitor system CPU, RAM Memory (`usedMem` vs `totalMem`), active virtual host sites, and database servers at a glance.
- **🛡️ Fail-Safe Config Editor**: Every raw Nginx configuration change runs `sudo nginx -t`. If syntax validation fails, LocalForge automatically restores your previous backup config.
- **🗑️ Safe Destructive Dialogs**: Irreversible actions (dropping databases or removing virtual host sites) require typed name confirmation to prevent accidental loss.
- **📡 Real-Time SSE Log Tailing**: Stream `/var/log/nginx/error.log` and `/var/log/nginx/access.log` live in your browser.

---

## 📜 License

Distributed under the [MIT License](LICENSE). Copyright (c) 2026 LocalForge Project Authors.

If LocalForge saves you time, a star on [GitHub](https://github.com/sdev4522/LocalForge) helps other Linux developers find it.
