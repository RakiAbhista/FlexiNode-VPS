import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { githubHandle: null, githubToken: null },
    });

    return NextResponse.json({
      success: true,
      message: "Tautan integrasi GitHub berhasil diputuskan.",
      githubHandle: null,
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
