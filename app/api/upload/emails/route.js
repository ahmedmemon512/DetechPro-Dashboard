import { json, sameOrigin, readJson } from "@/lib/guard";
import { postToN8n } from "@/lib/n8n";
import { cleanEmailLeads, renderTemplate, MAX_EMAIL_LEADS } from "@/lib/leads";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);

  const url = process.env.N8N_EMAILS_WEBHOOK_URL;
  if (!url) return json({ error: "N8N_EMAILS_WEBHOOK_URL is not set in .env.local." }, 500);

  let body;
  try { body = await readJson(request, 1_000_000); } catch { return json({ error: "Invalid or too large request." }, 400); }

  const subjectTpl = String(body?.subject ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, 200);
  const bodyTpl = String(body?.body ?? "").replace(/\r\n/g, "\n").trim().slice(0, 5000);
  if (!subjectTpl || !bodyTpl) return json({ error: "Write a subject and an email body first." }, 400);

  const { leads, invalid, duplicates } = cleanEmailLeads(body?.leads);
  if (leads.length === 0) return json({ error: "No valid email addresses found in the file." }, 400);
  if (leads.length > MAX_EMAIL_LEADS) return json({ error: `Too many leads. Maximum ${MAX_EMAIL_LEADS} per upload.` }, 400);

  const delay = Math.min(Math.max(Number(process.env.EMAIL_DELAY_SECONDS) || 10, 2), 600);
  const r = await postToN8n(url, {
    leads: leads.map((l) => ({
      name: l.name,
      email: l.email,
      subject: renderTemplate(subjectTpl, l).replace(/[\r\n]+/g, " "),
      body: renderTemplate(bodyTpl, l),
    })),
    settings: { emailDelaySeconds: delay },
  });
  if (!r.ok) return json({ error: r.status ? `The n8n webhook responded with status ${r.status}.` : "Could not reach the n8n webhook." }, 502);

  return json({ ok: true, accepted: leads.length, skipped: invalid + duplicates, estimatedMinutes: Math.ceil((leads.length * (delay + 2)) / 60) });
}
