"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Server,
  Clock,
  Terminal as TerminalIcon,
  Activity,
  Download,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Check,
  Copy,
  X,
  ArrowLeft,
  ArrowRight,
  XCircle,
  Play,
  Square,
  RotateCcw,
  GitBranch,
  Send,
  Trash2,
  Cpu,
  HardDrive,
  CornerDownLeft,
  Globe,
  Eye,
  EyeOff,
  Pencil,
  Key,
  Boxes,
  FileCode2,
  Container,
  Zap,
  Search,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  Lock,
  Unlock,
  Settings2,
  Flame,
  Code2,
  Layers,
  ExternalLink,
  ShieldCheck,
  Server as ServerIcon,
  Terminal,
  Sparkles,
} from "lucide-react";
import { GithubIcon } from "@/components/shared/github-icon";
import { GithubLogViewer } from "@/components/shared/github-log-viewer";
import { Order, Plan } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AVAILABLE_SETUP_PACKAGES, SETUP_PRESETS } from "@/lib/setup-packages";
import { DEPLOY_FRAMEWORKS, DeployFramework } from "@/lib/deploy-frameworks";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

type TabType = "overview" | "cli" | "deploy" | "monitoring" | "backup" | "danger";

interface GithubRepo {
  id: number;
  name: string;
  full_name: string;
  defaultBranch: string;
  private: boolean;
  description?: string | null;
  language?: string | null;
  stars?: number;
}

export default function ContainerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;
  const searchParams = useSearchParams();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [copied, setCopied] = useState<boolean>(false);
  const [githubHandle, setGithubHandle] = useState<string | null>(null);

  // Container action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showActionToast = (msg: { type: "success" | "error"; text: string } | null) => {
    setActionMessage(msg);
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    if (msg) {
      actionTimeoutRef.current = setTimeout(() => {
        setActionMessage(null);
      }, 4500);
    }
  };

  // Danger zone modal state
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [rebuildModalOpen, setRebuildModalOpen] = useState<boolean>(false);
  const [rebuilding, setRebuilding] = useState<boolean>(false);
  const [rebuildConfirmText, setRebuildConfirmText] = useState<string>("");
  const [rebuildPackages, setRebuildPackages] = useState<string[]>(["nodejs", "git_tools"]);

  // Extend order modal state
  const [extendModalOpen, setExtendModalOpen] = useState<boolean>(false);
  const [extendDays, setExtendDays] = useState<number>(3);
  const [extendWithAddon, setExtendWithAddon] = useState<boolean>(true);
  const [extending, setExtending] = useState<boolean>(false);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);

  const getExtendCost = (days: number) => {
    const matching = availablePlans.find(
      (p) => p.durationDays === days && p.tier === (order?.plan?.tier || "Micro")
    );
    if (matching) return matching.price;
    if (days === 1) return 3500;
    if (days === 3) return 9000;
    if (days === 7) return 18000;
    return (
      (order?.plan ? Math.round(order.plan.price / order.plan.durationDays) : 3500) * days
    );
  };

  const calculateNewExpiry = (days: number) => {
    const cur = order?.expiresAt ? new Date(order.expiresAt) : new Date();
    const base = cur.getTime() > Date.now() ? cur : new Date();
    return new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
  };

  // SSH Credential State
  const [showSshPassword, setShowSshPassword] = useState<boolean>(false);
  const [sshPasswordCopied, setSshPasswordCopied] = useState<boolean>(false);
  const [sshCmdCopied, setSshCmdCopied] = useState<boolean>(false);

  // Subdomain Edit Modal State
  const [subdomainModalOpen, setSubdomainModalOpen] = useState<boolean>(false);
  const [newSubdomainPrefix, setNewSubdomainPrefix] = useState<string>("");
  const [subdomainLoading, setSubdomainLoading] = useState<boolean>(false);
  const [subdomainError, setSubdomainError] = useState<string | null>(null);

  const handleUpdateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomainPrefix.trim()) return;
    setSubdomainLoading(true);
    setSubdomainError(null);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/subdomain`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSubdomain: newSubdomainPrefix.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah subdomain.");

      setOrder((prev) => (prev ? { ...prev, subdomain: data.subdomain } : null));
      showActionToast({ type: "success", text: data.message || "Subdomain berhasil diperbarui!" });
      setSubdomainModalOpen(false);
    } catch (err: any) {
      setSubdomainError(err.message || "Terjadi kesalahan.");
    } finally {
      setSubdomainLoading(false);
    }
  };

  const handleSelectExtendDays = (days: number) => {
    setExtendDays(days);
    if (days < 3) {
      setExtendWithAddon(false);
    } else if (order?.addon) {
      setExtendWithAddon(!order.addonSuspended);
    }
  };

  // Web CLI Interactive State
  const [cliHistory, setCliHistory] = useState<
    Array<{ command: string; stdout?: string; stderr?: string; isRunning?: boolean; cwd?: string }>
  >([]);
  const [cliCwd, setCliCwd] = useState<string>("/root");
  const [cmdHistoryList, setCmdHistoryList] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [inputDraft, setInputDraft] = useState<string>("");
  const [cliInput, setCliInput] = useState<string>("");
  const [cliExecuting, setCliExecuting] = useState<boolean>(false);
  const cliScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const formatPromptPath = (dir?: string) => {
    const p = dir || cliCwd || "/root";
    if (p === "/root") return "~";
    if (p.startsWith("/root/")) return "~" + p.slice(5);
    return p;
  };

  // Keyboard navigation & Shortcuts (ArrowUp, ArrowDown, Ctrl + C)
  const handleCliKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tangani Ctrl + C (SIGINT)
    if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
      const sel = window.getSelection();
      if (sel && sel.toString().length > 0) {
        // Biarkan browser menyalin teks yang diblok
        return;
      }

      e.preventDefault();

      if (cliExecuting) {
        // Hentikan proses yang sedang berjalan
        abortControllerRef.current?.abort();
        fetch(`/api/customer/orders/${orderId}/exec`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "kill" }),
        }).catch(() => {});

        setCliHistory((prev) => {
          const next = [...prev];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0) {
            next[lastIdx] = {
              ...next[lastIdx],
              command: next[lastIdx].command + "^C",
              isRunning: false,
            };
          }
          return next;
        });
        setCliExecuting(false);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }

      // Jika tidak sedang menjalankan proses, batalkan baris yang diketik
      const cancelledCmd = (cliInput || "") + "^C";
      setCliHistory((prev) => [
        ...prev,
        { command: cancelledCmd, cwd: cliCwd },
      ]);
      setCliInput("");
      setHistoryIndex(-1);
      return;
    }

    if (cmdHistoryList.length === 0) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIndex === -1) {
        // Simpan input yang sedang diketik sebelum menelusuri history ke belakang
        setInputDraft(cliInput);
        const nextIdx = cmdHistoryList.length - 1;
        setHistoryIndex(nextIdx);
        setCliInput(cmdHistoryList[nextIdx]);
        setTimeout(() => {
          inputRef.current?.setSelectionRange(cmdHistoryList[nextIdx].length, cmdHistoryList[nextIdx].length);
        }, 0);
      } else if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCliInput(cmdHistoryList[nextIdx]);
        setTimeout(() => {
          inputRef.current?.setSelectionRange(cmdHistoryList[nextIdx].length, cmdHistoryList[nextIdx].length);
        }, 0);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;

      if (historyIndex < cmdHistoryList.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setCliInput(cmdHistoryList[nextIdx]);
        setTimeout(() => {
          inputRef.current?.setSelectionRange(cmdHistoryList[nextIdx].length, cmdHistoryList[nextIdx].length);
        }, 0);
      } else {
        // Kembali ke input yang sedang diketik semula
        setHistoryIndex(-1);
        setCliInput(inputDraft);
        setTimeout(() => {
          inputRef.current?.setSelectionRange(inputDraft.length, inputDraft.length);
        }, 0);
      }
    }
  };

  // State & handler untuk salin teks log terminal
  const [terminalCopied, setTerminalCopied] = useState<boolean>(false);
  const handleCopyTerminal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const cliHost = order?.subdomain || (order?.containerId ? order.containerId.replace(/^rupa-/, "") : "server");
    const text = cliHistory
      .map((item) => {
        let block = `root@${cliHost}:${formatPromptPath(item.cwd)}# ${item.command}`;
        if (item.stdout) block += `\n${item.stdout}`;
        if (item.stderr) block += `\n${item.stderr}`;
        return block;
      })
      .join("\n");

    if (!text) return;
    navigator.clipboard.writeText(text);
    setTerminalCopied(true);
    setTimeout(() => setTerminalCopied(false), 2000);
  };

  // Live monitoring state (riil dari database & container telemetry)
  const [monitoringData, setMonitoringData] = useState<Array<{ time: string; cpu: number; ram: number }>>([]);
  const [liveStats, setLiveStats] = useState<{
    online: boolean;
    cpu: number;
    ramPercent: number;
    ramMb: number;
    ramTotalMb: number;
    diskGb: number;
    diskTotalGb: number;
    networkRxMb: number;
    networkTxMb: number;
    uptime: string;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);

  // Backup state
  const [backupLoading, setBackupLoading] = useState<boolean>(false);

  // GitHub CI/CD state
  const [githubRepos, setGithubRepos] = useState<GithubRepo[] | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [repoSearch, setRepoSearch] = useState<string>("");
  const [repoDropdownOpen, setRepoDropdownOpen] = useState<boolean>(false);
  const [selectedFramework, setSelectedFramework] = useState<string>("nextjs");
  const [deployBranch, setDeployBranch] = useState<string>("main");
  const [rootDirectory, setRootDirectory] = useState<string>("./");
  const [appPort, setAppPort] = useState<number>(3000);
  const [installCommand, setInstallCommand] = useState<string>("");
  const [buildCommand, setBuildCommand] = useState<string>("");
  const [startCommand, setStartCommand] = useState<string>("");
  const [envVars, setEnvVars] = useState<string>("");
  const [showAdvancedConfig, setShowAdvancedConfig] = useState<boolean>(false);
  const [customSshHost, setCustomSshHost] = useState<string>("");
  const [customSshPort, setCustomSshPort] = useState<string>("");
  const [cicdLoading, setCicdLoading] = useState<boolean>(false);
  const [installingPackage, setInstallingPackage] = useState<string | null>(null);
  const [cicdMessage, setCicdMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // GitHub Actions Runs & Live Logs
  interface GhWorkflowRun {
    id: number;
    name: string;
    headBranch: string;
    headSha: string;
    commitMessage: string;
    event: string;
    status: "queued" | "in_progress" | "completed";
    conclusion: "success" | "failure" | "cancelled" | null;
    createdAt: string;
    updatedAt: string;
    htmlUrl: string;
    jobsUrl: string;
  }

  const [ghRuns, setGhRuns] = useState<GhWorkflowRun[]>([]);
  const [selectedGhRun, setSelectedGhRun] = useState<GhWorkflowRun | null>(null);
  const [ghLogText, setGhLogText] = useState<string>("");
  const [ghLogLoading, setGhLogLoading] = useState<boolean>(false);
  const [ghRunsLoading, setGhRunsLoading] = useState<boolean>(false);
  const [ghLogCopied, setGhLogCopied] = useState<boolean>(false);

  const handleExecuteCli = async () => {
    const cmd = cliInput.trim();
    if (!cmd || cliExecuting) return;

    // Catat ke history buffer
    setCmdHistoryList((prev) => [...prev, cmd]);
    setHistoryIndex(-1);
    setInputDraft("");

    if (cmd === "clear") {
      setCliHistory([]);
      setCliInput("");
      return;
    }

    if (cmd === "help") {
      setCliHistory((prev) => [
        ...prev,
        {
          command: cmd,
          cwd: cliCwd,
          stdout:
            "RuPa Cloud Interactive Shell v2.0\n" +
            "Perintah umum yang didukung:\n" +
            "  ls -la                 - Cek isi file & direktori\n" +
            "  cd <folder>            - Pindah folder kerja\n" +
            "  pwd                    - Cek path direktori aktif\n" +
            "  mkdir <folder>         - Buat direktori baru\n" +
            "  touch <file>           - Buat file kosong baru\n" +
            "  echo 'teks' > file.txt - Tulis isi file baru\n" +
            "  cat <file>             - Baca isi file\n" +
            "  rm <file>              - Hapus file\n" +
            "  systemctl status nginx - Cek status web server\n" +
            "  df -h                  - Cek penggunaan disk storage\n" +
            "  free -m                - Cek penggunaan RAM\n" +
            "  Ctrl + C               - Hentikan proses yang berjalan (SIGINT)\n" +
            "  clear                  - Bersihkan layar terminal",
        },
      ]);
      setCliInput("");
      return;
    }

    // Langsung masukkan ke history dengan status running agar teks perintah tidak hilang dari layar
    setCliHistory((prev) => [
      ...prev,
      { command: cmd, isRunning: true, cwd: cliCwd },
    ]);
    setCliExecuting(true);
    setCliInput("");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`/api/customer/orders/${orderId}/exec`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, cwd: cliCwd }),
        signal: controller.signal,
      });
      const data = await res.json();

      if (data.cwd) {
        setCliCwd(data.cwd);
      }

      setCliHistory((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        if (!res.ok) {
          next[lastIdx] = {
            command: cmd,
            stderr: data.error || "Gagal mengeksekusi perintah.",
            isRunning: false,
            cwd: cliCwd,
          };
        } else {
          next[lastIdx] = {
            command: cmd,
            stdout: data.stdout || undefined,
            stderr: data.stderr || undefined,
            isRunning: false,
            cwd: cliCwd,
          };
        }
        return next;
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      setCliHistory((prev) => {
        const next = [...prev];
        const lastIdx = next.length - 1;
        next[lastIdx] = {
          command: cmd,
          stderr: err.message || "Network error",
          isRunning: false,
          cwd: cliCwd,
        };
        return next;
      });
    } finally {
      setCliExecuting(false);
      abortControllerRef.current = null;
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const fetchLiveStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/stats`);
      const data = await res.json();
      if (data.success && data.stats) {
        setLiveStats(data.stats);
        if (Array.isArray(data.history) && data.history.length > 0) {
          setMonitoringData(data.history);
        } else if (data.stats.online) {
          setMonitoringData([
            {
              time: data.stats.time || new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              cpu: data.stats.cpu,
              ram: data.stats.ramPercent,
            },
          ]);
        }
      }
    } catch {
      // ignore fetch error
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    try {
      const link = document.createElement("a");
      link.href = `/api/customer/orders/${orderId}/backup`;
      link.setAttribute("download", `rupacloud-backup-${order?.subdomain || orderId}.tar.gz`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setActionMessage({ type: "success", text: "Arsip backup server (.tar.gz) berhasil diunduh!" });
    } catch {
      setActionMessage({ type: "error", text: "Gagal mengunduh backup server." });
    } finally {
      setTimeout(() => setBackupLoading(false), 1500);
    }
  };

  useEffect(() => {
    if (activeTab === "cli") {
      if (cliScrollRef.current) {
        cliScrollRef.current.scrollTop = cliScrollRef.current.scrollHeight;
      }
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [cliHistory, activeTab]);

  // Global listener untuk Ctrl + C pada saat tab CLI aktif
  useEffect(() => {
    if (activeTab !== "cli") return;

    const handleGlobalTerminalKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        const sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;

        if (cliExecuting) {
          e.preventDefault();
          abortControllerRef.current?.abort();
          fetch(`/api/customer/orders/${orderId}/exec`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "kill" }),
          }).catch(() => {});

          setCliHistory((prev) => {
            const next = [...prev];
            const lastIdx = next.length - 1;
            if (lastIdx >= 0) {
              next[lastIdx] = {
                ...next[lastIdx],
                command: next[lastIdx].command + "^C",
                isRunning: false,
              };
            }
            return next;
          });
          setCliExecuting(false);
          setTimeout(() => inputRef.current?.focus(), 50);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalTerminalKey);
    return () => window.removeEventListener("keydown", handleGlobalTerminalKey);
  }, [activeTab, cliExecuting, orderId]);

  useEffect(() => {
    if (activeTab === "monitoring") {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab, orderId]);

  useEffect(() => {
    if (searchParams.get("success") === "GithubConnected") {
      setActiveTab("deploy");
      setCicdMessage({
        type: "success",
        text: "Akun GitHub berhasil terhubung! Silakan pilih repositori kamu di bawah ini.",
      });
    }
  }, [searchParams]);

  // Polling otomatis saat server masih PROVISIONING sampai siap (ACTIVE)
  useEffect(() => {
    if (!order || order.status !== "PROVISIONING") return;

    const pollInterval = setInterval(async () => {
      try {
        const updated = await dataSource.getOrderDetail(orderId);
        if (updated) {
          setOrder(updated);
          if (updated.status === "ACTIVE") {
            setActionMessage({
              type: "success",
              text: "🎉 Server VPS berhasil disiapkan dan sekarang aktif!",
            });
            clearInterval(pollInterval);
          }
        }
      } catch {
        // Abaikan fetch error saat polling
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [order?.status, orderId]);

  useEffect(() => {
    async function loadDetail() {
      const [data, plans] = await Promise.all([
        dataSource.getOrderDetail(orderId),
        dataSource.getPlans(),
      ]);
      setOrder(data);
      setAvailablePlans(plans);
      if (data?.addon) {
        setExtendWithAddon(!data.addonSuspended);
      }
      setLoading(false);

      // Fetch github repos in background
      fetch("/api/user/github/repos")
        .then(async (res) => {
          if (!res.ok) {
            setGithubRepos(null);
            setGithubHandle(null);
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data && data.success && Array.isArray(data.repositories)) {
            setGithubRepos(data.repositories);
            setGithubHandle(data.githubHandle || null);
            if (data.repositories.length > 0) {
              const firstRepo = data.repositories[0];
              setSelectedRepo(firstRepo.full_name);
              setDeployBranch(firstRepo.defaultBranch || "main");
              autoDetectAndApplyFramework(firstRepo);
            }
          } else {
            setGithubRepos(null);
            setGithubHandle(null);
          }
        })
        .catch(() => {
          setGithubRepos(null);
          setGithubHandle(null);
        });
    }
    loadDetail();
  }, [orderId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContainerAction = async (action: "start" | "stop" | "restart") => {
    setActionLoading(action);
    showActionToast(null);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Aksi gagal");
      showActionToast({ type: "success", text: body.message ?? "Aksi berhasil dijalankan." });
      // Refresh order data
      const updated = await dataSource.getOrderDetail(orderId);
      if (updated) setOrder(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      showActionToast({ type: "error", text: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetContainer = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restart" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Reset gagal");
      showActionToast({ type: "success", text: "Server berhasil direset (restart)." });
      const updated = await dataSource.getOrderDetail(orderId);
      if (updated) setOrder(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset gagal.";
      showActionToast({ type: "error", text: msg });
    } finally {
      setResetting(false);
      setResetModalOpen(false);
    }
  };

  const handleRebuildContainer = async () => {
    if (rebuildConfirmText !== "REBUILD") return;
    setRebuilding(true);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rebuild", packages: rebuildPackages }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Rebuild OS gagal");
      showActionToast({ type: "success", text: body.message ?? "OS berhasil di-reinstall bersih (Ubuntu 22.04 LTS)!" });
      setCliHistory([]);
      const updated = await dataSource.getOrderDetail(orderId);
      if (updated) setOrder(updated);
      setRebuildModalOpen(false);
      setRebuildConfirmText("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Rebuild OS gagal.";
      showActionToast({ type: "error", text: msg });
    } finally {
      setRebuilding(false);
    }
  };

  const handleExtendContainer = async () => {
    setExtending(true);
    setExtendError(null);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          days: extendDays,
          withAddon: extendWithAddon && extendDays >= 3,
          paymentMethod: "BALANCE",
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Perpanjangan gagal");
      showActionToast({ type: "success", text: body.message ?? "Masa sewa berhasil diperpanjang!" });
      setExtendModalOpen(false);

      // Trigger update balance & refresh order
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("rupacloud:balance-updated"));
      }
      const updated = await dataSource.getOrderDetail(orderId);
      if (updated) setOrder(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Perpanjangan gagal.";
      setExtendError(msg);
    } finally {
      setExtending(false);
    }
  };

  const autoDetectAndApplyFramework = (repo: GithubRepo) => {
    let fwId = "nextjs";
    const lang = (repo.language || "").toLowerCase();
    const name = (repo.name || "").toLowerCase();

    if (lang.includes("python")) {
      fwId = "python_fastapi";
    } else if (lang.includes("php") || name.includes("laravel")) {
      fwId = "laravel";
    } else if (lang.includes("go")) {
      fwId = "golang";
    } else if (name.includes("vite") || name.includes("vue") || name.includes("react-app")) {
      fwId = "vite_spa";
    } else if (name.includes("api") || name.includes("server") || name.includes("express")) {
      fwId = "nodejs_api";
    } else if (lang.includes("javascript") || lang.includes("typescript")) {
      fwId = "nextjs";
    }

    applyFramework(fwId);
  };

  const applyFramework = (fwId: string) => {
    setSelectedFramework(fwId);
    const fw = DEPLOY_FRAMEWORKS.find((f) => f.id === fwId);
    if (fw) {
      setAppPort(fw.defaultPort);
      setInstallCommand(fw.defaultInstall);
      setBuildCommand(fw.defaultBuild);
      setStartCommand(fw.defaultStart);
      setEnvVars((prev) => (prev ? prev : fw.envPlaceholder));
    }
  };

  const handleSelectRepo = (repo: GithubRepo) => {
    setSelectedRepo(repo.full_name);
    setDeployBranch(repo.defaultBranch || "main");
    setRepoDropdownOpen(false);
    autoDetectAndApplyFramework(repo);
  };

  const handleInstallRuntime = async (pkgId: string) => {
    setInstallingPackage(pkgId);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/install-package`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memasang paket runtime.");

      // Refresh order data
      if (data.setupPackages) {
        setOrder((prev) => (prev ? { ...prev, setupPackages: data.setupPackages } : prev));
      }
      const updated = await dataSource.getOrderDetail(orderId);
      if (updated) setOrder(updated);

      showActionToast({ type: "success", text: data.message });
    } catch (err: any) {
      showActionToast({ type: "error", text: err.message || "Gagal memasang paket runtime." });
    } finally {
      setInstallingPackage(null);
    }
  };

  const handleSetupCicd = async () => {
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");
    setCicdLoading(true);
    setCicdMessage(null);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/setup-cicd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoOwner: owner,
          repoName: repo,
          branch: deployBranch || "main",
          frameworkId: selectedFramework,
          rootDirectory: rootDirectory || "./",
          port: appPort,
          installCommand: installCommand || undefined,
          buildCommand: buildCommand || undefined,
          startCommand: startCommand || undefined,
          envVars: envVars || undefined,
          customSshHost: customSshHost.trim() || undefined,
          customSshPort: customSshPort.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Setup CI/CD gagal");
      setCicdMessage({ type: "success", text: body.message ?? "CI/CD berhasil dipasang!" });
      setTimeout(() => {
        fetchGhWorkflowRuns(owner, repo, true);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Setup CI/CD gagal.";
      setCicdMessage({ type: "error", text: msg });
    } finally {
      setCicdLoading(false);
    }
  };

  // GitHub Actions Runs & Live Logs Fetchers
  const fetchGhWorkflowRuns = async (
    owner: string,
    repo: string,
    autoSelectFirst = false,
    silent = false
  ) => {
    if (!silent) setGhRunsLoading(true);
    try {
      const res = await fetch(
        `/api/customer/orders/${orderId}/github-actions?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&latest=true`
      );
      if (!res.ok) return;
      const data = await res.json();
      const runs: GhWorkflowRun[] = data.runs || [];
      setGhRuns(runs);

      if (autoSelectFirst && runs.length > 0) {
        setSelectedGhRun(runs[0]);
        if (data.latestLog) {
          setGhLogText(data.latestLog);
        }
      } else if (selectedGhRun) {
        const updated = runs.find((r) => r.id === selectedGhRun.id);
        if (updated) {
          setSelectedGhRun(updated);
          if (
            (updated.status !== selectedGhRun.status || updated.conclusion !== selectedGhRun.conclusion) &&
            updated.id === runs[0]?.id &&
            data.latestLog
          ) {
            setGhLogText(data.latestLog);
          }
        }
      }
    } catch (err) {
      console.error("Gagal mengambil runs GitHub Actions:", err);
    } finally {
      if (!silent) setGhRunsLoading(false);
    }
  };

  const handleSelectRun = async (run: GhWorkflowRun) => {
    setSelectedGhRun(run);
    if (!selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");
    if (!owner || !repo) return;

    setGhLogLoading(true);
    try {
      const jobsRes = await fetch(
        `/api/customer/orders/${orderId}/github-actions?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&runId=${run.id}`
      );
      if (!jobsRes.ok) throw new Error("Gagal mengambil jobs list");
      const jobsData = await jobsRes.json();
      const firstJob = jobsData.jobs?.[0];
      if (firstJob) {
        const logRes = await fetch(
          `/api/customer/orders/${orderId}/github-actions?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&jobId=${firstJob.id}`
        );
        const logData = await logRes.json();
        setGhLogText(logData.log || "Tidak ada log untuk job ini.");
      } else {
        setGhLogText("Menunggu runner GitHub mengeksekusi job...");
      }
    } catch (err: any) {
      setGhLogText(`Gagal memuat log: ${err.message}`);
    } finally {
      setGhLogLoading(false);
    }
  };

  const handleCopyGhLog = () => {
    if (!ghLogText) return;
    navigator.clipboard.writeText(ghLogText);
    setGhLogCopied(true);
    setTimeout(() => setGhLogCopied(false), 2000);
  };

  // Auto-refresh GitHub Actions runs saat tab deploy dibuka & repo dipilih
  useEffect(() => {
    if (activeTab === "deploy" && selectedRepo) {
      const [owner, repo] = selectedRepo.split("/");
      if (owner && repo) {
        fetchGhWorkflowRuns(owner, repo, true);
        const interval = setInterval(() => {
          fetchGhWorkflowRuns(owner, repo, false, true);
        }, 6000);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab, selectedRepo]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-2xl"></div>
        <div className="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-navy-900">Server Tidak Ditemukan</h2>
        <p className="text-xs text-neutral-600">ID container tidak terdaftar di sistem kamu.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy-800 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Server</span>
        </Link>
      </div>
    );
  }

  const isServerRunning = (order.serverStatus ?? "RUNNING") === "RUNNING";
  const isOrderActive = order.status === "ACTIVE" || order.status === "EXPIRING_SOON";

  // Validasi Kesiapan CI/CD Deploy (Langkah 1 & Langkah 2)
  const isStep1Ready = Boolean(selectedRepo);
  const activeFrameworkObj = DEPLOY_FRAMEWORKS.find((f) => f.id === selectedFramework);
  const containerPkgs: string[] = order.setupPackages || [];
  const isStep2Ready = !activeFrameworkObj?.requiredPackage || containerPkgs.includes(activeFrameworkObj.requiredPackage);
  const canDeploy = Boolean(
    order.addon &&
    !order.addonSuspended &&
    isStep1Ready &&
    isStep2Ready &&
    !cicdLoading
  );

  return (
    <div className="space-y-6">
      {/* Back Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="text-xs font-bold text-navy-900 hover:text-blue-600 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Server Saya</span>
        </Link>
        <span className="text-xs font-mono text-neutral-400">ID: {order.id}</span>
      </div>

      {/* Container Identity Banner */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Badge Status Masa Sewa / Subscription */}
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold",
                order.status === "ACTIVE"
                  ? "bg-green-100 text-green-800 border border-green-200"
                  : order.status === "EXPIRING_SOON"
                  ? "bg-amber-100 text-amber-800 border border-amber-200"
                  : order.status === "EXPIRED"
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-slate-100 text-slate-700 border border-slate-200"
              )}
            >
              {order.status === "ACTIVE"
                ? "Sewa Aktif"
                : order.status === "EXPIRING_SOON"
                ? "Segera Berakhir"
                : order.status === "EXPIRED"
                ? "Masa Sewa Berakhir"
                : order.status}
            </span>

            {/* Badge Keadaan Mesin Server (Running vs Stopped) */}
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5",
                isServerRunning
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-700 border border-slate-300"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isServerRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                )}
              />
              <span>{isServerRunning ? "Server Berjalan" : "Server Berhenti"}</span>
            </span>

            {order.addon && !order.addonSuspended && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                CI/CD + Subdomain
              </span>
            )}
            {order.addon && order.addonSuspended && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Add-on Ditangguhkan
              </span>
            )}
            <span className="text-xs text-neutral-500 font-mono">Container LXD</span>
          </div>
          <h1 className="text-2xl font-extrabold text-navy-900">
            {order.plan?.name || "Server LXD"}
          </h1>
          <p className="text-xs text-neutral-500 font-mono">{order.subdomain}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Action buttons based on server power state */}
          {isOrderActive && (
            <>
              {isServerRunning ? (
                <>
                  <button
                    onClick={() => handleContainerAction("stop")}
                    disabled={!!actionLoading}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Matikan server VPS"
                  >
                    <Square className="w-3.5 h-3.5 fill-slate-500 text-slate-500" />
                    <span>{actionLoading === "stop" ? "Menghentikan..." : "Stop Server"}</span>
                  </button>
                  <button
                    onClick={() => handleContainerAction("restart")}
                    disabled={!!actionLoading}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    title="Restart server VPS"
                  >
                    <RotateCcw className={cn("w-3.5 h-3.5", actionLoading === "restart" && "animate-spin")} />
                    <span>{actionLoading === "restart" ? "Merestart..." : "Restart"}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleContainerAction("start")}
                  disabled={!!actionLoading}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  title="Nyalakan server VPS"
                >
                  <Play className={cn("w-3.5 h-3.5 fill-current", actionLoading === "start" && "animate-pulse")} />
                  <span>{actionLoading === "start" ? "Menyalakan..." : "Start Server"}</span>
                </button>
              )}
            </>
          )}

          {order.status !== "FAILED" ? (
            <button
              onClick={() => {
                setExtendError(null);
                setExtendModalOpen(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>Perpanjang Masa Sewa</span>
            </button>
          ) : (
            <span className="px-4 py-2 bg-red-50 text-red-700 font-bold text-xs rounded-xl border border-red-200 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Server Dihapus Permanen</span>
            </span>
          )}
        </div>
      </div>

      {/* Alert Masa Sewa Berakhir (Expired - Grace Period 7 Hari) */}
      {order.status === "EXPIRED" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-900 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">
                Masa Sewa Server Telah Berakhir (Masa Tenggang 7 Hari)
              </p>
              <p className="text-red-700 text-[11px] mt-0.5">
                Mesin server telah dihentikan sementara. Anda memiliki waktu hingga 7 hari untuk memperpanjang masa sewa sebelum seluruh data dan container VPS dihapus permanen.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setExtendError(null);
              setExtendModalOpen(true);
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shrink-0 transition-colors cursor-pointer text-xs"
          >
            Perpanjang Sekarang
          </button>
        </div>
      )}

      {/* Alert Server Dihapus Permanen (FAILED / Exceeded 7 Days) */}
      {order.status === "FAILED" && (
        <div className="relative overflow-hidden p-5 sm:p-6 bg-gradient-to-r from-neutral-950 via-red-950/80 to-neutral-950 border-2 border-red-600/70 rounded-3xl text-white shadow-2xl">
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none">
            <Trash2 className="w-44 h-44 text-red-500" />
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600/20 border border-red-500/50 rounded-2xl shrink-0 text-red-400 shadow-inner">
                <Trash2 className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-red-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                    Terminated / Musnah
                  </span>
                  <span className="text-xs text-neutral-300 font-medium">• Masa Tenggang 7 Hari Berakhir</span>
                </div>
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  Container VPS Telah Dihapus Permanen
                </h3>
                <p className="text-neutral-100 text-xs max-w-2xl leading-relaxed font-normal">
                  Server ini telah melewati batas masa tenggang 7 hari tanpa perpanjangan sewa. Seluruh data, container Incus, dan routing subdomain telah dimusnahkan secara permanen dari node cluster dan tidak dapat dipulihkan kembali.
                </p>
              </div>
            </div>
            <Link
              href="/product"
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shrink-0 transition-colors shadow-lg shadow-red-900/50 flex items-center gap-1.5"
            >
              <span>Pesan VPS Baru</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Alert Grace Period Addon Suspended */}
      {order.addon && order.addonSuspended && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">
                Add-on CI/CD & Subdomain Ditangguhkan (Masa Tenggang 24 Jam)
              </p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Akses webhook deploy GitHub dan routing subdomain dinonaktifkan sementara. Perpanjang sewa server dengan add-on (pilih 3 atau 7 hari) untuk mengaktifkannya kembali sebelum dihapus permanen.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setExtendDays(3);
              setExtendWithAddon(true);
              setExtendError(null);
              setExtendModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 transition-colors cursor-pointer text-xs"
          >
            Pulihkan Add-on
          </button>
        </div>
      )}

      {/* Provisioning In Progress Banner */}
      {order.status === "PROVISIONING" && (
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <RefreshCcw className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                <span>Inisialisasi & Setup Container VPS Sedang Berjalan</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md animate-pulse">
                  Memproses...
                </span>
              </h3>
              <p className="text-xs text-neutral-600 mt-0.5">
                Node Incus sedang mengalokasikan image Ubuntu 22.04 LTS, RAM {order.plan?.ramMb}MB, CPU {order.plan?.cpuAllowance}%, dan mengonfigurasi IP container.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
            <div className="p-3 bg-white/90 rounded-xl border border-blue-100 flex items-center gap-2.5 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span className="font-semibold text-slate-800">1. Alokasi Resource & Order Sukses</span>
            </div>
            <div className="p-3 bg-white/90 rounded-xl border border-blue-200 flex items-center gap-2.5 shadow-xs">
              <RefreshCcw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
              <span className="font-bold text-blue-900">2. Booting Kernel OS Container</span>
            </div>
            <div className="p-3 bg-white/90 rounded-xl border border-blue-100 flex items-center gap-2.5 shadow-xs text-slate-400">
              <Globe className="w-4 h-4 shrink-0" />
              <span>3. Subdomain & Jaringan Siap</span>
            </div>
          </div>

          {order.setupPackages && order.setupPackages.length > 0 && (
            <div className="p-3 bg-white/90 rounded-xl border border-blue-200 text-xs space-y-1">
              <span className="font-bold text-navy-900 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                <span>Paket Setup Otomatis yang Sedang Dipasang:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {order.setupPackages.map((pkgId) => {
                  const pkg = AVAILABLE_SETUP_PACKAGES.find((p) => p.id === pkgId);
                  return (
                    <span
                      key={pkgId}
                      className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md"
                    >
                      {pkg?.name || pkgId}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-[11px] text-blue-700 font-medium">
            💡 Halaman ini memantau status secara live dan akan terbuka otomatis dalam beberapa detik. Anda tidak perlu me-refresh browser.
          </p>
        </div>
      )}

      {/* Action feedback toast */}
      {actionMessage && (
        <div
          className={cn(
            "px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200",
            actionMessage.type === "success"
              ? "bg-green-50 text-green-800 border-green-200"
              : "bg-red-50 text-red-800 border-red-200"
          )}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer"
            title="Tutup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Overview", icon: Server },
          { id: "cli", label: "Web CLI", icon: TerminalIcon },
          { id: "deploy", label: "Deploy (GitHub)", icon: GithubIcon },
          { id: "monitoring", label: "Monitoring", icon: Activity },
          { id: "backup", label: "Backup / Export", icon: Download },
          { id: "danger", label: "Danger Zone", icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors",
                isActiveTab
                  ? "bg-navy-800 text-white shadow-sm"
                  : "bg-white text-navy-900 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
              Informasi Akses & Subdomain
            </h2>

            <div className="space-y-4">
              {/* Subdomain Publik: HANYA muncul jika membeli Add-on */}
              {order.addon && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-500">Subdomain Publik</label>
                    {!order.addonSuspended && (
                      <button
                        onClick={() => {
                          const currentSub = order.subdomain
                            ? order.subdomain.replace(".rupacloud.id", "")
                            : "";
                          setNewSubdomainPrefix(currentSub);
                          setSubdomainError(null);
                          setSubdomainModalOpen(true);
                        }}
                        className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Ubah Subdomain</span>
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={order.subdomain ? `https://${order.subdomain}` : "-"}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
                    />
                    <button
                      onClick={() => order.subdomain && copyToClipboard(`https://${order.subdomain}`)}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? "Tersalin!" : "Salin"}</span>
                    </button>
                  </div>
                  {order.addonSuspended && (
                    <p className="text-[11px] text-amber-700 font-semibold">
                      ⚠️ Subdomain ditangguhkan (grace period 24 jam). Perpanjang dengan add-on untuk mengaktifkannya kembali.
                    </p>
                  )}
                </div>
              )}

              {/* Kredensial Akses SSH */}
              <div className="p-4.5 bg-slate-900 text-white rounded-2xl space-y-3.5 border border-slate-800 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-100">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Akses SSH Container (Remote Login)</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 bg-slate-800 text-green-400 font-mono rounded-md font-bold">
                    Port: 22
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">SSH Username</span>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-green-400">
                      <span>root</span>
                      <button
                        onClick={() => copyToClipboard("root")}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Salin username"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block">SSH Password</span>
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300">
                      <span>{showSshPassword ? (order.sshPassword || "rc-admin1234") : "••••••••••••"}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          type="button"
                          onClick={() => setShowSshPassword(!showSshPassword)}
                          className="text-slate-400 hover:text-white transition-colors"
                          title={showSshPassword ? "Sembunyikan password" : "Lihat password"}
                        >
                          {showSshPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(order.sshPassword || "rc-admin1234");
                            setSshPasswordCopied(true);
                            setTimeout(() => setSshPasswordCopied(false), 2000);
                          }}
                          className="text-slate-400 hover:text-white transition-colors"
                          title="Salin password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {sshPasswordCopied && (
                      <span className="text-[10px] text-green-400 font-medium block">Password tersalin!</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Perintah Akses Terminal Laptop:</span>
                    {sshCmdCopied && <span className="text-green-400 font-bold">Perintah Tersalin!</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`ssh root@${order.ipAddress || "10.78.126.102"}`}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 select-all"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`ssh root@${order.ipAddress || "10.78.126.102"}`);
                        setSshCmdCopied(true);
                        setTimeout(() => setSshCmdCopied(false), 2000);
                      }}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{sshCmdCopied ? "Tersalin" : "Salin Perintah"}</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-500">IP Address Container</label>
                <input
                  type="text"
                  readOnly
                  value={order.ipAddress || "-"}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900"
                />
              </div>

              {order.addon && !order.addonSuspended && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <GitBranch className="w-4 h-4" />
                    <span>Add-on CI/CD + Subdomain aktif</span>
                  </div>
                  <p className="text-[11px]">
                    Subdomain dan GitHub Actions workflow sudah dikonfigurasi. Pergi ke tab <strong>Deploy</strong> untuk memasang webhook.
                  </p>
                </div>
              )}
              {order.addon && order.addonSuspended && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Add-on CI/CD + Subdomain Ditangguhkan (Grace Period 24 Jam)</span>
                  </div>
                  <p className="text-[11px]">
                    Masa tenggang 24 jam aktif. Routing subdomain dan akses deploy dinonaktifkan sementara sampai perpanjangan add-on dilakukan.
                  </p>
                </div>
              )}

              {/* Setup Software & Environment Otomatis */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>Setup Software & Environment Otomatis</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-neutral-500">
                    {order.setupPackages && order.setupPackages.length > 0
                      ? `${order.setupPackages.length} Paket Terpasang`
                      : "Clean Ubuntu"}
                  </span>
                </div>

                {order.setupPackages && order.setupPackages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {order.setupPackages.map((pkgId) => {
                      const pkg = AVAILABLE_SETUP_PACKAGES.find((p) => p.id === pkgId);
                      return (
                        <div
                          key={pkgId}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-navy-900 text-xs">
                                {pkg?.name || pkgId}
                              </span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded-full">
                                Terpasang
                              </span>
                            </div>
                            {pkg?.commandCheck && (
                              <p className="text-[10px] text-neutral-500 font-mono mt-1 bg-white px-2 py-0.5 rounded border border-slate-100 inline-block">
                                Cek: {pkg.commandCheck}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-neutral-600 flex items-center justify-between">
                    <span>Sistem Operasi: <strong>Ubuntu 22.04 LTS (Clean / Minimal)</strong></span>
                    <span className="text-[11px] text-neutral-400">Tanpa paket pre-install</span>
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3 pt-4">
              Spesifikasi Resource
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">Memory RAM</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.ramMb} MB
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">CPU Core</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.cpuAllowance}% CPU
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <span className="text-[11px] text-neutral-500 block">Storage</span>
                <span className="text-base font-extrabold text-navy-900">
                  {order.plan?.storageGb} GB
                </span>
              </div>
            </div>

            {order.addonPrice > 0 && (
              <div className="pt-2 border-t border-slate-100 text-xs text-neutral-500 flex items-center justify-between">
                <span>Add-on CI/CD + Subdomain</span>
                <span className="font-bold text-navy-900">{formatRupiah(order.addonPrice)}</span>
              </div>
            )}
          </div>

          {/* Right Status Sidebar */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            <h2 className="text-base font-bold text-navy-900 border-b border-slate-100 pb-3">
              Masa Aktivasi
            </h2>

            <div className="space-y-3 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Tanggal Aktif:</span>
                <span className="font-bold text-navy-900">
                  {order.startedAt ? new Date(order.startedAt).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Berakhir Pada:</span>
                <span className="font-bold text-navy-900">
                  {order.expiresAt ? new Date(order.expiresAt).toLocaleDateString("id-ID") : "-"}
                </span>
              </div>
            </div>

            {order.status === "FAILED" ? (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-xs space-y-3 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-red-800">
                  <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="font-extrabold text-sm">Layanan Telah Dihapus Permanen</span>
                </div>
                <p className="text-xs text-red-950 font-medium leading-relaxed">
                  Server ini sudah melewati batas masa tenggang dan dihapus secara permanen. Perpanjangan tidak lagi tersedia untuk instance ini. Silakan pesan VPS baru di katalog produk.
                </p>
                <Link
                  href="/product"
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Pesan VPS Baru di Katalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Ketentuan Expired</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Saat masa sewa habis, container akan otomatis direset. Backup data kamu atau lakukan perpanjangan sebelum waktu habis.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setExtendError(null);
                    setExtendModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Clock className="w-4 h-4" />
                  <span>Perpanjang Masa Sewa</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Web CLI */}
      {activeTab === "cli" && (
        <div
          onClick={() => {
            // Hanya fokus ke input jika user TIDAK sedang menyeleksi / mem-blok teks
            const sel = window.getSelection();
            if (!sel || sel.toString().length === 0) {
              inputRef.current?.focus();
            }
          }}
          className="p-6 bg-navy-900 text-green-400 rounded-2xl font-mono text-xs shadow-2xl space-y-4 border border-navy-800 cursor-text select-text"
        >
          {(() => {
            const cliHost = order.subdomain || (order.containerId ? order.containerId.replace(/^rupa-/, "") : "server");
            return (
              <>
                <div className="flex items-center justify-between border-b border-navy-800 pb-3 text-neutral-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="ml-2 text-[11px]">web-cli@{cliHost}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {cliHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyTerminal}
                        className="px-2 py-0.5 rounded bg-navy-800 hover:bg-navy-700 text-neutral-300 hover:text-white text-[11px] font-sans flex items-center gap-1 transition-colors cursor-pointer border border-navy-700"
                        title="Salin seluruh riwayat log terminal"
                      >
                        {terminalCopied ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400 font-semibold">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-400" />
                            <span>Salin Log</span>
                          </>
                        )}
                      </button>
                    )}
                    <span>Session: {isServerRunning ? "Active (Restricted Shell)" : "Offline (Server Stopped)"}</span>
                  </div>
                </div>

                <div
                  ref={cliScrollRef}
                  className="space-y-2 min-h-[280px] max-h-[460px] overflow-y-auto select-text selection:bg-emerald-600/40 selection:text-white"
                >
                  <p className="text-neutral-400 select-text">RuPa Cloud LXD Interactive Web CLI v2.0</p>
                  <p className="text-neutral-400 select-text">Type &apos;help&apos; for system info or start typing commands...</p>

                  {cliHistory.map((item, idx) => (
                    <div key={idx} className="space-y-1 select-text">
                      <p className="pt-2 text-white flex items-center select-text">
                        <span className="select-text">root@{cliHost}:{formatPromptPath(item.cwd)}# {item.command}</span>
                        {item.isRunning && (
                          <span className="w-2 h-4 bg-green-400 animate-pulse inline-block ml-1"></span>
                        )}
                      </p>
                      {item.stdout && (
                        <pre className="text-green-400 whitespace-pre-wrap font-mono text-xs leading-relaxed select-text selection:bg-emerald-600/40 selection:text-white">{item.stdout}</pre>
                      )}
                      {item.stderr && (
                        <pre className="text-red-400 whitespace-pre-wrap font-mono text-xs leading-relaxed select-text selection:bg-red-800/40 selection:text-white">{item.stderr}</pre>
                      )}
                    </div>
                  ))}

                  {order.status === "FAILED" ? (
                    <div className="pt-3 border-t border-navy-800 text-neutral-400">
                      <span className="text-red-400 text-xs">
                        🛑 Container telah dihapus permanen dari server. Akses Web CLI tidak lagi tersedia.
                      </span>
                    </div>
                  ) : order.status === "EXPIRED" ? (
                    <div className="pt-3 border-t border-navy-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-neutral-400">
                      <span className="text-red-400 text-xs">
                        ⚠️ Masa sewa VPS telah berakhir. Layanan terminal dinonaktifkan sampai masa sewa diperpanjang.
                      </span>
                      <button
                        onClick={() => {
                          setExtendError(null);
                          setExtendModalOpen(true);
                        }}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Perpanjang Sewa
                      </button>
                    </div>
                  ) : !isServerRunning ? (
                    <div className="pt-3 border-t border-navy-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-neutral-400">
                      <span className="text-amber-400 text-xs">
                        ⚠️ Server sedang dalam keadaan berhenti (Stopped). Nyalakan server untuk mengakses Web CLI.
                      </span>
                      <button
                        onClick={() => handleContainerAction("start")}
                        disabled={!!actionLoading}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        {actionLoading === "start" ? "Menyalakan..." : "Start Server"}
                      </button>
                    </div>
                  ) : (
                    !cliExecuting && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleExecuteCli();
                        }}
                        className="pt-2 flex items-center gap-1 text-white"
                      >
                        <span className="shrink-0 text-white select-none">root@{cliHost}:{formatPromptPath(cliCwd)}#</span>
                        <input
                          ref={inputRef}
                          type="text"
                          value={cliInput}
                          onChange={(e) => {
                            setCliInput(e.target.value);
                            if (historyIndex !== -1) {
                              setHistoryIndex(-1);
                            }
                          }}
                          onKeyDown={handleCliKeyDown}
                          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-xs p-0 m-0 focus:ring-0 focus:outline-none"
                          autoFocus
                          spellCheck={false}
                        />
                        <span className="w-2 h-4 bg-green-400 animate-pulse inline-block shrink-0"></span>
                      </form>
                    )
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* TAB CONTENT: Deploy (GitHub) */}
      {activeTab === "deploy" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Auto-deploy dari GitHub</h2>
              <p className="text-xs text-neutral-600">
                Hubungkan repositori GitHub kamu untuk memicu otomatisasi build ke container.
              </p>
            </div>
            {githubRepos !== null ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{githubHandle ? `@${githubHandle}` : "Connected"}</span>
                </span>
                <a
                  href={`/api/auth/github?redirect=/products/${orderId}`}
                  className="text-[11px] text-neutral-500 hover:text-navy-900 underline ml-1"
                >
                  Ganti Akun
                </a>
              </div>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5 border border-slate-200">
                Not Connected
              </span>
            )}
          </div>

          {(!order.addon || order.addonSuspended) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>
                  {order.addonSuspended ? "Add-on CI/CD Sedang Ditangguhkan" : "Add-on CI/CD tidak aktif"}
                </span>
              </div>
              <p>
                {order.addonSuspended
                  ? "Akses deploy dinonaktifkan sementara karena perpanjangan sewa sebelumnya tidak menyertakan add-on. Silakan perpanjang sewa (minimal 3 hari) dengan mencentang add-on untuk memulihkan akses sebelum 24 jam masa tenggang berakhir."
                  : "Fitur CI/CD + Subdomain hanya tersedia untuk paket 3-hari atau 7-hari dengan add-on. Perpanjang atau beli paket baru dengan add-on untuk mengakses fitur ini."}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {githubRepos === null ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 max-w-xl">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 bg-navy-900 text-white rounded-xl shrink-0 shadow-sm">
                    <GithubIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-navy-900">Hubungkan Akun GitHub</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      Hubungkan akun GitHub Anda untuk mengaktifkan otomatisasi CI/CD workflow ke container setiap kali Anda push code ke repositori.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={`/api/auth/github?redirect=/products/${orderId}`}
                    className="px-4 py-2.5 bg-navy-900 hover:bg-navy-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow hover:-translate-y-0.5 cursor-pointer"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>Sambungkan Akun GitHub</span>
                  </a>
                  <Link
                    href="/settings"
                    className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-navy-900 transition-colors"
                  >
                    Atur di Pengaturan Akun
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {cicdMessage && (
                  <div
                    className={cn(
                      "px-4 py-3 rounded-xl text-xs font-semibold border flex items-start gap-2.5",
                      cicdMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                        : "bg-red-50 text-red-900 border-red-200"
                    )}
                  >
                    {cicdMessage.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{cicdMessage.text}</span>
                  </div>
                )}

                {/* 1. Searchable Repositories Selector */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                        1
                      </span>
                      <label className="text-xs font-bold text-navy-900">
                        Pilih Repositori GitHub
                      </label>
                      {isStep1Ready ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Siap
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                          Belum Dipilih
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {selectedRepo && (
                        <button
                          type="button"
                          onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                          className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{repoDropdownOpen ? "Tutup Pilihan" : "Ganti Repositori"}</span>
                          {repoDropdownOpen ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {githubRepos.length === 0 ? (
                    <p className="text-xs text-neutral-500">Tidak ada repositori ditemukan di akun GitHub Anda.</p>
                  ) : (
                    <div className="space-y-2">
                      {/* Selected Repo Card (Preview) */}
                      {selectedRepo && (() => {
                        const cur = githubRepos.find((r) => r.full_name === selectedRepo);
                        return (
                          <div
                            onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
                            className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 bg-white rounded-lg border border-slate-200 text-navy-900 shrink-0 shadow-2xs">
                                <FolderGit2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-navy-900 truncate">
                                    {cur?.full_name || selectedRepo}
                                  </span>
                                  {cur?.private ? (
                                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[9px] font-bold rounded flex items-center gap-1">
                                      <Lock className="w-2.5 h-2.5" /> Private
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded flex items-center gap-1">
                                      <Globe className="w-2.5 h-2.5" /> Public
                                    </span>
                                  )}
                                  {cur?.language && (
                                    <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded">
                                      {cur.language}
                                    </span>
                                  )}
                                </div>
                                {cur?.description && (
                                  <p className="text-[11px] text-neutral-500 truncate mt-0.5 max-w-md">
                                    {cur.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[11px] text-neutral-500">
                              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md font-mono text-[10px]">
                                Branch: {deployBranch || cur?.defaultBranch || "main"}
                              </span>
                              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", repoDropdownOpen && "rotate-180")} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Dropdown / Searchable Selector */}
                      {repoDropdownOpen && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-lg space-y-2 mt-1">
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={repoSearch}
                              onChange={(e) => setRepoSearch(e.target.value)}
                              placeholder="Cari repositori GitHub..."
                              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-navy-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              autoFocus
                            />
                          </div>

                          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                            {githubRepos
                              .filter(
                                (r) =>
                                  r.full_name.toLowerCase().includes(repoSearch.toLowerCase()) ||
                                  (r.description && r.description.toLowerCase().includes(repoSearch.toLowerCase()))
                              )
                              .map((repo) => {
                                const isSelected = selectedRepo === repo.full_name;
                                return (
                                  <button
                                    key={repo.id}
                                    type="button"
                                    onClick={() => handleSelectRepo(repo)}
                                    className={cn(
                                      "w-full p-2.5 text-left rounded-lg transition-all flex items-center justify-between gap-2 cursor-pointer text-xs",
                                      isSelected
                                        ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                                        : "hover:bg-slate-50 text-navy-900"
                                    )}
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="truncate">{repo.full_name}</span>
                                        {repo.private && (
                                          <Lock className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                                        )}
                                        {repo.language && (
                                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[9px] rounded font-semibold shrink-0">
                                            {repo.language}
                                          </span>
                                        )}
                                      </div>
                                      {repo.description && (
                                        <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                                          {repo.description}
                                        </p>
                                      )}
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Framework & Tech Stack Picker */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                        2
                      </span>
                      <label className="text-xs font-bold text-navy-900">
                        Pilih Tech Stack & Framework Aplikasi
                      </label>
                      {isStep2Ready ? (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" /> Runtime Siap
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Butuh {activeFrameworkObj?.requiredPackage}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      Otomatis mendeteksi dependensi build & start script
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                    {DEPLOY_FRAMEWORKS.map((fw) => {
                      const isSelected = selectedFramework === fw.id;
                      const containerPkgs: string[] = order?.setupPackages || [];
                      const isRuntimeReady =
                        !fw.requiredPackage || containerPkgs.includes(fw.requiredPackage);

                      return (
                        <div
                          key={fw.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => applyFramework(fw.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              applyFramework(fw.id);
                            }
                          }}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between space-y-2",
                            isSelected
                              ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-xs"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-xs font-bold text-navy-900">{fw.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              :{fw.defaultPort}
                            </span>
                          </div>

                          <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                            {fw.tagline}
                          </p>

                          <div className="pt-1 border-t border-slate-100 flex flex-col gap-1.5 text-[10px]">
                            <div className="flex items-center justify-between">
                              {isRuntimeReady ? (
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Runtime Siap
                                </span>
                              ) : (
                                <span className="text-amber-700 font-medium flex items-center gap-1" title={`Perlu install paket ${fw.requiredPackage}`}>
                                  ⚠️ Butuh {fw.requiredPackage}
                                </span>
                              )}
                              {isSelected && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-blue-600 text-white font-extrabold rounded-full">
                                  AKTIF
                                </span>
                              )}
                            </div>

                            {!isRuntimeReady && fw.requiredPackage && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInstallRuntime(fw.requiredPackage!);
                                }}
                                disabled={installingPackage === fw.requiredPackage}
                                className="w-full py-1 px-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-md text-[9px] flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                <Zap className={cn("w-2.5 h-2.5", installingPackage === fw.requiredPackage && "animate-spin")} />
                                <span>{installingPackage === fw.requiredPackage ? "Menginstall..." : `⚡ Install ${fw.requiredPackage} ke VPS`}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Konfigurasi Lanjutan: Commands, Port & .env */}
                <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-navy-900 text-white text-[11px] font-bold flex items-center justify-center">
                        3
                      </span>
                      <label className="text-xs font-bold text-navy-900 flex items-center gap-2">
                        <span>Konfigurasi Build, Port & Environment (.env)</span>
                        <span className="text-[10px] text-neutral-400 font-normal">
                          (Dapat Disesuaikan)
                        </span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5" />
                      <span>{showAdvancedConfig ? "Sembunyikan" : "Buka Konfigurasi"}</span>
                      {showAdvancedConfig ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  {showAdvancedConfig && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      {/* Branch & Port Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 block">
                            Target Branch:
                          </label>
                          <input
                            type="text"
                            value={deployBranch}
                            onChange={(e) => setDeployBranch(e.target.value)}
                            placeholder="main"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 block">
                            Root Directory:
                          </label>
                          <input
                            type="text"
                            value={rootDirectory}
                            onChange={(e) => setRootDirectory(e.target.value)}
                            placeholder="./"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="text-[10px] text-neutral-400">Folder sub-proyek (misal: frontend)</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 block">
                            Port Aplikasi:
                          </label>
                          <input
                            type="number"
                            value={appPort}
                            onChange={(e) => setAppPort(Number(e.target.value) || 3000)}
                            placeholder="3000"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <p className="text-[10px] text-neutral-400">Port internal container</p>
                        </div>
                      </div>

                      {/* Commands Row */}
                      <div className="space-y-3 pt-1">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 flex items-center justify-between">
                            <span>Install Command:</span>
                            <span className="text-[10px] text-neutral-400 font-mono">Dijalankan sebelum build</span>
                          </label>
                          <input
                            type="text"
                            value={installCommand}
                            onChange={(e) => setInstallCommand(e.target.value)}
                            placeholder="npm install"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 flex items-center justify-between">
                            <span>Build Command:</span>
                            <span className="text-[10px] text-neutral-400 font-mono">Proses kompilasi/bundle</span>
                          </label>
                          <input
                            type="text"
                            value={buildCommand}
                            onChange={(e) => setBuildCommand(e.target.value)}
                            placeholder="npm run build"
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-navy-900 flex items-center justify-between">
                            <span>Start / Restart Command:</span>
                            <span className="text-[10px] text-neutral-400 font-mono">Daemon PM2 atau process runner</span>
                          </label>
                          <input
                            type="text"
                            value={startCommand}
                            onChange={(e) => setStartCommand(e.target.value)}
                            placeholder="pm2 restart app || pm2 start ..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Environment Variables (.env) */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                            <span>Environment Variables (.env)</span>
                          </label>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Enkripsi GitHub Secret
                          </span>
                        </div>
                        <textarea
                          rows={4}
                          value={envVars}
                          onChange={(e) => setEnvVars(e.target.value)}
                          placeholder="PORT=3000&#10;NODE_ENV=production&#10;DATABASE_URL=..."
                          className="w-full p-3 bg-slate-950 text-emerald-400 border border-slate-800 rounded-xl text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent selection:bg-blue-600 selection:text-white"
                          spellCheck={false}
                        />
                        <p className="text-[10px] text-neutral-400">
                          Data variabel lingkungan akan dienkripsi via libsodium, disimpan sebagai Secret repo (<code>APP_ENV</code>), dan di-inject ke file <code>~/app/.env</code> saat deploy.
                        </p>
                      </div>

                      {/* SSH Tunnel Configuration (Opsional untuk Testing Lokal / Ngrok / Pinggy) */}
                      <div className="space-y-2 pt-3 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-blue-600" />
                            <span>Tunnel SSH Publik (Opsional untuk Testing Lokal)</span>
                          </label>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold border border-blue-200">
                            Ngrok / Pinggy / Local Tunnel
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Default: IP internal container (<code>{order?.ipAddress || "10.x.x.x"}:22</code>). Jika Anda menjalankan di laptop lokal tanpa IP publik, isi host &amp; port dari tunnel TCP Anda agar GitHub Actions cloud runner bisa SSH ke container laptop Anda.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-navy-900 block">
                              SSH Host / Domain:
                            </label>
                            <input
                              type="text"
                              value={customSshHost}
                              onChange={(e) => setCustomSshHost(e.target.value)}
                              placeholder="tcp.a.pinggy.io atau 0.tcp.ngrok.io"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-navy-900 block">
                              SSH Port:
                            </label>
                            <input
                              type="text"
                              value={customSshPort}
                              onChange={(e) => setCustomSshPort(e.target.value)}
                              placeholder="Port tunnel (misal: 45678)"
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-navy-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Action CTA Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleSetupCicd}
                    disabled={!canDeploy}
                    className="px-5 py-3 bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCcw className={cn("w-4 h-4", cicdLoading && "animate-spin")} />
                    <span>
                      {cicdLoading
                        ? "Menyiapkan SSH Key & Workflow..."
                        : `Pasang Webhook & Auto-Deploy (${selectedFramework})`}
                    </span>
                  </button>

                  {order.subdomain && (
                    <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                      <span>Target Subdomain:</span>
                      <a
                        href={`https://${order.subdomain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        <span>https://{order.subdomain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {(!order.addon || order.addonSuspended) ? (
                  <p className="text-[11px] text-neutral-500">
                    {order.addonSuspended
                      ? "Tombol dinonaktifkan karena add-on sedang dalam masa tenggang suspend."
                      : "Tombol tidak aktif karena add-on CI/CD belum diaktifkan."}
                  </p>
                ) : !isStep1Ready ? (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Langkah 1 Belum Siap: Silakan pilih repositori GitHub pada Langkah 1 di atas terlebih dahulu.</span>
                  </p>
                ) : !isStep2Ready ? (
                  <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Langkah 2 Belum Siap: Runtime <b>{activeFrameworkObj?.requiredPackage}</b> belum terpasang di VPS. Silakan klik tombol <b>⚡ Install {activeFrameworkObj?.requiredPackage} ke VPS</b> pada kartu framework di Langkah 2.
                    </span>
                  </p>
                ) : (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Langkah 1 & 2 siap! Silakan klik tombol di atas untuk memasang webhook & auto-deploy.</span>
                  </p>
                )}
              </>
            )}
          </div>

          {githubRepos !== null && (
            <div className="pt-4 border-t border-slate-100 mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                    <GithubIcon className="w-4 h-4 text-navy-900" />
                    <span>Riwayat &amp; Live Log GitHub Actions Deployment</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Pantau status dan streaming log eksekusi build langsung dari runner GitHub tanpa perlu membuka tab GitHub.
                  </p>
                </div>
                {selectedRepo && (
                  <button
                    type="button"
                    onClick={() => {
                      const [owner, repo] = selectedRepo.split("/");
                      if (owner && repo) fetchGhWorkflowRuns(owner, repo, false);
                    }}
                    disabled={ghRunsLoading}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
                  >
                    <RefreshCcw className={cn("w-3.5 h-3.5", ghRunsLoading && "animate-spin")} />
                    <span>{ghRunsLoading ? "Memuat..." : "Refresh Log"}</span>
                  </button>
                )}
              </div>

              {/* List of Workflow Runs */}
              {ghRuns.length === 0 ? (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-neutral-500 space-y-1.5">
                  <Clock className="w-5 h-5 text-neutral-400 mx-auto" />
                  <p className="font-semibold text-navy-900">Belum Ada Riwayat Deployment di Repo Ini</p>
                  <p className="text-[11px]">
                    Klik tombol <b>Pasang Webhook &amp; Auto-Deploy</b> di atas atau lakukan <code>git push</code> ke branch repositori untuk memicu pipeline otomatis.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ghRuns.slice(0, 6).map((run) => {
                      const isSelected = selectedGhRun?.id === run.id;
                      const isSuccess = run.conclusion === "success";
                      const isFailed = run.conclusion === "failure";
                      const isRunning = run.status === "in_progress" || run.status === "queued";

                      return (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => handleSelectRun(run)}
                          className={cn(
                            "p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5",
                            isSelected
                              ? "bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 shadow-sm"
                              : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 w-full">
                            <span className="text-[10px] font-mono text-neutral-500 truncate">
                              #{run.id.toString().slice(-6)} • {run.headBranch}
                            </span>
                            {isRunning ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold flex items-center gap-1">
                                <RefreshCcw className="w-2.5 h-2.5 animate-spin" /> Running
                              </span>
                            ) : isSuccess ? (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Success
                              </span>
                            ) : isFailed ? (
                              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold flex items-center gap-1">
                                <XCircle className="w-2.5 h-2.5 text-rose-600" /> Failed
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">
                                {run.status}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-semibold text-navy-900 line-clamp-1">
                            {run.commitMessage}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 w-full pt-1 border-t border-slate-200/50">
                            <span className="font-mono text-[9px]">{run.headSha || run.event}</span>
                            <span>{new Date(run.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Terminal Live Log Viewer */}
                  {selectedGhRun && (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                      {/* Terminal Header */}
                      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <TerminalIcon className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-bold text-white font-mono text-[11px]">
                            {selectedGhRun.name} (run #{selectedGhRun.id})
                          </span>
                          {selectedGhRun.status === "in_progress" && (
                            <span className="flex items-center gap-1 px-1.5 py-0.2 text-[9px] bg-amber-500/20 text-amber-300 rounded font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Streaming
                            </span>
                          )}
                          {selectedGhRun.conclusion === "success" && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-300 rounded font-mono">
                              ✓ Selesai
                            </span>
                          )}
                          {selectedGhRun.conclusion === "failure" && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-300 rounded font-mono">
                              ✗ Gagal
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={selectedGhRun.htmlUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[11px] font-sans flex items-center gap-1.5 transition-colors"
                          >
                            <span>Buka di GitHub</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Terminal Body with Interactive GitHub Log Viewer */}
                      {ghLogLoading ? (
                        <div className="p-8 flex flex-col items-center justify-center gap-2 text-neutral-400 bg-slate-950">
                          <RefreshCcw className="w-5 h-5 animate-spin text-blue-400" />
                          <span className="text-xs font-sans">Mengunduh log deployment dari runner GitHub...</span>
                        </div>
                      ) : ghLogText ? (
                        <GithubLogViewer logText={ghLogText} className="border-0 rounded-none rounded-b-xl" />
                      ) : (
                        <div className="p-6 text-center text-neutral-500 italic text-xs font-sans bg-slate-950">
                          Log belum tersedia atau masih diproses oleh runner GitHub.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Monitoring */}
      {activeTab === "monitoring" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-navy-900">Grafik Monitoring Resource</h2>
              <p className="text-xs text-neutral-600">Penggunaan CPU & RAM secara real-time dari container.</p>
            </div>
            <button
              onClick={fetchLiveStats}
              disabled={statsLoading}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={cn("w-3.5 h-3.5", statsLoading && "animate-spin")} />
              <span>{statsLoading ? "Menyinkronkan..." : "Refresh Data"}</span>
            </button>
          </div>

          {/* Banner jika server sedang stopped */}
          {!isServerRunning && (
            <div className="p-4 bg-slate-100 border border-slate-300 rounded-xl flex items-center gap-3 text-xs text-slate-700">
              <Square className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Server sedang dalam keadaan <strong>Berhenti (Stopped)</strong>. Penggunaan daya CPU & alokasi RAM dinonaktifkan sementara hingga server dinyalakan kembali.
              </span>
            </div>
          )}

          {/* Metric Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                <Cpu className="w-3.5 h-3.5 text-blue-600" /> CPU Usage
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-navy-900">
                  {isServerRunning && liveStats?.online ? `${liveStats.cpu}%` : "0%"}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-bold",
                    !isServerRunning || !liveStats?.online
                      ? "text-slate-500"
                      : liveStats.cpu > 80
                      ? "text-red-600"
                      : "text-emerald-600"
                  )}
                >
                  {!isServerRunning || !liveStats?.online ? "Stopped" : liveStats.cpu > 80 ? "Tinggi" : "Optimal"}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                <Activity className="w-3.5 h-3.5 text-blue-600" /> RAM Memory
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-navy-900">
                  {isServerRunning && liveStats?.online ? `${liveStats.ramPercent}%` : "0%"}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  ({isServerRunning && liveStats?.online ? `${liveStats.ramMb}MB` : "0MB"} / {liveStats?.ramTotalMb || order.plan?.ramMb || 512}MB)
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-blue-600" /> NVMe Storage
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-navy-900">
                  {liveStats?.diskGb ? `${liveStats.diskGb} GB` : "0.7 GB"}
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">
                  / {liveStats?.diskTotalGb ?? (order.plan?.storageGb || 10)} GB
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <span className="text-[11px] text-neutral-500 flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Server Uptime
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-extrabold text-navy-900 truncate" title={isServerRunning && liveStats?.online ? liveStats.uptime : "Server Berhenti (Stopped)"}>
                  {isServerRunning && liveStats?.online ? liveStats.uptime : "Server Berhenti"}
                </span>
              </div>
            </div>
          </div>

          {monitoringData.length > 0 ? (
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monitoringData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="#5483B3" fill="#C1E8FF" />
                  <Area type="monotone" dataKey="ram" name="RAM (%)" stroke="#052659" fill="#052659" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl text-neutral-400 space-y-2">
              <Activity className="w-8 h-8 text-neutral-300 animate-pulse" />
              <p className="text-xs font-semibold text-neutral-600">Menyinkronkan telemetri container...</p>
              <p className="text-[11px] text-neutral-400 max-w-sm">
                Data penggunaan CPU & RAM real-time sedang diambil dan disimpan ke database secara otomatis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Backup / Export */}
      {activeTab === "backup" && (
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-navy-900">Export & Backup Server</h2>
            <p className="text-xs text-neutral-600">
              Unduh arsip data atau konfigurasi sebelum masa sewa server kamu berakhir.
            </p>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 max-w-lg">
            <h3 className="text-sm font-bold text-navy-900">Generate Full Data Backup (.tar.gz)</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Arsip mencakup file konfigurasi web server Nginx, environment variabel, file metadata container, dan dump database lokal jika ada.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={backupLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className={cn("w-4 h-4", backupLoading && "animate-bounce")} />
              <span>{backupLoading ? "Menyiapkan Arsip..." : "Generate & Unduh Backup"}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Danger Zone */}
      {activeTab === "danger" && (
        <div className="p-6 bg-white border border-red-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-red-600">Danger Zone (Aksi Destruktif)</h2>
            <p className="text-xs text-neutral-600">
              Tindakan di bawah ini tidak dapat dibatalkan setelah dikonfirmasi.
            </p>
          </div>

          {order.status === "FAILED" ? (
            <div className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl space-y-3 max-w-lg shadow-xs">
              <div className="flex items-center gap-2 font-bold text-red-800 text-sm">
                <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span className="font-extrabold">Container VPS Telah Dimusnahkan</span>
              </div>
              <p className="text-xs text-red-950 font-medium leading-relaxed">
                Instance VPS ini telah dimusnahkan secara permanen dari server cluster karena melewati toleransi 7 hari masa tenggang. Seluruh data, alokasi container, dan routing telah dihapus total. Tidak ada aksi kontrol atau perubahan data yang dapat dilakukan pada instance ini.
              </p>
              <Link
                href="/product"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors"
              >
                <span>Pesan VPS Baru di Katalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-w-lg">
              <div className="p-6 bg-red-50/50 border border-red-200 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-navy-900">Reset Manual Container (Restart)</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  {isServerRunning
                    ? "Server ini akan di-restart (reset). Semua proses yang berjalan akan terhenti sementara dan sistem di-boot ulang."
                    : "Server sedang dalam keadaan berhenti (Stopped). Anda dapat menyalakan server kembali menggunakan tombol di bawah atau tombol Start di bagian atas."}
                </p>
                <button
                  onClick={() => {
                    if (isServerRunning) {
                      setResetModalOpen(true);
                    } else {
                      handleContainerAction("start");
                    }
                  }}
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  {isServerRunning ? "Reset Manual Server" : "Nyalakan Server (Start)"}
                </button>
              </div>

              {isServerRunning && (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h3 className="text-sm font-bold text-navy-900">Matikan Server Sementara (Stop)</h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Hentikan semua proses aplikasi dan bebaskan penggunaan CPU/RAM host. Anda dapat menyalakannya kembali kapan saja sebelum masa sewa berakhir.
                  </p>
                  <button
                    onClick={() => handleContainerAction("stop")}
                    disabled={!!actionLoading}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                  >
                    Matikan Server (Stop)
                  </button>
                </div>
              )}

              {/* Fitur Reinstall / Rebuild OS */}
              <div className="p-6 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-navy-900">Reinstall OS (Format Ulang Bersih)</h3>
                  <span className="px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-700 rounded-md text-[10px] font-extrabold uppercase tracking-wide">
                    Destruktif
                  </span>
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Menghapus total seluruh file, direktori <code className="px-1 py-0.5 bg-rose-100/80 text-rose-800 rounded font-mono text-[11px]">/root</code>, dan paket yang terpasang, lalu menginstal ulang OS bersih <strong>Ubuntu 22.04 LTS</strong> dari awal. Kredensial SSH, IP address, subdomain, dan sisa masa sewa Anda tetap dipertahankan.
                </p>
                <button
                  onClick={() => {
                    setRebuildConfirmText("");
                    setRebuildModalOpen(true);
                  }}
                  disabled={!!actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Format & Install Ulang OS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal with Framer Motion */}
      <AnimatePresence>
        {resetModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setResetModalOpen(false)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-navy-900">Konfirmasi Reset Server</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Server akan di-restart. Semua proses yang berjalan akan terhenti sementara. Yakin lanjutkan?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleResetContainer}
                  disabled={resetting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {resetting ? "Mereset..." : "Ya, Reset Sekarang"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Rebuild / Reinstall OS Confirmation Modal */}
        {rebuildModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !rebuilding && setRebuildModalOpen(false)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl z-10 border border-rose-200"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-navy-900">Konfirmasi Format & Reinstall OS</h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Tindakan ini akan <strong>menghapus permanen seluruh file di dalam container</strong> dan memasang ulang sistem operasi Ubuntu 22.04 LTS dari awal.
                </p>
              </div>

              <div className="space-y-2 text-xs text-left">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy-900">Setup Software Otomatis:</span>
                  <span className="text-[10px] font-semibold text-neutral-500">
                    {rebuildPackages.length} paket dipilih
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  {AVAILABLE_SETUP_PACKAGES.map((pkg) => {
                    const isChecked = rebuildPackages.includes(pkg.id);
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => {
                          setRebuildPackages((prev) =>
                            prev.includes(pkg.id) ? prev.filter((p) => p !== pkg.id) : [...prev, pkg.id]
                          );
                        }}
                        className={cn(
                          "p-2 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer text-[11px]",
                          isChecked
                            ? "border-blue-600 bg-blue-50/70 font-semibold text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        <div
                          className={cn(
                            "w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border",
                            isChecked
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{pkg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-left">
                <p className="font-bold text-rose-900">Ketik &quot;REBUILD&quot; untuk melanjutkan:</p>
                <input
                  type="text"
                  placeholder="REBUILD"
                  value={rebuildConfirmText}
                  onChange={(e) => setRebuildConfirmText(e.target.value.toUpperCase())}
                  disabled={rebuilding}
                  className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold tracking-wider text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRebuildModalOpen(false)}
                  disabled={rebuilding}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleRebuildContainer}
                  disabled={rebuilding || rebuildConfirmText !== "REBUILD"}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className={cn("w-3.5 h-3.5", rebuilding && "animate-spin")} />
                  <span>{rebuilding ? "Memformat & Menginstal..." : "Format & Rebuild Sekarang"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {/* Extend Order Modal */}
        {extendModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExtendModalOpen(false)}
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-900">Perpanjang Masa Sewa</h3>
                    <p className="text-[11px] text-neutral-500">{order.plan?.name || "Server VPS"}</p>
                  </div>
                </div>
              </div>

              {extendError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {extendError}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs font-bold text-navy-900">Pilih Tambahan Durasi</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 3, 7].map((days) => {
                    const cost = getExtendCost(days);
                    const isSelected = extendDays === days;
                    return (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleSelectExtendDays(days)}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all cursor-pointer",
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20 font-bold"
                            : "border-slate-200 hover:border-slate-300 text-navy-900"
                        )}
                      >
                        <span className="block text-sm font-extrabold">{days} Hari</span>
                        <span className="block text-[11px] text-neutral-500 font-medium mt-0.5">
                          {formatRupiah(cost)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Opsi Add-on Subdomain & CI/CD */}
              {extendDays >= 3 ? (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={extendWithAddon}
                      onChange={(e) => setExtendWithAddon(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-navy-900">Perpanjang Add-on Subdomain & CI/CD</span>
                        <span className="font-extrabold text-blue-600">+Rp 3.000</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-0.5 leading-relaxed">
                        {order.addon
                          ? "Pertahankan akses subdomain publik dan webhook deploy GitHub tetap aktif."
                          : "Dapatkan subdomain publik kustom dan fitur auto-deploy GitHub Actions ke server ini."}
                      </p>
                    </div>
                  </label>

                  {!extendWithAddon && order.addon && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Perhatian:</strong> Add-on tidak diperpanjang dan akan disuspend selama 24 jam masa tenggang sebelum dinonaktifkan permanen.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                order.addon && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Add-on Tidak Tersedia untuk Durasi 1 Hari</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Add-on Subdomain & CI/CD hanya tersedia untuk perpanjangan ≥ 3 hari. Memperpanjang 1 hari akan menangguhkan (suspend) add-on Anda selama 24 jam masa tenggang.
                    </p>
                  </div>
                )
              )}

              {/* Rincian Biaya & Akumulasi Waktu */}
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-2">
                <div className="flex justify-between text-neutral-600">
                  <span>Masa Sewa Saat Ini:</span>
                  <span className="font-semibold text-navy-900">
                    {order.expiresAt
                      ? new Date(order.expiresAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "-"}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tambahan Durasi:</span>
                  <span className="font-semibold text-blue-600">+{extendDays} Hari (Akumulasi)</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50/80 border border-blue-100 px-2.5 py-1.5 rounded-lg text-blue-900">
                  <span className="font-bold">Masa Aktif Baru Hingga:</span>
                  <span className="font-extrabold">
                    {calculateNewExpiry(extendDays).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })} WIB
                  </span>
                </div>

                <div className="pt-1.5 border-t border-slate-200 space-y-1">
                  <div className="flex justify-between text-neutral-600">
                    <span>Sewa VPS ({extendDays} Hari):</span>
                    <span className="font-semibold text-navy-900">{formatRupiah(getExtendCost(extendDays))}</span>
                  </div>
                  {extendDays >= 3 && extendWithAddon && (
                    <div className="flex justify-between text-neutral-600">
                      <span>Add-on Subdomain & CI/CD:</span>
                      <span className="font-semibold text-navy-900">+Rp 3.000</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-navy-900">
                    <span>Total Biaya:</span>
                    <span className="text-blue-600 font-extrabold">
                      {formatRupiah(getExtendCost(extendDays) + (extendDays >= 3 && extendWithAddon ? 3000 : 0))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExtendContainer}
                  disabled={extending}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {extending ? "Memproses..." : "Bayar & Perpanjang"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Ubah Subdomain Publik */}
        {subdomainModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-navy-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Ubah Nama Subdomain Publik</span>
                </h3>
                <button
                  onClick={() => setSubdomainModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 text-lg leading-none cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {subdomainError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{subdomainError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateSubdomain} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy-900">Nama Subdomain Baru</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newSubdomainPrefix}
                      onChange={(e) =>
                        setNewSubdomainPrefix(
                          e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                        )
                      }
                      placeholder="nama-proyek-baru"
                      maxLength={30}
                      className="flex-1 px-3.5 py-2 border border-slate-300 rounded-l-xl text-xs font-mono text-navy-900 focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-xl text-xs font-mono font-bold text-neutral-600 select-none">
                      .rupacloud.id
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Minimal 3 karakter, hanya gunakan huruf kecil, angka, dan tanda hubung (-).
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubdomainModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-neutral-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={subdomainLoading || !newSubdomainPrefix.trim()}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <RefreshCcw className={cn("w-3.5 h-3.5", subdomainLoading && "animate-spin")} />
                    <span>{subdomainLoading ? "Menyimpan..." : "Simpan Subdomain"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
