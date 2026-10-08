import { json, sameOrigin } from "@/lib/guard";
import { sb, dbError } from "@/lib/supabase";
import { isUuid } from "@/lib/jobs";

export const dynamic = "force-dynamic";

// Cancel a scheduled job (or dismiss one that is stuck scraping).
export async function POST(request, { params }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const id = params?.id;
  if (!isUuid(id)) return json({ error: "Bad job id." }, 400);
  try {
    const r = await sb(`jobs?id=eq.${id}&status=in.(scheduled,scraping)`, { method: "PATCH", body: { status: "cancelled", updated_at: new Date().toISOString() }, prefer: "return=representation" });
    if (!r.ok) throw new Error(`supabase_${r.status}`);
    if (!Array.isArray(r.data) || r.data.length === 0) return json({ error: "This job can no longer be cancelled." }, 409);
    return json({ ok: true });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
