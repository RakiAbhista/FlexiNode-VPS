import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmailAsync } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`resend-otp:${ip}`, 3, 60_000)) {
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

    const normalizedEmail = email.toLowerCase().trim();

    // Pastikan user ada
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun dengan email ini tidak ditemukan." },
        { status: 404 }
      );
    }

    // Invalidate OTP lama yang belum terpakai
    await prisma.otpCode.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Generate kode baru 6 digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        email: normalizedEmail,
        code: otpCode,
        expiresAt,
      },
    });

    // Kirim email di background (non-blocking)
    sendEmailAsync({
      to: normalizedEmail,
      subject: "Kode OTP Verifikasi RuPa Cloud (Kirim Ulang)",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #052659;">Kode OTP Baru RuPa Cloud</h2>
          <p>Halo ${user.name},</p>
          <p>Berikut adalah kode verifikasi OTP baru kamu:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 32px;">${otpCode}</h1>
          <p>Kode ini berlaku selama 15 menit.</p>
        </div>
      `,
    });

    console.log(`[AUTH] Resent OTP for ${normalizedEmail}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: "Kode OTP baru telah dikirim ke email kamu.",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json(
      { error: "Gagal mengirim ulang kode OTP." },
      { status: 500 }
    );
  }
}
