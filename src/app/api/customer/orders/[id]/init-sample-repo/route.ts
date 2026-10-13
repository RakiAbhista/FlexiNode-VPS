import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const SAMPLE_PHP_CODE = `<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Native - RupaCloud VPS</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #021024; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1.5rem; }
        .card { background: #052659; border: 1px solid #5483B3; border-radius: 1.5rem; padding: 2.5rem; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.5); text-align: center; }
        .badge { display: inline-block; background: #5483B3; color: white; padding: 0.35rem 1rem; border-radius: 9999px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1.5rem; }
        h1 { font-size: 1.75rem; margin-bottom: 0.75rem; color: #C1E8FF; }
        p { color: #94a3b8; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem; }
        .info-grid { background: rgba(2, 16, 36, 0.6); border-radius: 1rem; padding: 1rem; text-align: left; font-family: monospace; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .info-row { display: flex; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .info-row:last-child { border-bottom: none; }
        .status { color: #10b981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">🚀 RupaCloud VPS Auto-Deploy</span>
        <h1>PHP Native Berhasil Live!</h1>
        <p>Aplikasi PHP berhasil di-deploy secara otomatis dari repositori GitHub langsung ke container VPS RupaCloud kamu.</p>
        <div class="info-grid">
            <div class="info-row"><span>Status:</span> <span class="status">ONLINE (Port 3000)</span></div>
            <div class="info-row"><span>PHP Version:</span> <span><?php echo phpversion(); ?></span></div>
            <div class="info-row"><span>Server Time:</span> <span><?php echo date('Y-m-d H:i:s'); ?> UTC</span></div>
            <div class="info-row"><span>Server Host:</span> <span><?php echo gethostname(); ?></span></div>
        </div>
        <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 0;">Kamu bisa mengedit file <code>index.php</code> di repository kamu, lakukan <code>git push</code>, dan tonton auto-deploy berjalan otomatis!</p>
    </div>
</body>
</html>
`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (!user.githubToken) {
      return NextResponse.json(
        { error: "Akun belum terhubung ke GitHub. Sambungkan di halaman Pengaturan." },
        { status: 400 }
      );
    }

    const token = user.githubToken;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "User-Agent": "RupaCloud-App",
    };

    // Ambil info user GitHub untuk mengetahui username/login
    const userRes = await fetch("https://api.github.com/user", { headers });
    if (!userRes.ok) {
      return NextResponse.json({ error: "Gagal memverifikasi akun GitHub." }, { status: 400 });
    }
    const githubUser = await userRes.json();
    const owner = githubUser.login;
    const repoName = "rupacloud-php-sample";

    // Cek apakah repo sudah ada
    const checkRepo = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    if (!checkRepo.ok) {
      // Buat repo baru
      const createRes = await fetch("https://api.github.com/user/repos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: repoName,
          description: "Contoh aplikasi PHP Native untuk testing deployment RupaCloud",
          private: false,
          auto_init: true,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: `Gagal membuat repository di GitHub: ${err.message || createRes.statusText}` },
          { status: 500 }
        );
      }
      // Tunggu sebentar agar inisialisasi commit selesai
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Suntikkan index.php
    const fileUrl = `https://api.github.com/repos/${owner}/${repoName}/contents/index.php`;
    let fileSha: string | undefined;
    const checkFile = await fetch(fileUrl, { headers });
    if (checkFile.ok) {
      const fData = await checkFile.json();
      fileSha = fData.sha;
    }

    const putRes = await fetch(fileUrl, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "feat: add sample PHP index page for RupaCloud",
        content: Buffer.from(SAMPLE_PHP_CODE).toString("base64"),
        ...(fileSha && { sha: fileSha }),
      }),
    });

    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Gagal membuat file index.php: ${err.message || putRes.statusText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Repository ${owner}/${repoName} berhasil dibuat di akun GitHub kamu!`,
      repo: `${owner}/${repoName}`,
      owner,
      repoName,
      branch: "main",
      frameworkId: "php_native",
    });
  } catch (error: any) {
    console.error("Init sample repo error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan saat menyiapkan repositori sample." },
      { status: 500 }
    );
  }
}
