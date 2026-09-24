import React from "react";
import { CustomerShell } from "@/components/shared/customer-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell>{children}</CustomerShell>;
}
