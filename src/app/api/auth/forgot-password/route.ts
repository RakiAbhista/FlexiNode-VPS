import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    // Rate limit: max 3 percobaan per IP per menit (mencegah email spam)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`forgot:${ip}`, 3, 60_000)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email wajib diisi." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Return positive message for security privacy (jangan bocorkan apakah email terdaftar)
      return NextResponse.json({
        success: true,
        message: "Jika email terdaftar, instruksi reset password telah dikirim.",
      });
    }

    // Generate 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.otpCode.create({
      data: {
        email: user.email,
        code: otpCode,
        expiresAt,
      },
    });

    // TODO: Kirim OTP via email (gunakan SMTP_EMAIL / nodemailer)
    // Untuk sementara, log OTP di server (JANGAN di response)
    console.log(`[DEV ONLY] OTP untuk ${email}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: "Jika email terdaftar, instruksi reset password telah dikirim.",
    });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan reset password." },
      { status: 500 }
    );
  }
}
