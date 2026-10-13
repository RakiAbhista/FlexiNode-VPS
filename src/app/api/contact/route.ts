import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Hanya karakter aman di nama dan pesan (hindari HTML injection)
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Nama, email, dan pesan harus diisi." },
        { status: 400 }
      );
    }

    // Validasi format email
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });
    }

    // Batasi panjang input
    if (name.length > 100 || message.length > 2000) {
      return NextResponse.json({ error: "Input melebihi batas panjang yang diizinkan." }, { status: 400 });
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpEmail || !smtpPassword) {
      console.error("SMTP credentials not configured.");
      return NextResponse.json(
        { error: "Server email belum dikonfigurasi dengan benar." },
        { status: 500 }
      );
    }

    // Escape semua input user sebelum masuk ke HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: smtpEmail, pass: smtpPassword },
    });

    await transporter.sendMail({
      from: `"RuPa Cloud Contact" <${smtpEmail}>`,
      replyTo: email,
      to: smtpEmail,
      subject: `[RuPa Cloud Contact] Pesan Baru dari ${safeName}`,
      text: `Nama: ${name}\nEmail: ${email}\n\nPesan:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #052659;">Pesan Baru dari Form Kontak RuPa Cloud</h2>
          <p><strong>Nama:</strong> ${safeName}</p>
          <p><strong>Email Pengirim:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p><strong>Pesan:</strong></p>
          <p style="white-space: pre-wrap; color: #374151;">${safeMessage}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: "Pesan berhasil dikirim." });
  } catch (error: any) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }
}
