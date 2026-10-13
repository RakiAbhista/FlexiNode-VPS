import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { incus } from "@/lib/incus";
import { githubCiCd } from "@/lib/github-cicd";
import { generateSshKeyPair } from "@/lib/ssh";
import { buildDynamicWorkflow, DEPLOY_FRAMEWORKS } from "@/lib/deploy-frameworks";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

/**
 * POST /api/customer/orders/[id]/setup-cicd
 * Body: {
 *   owner: string,
 *   repo: string,
 *   branch?: string,
 *   frameworkId?: string,
 *   rootDirectory?: string,
 *   port?: number,
 *   installCommand?: string,
 *   buildCommand?: string,
 *   startCommand?: string,
 *   envVars?: string
 * }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const owner = (body.owner || body.repoOwner || "").trim();
    const repo = (body.repo || body.repoName || "").trim();
    const branch = (body.branch || "main").trim();
    const frameworkId = (body.frameworkId || "nextjs").trim();
    const rootDirectory = (body.rootDirectory || "./").trim();
    const port = Number(body.port) || 3000;
    const installCommand = body.installCommand?.trim();
    const buildCommand = body.buildCommand?.trim();
    const startCommand = body.startCommand?.trim();
    const envVars = (body.envVars || "").trim();
    const customSshHost = (body.customSshHost || "").trim();
    const customSshPort = (body.customSshPort || "").toString().trim();

    if (!owner || !repo) {
      return NextResponse.json({ error: "Owner dan nama repositori GitHub wajib diisi." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }
    if (!order.addon) {
      return NextResponse.json({ error: "Order ini tidak memiliki add-on CI/CD." }, { status: 400 });
    }
    if (!order.containerId || !order.ipAddress) {
      return NextResponse.json({ error: "Container belum siap." }, { status: 400 });
    }
    if (!user.githubToken) {
      return NextResponse.json({ error: "Akun belum terhubung ke GitHub. Sambungkan di halaman Pengaturan." }, { status: 400 });
    }

    // 1. Generate SSH key pair
    const { privateKey, publicKey } = await generateSshKeyPair(`rupacloud-${order.containerId}`);

    // 2. Inject public key ke container
    const setupCmd = [
      "apt-get install -y openssh-server -qq",
      "mkdir -p /root/.ssh",
      "chmod 700 /root/.ssh",
      "systemctl enable ssh && systemctl start ssh",
      "mkdir -p /root/app",
    ].join(" && ");

    await incus.exec(order.containerId, setupCmd);

    // Tulis authorized_keys via stdin agar aman dari shell injection
    await execAsync(
      `printf '%s' ${JSON.stringify(publicKey)} | incus exec ${order.containerId} -- tee /root/.ssh/authorized_keys`
    );
    await incus.exec(order.containerId, "chmod 600 /root/.ssh/authorized_keys");

    // Jika user menginput envVars, tulis langsung ke ~/app/.env di container
    if (envVars) {
      await execAsync(
        `printf '%s' ${JSON.stringify(envVars + "\n")} | incus exec ${order.containerId} -- tee /root/app/.env`
      );
      await incus.exec(order.containerId, "chmod 600 /root/app/.env");
    }

    // 3. Simpan GitHub Secrets
    const serverHost = customSshHost || order.ipAddress;
    const serverPort = customSshPort || "22";

    await githubCiCd.setRepoSecret(user.githubToken, owner, repo, "SSH_PRIVATE_KEY", privateKey);
    await githubCiCd.setRepoSecret(user.githubToken, owner, repo, "SERVER_IP", serverHost);
    await githubCiCd.setRepoSecret(user.githubToken, owner, repo, "SERVER_PORT", serverPort);

    const hasEnvSecret = Boolean(envVars);
    if (hasEnvSecret) {
      await githubCiCd.setRepoSecret(user.githubToken, owner, repo, "APP_ENV", envVars);
    }

    // 4. Bangun & Inject workflow file sesuai framework tech stack pilihan
    const workflow = buildDynamicWorkflow({
      serverIp: serverHost,
      branch,
      frameworkId,
      rootDirectory,
      port,
      installCommand,
      buildCommand,
      startCommand,
      hasEnvSecret,
    });

    await githubCiCd.injectWorkflow(user.githubToken, owner, repo, workflow, branch);

    const fw = DEPLOY_FRAMEWORKS.find((f) => f.id === frameworkId) || DEPLOY_FRAMEWORKS[0];

    return NextResponse.json({
      success: true,
      message: `CI/CD untuk ${fw.name} berhasil dipasang! Cukup push ke branch '${branch}' di repo ${owner}/${repo} untuk deploy otomatis.`,
      info: {
        sshUser: "root",
        serverIp: serverHost,
        serverPort,
        subdomain: order.subdomain,
        repoConnected: `${owner}/${repo}`,
        branch,
        framework: fw.name,
        port,
      },
    });
  } catch (error: any) {
    console.error("Setup CI/CD error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan internal server saat menyiapkan CI/CD." },
      { status: 500 }
    );
  }
}
