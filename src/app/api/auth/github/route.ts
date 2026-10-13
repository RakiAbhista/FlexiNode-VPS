import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub Client ID not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const redirect = searchParams.get("redirect") || "/settings";

  // Define scopes: repo (read/write all repos), workflow (modify .github/workflows), user:email
  const scopes = "repo workflow user:email";
  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const redirectUri = `${origin}/api/auth/callback/github`;

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(redirect)}&prompt=consent`;

  return NextResponse.redirect(githubAuthUrl);
}
