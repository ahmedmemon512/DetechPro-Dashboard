import { json, sameOrigin, readJson, cookieOpts } from "@/lib/guard";
import { normEmail, validEmail, limited, clientIp, verifyOtp } from "@/lib/auth";
import { COOKIE, MAX_AGE, createSession, secretOk } from "@/lib/session";

export const dynamic = "force-dynamic";
const WINDOW = 15 * 60 * 1000;

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!secretOk()) return json({ error: "SESSION_SECRET is missing or shorter than 32 characters in .env.local." }, 500);

  let body;
  try { body = await readJson(request, 2000); } catch { return json({ error: "Invalid request." }, 400); }
  const email = normEmail(body?.email);
  const code = String(body?.code ?? "").replace(/\s+/g, "");
  if (!validEmail(email) || !/^\d{6,10}$/.test(code)) return json({ error: "Enter the code from your email." }, 400);

  if (limited(`verify-ip:${clientIp(request)}`, 20, WINDOW) || limited(`verify:${email}`, 6, WINDOW)) {
    return json({ error: "Too many attempts. Please wait a few minutes and request a new code." }, 429);
  }

  const r = await verifyOtp(email, code);
  if (r.code === "not_configured") return json({ error: "Supabase auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local." }, 500);
  // Supabase already ties the code to this email; only reject if it reports a different one.
  if (!r.ok || (r.email && r.email !== email)) return json({ error: "That code is wrong or has expired." }, 401);

  const res = json({ ok: true });
  res.cookies.set(COOKIE, await createSession(email), cookieOpts(request, MAX_AGE));
  return res;
}