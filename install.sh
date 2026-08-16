#!/usr/bin/env bash

set -e

echo "=================================================="
echo "⚡ LocalForge — One-Command Installer"
echo "=================================================="

# Distro Package Manager Detection
detect_package_manager() {
    if command -v dnf >/dev/null 2>&1; then
        echo "dnf"
    elif command -v apt >/dev/null 2>&1; then
        echo "apt"
    elif command -v pacman >/dev/null 2>&1; then
        echo "pacman"
    else
        echo "unknown"
    fi
}

PKG_MGR=$(detect_package_manager)

# Check Node.js installation
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed."
    case "$PKG_MGR" in
        dnf)
            echo "Install Node.js on Fedora/RHEL: sudo dnf install -y nodejs npm"
            ;;
        apt)
            echo "Install Node.js on Ubuntu/Debian: sudo apt update && sudo apt install -y nodejs npm"
            ;;
        pacman)
            echo "Install Node.js on Arch Linux: sudo pacman -S nodejs npm"
            ;;
        *)
            echo "Please install Node.js (v18+) and npm using your Linux distribution package manager."
            ;;
    esac
    exit 1
fi

echo "✅ Node.js $(node -v) detected."

# Build UI bundle if needed
if [ -d "frontend" ]; then
    echo "📦 Building LocalForge React frontend bundle..."
    npm run build:ui
fi

# Link binary globally
echo "🔗 Registering localforge CLI executable..."
npm link || sudo npm link

echo ""
echo "=================================================="
echo "🎉 LocalForge installation complete!"
echo "Run 'localforge' in your terminal to start."
echo "=================================================="
