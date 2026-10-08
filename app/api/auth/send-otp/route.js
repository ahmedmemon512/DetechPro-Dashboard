import { json, sameOrigin, readJson } from "@/lib/guard";
import { normEmail, validEmail, limited, clientIp, sendOtp } from "@/lib/auth";
import { secretOk } from "@/lib/session";

export const dynamic = "force-dynamic";
const WINDOW = 15 * 60 * 1000;

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!secretOk()) return json({ error: "SESSION_SECRET is missing or shorter than 32 characters in .env.local." }, 500);

  let body;
  try { body = await readJson(request, 2000); } catch { return json({ error: "Invalid request." }, 400); }
  const email = normEmail(body?.email);
  if (!validEmail(email)) return json({ error: "Enter a valid email address." }, 400);

  if (limited(`send-ip:${clientIp(request)}`, 10, WINDOW) || limited(`send:${email}`, 5, WINDOW)) {
    return json({ error: "Too many attempts. Please try again in a few minutes." }, 429);
  }

  const r = await sendOtp(email);
  if (!r.ok) {
    if (r.status === 429) return json({ error: "Please wait a minute before asking for another code." }, 429);
    if (r.code === "not_configured") return json({ error: "Supabase auth is not configured. Add SUPABASE_URL and SUPABASE_ANON_KEY to .env.local." }, 500);
    // Email Supabase Users mein nahi hai: chup-chap same jawab, taake koi emails check na kar sake.
    if (r.status === 422) { console.warn("[auth] code not sent (email not in Supabase Users, or Email provider is off)"); return json({ ok: true }); }
    console.error("[auth] could not send code, status", r.status);
    return json({ error: "Could not send the code. Check the email settings in Supabase." }, 502);
  }
  return json({ ok: true });
}