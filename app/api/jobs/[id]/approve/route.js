import { json, sameOrigin } from "@/lib/guard";
import { postToN8n } from "@/lib/n8n";
import { sb, fetchRows, dbError } from "@/lib/supabase";
import { cleanCallLeads } from "@/lib/leads";
import { isUuid, callSettings, MAX_APPROVE_LEADS } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// Approve = place AI calls to every lead of this job that has a phone number.
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const id = params?.id;
  if (!isUuid(id)) return json({ error: "Bad job id." }, 400);
  const url = process.env.N8N_CALLS_WEBHOOK_URL;
  if (!url) return json({ error: "N8N_CALLS_WEBHOOK_URL is not set in .env.local." }, 500);

  const now = () => new Date().toISOString();
  const patch = (body) => sb(`jobs?id=eq.${id}`, { method: "PATCH", body: { ...body, updated_at: now() } });

  try {
    // Claim the job (ready -> calling) so a double click can never start the calls twice.
    const claim = await sb(`jobs?id=eq.${id}&status=eq.ready`, { method: "PATCH", body: { status: "calling", updated_at: now() }, prefer: "return=representation" });
    if (!claim.ok) throw new Error(`supabase_${claim.status}`);
    if (!Array.isArray(claim.data) || claim.data.length === 0) return json({ error: "This job is not waiting for approval (already approved, cancelled or still scraping)." }, 409);

    const rows = await fetchRows(`select=name,phone&job_id=eq.${id}&phone=neq.&order=id.asc`, MAX_APPROVE_LEADS, "leads");
    const { leads } = cleanCallLeads(rows);
    if (leads.length === 0) {
      await patch({ status: "ready" });
      return json({ error: "None of the leads has a valid phone number." }, 400);
    }

    const settings = callSettings();
    const r = await postToN8n(url, { leads, settings });
    if (!r.ok) {
      await patch({ status: "ready" });
      return json({ error: r.status ? `The n8n webhook responded with status ${r.status}.` : "Could not reach the n8n webhook." }, 502);
    }
    await patch({ status: "called", call_count: leads.length, approved_at: now() });
    return json({ ok: true, accepted: leads.length, estimatedMinutes: Math.ceil((leads.length * (settings.callDelaySeconds + 5)) / 60) });
  } catch (e) {
    await patch({ status: "ready" }).catch(() => {});
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
