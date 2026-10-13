import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: max 5 percobaan per IP per menit (mencegah OTP brute force)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`otp:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, otp } = body;

    if (!otp || !email) {
      return NextResponse.json(
        { error: "Email dan kode OTP wajib diisi." },
        { status: 400 }
      );
    }

    // REMOVED: OTP universal "123456" untuk testing — ini backdoor di production

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: email?.toLowerCase().trim(),
        code: otp,
        used: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kadaluwarsa." },
        { status: 400 }
      );
    }

    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Ambil dan update user menjadi verified
    const user = await prisma.user.update({
      where: { email: otpRecord.email },
      data: { emailVerified: true },
    });

    const cookieOpts = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    const response = NextResponse.json({
      success: true,
      message: "Verifikasi OTP berhasil!",
    });

    if (user) {
      response.cookies.set("rc_mock_role", user.role, { ...cookieOpts, httpOnly: false });
      response.cookies.set("rc_user_email", user.email, cookieOpts);
      response.cookies.set("rc_user_id", user.id, cookieOpts);
    }

    return response;
  } catch (error: any) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi OTP." },
      { status: 500 }
    );
  }
}
