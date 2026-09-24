import React from "react";
import Link from "next/link";
import { Cloud, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  href?: string;
}

export function Logo({ className, iconOnly = false, href = "/" }: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2 font-bold tracking-tight select-none", className)}>
      <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 text-white shadow-md">
        <Cloud className="w-5 h-5 text-blue-100" />
        <Server className="w-3 h-3 text-blue-400 absolute bottom-1 right-1" />
      </div>
      {!iconOnly && (
        <span className="text-xl font-extrabold text-navy-900">
          RuPa <span className="text-blue-600 font-semibold">Cloud</span>
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
