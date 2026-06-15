import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((req) => {
  if (!req.auth) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Env mismatch — token was issued by a different environment, force re-login
  const currentEnv = process.env.APP_ENV || "local";
  if (req.auth.user?.appEnv && req.auth.user.appEnv !== currentEnv) {
    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear all possible Auth.js session cookies
    const clearCookie = "=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax";
    response.headers.append(
      "Set-Cookie",
      `next-auth.session-token${clearCookie}`,
    );
    response.headers.append(
      "Set-Cookie",
      `__Secure-next-auth.session-token${clearCookie}`,
    );
    response.headers.append(
      "Set-Cookie",
      `authjs.session-token${clearCookie}`,
    );
    return response;
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
