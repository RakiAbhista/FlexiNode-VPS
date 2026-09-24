"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import {
  LayoutDashboard,
  Server,
  ShoppingBag,
  History,
  Wallet,
  Settings,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";
import { User } from "@/lib/data/types";
import { dataSource } from "@/lib/data";
import { formatRupiah, cn } from "@/lib/utils";
import { OnboardingTour } from "@/components/shared/onboarding-tour";
import { motion, AnimatePresence } from "framer-motion";


export function CustomerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadUser() {
      const u = await dataSource.getCurrentUser("CUSTOMER");
      setUser(u);
    }
    loadUser();
  }, []);

  const handleLogout = () => {
    document.cookie = "rc_mock_role=GUEST; path=/; max-age=86400";
    router.push("/login");
  };

  const navSections = [
    {
      title: "UTAMA",
      items: [
        { id: "tour-dashboard", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "PRODUK & LAYANAN",
      items: [
        { id: "tour-produk-saya", href: "/products", label: "Produk Saya", icon: Server },
        { id: "tour-sewa-baru", href: "/product", label: "Sewa Baru", icon: ShoppingBag },
      ],
    },
    {
      title: "KEUANGAN",
      items: [
        { id: "tour-riwayat-transaksi", href: "/history", label: "Riwayat Transaksi", icon: History },
        { id: "tour-topup", href: "/topup", label: "Top-up Saldo", icon: Wallet },
      ],
    },
    {
      title: "PENGATURAN",
      items: [
        { id: "tour-settings", href: "/settings", label: "Pengaturan Akun", icon: Settings },
      ],
    },
  ];

  const getBreadcrumb = (isMobile = false) => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/products/")) return isMobile ? "Detail Server" : "Produk > Detail Server";
    if (pathname.startsWith("/products")) return isMobile ? "Produk Saya" : "Produk > Produk Saya";
    if (pathname.startsWith("/product")) return isMobile ? "Katalog Sewa" : "Produk > Katalog Sewa";
    if (pathname.startsWith("/history")) return isMobile ? "Riwayat Transaksi" : "Keuangan > Riwayat Transaksi";
    if (pathname.startsWith("/invoices/")) return isMobile ? "Invoice" : "Keuangan > Invoice";
    if (pathname.startsWith("/topup")) return isMobile ? "Top-up Saldo" : "Keuangan > Top-up Saldo";
    if (pathname.startsWith("/checkout")) return "Checkout";
    if (pathname.startsWith("/settings")) return isMobile ? "Pengaturan" : "Pengaturan Akun";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* ONBOARDING SPOTLIGHT TOUR */}
      <OnboardingTour userId={user?.id || "usr_cust_1"} />

      {/* FULL HEIGHT DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-white border-r border-slate-200 min-h-screen sticky top-0 z-40 transition-all duration-300 select-none",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
          <Logo href="/dashboard" iconOnly={isCollapsed} />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
            title={isCollapsed ? "Buka Sidebar" : "Tutup Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1.5 text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    id={item.id}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group",
                      isActive
                        ? "bg-blue-100/70 text-blue-600 font-extrabold"
                        : "text-neutral-600 hover:bg-slate-100 hover:text-navy-900",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full"></span>
                    )}
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-blue-600" : "text-neutral-500")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Logout */}
        <div className="p-3 border-t border-slate-100">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Keluar Akun" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* MOBILE DRAWER WITH SMOOTH SLIDE ANIMATION */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-navy-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-64 bg-white min-h-full p-4 flex flex-col justify-between shadow-2xl z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <Logo href="/dashboard" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-neutral-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-6">
                  {navSections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="px-3 pb-1 text-[10px] font-extrabold tracking-wider text-neutral-400 uppercase">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            id={`mobile-${item.id}`}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                              isActive
                                ? "bg-blue-100/70 text-blue-600 font-extrabold"
                                : "text-neutral-600 hover:bg-slate-100"
                            )}
                          >
                            <Icon className="w-4 h-4 text-blue-600" />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 text-navy-900 hover:bg-slate-100 rounded-lg shrink-0"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold text-navy-900 min-w-0">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 sm:px-2.5 rounded-md whitespace-nowrap text-[11px] sm:text-xs">
                <span className="sm:hidden">{getBreadcrumb(true)}</span>
                <span className="hidden sm:inline">{getBreadcrumb(false)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Saldo Badge with tour-saldo-card ID */}
            <div
              id="tour-saldo-card"
              className="flex items-center bg-blue-100/60 border border-blue-200/80 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 gap-1.5 sm:gap-2 text-xs whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <div className="flex flex-col">
                <span className="hidden sm:block text-[10px] text-neutral-500 leading-none">Saldo</span>
                <span className="font-extrabold text-navy-900 leading-tight text-[11px] sm:text-xs">
                  {user ? formatRupiah(user.balance) : "Rp0"}
                </span>
              </div>
              <Link
                href="/topup"
                className="p-1 bg-navy-800 hover:bg-navy-900 text-white rounded-md transition-colors shrink-0"
                title="Top-up Saldo"
              >
                <PlusCircle className="w-3.5 h-3.5" />
              </Link>
            </div>

            <Link
              href="/checkout"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Checkout</span>
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-navy-800 text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-navy-900 leading-tight">
                  {user?.name || "Customer"}
                </span>
                <span className="text-[10px] text-neutral-400">Hi, Selamat Datang</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* FOOTER */}
        <footer className="py-4 px-6 bg-white border-t border-slate-200 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} RuPa Cloud Indonesia • Maruta & Alpa Technology.
        </footer>
      </div>
    </div>
  );
}
