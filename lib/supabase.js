const PAGE = 1000; // Supabase returns at most 1000 rows per request, so we page with Range headers.

function config() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) return null;
  return { base: base.replace(/\/$/, ""), key };
}

const authHeaders = (key) => ({ apikey: key, ...(key.startsWith("sb_") ? {} : { Authorization: `Bearer ${key}` }) });

export async function fetchRows(query, maxRows = PAGE, table = "calls") {
  const c = config();
  if (!c) throw new Error("not_configured");
  const rows = [];
  for (let from = 0; from < maxRows; from += PAGE) {
    const to = Math.min(from + PAGE, maxRows) - 1;
    const res = await fetch(`${c.base}/rest/v1/${table}?${query}`, {
      headers: { ...authHeaders(c.key), Range: `${from}-${to}`, "Range-Unit": "items" },
      cache: "no-store",
    });
    if (res.status === 416) break;
    if (!res.ok) throw new Error(`supabase_${res.status}`);
    const part = await res.json();
    rows.push(...part);
    if (part.length < to - from + 1) break;
  }
  return rows;
}

export function dbError(e) {
  if (e?.message === "not_configured") {
    return { status: 500, error: "Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local." };
  }
  console.error("[supabase]", e?.message);
  return { status: 502, error: "Could not load data from Supabase. Check the URL, key and that the calls table exists." };
}

// Generic REST call (insert / update / read). Returns { ok, status, data }.
export async function sb(path, { method = "GET", body, prefer } = {}) {
  const c = config();
  if (!c) throw new Error("not_configured");
  const res = await fetch(`${c.base}/rest/v1/${path}`, {
    method,
    headers: { ...authHeaders(c.key), "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}
