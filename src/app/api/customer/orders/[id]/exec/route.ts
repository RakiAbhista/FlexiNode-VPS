import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { incus } from "@/lib/incus";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || !order.containerId) {
      return NextResponse.json({ error: "Order atau container tidak ditemukan." }, { status: 404 });
    }

    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (order.status !== OrderStatus.ACTIVE && order.status !== OrderStatus.EXPIRING_SOON) {
      return NextResponse.json(
        { error: "Container sedang tidak aktif atau masa sewa telah berakhir." },
        { status: 400 }
      );
    }

    // Jika menerima sinyal kill / abort (Ctrl + C)
    if (body.action === "kill") {
      await incus.killProcesses(order.containerId);
      return NextResponse.json({ success: true, killed: true });
    }

    const command = (body.command ?? "").trim();
    const cwd = (body.cwd ?? "/root").trim() || "/root";

    if (!command) {
      return NextResponse.json({ error: "Perintah tidak boleh kosong." }, { status: 400 });
    }

    if (command.length > 500) {
      return NextResponse.json({ error: "Perintah terlalu panjang (maks. 500 karakter)." }, { status: 400 });
    }

    // Eksekusi perintah di dalam container dengan working directory aktif
    const { stdout, stderr, cwd: nextCwd } = await incus.exec(order.containerId, command, cwd);

    return NextResponse.json({
      success: true,
      command,
      stdout: stdout || "",
      stderr: stderr || "",
      cwd: nextCwd || cwd,
    });
  } catch (error: any) {
    console.error("[API/Exec]", error);
    return NextResponse.json({ error: "Gagal mengeksekusi perintah." }, { status: 500 });
  }
}
