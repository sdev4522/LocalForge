const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

function execWhich(binaryName) {
  try {
    const res = execSync(`which ${binaryName} 2>/dev/null`, { encoding: 'utf8' }).trim();
    return res || null;
  } catch (e) {
    return null;
  }
}

function detectDistro() {
  let distro = 'fedora';
  let distroLike = '';

  if (fs.existsSync('/etc/os-release')) {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    const idMatch = osRelease.match(/^ID=(.*)$/m);
    const likeMatch = osRelease.match(/^ID_LIKE=(.*)$/m);

    if (idMatch) {
      distro = idMatch[1].replace(/"/g, '').toLowerCase();
    }
    if (likeMatch) {
      distroLike = likeMatch[1].replace(/"/g, '').toLowerCase();
    }
  }

  if (distro.includes('ubuntu') || distro.includes('debian') || distroLike.includes('ubuntu') || distroLike.includes('debian')) {
    return 'ubuntu';
  }
  if (distro.includes('arch') || distroLike.includes('arch') || distro.includes('manjaro')) {
    return 'arch';
  }
  return 'fedora';
}

function resolvePackageManager(distro) {
  if (execWhich('dnf')) return 'dnf';
  if (execWhich('apt') || execWhich('apt-get')) return 'apt';
  if (execWhich('pacman')) return 'pacman';
  return distro === 'ubuntu' ? 'apt' : distro === 'arch' ? 'pacman' : 'dnf';
}

function resolvePhpFpmSocket() {
  const commonSocketPaths = [
    '/run/php-fpm/www.sock',
    '/run/php/php8.3-fpm.sock',
    '/run/php/php8.2-fpm.sock',
    '/run/php/php8.1-fpm.sock',
    '/run/php/php8.0-fpm.sock',
    '/run/php/php-fpm.sock',
    // NEEDS VERIFICATION on real Arch system:
    '/run/php-fpm/php-fpm.sock',
    '/run/php-fpm.sock',
  ];

  for (const sockPath of commonSocketPaths) {
    if (fs.existsSync(sockPath)) {
      return sockPath;
    }
  }

  // Dynamic glob search in /run/php/ if available
  if (fs.existsSync('/run/php')) {
    try {
      const files = fs.readdirSync('/run/php');
      const sockFile = files.find((f) => f.endsWith('.sock'));
      if (sockFile) return path.join('/run/php', sockFile);
    } catch (e) {}
  }

  // Default fallback
  return '/run/php-fpm/www.sock';
}

function resolveNginxConfStyle() {
  if (fs.existsSync('/etc/nginx/sites-available') && fs.existsSync('/etc/nginx/sites-enabled')) {
    return {
      style: 'sites-enabled',
      confDir: '/etc/nginx/sites-enabled/',
      availableDir: '/etc/nginx/sites-available/',
    };
  }
  return {
    style: 'confd',
    confDir: '/etc/nginx/conf.d/',
    availableDir: '/etc/nginx/conf.d/',
  };
}

function resolveMariaDbServiceName() {
  try {
    const output = execSync('systemctl list-unit-files mariadb.service mysql.service mysqld.service 2>/dev/null', { encoding: 'utf8' });
    if (output.includes('mariadb.service')) return 'mariadb';
    if (output.includes('mysql.service')) return 'mysql';
    if (output.includes('mysqld.service')) return 'mysqld';
  } catch (e) {}

  if (execWhich('mariadb')) return 'mariadb';
  if (execWhich('mysql')) return 'mysql';
  return 'mariadb';
}

function resolvePlatformConfig() {
  const distroFamily = detectDistro();
  const packageManager = resolvePackageManager(distroFamily);
  const phpFpmSocket = resolvePhpFpmSocket();
  const nginxConfStyle = resolveNginxConfStyle();
  const mariaDbServiceName = resolveMariaDbServiceName();

  const hasSelinux = !!execWhich('getenforce');
  const hasApparmor = !!execWhich('aa-status');

  const requiredBinaries = ['nginx', 'systemctl', 'chmod', 'chown', 'rm', 'mv', 'tee', 'openssl', 'php-fpm'];
  const optionalBinaries = ['mariadb', 'mysql', 'chcon', 'getenforce', 'aa-status'];

  const binaryPaths = {};
  const missingBinaries = [];

  for (const bin of requiredBinaries) {
    const resolvedPath = execWhich(bin);
    if (resolvedPath) {
      binaryPaths[bin] = resolvedPath;
    } else {
      missingBinaries.push(bin);
    }
  }

  for (const bin of optionalBinaries) {
    const resolvedPath = execWhich(bin);
    if (resolvedPath) {
      binaryPaths[bin] = resolvedPath;
    }
  }

  return {
    distroFamily,
    packageManager,
    phpFpmSocket,
    nginxConfStyle,
    mariaDbServiceName,
    hasSelinux,
    hasApparmor,
    binaryPaths,
    missingBinaries,
    resolvedAt: new Date().toISOString(),
  };
}

module.exports = {
  detectDistro,
  resolvePlatformConfig,
  execWhich,
};
