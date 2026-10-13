import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface IncusLimits {
  memoryMb: number; // e.g. 512
  cpuAllowance: number; // e.g. 50 (= 50% of 1 core)
}

let incusAvailable: boolean | null = null;

async function checkIncusInstalled(): Promise<boolean> {
  if (incusAvailable !== null) return incusAvailable;
  try {
    await execAsync("which incus");
    incusAvailable = true;
  } catch {
    incusAvailable = false;
  }
  return incusAvailable;
}

export const incus = {
  async createAndStart(name: string, image: string = "e20bfaead29a", limits: IncusLimits) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] 'incus' CLI not installed on this machine. Simulating provisioning for container: ${name}`);
      return {
        stdout: `Container ${name} mock-created and started with limits (mem: ${limits.memoryMb}MB, cpu: ${limits.cpuAllowance}%)`,
        stderr: "",
      };
    }

    const cmd = `incus init ${image} ${name} -c limits.cpu=1 -c limits.cpu.allowance=${limits.cpuAllowance}% -c limits.memory=${limits.memoryMb}MB -c limits.memory.swap=1GB -c security.nesting=true < /dev/null && incus start ${name}`;
    const { stdout, stderr } = await execAsync(cmd);
    return { stdout, stderr };
  },

  async stop(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] Mock stopping container: ${name}`);
      return { stdout: `Container ${name} mock-stopped`, stderr: "" };
    }

    try {
      const { stdout, stderr } = await execAsync(`incus stop ${name} --force`);
      return { stdout, stderr };
    } catch (err: any) {
      const msg = `${err.stderr || ""} ${err.message || ""}`.toLowerCase();
      if (
        msg.includes("already stopped") ||
        msg.includes("is not running") ||
        msg.includes("not found")
      ) {
        return { stdout: "Container sudah dalam keadaan berhenti", stderr: "" };
      }
      throw err;
    }
  },

  async start(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] Mock starting container: ${name}`);
      return { stdout: `Container ${name} mock-started`, stderr: "" };
    }

    try {
      const { stdout, stderr } = await execAsync(`incus start ${name}`);
      return { stdout, stderr };
    } catch (err: any) {
      const msg = `${err.stderr || ""} ${err.message || ""}`.toLowerCase();
      if (msg.includes("already running")) {
        return { stdout: "Container sudah dalam keadaan berjalan", stderr: "" };
      }
      throw err;
    }
  },

  async restart(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] Mock restarting container: ${name}`);
      return { stdout: `Container ${name} mock-restarted`, stderr: "" };
    }

    try {
      const { stdout, stderr } = await execAsync(`incus restart ${name} --force`);
      return { stdout, stderr };
    } catch (err: any) {
      const msg = `${err.stderr || ""} ${err.message || ""}`.toLowerCase();
      if (msg.includes("not running") || msg.includes("stopped") || msg.includes("already stopped")) {
        return this.start(name);
      }
      throw err;
    }
  },

  async delete(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] Mock deleting container: ${name}`);
      return { stdout: `Container ${name} mock-deleted`, stderr: "" };
    }

    try {
      const { stdout, stderr } = await execAsync(`incus delete ${name} --force`);
      return { stdout, stderr };
    } catch (err: any) {
      const msg = `${err.stderr || ""} ${err.message || ""}`.toLowerCase();
      if (msg.includes("not found")) {
        return { stdout: "Container sudah tidak ditemukan / terhapus", stderr: "" };
      }
      throw err;
    }
  },

  async getIp(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      // Generate simulated private IPv4 for dev/testing
      const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lastOctet = (hash % 200) + 10;
      return `10.152.42.${lastOctet}`;
    }

    try {
      const cmd = `incus list ${name} -c 4 --format csv`;
      const { stdout } = await execAsync(cmd);
      const match = stdout.match(/([0-9]{1,3}\.){3}[0-9]{1,3}/);
      return match ? match[0] : null;
    } catch {
      return null;
    }
  },

  async killProcesses(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) return;
    try {
      await execAsync(`incus exec ${name} -- bash -c "pkill -P 1 -v -f 'systemd|sshd' 2>/dev/null || true"`);
    } catch {
      // ignore kill errors
    }
  },

  async exec(
    name: string,
    command: string,
    cwd: string = "/root",
    timeoutMs: number = 30000
  ) {
    const safeCwd = cwd || "/root";
    const trimmed = command.trim();

    // Berikan panduan ramah jika pengguna mencoba membuka editor interaktif layar penuh
    if (
      trimmed.startsWith("nano") ||
      trimmed.startsWith("vim") ||
      trimmed.startsWith("vi ") ||
      trimmed === "vi"
    ) {
      return {
        stdout: "",
        stderr:
          "Web CLI berbasis baris perintah cepat dan tidak mendukung editor interaktif layar penuh (nano/vim).\n" +
          "Untuk mengelola file langsung di Web CLI:\n" +
          "  - Tulis baru : echo 'isi teks' > file.txt\n" +
          "  - Tambah teks: echo 'baris baru' >> file.txt\n" +
          "  - Baca file  : cat file.txt\n" +
          "  - Hapus file : rm file.txt\n" +
          "Untuk membuka nano/vim secara visual, gunakan koneksi SSH dengan kredensial di atas.",
        cwd: safeCwd,
      };
    }

    if (trimmed === "node") {
      return {
        stdout:
          "Node.js telah terpasang dan siap digunakan.\n" +
          "  - Cek versi: node -v\n" +
          "  - Eksekusi file: node <nama_file>.js\n" +
          "  - One-liner JS: node -e \"console.log('Hello RupaCloud')\"\n" +
          "Untuk membuka Node.js REPL interaktif, gunakan koneksi SSH.",
        stderr: "",
        cwd: safeCwd,
      };
    }

    if (trimmed === "python" || trimmed === "python3") {
      return {
        stdout:
          "Python telah terpasang dan siap digunakan.\n" +
          "  - Cek versi: python3 --version\n" +
          "  - Eksekusi file: python3 <nama_file>.py\n" +
          "  - One-liner: python3 -c \"print('Hello RupaCloud')\"\n" +
          "Untuk membuka Python REPL interaktif, gunakan koneksi SSH.",
        stderr: "",
        cwd: safeCwd,
      };
    }

    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      console.warn(`[INCUS MOCK/DEV] Mock executing command on ${name}: ${command}`);

      if (trimmed.startsWith("cd ")) {
        const target = trimmed.slice(3).trim();
        const nextCwd = target === ".." || target === "~" ? "/root" : target.startsWith("/") ? target : `${safeCwd}/${target}`;
        return { stdout: "", stderr: "", cwd: nextCwd };
      }
      if (trimmed === "pwd") {
        return { stdout: `${safeCwd}\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "uname -a") {
        return { stdout: `Linux rupacloud-${name} 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "uptime") {
        return { stdout: ` 14:42:01 up 2 days, 4:18,  1 user,  load average: 0.14, 0.09, 0.05\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "df -h") {
        return {
          stdout: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        10G  1.4G  8.6G  14% /\ntmpfs           256M     0  256M   0% /dev/shm\ntmpfs           100M  1.1M   99M   2% /run\n`,
          stderr: "",
          cwd: safeCwd,
        };
      }
      if (trimmed === "free -m" || trimmed === "free -h") {
        return {
          stdout: `               total        used        free      shared  buff/cache   available\nMem:             512         194         218           8         100         310\nSwap:              0           0           0\n`,
          stderr: "",
          cwd: safeCwd,
        };
      }
      if (trimmed.startsWith("ps")) {
        return {
          stdout: `PID TTY          TIME CMD\n  1 ?        00:00:02 systemd\n 89 ?        00:00:00 systemd-journal\n142 ?        00:00:00 sshd\n210 ?        00:00:01 nginx\n304 ?        00:00:04 node /root/app/index.js\n412 pts/0    00:00:00 bash\n`,
          stderr: "",
          cwd: safeCwd,
        };
      }
      if (trimmed.includes("systemctl status")) {
        return {
          stdout: `● nginx.service - A high performance web server and a reverse proxy server\n   Loaded: loaded (/lib/systemd/system/nginx.service; enabled)\n   Active: active (running) since Wed 2026-10-06 08:00:00 WIB\n   Main PID: 210 (nginx)\n   Tasks: 2 (limit: 512)\n   Memory: 18.4M\n`,
          stderr: "",
          cwd: safeCwd,
        };
      }
      if (trimmed === "whoami") {
        return { stdout: `root\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "ls" || trimmed === "ls -la" || trimmed === "ls -l") {
        return {
          stdout: `total 32\ndrwx------ 4 root root 4096 Oct  6 08:00 .\ndrwxr-xr-x 1 root root 4096 Oct  6 08:00 ..\n-rw-r--r-- 1 root root  220 Jan  7  2023 .bashrc\n-rw-r--r-- 1 root root  807 Jan  7  2023 .profile\ndrwx------ 2 root root 4096 Oct  6 08:00 .ssh\ndrwxr-xr-x 4 root root 4096 Oct  6 08:01 app\n-rw-r--r-- 1 root root  512 Oct  6 08:02 README.md\n`,
          stderr: "",
          cwd: safeCwd,
        };
      }
      if (trimmed === "node -v") {
        return { stdout: `v20.18.0\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "npm -v") {
        return { stdout: `10.8.2\n`, stderr: "", cwd: safeCwd };
      }
      if (trimmed === "clear") {
        return { stdout: `\x1b[2J\x1b[0;0H`, stderr: "", cwd: safeCwd };
      }
      if (trimmed.startsWith("echo ")) {
        return { stdout: `${trimmed.slice(5).replace(/["']/g, "")}\n`, stderr: "", cwd: safeCwd };
      }

      return { stdout: `[${name}] Executed: ${trimmed}\nExit status: 0\n`, stderr: "", cwd: safeCwd };
    }

    const wrappedScript = `${command}\n__RET__=$?\necho "__RUPA_CWD__"\npwd\nexit $__RET__`;
    const b64 = Buffer.from(wrappedScript, "utf-8").toString("base64");

    const parseOutput = (rawStdout: string, rawStderr: string) => {
      let stdout = rawStdout || "";
      const stderr = rawStderr || "";
      let nextCwd = safeCwd;

      const delim = "__RUPA_CWD__";
      if (stdout.includes(delim)) {
        const parts = stdout.split(delim);
        stdout = parts[0].replace(/\n$/, "");
        const rest = parts[1]?.trim().split("\n");
        if (rest && rest[0]) {
          nextCwd = rest[0].trim();
        }
      }

      return { stdout, stderr, cwd: nextCwd };
    };

    try {
      const { stdout: rawStdout, stderr: rawStderr } = await execAsync(
        `incus exec ${name} --cwd ${safeCwd} -- bash -c "\$(echo '${b64}' | base64 -d)" < /dev/null`,
        { timeout: timeoutMs }
      );
      return parseOutput(rawStdout, rawStderr);
    } catch (err: any) {
      return parseOutput(err.stdout || "", err.stderr || err.message || "Command exited with error");
    }
  },

  async stats(name: string) {
    const isInstalled = await checkIncusInstalled();
    if (!isInstalled) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      return {
        online: true,
        time: timeStr,
        cpu: 5,
        ramPercent: 15,
        ramMb: 110,
        ramTotalMb: 768,
        diskGb: 0.7,
        diskTotalGb: 5,
        networkRxMb: 0.1,
        networkTxMb: 0.05,
        uptime: "10 menit",
      };
    }

    try {
      const { stdout: infoOut } = await execAsync(`incus info ${name}`);
      const isRunning = infoOut.includes("Status: RUNNING");
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

      if (!isRunning) {
        return {
          online: false,
          time: timeStr,
          cpu: 0,
          ramPercent: 0,
          ramMb: 0,
          ramTotalMb: 768,
          diskGb: 0,
          diskTotalGb: 5,
          networkRxMb: 0,
          networkTxMb: 0,
          uptime: "Server Berhenti (Stopped)",
        };
      }

      // 1. Memory & Network dari incus info
      const memMatch = infoOut.match(/Memory \(current\):\s*([0-9.]+)\s*([A-Za-z]+)/);
      const rxMatch = infoOut.match(/Bytes received:\s*([0-9.]+)\s*([A-Za-z]+)/);
      const txMatch = infoOut.match(/Bytes sent:\s*([0-9.]+)\s*([A-Za-z]+)/);

      const parseMb = (valStr: string, unitStr: string) => {
        const val = parseFloat(valStr);
        const u = unitStr.toLowerCase();
        if (u.startsWith("g")) return Math.round(val * 1024);
        if (u.startsWith("m")) return Math.round(val);
        if (u.startsWith("k")) return +(val / 1024).toFixed(2);
        return +(val / (1024 * 1024)).toFixed(2);
      };

      let ramMb = memMatch ? Math.round(parseMb(memMatch[1], memMatch[2])) : 85;
      const rxMb = rxMatch ? Number(parseMb(rxMatch[1], rxMatch[2])) : 0;
      const txMb = txMatch ? Number(parseMb(txMatch[1], txMatch[2])) : 0;

      // 2. CPU, Uptime, dan Disk riil dari dalam container
      let cpu = 2;
      let uptime = "Aktif";
      let diskGb = 0.7;

      try {
        const { stdout: execOut } = await execAsync(
          `incus exec ${name} -- bash -c "uptime -p; echo '---'; top -bn1 | head -n 5; echo '---'; du -s -m /var /usr /etc /root /bin 2>/dev/null | awk '{s+=\\$1} END {print s}'; echo '---'; free -m | awk 'NR==2{print \\$3}'"`,
          { timeout: 6000 }
        );

        const sections = execOut.split("---");
        if (sections[0]) {
          const rawUptime = sections[0].trim();
          uptime = rawUptime.replace(/^up\s+/, "").replace(/minutes?/, "menit").replace(/hours?/, "jam").replace(/days?/, "hari");
        }

        if (sections[1]) {
          const cpuMatch = sections[1].match(/%Cpu\(s\):\s*([0-9.]+)\s*us,\s*([0-9.]+)\s*sy/);
          if (cpuMatch) {
            cpu = Math.min(100, Math.max(1, Math.round(parseFloat(cpuMatch[1]) + parseFloat(cpuMatch[2]))));
          }
        }

        if (sections[2]) {
          const rawDiskMb = parseFloat(sections[2].trim());
          if (!isNaN(rawDiskMb) && rawDiskMb > 0) {
            diskGb = +(rawDiskMb / 1024).toFixed(2);
          }
        }

        // 3. Gunakan RAM terpakai riil aplikasi dari free -m (mengabaikan kernel page/buffer cache)
        if (sections[3]) {
          const rawRamMb = parseInt(sections[3].trim(), 10);
          if (!isNaN(rawRamMb) && rawRamMb > 0) {
            ramMb = rawRamMb;
          }
        }
      } catch {
        // Fallback jika container busy
      }

      return {
        online: true,
        time: timeStr,
        cpu,
        ramPercent: Math.min(100, Math.max(1, Math.round((ramMb / 768) * 100))),
        ramMb,
        ramTotalMb: 768,
        diskGb,
        diskTotalGb: 5,
        networkRxMb: rxMb,
        networkTxMb: txMb,
        uptime,
      };
    } catch {
      return {
        online: false,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        cpu: 0,
        ramPercent: 0,
        ramMb: 0,
        ramTotalMb: 768,
        diskGb: 0,
        diskTotalGb: 5,
        networkRxMb: 0,
        networkTxMb: 0,
        uptime: "Offline",
      };
    }
  },
};
