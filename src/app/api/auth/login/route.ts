import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: max 10 percobaan login per IP per menit
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    if (user.suspended) {
      return NextResponse.json(
        { error: "Akun kamu ditangguhkan. Silakan hubungi dukungan RuPa Cloud." },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Email atau password salah." },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "Akun belum diverifikasi. Silakan masukkan kode OTP yang telah dikirimkan ke email kamu.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    const cookieOpts = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
      },
    });

    // rc_mock_role dibiarkan non-httpOnly agar frontend bisa baca untuk routing
    // tapi rc_user_id dan rc_user_email yang sensitif harus httpOnly
    response.cookies.set("rc_mock_role", user.role, { ...cookieOpts, httpOnly: false });
    response.cookies.set("rc_user_email", user.email, cookieOpts);
    response.cookies.set("rc_user_id", user.id, cookieOpts);

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: "Gagal login. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
