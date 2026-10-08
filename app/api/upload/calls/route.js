import { json, sameOrigin, readJson } from "@/lib/guard";
import { postToN8n } from "@/lib/n8n";
import { cleanCallLeads, MAX_CALL_LEADS } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);

  const url = process.env.N8N_CALLS_WEBHOOK_URL;
  if (!url) return json({ error: "N8N_CALLS_WEBHOOK_URL is not set in .env.local." }, 500);

  let body;
  try { body = await readJson(request, 500_000); } catch { return json({ error: "Invalid or too large request." }, 400); }

  const { leads, invalid, duplicates } = cleanCallLeads(body?.leads);
  if (leads.length === 0) return json({ error: "No valid leads found. Each row needs a restaurant_name and a valid phone." }, 400);
  if (leads.length > MAX_CALL_LEADS) return json({ error: `Too many leads. Maximum ${MAX_CALL_LEADS} per upload.` }, 400);

  const delay = Math.min(Math.max(Number(process.env.CALL_DELAY_SECONDS) || 15, 5), 600);
  const r = await postToN8n(url, {
    leads,
    settings: { callDelaySeconds: delay },
  });
  if (!r.ok) return json({ error: r.status ? `The n8n webhook responded with status ${r.status}.` : "Could not reach the n8n webhook." }, 502);

  return json({ ok: true, accepted: leads.length, skipped: invalid + duplicates, estimatedMinutes: Math.ceil((leads.length * (delay + 5)) / 60) });
}