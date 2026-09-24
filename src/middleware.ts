import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const mockRole = request.cookies.get("rc_mock_role")?.value || "GUEST";

  const isCustomerRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/topup") ||
    pathname.startsWith("/settings");

  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // Protect Customer routes
  if (isCustomerRoute && mockRole === "GUEST") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Protect Admin routes
  if (isAdminRoute && mockRole !== "ADMIN") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated user away from auth pages
  if (isAuthRoute && mockRole !== "GUEST") {
    if (mockRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/checkout/:path*",
    "/invoices/:path*",
    "/history/:path*",
    "/topup/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
