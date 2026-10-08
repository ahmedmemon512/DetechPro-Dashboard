import { json, sameOrigin, readJson } from "@/lib/guard";
import { postToN8n } from "@/lib/n8n";
import { sb, dbError } from "@/lib/supabase";
import { zonedToUtc } from "@/lib/time";
import { SCHEDULE_TZ } from "@/lib/constants";

export const dynamic = "force-dynamic";

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

// Body: { query, location, maxResults, schedule?: { date: "YYYY-MM-DD", time: "HH:MM" } }  (schedule = Houston time)
export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return json({ error: "N8N_WEBHOOK_URL is not set in .env.local." }, 500);

  let body;
  try { body = await readJson(request, 10_000); } catch { return json({ error: "Invalid request body." }, 400); }

  const query = clean(body?.query, 120);
  const location = clean(body?.location, 120);
  const maxResults = Math.floor(Number(body?.maxResults));
  if (!query || !location || !Number.isFinite(maxResults) || maxResults < 1 || maxResults > 5000) {
    return json({ error: "Enter a query, a location and max results between 1 and 5000." }, 400);
  }

  // Optional schedule (typed in Houston time).
  let runAt = null;
  if (body?.schedule) {
    runAt = zonedToUtc(String(body.schedule.date || ""), String(body.schedule.time || ""), SCHEDULE_TZ);
    if (!runAt) return json({ error: "Pick a valid date and time for the schedule." }, 400);
    const diff = runAt.getTime() - Date.now();
    if (diff < 60_000) return json({ error: "The scheduled time must be at least a minute in the future (Houston time)." }, 400);
    if (diff > 366 * 86400000) return json({ error: "The scheduled time must be within the next year." }, 400);
  }

  try {
    const row = { query, location, max_results: maxResults, status: runAt ? "scheduled" : "scraping", auto_call: Boolean(runAt), run_at: runAt ? runAt.toISOString() : null };
    const made = await sb("jobs", { method: "POST", body: row, prefer: "return=representation" });
    const job = made.ok && Array.isArray(made.data) ? made.data[0] : null;
    if (!job?.id) return json({ error: "Could not save the job. Did you run the new SQL (jobs and leads tables) in Supabase?" }, 502);

    // Scheduled: hand the job to n8n, which sleeps until the exact time (one execution, no polling).
    if (runAt) {
      const sUrl = process.env.N8N_SCHEDULE_WEBHOOK_URL;
      const fail = async (msg) => {
        await sb(`jobs?id=eq.${job.id}`, { method: "PATCH", body: { status: "failed", error: msg, updated_at: new Date().toISOString() } });
      };
      if (!sUrl) { await fail("N8N_SCHEDULE_WEBHOOK_URL missing"); return json({ error: "N8N_SCHEDULE_WEBHOOK_URL is not set in .env.local." }, 500); }
      const sr = await postToN8n(sUrl, { jobId: job.id, query, location, maxResults, runAt: runAt.toISOString() });
      if (!sr.ok) { await fail("schedule webhook not reachable"); return json({ error: sr.status ? `The schedule webhook responded with status ${sr.status}.` : "Could not reach the n8n schedule webhook." }, 502); }
      return json({ ok: true, scheduled: true, jobId: job.id, runAt: job.run_at });
    }

    const r = await postToN8n(url, { jobId: job.id, query, location, maxResults, autoCall: false });
    if (!r.ok) {
      await sb(`jobs?id=eq.${job.id}`, { method: "PATCH", body: { status: "failed", error: "n8n webhook not reachable", updated_at: new Date().toISOString() } });
      return json({ error: r.status ? `The webhook responded with status ${r.status}.` : "Could not reach the n8n webhook." }, 502);
    }
    return json({ ok: true, scheduled: false, jobId: job.id });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}