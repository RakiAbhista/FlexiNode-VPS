export interface SetupPackage {
  id: string;
  name: string;
  shortDesc: string;
  category: "runtime" | "web" | "tool";
  icon: string; // Lucide icon name indicator
  badge?: string;
  commandCheck: string;
  script: string;
}

export const AVAILABLE_SETUP_PACKAGES: SetupPackage[] = [
  {
    id: "nodejs",
    name: "Node.js & npm (LTS)",
    shortDesc: "Node.js v20 LTS resmi (NodeSource) + npm & PM2, standar emas untuk Next.js, Express & TypeScript.",
    category: "runtime",
    icon: "Boxes",
    badge: "LTS Populer",
    commandCheck: "node -v && npm -v",
    script: `which node >/dev/null 2>&1 || (curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs && npm install -g pm2 --silent 2>/dev/null && pm2 startup systemd -u root --hp /root 2>/dev/null && systemctl enable pm2-root 2>/dev/null || true)`,
  },
  {
    id: "git_tools",
    name: "Git & Dev Essentials",
    shortDesc: "Git, curl, wget, htop, jq, tmux, dan build-essential (gcc, make) standar lingkungan Linux.",
    category: "tool",
    icon: "Terminal",
    badge: "Wajib",
    commandCheck: "git --version && nano --version",
    script: `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq git curl wget nano htop jq tmux kitty-terminfo build-essential`,
  },
  {
    id: "python",
    name: "Python 3 & Pip (Stable)",
    shortDesc: "Python 3.10 LTS, pip, venv, dan alias 'python' siap untuk FastAPI, Django, automation & bot.",
    category: "runtime",
    icon: "FileCode2",
    badge: "LTS",
    commandCheck: "python --version && pip3 --version",
    script: `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3 python3-pip python3-venv python-is-python3`,
  },
  {
    id: "nginx",
    name: "Nginx Web Server",
    shortDesc: "Nginx web server & reverse proxy berkinerja tinggi, siap routing port dan sertifikat SSL.",
    category: "web",
    icon: "Globe",
    commandCheck: "nginx -v",
    script: `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx && systemctl enable nginx 2>/dev/null && systemctl restart nginx 2>/dev/null || true`,
  },
  {
    id: "golang",
    name: "Golang (Go 1.22 LTS)",
    shortDesc: "Compiler Go v1.22 LTS stabil untuk microservice, API performa tinggi, dan routing modern.",
    category: "runtime",
    icon: "Cpu",
    badge: "LTS",
    commandCheck: "go version",
    script: `which go >/dev/null 2>&1 || (curl -fsSL https://dl.google.com/go/go1.22.10.linux-amd64.tar.gz -o /tmp/go.tar.gz && tar -C /usr/local -xzf /tmp/go.tar.gz && rm -f /tmp/go.tar.gz && ln -sf /usr/local/go/bin/go /usr/local/bin/go && ln -sf /usr/local/go/bin/gofmt /usr/local/bin/gofmt)`,
  },
  {
    id: "docker",
    name: "Docker & Compose v2",
    shortDesc: "Docker Engine CE stabil & Compose v2 plugin untuk deploy microservices berbasis container.",
    category: "tool",
    icon: "Container",
    commandCheck: "docker --version && docker compose version",
    script: `DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io docker-compose-v2 && systemctl enable docker 2>/dev/null || true`,
  },
  {
    id: "bun",
    name: "Bun Runtime (v1.x)",
    shortDesc: "Toolkit all-in-one JavaScript/TypeScript v1.x stabil yang ultra-cepat (alternatif kilat Node.js).",
    category: "runtime",
    icon: "Zap",
    commandCheck: "bun --version",
    script: `which bun >/dev/null 2>&1 || (curl -fsSL https://bun.sh/install | bash && ln -sf /root/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true)`,
  },
  {
    id: "php",
    name: "PHP 8.x & Composer (LTS)",
    shortDesc: "PHP CLI, Composer, ekstensi mbstring, xml, curl, zip, sqlite3, siap untuk Laravel & Native PHP.",
    category: "runtime",
    icon: "Flame",
    badge: "Populer",
    commandCheck: "php -v && composer --version",
    script: `DEBIAN_FRONTEND=noninteractive apt-get update -qq && which add-apt-repository >/dev/null 2>&1 || (DEBIAN_FRONTEND=noninteractive apt-get install -y -qq software-properties-common && add-apt-repository -y ppa:ondrej/php && apt-get update -qq); DEBIAN_FRONTEND=noninteractive apt-get install -y -qq php8.2-cli php8.2-mbstring php8.2-xml php8.2-curl php8.2-zip php8.2-sqlite3 php8.2-mysql php8.2-bcmath php8.2-intl composer && (update-alternatives --set php /usr/bin/php8.2 2>/dev/null || true)`,
  },
];

export const SETUP_PRESETS = [
  {
    id: "node_fullstack",
    name: "Web Fullstack (Node + Git)",
    desc: "Cocok untuk Next.js, Express, React, dan API Node.",
    packages: ["nodejs", "git_tools"],
  },
  {
    id: "php_fullstack",
    name: "PHP & Laravel (PHP + Composer + Nginx + Git)",
    desc: "Cocok untuk Laravel, CodeIgniter, dan Native PHP.",
    packages: ["php", "nginx", "git_tools"],
  },
  {
    id: "python_dev",
    name: "Python Developer (Python + Git)",
    desc: "Cocok untuk bot, scraping, FastAPI, Flask, dan data processing.",
    packages: ["python", "git_tools"],
  },
  {
    id: "web_server",
    name: "Production Web (Node + Nginx + Git)",
    desc: "Cocok untuk web server dengan reverse proxy Nginx dan Node.js.",
    packages: ["nodejs", "nginx", "git_tools"],
  },
  {
    id: "clean",
    name: "Clean Ubuntu (Tanpa Setup)",
    desc: "Instance murni Ubuntu 22.04 LTS, paling hemat RAM & booting instan.",
    packages: [],
  },
];

/**
 * Builds a single unified bash script to install chosen packages inside an Incus container.
 */
export function buildSetupScript(selectedPackageIds: string[]): string {
  const chosen = AVAILABLE_SETUP_PACKAGES.filter((p) =>
    selectedPackageIds.includes(p.id)
  );

  if (chosen.length === 0) {
    return 'echo "[Setup] Clean install requested. No additional packages."';
  }

  // Pre-update apt once, then run each chosen package's script
  const parts = [
    'echo "[Setup] Memulai instalasi otomatis paket pilihan user..."',
    "export DEBIAN_FRONTEND=noninteractive",
    "apt-get update -qq",
  ];

  for (const pkg of chosen) {
    parts.push(`echo "[Setup] Memasang ${pkg.name}..."`);
    parts.push(pkg.script.trim());
  }

  parts.push('echo "[Setup] Semua paket otomatis berhasil dipasang!"');
  return parts.join("\n");
}
