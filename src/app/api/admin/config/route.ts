import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const configs = await prisma.appConfig.findMany({
      orderBy: { key: "asc" },
    });

    return NextResponse.json({
      success: true,
      configs: configs.reduce(
        (acc, c) => ({ ...acc, [c.key]: c.value }),
        {} as Record<string, string>
      ),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied: Admin only." }, { status: 403 });
    }

    const body = await request.json();
    // body is an object of { key: value } pairs to upsert
    const entries = Object.entries(body) as [string, string][];

    if (entries.length === 0) {
      return NextResponse.json({ error: "Tidak ada konfigurasi yang dikirim." }, { status: 400 });
    }

    const results = await Promise.all(
      entries.map(([key, value]) =>
        prisma.appConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${results.length} konfigurasi berhasil disimpan!`,
      configs: results.reduce(
        (acc, c) => ({ ...acc, [c.key]: c.value }),
        {} as Record<string, string>
      ),
    });
  } catch (error: any) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
