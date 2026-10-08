import { NextResponse } from "next/server";

export function json(data, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

// CSRF defence for state-changing requests: Origin must match the host we are served from.
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function readJson(request, maxBytes = 1_000_000) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > maxBytes) throw new Error("too_large");
  const text = await request.text();
  if (text.length > maxBytes) throw new Error("too_large");
  return JSON.parse(text);
}

export const clampInt = (v, min, max, fallback) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

// True when the browser reached us over HTTPS (also behind a proxy / Vercel / Cloudflare).
export function isHttps(request) {
  const proto = (request.headers.get("x-forwarded-proto") || request.nextUrl?.protocol || "").split(",")[0].trim().replace(":", "");
  return proto === "https";
}

// Session cookie options. "Secure" is set only when the request really is HTTPS, because a browser
// silently drops a Secure cookie on plain http (npm start, LAN IP, Safari on localhost) and the
// user then bounces back to /login with no error.
export const cookieOpts = (request, maxAge) => ({ httpOnly: true, secure: isHttps(request), sameSite: "lax", path: "/", maxAge });
