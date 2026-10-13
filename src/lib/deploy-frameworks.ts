export interface DeployFramework {
  id: string;
  name: string;
  tagline: string;
  category: "node" | "python" | "php" | "go" | "docker" | "other";
  icon: string; // Lucide icon identifier
  defaultPort: number;
  requiredPackage?: string; // id from setup-packages (e.g. 'nodejs', 'python', 'golang', 'docker')
  defaultInstall: string;
  defaultBuild: string;
  defaultStart: string;
  envPlaceholder: string;
}

export const DEPLOY_FRAMEWORKS: DeployFramework[] = [
  {
    id: "nextjs",
    name: "Next.js",
    tagline: "React framework fullstack (SSR, App Router & API Routes)",
    category: "node",
    icon: "Boxes",
    defaultPort: 3000,
    requiredPackage: "nodejs",
    defaultInstall: "npm install",
    defaultBuild: "NODE_OPTIONS='--max-old-space-size=1024' npm run build",
    defaultStart: "pm2 delete app 2>/dev/null || true; pm2 start npm --name app -- start -- -p 3000",
    envPlaceholder: "NODE_ENV=production\nPORT=3000\nNEXT_PUBLIC_API_URL=https://...",
  },
  {
    id: "nodejs_api",
    name: "Node.js (Express / NestJS / API)",
    tagline: "Backend REST API atau microservice berbasis Node.js",
    category: "node",
    icon: "Server",
    defaultPort: 3000,
    requiredPackage: "nodejs",
    defaultInstall: "npm install",
    defaultBuild: "npm run build 2>/dev/null || true",
    defaultStart: "pm2 restart app 2>/dev/null || (grep -q '\"start\"' package.json 2>/dev/null && pm2 start npm --name app -- start || pm2 start index.js --name app)",
    envPlaceholder: "NODE_ENV=production\nPORT=3000\nJWT_SECRET=rahasia-anda",
  },
  {
    id: "vite_spa",
    name: "Vite / React / Vue / Static SPA",
    tagline: "Single Page Application yang di-build menjadi file statis",
    category: "node",
    icon: "Globe",
    defaultPort: 3000,
    requiredPackage: "nodejs",
    defaultInstall: "npm install",
    defaultBuild: "npm run build",
    defaultStart: "which serve >/dev/null 2>&1 || npm install -g serve -s 2>/dev/null; pm2 restart app 2>/dev/null || pm2 start serve --name app -- -s dist -l 3000",
    envPlaceholder: "VITE_API_URL=https://api.domain.com",
  },
  {
    id: "python_fastapi",
    name: "Python (FastAPI / Flask / Django)",
    tagline: "Web framework Python untuk API dan automasi backend",
    category: "python",
    icon: "Code2",
    defaultPort: 3000,
    requiredPackage: "python",
    defaultInstall: "python3 -m pip install -r requirements.txt",
    defaultBuild: "echo 'No build step required'",
    defaultStart: "which uvicorn >/dev/null 2>&1 && (pm2 restart app 2>/dev/null || pm2 start \"uvicorn main:app --host 0.0.0.0 --port 3000\" --name app) || (pm2 restart app 2>/dev/null || pm2 start \"python3 main.py\" --name app)",
    envPlaceholder: "APP_ENV=production\nPORT=3000\nSECRET_KEY=kuncirahasia\nDATABASE_URL=sqlite:///./app.db",
  },
  {
    id: "php_native",
    name: "PHP Native / Procedural",
    tagline: "Aplikasi PHP murni, CodeIgniter, atau script index.php tanpa Laravel",
    category: "php",
    icon: "Flame",
    defaultPort: 3000,
    requiredPackage: "php",
    defaultInstall: "composer install --no-interaction --prefer-dist 2>/dev/null || true",
    defaultBuild: "echo 'No build step required'",
    defaultStart: "pm2 delete app 2>/dev/null || true; pm2 start \"php -S 0.0.0.0:3000\" --name app",
    envPlaceholder: "APP_ENV=production\nPORT=3000\nDATABASE_URL=",
  },
  {
    id: "laravel",
    name: "Laravel (Blade / Inertia React)",
    tagline: "Modern PHP framework dengan Artisan CLI & Vite bundler (React / Vue)",
    category: "php",
    icon: "Flame",
    defaultPort: 3000,
    requiredPackage: "php",
    defaultInstall: "composer install --no-interaction --prefer-dist --optimize-autoloader; if [ -f package.json ]; then npm install; fi",
    defaultBuild: "if [ ! -f .env ]; then cp .env.example .env 2>/dev/null || touch .env; fi; if ! grep -q '^APP_KEY=' .env 2>/dev/null; then echo 'APP_KEY=' >> .env; fi; grep -q '^LARAVEL_CLOUD=' .env 2>/dev/null || echo 'LARAVEL_CLOUD=1' >> .env; php artisan key:generate --force 2>/dev/null || true; if [ -f package.json ]; then export NODE_OPTIONS='--max-old-space-size=1200'; npm run build; node -e 'const fs=require(\"fs\"),f=\"public/build/manifest.json\";if(fs.existsSync(f)){const d=JSON.parse(fs.readFileSync(f,\"utf8\"));let c=false;for(const k of Object.keys(d)){if(k.includes(\"resources/js/pages/\")){const a=k.replace(\"resources/js/pages/\",\"resources/js/Pages/\");if(!d[a]){d[a]=d[k];c=true;}}else if(k.includes(\"resources/js/Pages/\")){const a=k.replace(\"resources/js/Pages/\",\"resources/js/pages/\");if(!d[a]){d[a]=d[k];c=true;}}}if(c)fs.writeFileSync(f,JSON.stringify(d,null,2));}' 2>/dev/null || true; fi; chmod -R 775 storage bootstrap/cache 2>/dev/null || true; php artisan storage:link 2>/dev/null || true; if grep -q 'DB_CONNECTION=sqlite' .env 2>/dev/null || ! grep -q 'DB_CONNECTION=' .env 2>/dev/null; then mkdir -p database && touch database/database.sqlite 2>/dev/null || true; fi; php artisan migrate --force 2>/dev/null || true; php artisan optimize:clear 2>/dev/null || true; php artisan config:cache 2>/dev/null || true; php artisan route:cache 2>/dev/null || true; php artisan view:cache 2>/dev/null || true",
    defaultStart: "pm2 delete app 2>/dev/null || true; pm2 start \"php artisan serve --host=0.0.0.0 --port=3000\" --name app",
    envPlaceholder: "APP_NAME=Laravel\nAPP_ENV=production\nAPP_KEY=\nAPP_DEBUG=false\nAPP_URL=https://...\nDB_CONNECTION=sqlite\nLARAVEL_CLOUD=1",
  },
  {
    id: "golang",
    name: "Golang (Go)",
    tagline: "High-performance microservice & compiled REST API",
    category: "go",
    icon: "Cpu",
    defaultPort: 8080,
    requiredPackage: "golang",
    defaultInstall: "go mod download 2>/dev/null || true",
    defaultBuild: "go build -o server .",
    defaultStart: "pm2 restart app 2>/dev/null || pm2 start ./server --name app",
    envPlaceholder: "PORT=8080\nGIN_MODE=release",
  },
  {
    id: "docker",
    name: "Docker (Dockerfile / Compose)",
    tagline: "Containerized application via Dockerfile atau docker-compose.yml",
    category: "docker",
    icon: "Container",
    defaultPort: 3000,
    requiredPackage: "docker",
    defaultInstall: "docker compose build 2>/dev/null || docker build -t app .",
    defaultBuild: "docker compose down 2>/dev/null || docker rm -f app 2>/dev/null || true",
    defaultStart: "docker compose up -d 2>/dev/null || docker run -d --name app -p 3000:3000 --restart always app",
    envPlaceholder: "COMPOSE_PROJECT_NAME=app\nPORT=3000",
  },
  {
    id: "custom",
    name: "Custom Script",
    tagline: "Konfigurasi bebas sesuai alur build & deploy kustom kamu",
    category: "other",
    icon: "Terminal",
    defaultPort: 3000,
    defaultInstall: "npm install 2>/dev/null || pip install -r requirements.txt 2>/dev/null || true",
    defaultBuild: "npm run build 2>/dev/null || true",
    defaultStart: "pm2 restart app 2>/dev/null || pm2 start npm --name app -- start",
    envPlaceholder: "# Tuliskan pasangan KEY=VALUE baris demi baris\nPORT=3000",
  },
];

export interface WorkflowOptions {
  serverIp: string;
  branch: string;
  frameworkId: string;
  rootDirectory?: string;
  port: number;
  installCommand?: string;
  buildCommand?: string;
  startCommand?: string;
  hasEnvSecret?: boolean;
}

/**
 * Membangun file .github/workflows/deploy.yml dinamis berdasarkan framework & opsi kustom user.
 * Bersih, terstruktur dengan ::group::, tanpa escape code ANSI mentah,
 * dan Job Summary aman menggunakan heredoc EOF.
 */
export function buildDynamicWorkflow(options: WorkflowOptions): string {
  const fw = DEPLOY_FRAMEWORKS.find((f) => f.id === options.frameworkId) || DEPLOY_FRAMEWORKS[0];

  const rootDir = (options.rootDirectory || "./").replace(/^\.\//, "").trim();
  const dirChange = rootDir ? `cd ${rootDir}` : "";

  const installCmd = (options.installCommand || fw.defaultInstall).trim();
  const buildCmd = (options.buildCommand || fw.defaultBuild).trim();
  const startCmd = (options.startCommand || fw.defaultStart).trim();
  const port = options.port || fw.defaultPort;

  // Bangun script SSH yang murni menjalankan proses tanpa sampah log echo/grouping
  const scriptSteps: string[] = [
    `set -e`,
    `export GIT_TERMINAL_PROMPT=0`,
    ``,
    `# 1. Sinkronisasi repositori git`,
    `TARGET_REPO="\${{ github.repository }}"`,
    `CURRENT_REPO="$(cd ~/app 2>/dev/null && git config --get remote.origin.url 2>/dev/null || true)"`,
    `if [ ! -d ~/app/.git ] || ! echo "$CURRENT_REPO" | grep -q "$TARGET_REPO"; then`,
    `  rm -rf ~/app`,
    `  git clone --depth 1 -b ${options.branch} https://x-access-token:\${{ secrets.GITHUB_TOKEN }}@github.com/\${{ github.repository }}.git ~/app`,
    `  cd ~/app`,
    `else`,
    `  cd ~/app`,
    `  git remote set-url origin https://x-access-token:\${{ secrets.GITHUB_TOKEN }}@github.com/\${{ github.repository }}.git`,
    `  git reset --hard HEAD 2>/dev/null || true`,
    `  git clean -fd 2>/dev/null || true`,
    `  git fetch --depth 1 origin ${options.branch}`,
    `  git checkout -B ${options.branch} FETCH_HEAD`,
    `  git reset --hard FETCH_HEAD`,
    `  git clean -fd`,
    `fi`,
  ];

  if (dirChange) {
    scriptSteps.push(``);
    scriptSteps.push(`# Masuk ke subdirektori proyek`);
    scriptSteps.push(dirChange);
  }

  // Inject .env jika secret tersedia
  if (options.hasEnvSecret) {
    scriptSteps.push(``);
    scriptSteps.push(`# 2. Injeksi environment variables dari secrets`);
    scriptSteps.push(`if [ -n "$APP_ENV_CONTENT" ]; then`);
    scriptSteps.push(`  echo "$APP_ENV_CONTENT" > .env`);
    scriptSteps.push(`fi`);
  }

  // Install dependensi
  if (installCmd && installCmd !== "echo 'No install step required'") {
    scriptSteps.push(``);
    scriptSteps.push(`# 3. Instalasi dependensi`);
    scriptSteps.push(installCmd);
  }

  // Auto-generate Prisma Client / ORM jika ada
  scriptSteps.push(``);
  scriptSteps.push(`# 4. Persiapan ORM & framework cache`);
  scriptSteps.push(`if [ -f prisma/schema.prisma ] || grep -q '"prisma"' package.json 2>/dev/null; then`);
  scriptSteps.push(`  npx prisma generate 2>/dev/null || true`);
  scriptSteps.push(`fi`);
  scriptSteps.push(`if [ -f artisan ]; then`);
  scriptSteps.push(`  php artisan config:clear 2>/dev/null || true`);
  scriptSteps.push(`fi`);

  // Build
  if (buildCmd && buildCmd !== "echo 'No build step required'") {
    scriptSteps.push(``);
    scriptSteps.push(`# 5. Build & kompilasi aplikasi`);
    if (options.frameworkId === "nextjs" || options.frameworkId === "laravel" || options.frameworkId === "vite_spa") {
      scriptSteps.push(`export NODE_OPTIONS="--max-old-space-size=1200"`);
    }
    scriptSteps.push(buildCmd);
  }

  // Nginx reverse proxy configuration to target app port
  scriptSteps.push(``);
  scriptSteps.push(`# 6. Konfigurasi Nginx reverse proxy`);
  scriptSteps.push(`if which nginx >/dev/null 2>&1; then`);
  scriptSteps.push(`  cat << 'NGINX_EOF' > /etc/nginx/sites-available/default`);
  scriptSteps.push(`server {`);
  scriptSteps.push(`    listen 80 default_server;`);
  scriptSteps.push(`    listen [::]:80 default_server;`);
  scriptSteps.push(`    server_name _;`);
  scriptSteps.push(`    location / {`);
  scriptSteps.push(`        proxy_pass http://127.0.0.1:${port};`);
  scriptSteps.push(`        proxy_http_version 1.1;`);
  scriptSteps.push(`        proxy_set_header Upgrade $http_upgrade;`);
  scriptSteps.push(`        proxy_set_header Connection 'upgrade';`);
  scriptSteps.push(`        proxy_set_header Host $host;`);
  scriptSteps.push(`        proxy_set_header X-Real-IP $remote_addr;`);
  scriptSteps.push(`        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;`);
  scriptSteps.push(`        proxy_set_header X-Forwarded-Proto $scheme;`);
  scriptSteps.push(`        proxy_cache_bypass $http_upgrade;`);
  scriptSteps.push(`    }`);
  scriptSteps.push(`}`);
  scriptSteps.push(`NGINX_EOF`);
  scriptSteps.push(`  nginx -t 2>/dev/null && systemctl reload nginx 2>/dev/null || true`);
  scriptSteps.push(`fi`);

  // Start / Restart PM2
  scriptSteps.push(``);
  scriptSteps.push(`# 7. Menjalankan proses aplikasi via PM2 & auto-resurrect on reboot`);
  scriptSteps.push(`pm2 delete app 2>/dev/null || true`);
  scriptSteps.push(startCmd);
  scriptSteps.push(`pm2 save 2>/dev/null || true`);
  scriptSteps.push(`pm2 startup systemd -u root --hp /root 2>/dev/null || true`);
  scriptSteps.push(`systemctl enable pm2-root 2>/dev/null || true`);
  scriptSteps.push(``);
  scriptSteps.push(`echo "✔ Aplikasi berhasil diperbarui dan aktif berjalan di port ${port}."`);

  const indentedScript = scriptSteps
    .map((line) => (line ? `            ${line}` : ""))
    .join("\n");

  const stepEnvBlock = options.hasEnvSecret
    ? `        env:\n          APP_ENV_CONTENT: \${{ secrets.APP_ENV }}\n`
    : "";
  const withEnvsBlock = options.hasEnvSecret
    ? `          envs: APP_ENV_CONTENT\n`
    : "";

  return `name: Deploy to RupaCloud (${fw.name})

on:
  push:
    branches: [${options.branch}]

jobs:
  deploy:
    name: Auto-Deploy to Container
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout Code
        uses: actions/checkout@v4

      - name: 🚀 SSH to RupaCloud Container & Deploy
        uses: appleboy/ssh-action@v1.0.0
${stepEnvBlock}        with:
          host: \${{ secrets.SERVER_IP }}
          port: \${{ secrets.SERVER_PORT || 22 }}
          username: root
          key: \${{ secrets.SSH_PRIVATE_KEY }}
          timeout: 60s
          command_timeout: 30m
${withEnvsBlock}          script: |
${indentedScript}

      - name: 📊 Ringkasan Status Deployment (RuPa Cloud Summary)
        if: success()
        run: |
          cat << 'EOF' >> \$GITHUB_STEP_SUMMARY
          ## ☁️ RuPa Cloud - Ringkasan Deployment
          ### ✅ Deployment Berhasil!
          Aplikasi **${fw.name}** berhasil diperbarui dan aktif berjalan di container RuPa Cloud.

          | Parameter | Informasi |
          | :--- | :--- |
          | 📦 Framework | ${fw.name} |
          | 🌿 Branch | ${options.branch} |
          | 🔖 Commit SHA | \${{ github.sha }} |
          | 👤 Dipicu Oleh | \${{ github.actor }} |
          | ⏱️ Waktu Selesai | \$(date -u '+%Y-%m-%d %H:%M:%S UTC') |
          EOF

      - name: ⚠️ Ringkasan Kegagalan Deployment
        if: failure()
        run: |
          cat << 'EOF' >> \$GITHUB_STEP_SUMMARY
          ## ☁️ RuPa Cloud - Ringkasan Deployment
          ### ❌ Deployment Gagal!
          Terjadi kendala saat proses deployment di container. Silakan periksa log step **🚀 SSH to RupaCloud Container & Deploy** di atas untuk melihat detail kesalahannya.
          EOF
`;
}
