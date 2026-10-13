import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const handle = body.githubHandle || user.githubHandle || `${user.name.toLowerCase().replace(/[^a-z0-9]/g, "")}-dev`;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { githubHandle: handle },
    });

    return NextResponse.json({
      success: true,
      message: `Akun GitHub @${handle} berhasil dihubungkan!`,
      githubHandle: updated.githubHandle,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
