"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { ShoppingBag, User, Menu, X, ArrowRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/data/types";
import { useLanguage } from "@/lib/i18n/language-context";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { motion, AnimatePresence } from "framer-motion";

export function GuestNavbar() {
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<Role>("GUEST");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const activeRole = (document.cookie
      .split("; ")
      .find((row) => row.startsWith("rc_mock_role="))
      ?.split("=")[1] as Role) || "GUEST";
    setRole(activeRole);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navLinks = [
    { href: "/", label: lang === "ID" ? "Beranda" : "Home" },
    { href: "/product", label: lang === "ID" ? "Paket & Harga" : "Pricing" },
    { href: "/about", label: lang === "ID" ? "Tentang Kami" : "About Us" },
    { href: "/faq", label: "FAQ" },
    { href: "/contact", label: lang === "ID" ? "Kontak" : "Contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm"
          : "bg-white border-b border-slate-100"
      )}
    >
      <div className="w-full px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between">

        {/* Left Side: Logo + Nav Links */}
        <div className="flex items-center gap-6 lg:gap-12">
          <Logo />

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-blue-600 bg-blue-100/50 font-semibold"
                      : "text-navy-900/80 hover:text-navy-900 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <LanguageSwitcher />

          {role === "GUEST" ? (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-navy-900 hover:text-blue-600 transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span>{lang === "ID" ? "Masuk" : "Sign In"}</span>
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-navy-800 hover:bg-navy-900 rounded-xl shadow-sm hover:shadow transition-all inline-flex items-center gap-1.5 hover:-translate-y-0.5"
              >
                <span>{lang === "ID" ? "Daftar Gratis" : "Register Free"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/checkout"
                className="px-3.5 py-2 text-xs font-semibold text-blue-600 bg-blue-100 hover:bg-blue-100/80 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Checkout</span>
              </Link>

              {role === "ADMIN" ? (
                <Link
                  href="/admin/dashboard"
                  className="px-4 py-2 text-sm font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Admin Panel</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-semibold text-white bg-navy-800 hover:bg-navy-900 rounded-lg flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  <span>{lang === "ID" ? "Dashboard Saya" : "My Dashboard"}</span>
                </Link>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="flex md:hidden items-center space-x-3">
          <LanguageSwitcher />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Smooth Mobile Drawer Dropdown Animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-lg border-b border-slate-200 px-5 pt-3 pb-6 space-y-3 shadow-xl"
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2.5 rounded-xl text-base font-semibold transition-colors",
                    pathname === link.href
                      ? "text-blue-600 bg-blue-50 font-bold"
                      : "text-navy-900 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
              {role === "GUEST" ? (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center font-bold text-navy-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    {t("Masuk", "Sign In")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full py-3 text-center font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl shadow transition-colors flex items-center justify-center gap-2"
                  >
                    <span>{t("Daftar Gratis", "Register Free")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <Link
                  href={role === "ADMIN" ? "/admin/dashboard" : "/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 text-center font-bold text-white bg-navy-800 hover:bg-navy-900 rounded-xl shadow transition-colors"
                >
                  {t("Buka Dashboard", "Open Dashboard")}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
