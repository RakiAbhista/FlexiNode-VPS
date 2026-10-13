import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil.",
  });

  const cookieOpts = { path: "/", maxAge: 0 };
  // Hapus semua session cookies
  response.cookies.set("rc_mock_role", "", cookieOpts);
  response.cookies.set("rc_user_email", "", cookieOpts);
  response.cookies.set("rc_user_id", "", cookieOpts);

  return response;
}
