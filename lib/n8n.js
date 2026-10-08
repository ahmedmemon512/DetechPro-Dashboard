export async function postToN8n(url, payload) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const headers = { "Content-Type": "application/json" };
    if (process.env.N8N_WEBHOOK_SECRET) headers["x-webhook-secret"] = process.env.N8N_WEBHOOK_SECRET;
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload), cache: "no-store", signal: ctrl.signal });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(timer);
  }
}
