import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmailAsync } from "@/lib/email";

// Validasi password: minimal 8 karakter, ada huruf dan angka
const isStrongPassword = (p: string) => p.length >= 8 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    // Rate limit: max 5 registrasi per IP per menit
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRateLimit(`register:${ip}`, 5, 60_000)) {
      return NextResponse.json(
        { error: "Terlalu banyak percobaan. Coba lagi dalam 1 menit." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi format email
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    // Validasi kekuatan password (minimal 8 karakter, ada huruf + angka)
    if (!isStrongPassword(password)) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter dan harus mengandung huruf serta angka." },
        { status: 400 }
      );
    }

    // Batas panjang nama
    if (name.length > 100) {
      return NextResponse.json({ error: "Nama terlalu panjang." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan login." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        role: "CUSTOMER",
        balance: 0,
        emailVerified: false,
      },
    });

    // Generate 6-digit random OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otpCode.create({
      data: {
        email: newUser.email,
        code: otpCode,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Kirim OTP via email di background (non-blocking, response instan <200ms)
    sendEmailAsync({
      to: newUser.email,
      subject: "Kode OTP Registrasi RuPa Cloud",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #052659;">Selamat Datang di RuPa Cloud!</h2>
          <p>Halo ${newUser.name},</p>
          <p>Kode OTP untuk pendaftaran akun Anda adalah:</p>
          <h1 style="color: #2563eb; letter-spacing: 5px; font-size: 32px;">${otpCode}</h1>
          <p>Kode ini akan kadaluwarsa dalam 15 menit.</p>
        </div>
      `,
    });

    console.log(`[AUTH] Register OTP for ${newUser.email}: ${otpCode}`);

    return NextResponse.json({
      success: true,
      message: "Registrasi berhasil! Silakan periksa email Anda untuk kode OTP.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Gagal mendaftar. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
