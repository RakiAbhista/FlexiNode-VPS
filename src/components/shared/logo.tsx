import React from "react";
import Link from "next/link";
import { Cloud, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  href?: string;
  lightText?: boolean;
}

import Image from "next/image";

export function Logo({ className, iconOnly = false, href = "/", lightText = false }: LogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2 font-bold tracking-tight select-none", className)}>
      <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
        <Image 
          src="/logo.png" 
          alt="RuPa Cloud Logo" 
          fill 
          sizes="48px"
          unoptimized
          className="object-contain"
          priority
        />
      </div>
      {!iconOnly && (
        <span className={cn("text-xl sm:text-2xl font-extrabold tracking-tight", lightText ? "text-white" : "text-navy-900")}>
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
