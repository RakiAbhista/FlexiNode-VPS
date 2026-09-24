"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { useLanguage } from "@/lib/i18n/language-context";

export function GuestFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-navy-900 text-white pt-16 pb-12 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-navy-800">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Logo className="text-white" />
            <p className="text-sm text-blue-100/70 leading-relaxed">
              {t(
                "Platform reseller VPS mikro harian terjangkau untuk mahasiswa & developer pemula di Indonesia. Sewa harian, auto-deploy, tanpa komitmen bulanan.",
                "Affordable daily micro VPS reseller platform for students & beginner developers in Indonesia. Daily rentals, auto-deploy, no monthly commitments."
              )}
            </p>
          </div>

          {/* Navigasi Produk */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-blue-400 uppercase">
              {t("Produk & Layanan", "Products & Services")}
            </h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <Link href="/product" className="hover:text-blue-100 transition-colors">
                  {t("Katalog Paket VPS", "VPS Package Catalog")}
                </Link>
              </li>
              <li>
                <Link href="/product" className="hover:text-blue-100 transition-colors">
                  {t("Sewa Harian & Mingguan", "Daily & Weekly Rentals")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-blue-100 transition-colors">
                  {t("Fitur Auto-deploy GitHub", "GitHub Auto-deploy Feature")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Bantuan & Komunitas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-blue-400 uppercase">
              {t("Bantuan & Informasi", "Help & Information")}
            </h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <Link href="/about" className="hover:text-blue-100 transition-colors">
                  {t("Tentang RuPa Cloud", "About RuPa Cloud")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-blue-100 transition-colors">
                  {t("Tanya Jawab (FAQ)", "Frequently Asked Questions (FAQ)")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-blue-100 transition-colors">
                  {t("Hubungi Kami", "Contact Us")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legalitas */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-blue-400 uppercase">
              {t("Legalitas & Privasi", "Legal & Privacy")}
            </h4>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li>
                <Link href="/terms" className="hover:text-blue-100 transition-colors">
                  {t("Syarat & Ketentuan", "Terms & Conditions")}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-100 transition-colors">
                  {t("Kebijakan Privasi", "Privacy Policy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>
            © {new Date().getFullYear()} RuPa Cloud.{" "}
            {t("Hak cipta dilindungi undang-undang.", "All rights reserved.")}
          </p>
          <p className="text-neutral-500">
            {t("Filosofi RuPa:", "RuPa Philosophy:")}{" "}
            <span className="text-blue-300 italic">Maruta</span> ({t("Kecepatan", "Speed")}) +{" "}
            <span className="text-blue-300 italic">Alpa</span> (
            {t("Ringan & Ekonomis", "Light & Economical")}).
          </p>
        </div>
      </div>
    </footer>
  );
}
