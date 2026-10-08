// Email-OTP login helpers. Allowed users = Supabase > Authentication > Users.
export const normEmail = (v) => String(v ?? "").trim().toLowerCase().slice(0, 254);
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

// Small in-memory rate limiter (per server instance). Supabase also has its own limits.
const hits = new Map();
export function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return false;
}
export const clientIp = (req) => (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";

function cfg() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!base || !key) return null;
  return { base: base.replace(/\/$/, ""), key };
}
const headers = (key) => ({ apikey: key, "Content-Type": "application/json", ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) });

// create_user:false => code sirf unhi emails ko jata hai jo Supabase Users mein pehle se hain.
export async function sendOtp(email) {
  const c = cfg();
  if (!c) return { ok: false, status: 500, code: "not_configured" };
  try {
    const res = await fetch(`${c.base}/auth/v1/otp`, { method: "POST", headers: headers(c.key), body: JSON.stringify({ email, create_user: false }), cache: "no-store" });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function verifyOtp(email, token) {
  const c = cfg();
  if (!c) return { ok: false, status: 500, code: "not_configured" };
  try {
    const res = await fetch(`${c.base}/auth/v1/verify`, { method: "POST", headers: headers(c.key), body: JSON.stringify({ email, token, type: "email" }), cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, email: normEmail(data?.user?.email) };
  } catch {
    return { ok: false, status: 0 };
  }
}