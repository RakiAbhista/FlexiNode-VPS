import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state") || "/settings";

    // Validate safe redirect url (prevent open redirect vulnerabilities)
    const targetUrl = state.startsWith("/") && !state.startsWith("//") ? state : "/dashboard";

    if (!code) {
      const sep = targetUrl.includes("?") ? "&" : "?";
      return NextResponse.redirect(new URL(`${targetUrl}${sep}error=NoCodeProvided`, request.url));
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      const sep = targetUrl.includes("?") ? "&" : "?";
      return NextResponse.redirect(new URL(`${targetUrl}${sep}error=MissingGithubCredentials`, request.url));
    }

    // 1. Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("Token exchange failed:", tokenData);
      const sep = targetUrl.includes("?") ? "&" : "?";
      return NextResponse.redirect(new URL(`${targetUrl}${sep}error=TokenExchangeFailed`, request.url));
    }

    // 2. Fetch GitHub user profile
    const profileResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const profileData = await profileResponse.json();
    const githubHandle = profileData.login;

    if (!githubHandle) {
      const sep = targetUrl.includes("?") ? "&" : "?";
      return NextResponse.redirect(new URL(`${targetUrl}${sep}error=ProfileFetchFailed`, request.url));
    }

    // 3. Fetch user email if not public in profile
    let userEmail: string | null = profileData.email;
    if (!userEmail) {
      try {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });
        if (emailsResponse.ok) {
          const emailsData: Array<{ email: string; primary: boolean; verified: boolean }> = await emailsResponse.json();
          const primaryEmail = emailsData.find((e) => e.primary && e.verified) || emailsData.find((e) => e.verified) || emailsData[0];
          if (primaryEmail) {
            userEmail = primaryEmail.email;
          }
        }
      } catch (err) {
        console.warn("Could not fetch user emails from GitHub:", err);
      }
    }

    if (!userEmail) {
      userEmail = `${githubHandle.toLowerCase()}@users.noreply.github.com`;
    }

    const sessionUser = await getSessionUser();

    const cookieOpts = {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7,
    };

    if (sessionUser) {
      // Skenario A: User sudah login, menghubungkan akun GitHub
      await prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          githubHandle,
          githubToken: accessToken,
        },
      });

      const sep = targetUrl.includes("?") ? "&" : "?";
      return NextResponse.redirect(new URL(`${targetUrl}${sep}success=GithubConnected`, request.url));
    } else {
      // Skenario B: User login / register lewat tombol GitHub
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { githubHandle },
            { email: userEmail.toLowerCase().trim() },
          ],
        },
      });

      if (user) {
        if (user.suspended) {
          return NextResponse.redirect(new URL("/login?error=AkunDitangguhkan", request.url));
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            githubHandle,
            githubToken: accessToken,
          },
        });
      } else {
        user = await prisma.user.create({
          data: {
            name: profileData.name || githubHandle,
            email: userEmail.toLowerCase().trim(),
            passwordHash: null,
            role: "CUSTOMER",
            githubHandle,
            githubToken: accessToken,
            emailVerified: true,
          },
        });
      }

      const response = NextResponse.redirect(new URL(targetUrl, request.url));
      response.cookies.set("rc_mock_role", user.role, { ...cookieOpts, httpOnly: false });
      response.cookies.set("rc_user_email", user.email, cookieOpts);
      response.cookies.set("rc_user_id", user.id, cookieOpts);
      return response;
    }
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    return NextResponse.redirect(new URL("/login?error=InternalError", request.url));
  }
}
