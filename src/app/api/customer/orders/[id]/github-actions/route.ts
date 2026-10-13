import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order tidak ditemukan." }, { status: 404 });
    }

    if (!user.githubToken) {
      return NextResponse.json(
        { error: "Akun GitHub belum terhubung. Silakan hubungkan di menu Pengaturan." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const runId = searchParams.get("runId");
    const jobId = searchParams.get("jobId");
    const fetchLatest = searchParams.get("latest") === "true";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Parameter owner dan repo wajib disertakan." },
        { status: 400 }
      );
    }

    const token = user.githubToken;
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "RupaCloud-App",
    };

    // 1. Jika ada jobId, ambil plaintext log untuk job tersebut
    if (jobId) {
      const logRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${jobId}/logs`,
        { headers, redirect: "follow" }
      );

      if (logRes.status === 404) {
        return NextResponse.json({
          log: "Job deployment sedang dipersiapkan oleh GitHub runner. Log akan muncul beberapa saat lagi...",
        });
      }

      if (!logRes.ok) {
        const errJson = await logRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errJson.message || `Gagal mengambil log (${logRes.statusText})` },
          { status: logRes.status }
        );
      }

      const logText = await logRes.text();
      return NextResponse.json({ log: logText });
    }

    // 2. Jika ada runId, ambil daftar jobs untuk run tersebut
    if (runId) {
      const jobsRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${runId}/jobs`,
        { headers }
      );

      if (!jobsRes.ok) {
        const errJson = await jobsRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: errJson.message || `Gagal mengambil job list (${jobsRes.statusText})` },
          { status: jobsRes.status }
        );
      }

      const jobsData = await jobsRes.json();
      return NextResponse.json({ jobs: jobsData.jobs || [] });
    }

    // 3. Ambil daftar workflow runs
    const runsRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      { headers }
    );

    if (!runsRes.ok) {
      const errJson = await runsRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errJson.message || `Gagal mengambil workflow runs (${runsRes.statusText})` },
        { status: runsRes.status }
      );
    }

    const runsData = await runsRes.json();
    const runs = (runsData.workflow_runs || []).map((run: any) => ({
      id: run.id,
      name: run.name,
      headBranch: run.head_branch,
      headSha: run.head_sha ? run.head_sha.slice(0, 7) : "",
      commitMessage: run.head_commit?.message || "Manual run",
      event: run.event,
      status: run.status, // "queued", "in_progress", "completed"
      conclusion: run.conclusion, // "success", "failure", "cancelled", null
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      htmlUrl: run.html_url,
      jobsUrl: run.jobs_url,
    }));

    // Jika parameter latest=true, sekaligus fetch log dari job pertama di run terbaru
    let latestLog: string | null = null;
    let latestJobId: number | null = null;

    if (fetchLatest && runs.length > 0) {
      const latestRun = runs[0];
      try {
        const jobsRes = await fetch(latestRun.jobsUrl, { headers });
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          if (jobsData.jobs && jobsData.jobs.length > 0) {
            const firstJob = jobsData.jobs[0];
            latestJobId = firstJob.id;
            const logRes = await fetch(
              `https://api.github.com/repos/${owner}/${repo}/actions/jobs/${firstJob.id}/logs`,
              { headers, redirect: "follow" }
            );
            if (logRes.ok) {
              latestLog = await logRes.text();
            } else if (logRes.status === 404) {
              latestLog = "Job sedang dipersiapkan oleh runner GitHub...";
            }
          }
        }
      } catch (err) {
        console.error("Error prefetching latest run log:", err);
      }
    }

    return NextResponse.json({
      runs,
      latestJobId,
      latestLog,
    });
  } catch (error: any) {
    console.error("Error in github-actions route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
