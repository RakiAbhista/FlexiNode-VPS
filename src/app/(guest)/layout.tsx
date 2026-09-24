import React from "react";
import { GuestNavbar } from "@/components/shared/guest-navbar";
import { GuestFooter } from "@/components/shared/guest-footer";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GuestNavbar />
      <main className="flex-1">{children}</main>
      <GuestFooter />
    </div>
  );
}
