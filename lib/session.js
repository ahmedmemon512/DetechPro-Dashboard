// Signed session cookie (HMAC-SHA256, Web Crypto) - works in middleware (edge) and in route handlers.
export const COOKIE = "dp_session";
export const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64u(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64u(str) {
  const p = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (str.length % 4)) % 4);
  return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
}

export const secretOk = () => (process.env.SESSION_SECRET || "").length >= 32;

async function hmacKey() {
  if (!secretOk()) return null;
  return crypto.subtle.importKey("raw", enc.encode(process.env.SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(email) {
  const key = await hmacKey();
  if (!key) throw new Error("no_secret");
  const payload = toB64u(enc.encode(JSON.stringify({ e: email, exp: Math.floor(Date.now() / 1000) + MAX_AGE })));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
  return `${payload}.${toB64u(sig)}`;
}

// Returns the email if the cookie is valid and not expired, otherwise null.
export async function readSession(token) {
  try {
    if (!token) return null;
    const key = await hmacKey();
    if (!key) return null;
    const [payload, sig] = token.split(".");
    if (!payload || !sig) return null;
    const ok = await crypto.subtle.verify("HMAC", key, fromB64u(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(dec.decode(fromB64u(payload)));
    if (!data.e || data.exp < Date.now() / 1000) return null;
    return data.e;
  } catch {
    return null;
  }
}