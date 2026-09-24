"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingBag,
  Sliders,
  Server,
  LogOut,
  Shield,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function AdminShell({ children }: { children: React.ReactNode }) {

  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  const navSections = [
    {
      title: "UTAMA",
      items: [
        { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "PELANGGAN & FINANSIAL",
      items: [
        { href: "/admin/customers", label: "Manajemen Customer", icon: Users },
        { href: "/admin/transactions", label: "Manajemen Transaksi", icon: CreditCard },
      ],
    },
    {
      title: "SERVER & OPERASIONAL",
      items: [
        { href: "/admin/orders", label: "Manajemen Order", icon: ShoppingBag },
        { href: "/admin/servers", label: "Manajemen Container", icon: Server },
      ],
    },
    {
      title: "KONFIGURASI",
      items: [
        { href: "/admin/plans", label: "Manajemen Paket & Config", icon: Sliders },
      ],
    },
  ];

  const handleLogout = () => {
    document.cookie = "rc_mock_role=GUEST; path=/; max-age=86400";
    router.push("/login");
  };

  const getBreadcrumb = (isMobile = false) => {
    if (pathname.includes("/dashboard")) return isMobile ? "Dashboard" : "Admin > Dashboard Operasional";
    if (pathname.includes("/customers")) return isMobile ? "Pelanggan" : "Admin > Manajemen Customer";
    if (pathname.includes("/transactions")) return isMobile ? "Audit Transaksi" : "Admin > Audit Transaksi";
    if (pathname.includes("/orders")) return isMobile ? "Siklus Order" : "Admin > Siklus Order";
    if (pathname.includes("/servers")) return isMobile ? "Servers LXD" : "Admin > Operasional Container LXD";
    if (pathname.includes("/plans")) return isMobile ? "Paket & Config" : "Admin > Konfigurasi Paket & AppConfig";
    return "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* FULL HEIGHT DESKTOP SIDEBAR */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-navy-900 text-white min-h-screen sticky top-0 z-40 transition-all duration-300 select-none border-r border-navy-800",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-navy-800">
          <Logo href="/admin/dashboard" iconOnly={isCollapsed} className="text-white" />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-navy-800 transition-colors"
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
                <div className="px-3 pb-1.5 text-[10px] font-extrabold tracking-wider text-blue-400 uppercase">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all relative group",
                      isActive
                        ? "bg-blue-600 text-white font-extrabold shadow-md"
                        : "text-neutral-300 hover:bg-navy-800 hover:text-white",
                      isCollapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-white" : "text-blue-300")} />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Logout */}
        <div className="p-3 border-t border-navy-800">
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Keluar Admin" : undefined}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/40 transition-colors",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Keluar Admin</span>}
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
              className="fixed inset-0 bg-navy-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-64 bg-navy-900 text-white min-h-full p-4 flex flex-col justify-between shadow-2xl z-10"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-navy-800">
                  <Logo href="/admin/dashboard" className="text-white" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-neutral-400 hover:bg-navy-800 rounded-lg cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-6">
                  {navSections.map((section, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="px-3 pb-1 text-[10px] font-extrabold tracking-wider text-blue-400 uppercase">
                        {section.title}
                      </div>
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                              isActive
                                ? "bg-blue-600 text-white"
                                : "text-neutral-300 hover:bg-navy-800"
                            )}
                          >
                            <Icon className="w-4 h-4 text-blue-300" />
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
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Admin</span>
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
              <span className="bg-navy-900 text-white px-2 py-1 sm:px-2.5 rounded-md font-mono whitespace-nowrap text-[11px] sm:text-xs">
                <span className="sm:hidden">{getBreadcrumb(true)}</span>
                <span className="hidden sm:inline">{getBreadcrumb(false)}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-blue-100/60 text-blue-800 rounded-xl text-[11px] sm:text-xs font-extrabold border border-blue-200 whitespace-nowrap">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Operator Status: Active</span>
              <span className="sm:hidden">Active</span>
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-navy-900 text-white font-bold text-xs flex items-center justify-center border border-navy-800">
                A
              </div>

              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-extrabold text-navy-900 leading-tight">
                  Admin RuPa Cloud
                </span>
                <span className="text-[10px] text-neutral-400">admin@rupacloud.id</span>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>

        {/* FOOTER */}
        <footer className="py-4 px-6 bg-white border-t border-slate-200 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} RuPa Cloud Operator Panel • Internal Infrastructure Control.
        </footer>
      </div>
    </div>
  );
}
