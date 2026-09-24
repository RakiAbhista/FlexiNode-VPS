import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DevToolbar } from "@/components/shared/dev-toolbar";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RuPa Cloud — Reseller VPS Mikro Harian Sederhana & Terjangkau",
  description:
    "Sewa VPS mikro harian (1 hari, 3 hari, 1 minggu) untuk mahasiswa & developer. Auto-deploy GitHub, bayar pakai saldo atau QRIS.",
};

import { LanguageProvider } from "@/lib/i18n/language-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-navy-900 font-sans selection:bg-blue-100 selection:text-navy-900">
        <LanguageProvider>
          {children}
          <DevToolbar />
        </LanguageProvider>
      </body>
    </html>
  );
}
