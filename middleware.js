import { NextResponse } from "next/server";
import { COOKIE, readSession } from "@/lib/session";

// Every page and API route needs a valid login, except /login and /api/auth/*.
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const signedIn = Boolean(await readSession(req.cookies.get(COOKIE)?.value));

  const isLogin = pathname === "/login";
  if (signedIn && isLogin) return NextResponse.redirect(new URL("/", req.url));
  if (signedIn || isLogin || pathname.startsWith("/api/auth/")) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|logo.webp|robots.txt).*)"],
};