import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        githubHandle: user.githubHandle || undefined,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name } : {}),
        ...(email ? { email: email.toLowerCase().trim() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        balance: updated.balance,
        githubHandle: updated.githubHandle || undefined,
      },
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
