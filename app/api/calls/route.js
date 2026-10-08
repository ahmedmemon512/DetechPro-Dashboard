import { json, clampInt } from "@/lib/guard";
import { fetchRows, dbError } from "@/lib/supabase";
import { outcomeOf, directionOf } from "@/lib/stats";

export const dynamic = "force-dynamic";

// List view: everything except the (large) transcript, which is loaded on demand.
const COLS =
  "call_id,restaurant_name,phone,call_outcome,contact_name,products_interested,email,note,call_summary,in_voicemail,recording_url,duration_seconds,disconnection_reason,started_at,direction";

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const days = clampInt(sp.get("days"), 1, 365, 30);
  const dir = ["inbound", "outbound"].includes(sp.get("direction")) ? sp.get("direction") : null;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  try {
    const rows = await fetchRows(`select=${COLS}&started_at=gte.${encodeURIComponent(since)}&order=started_at.desc`, 1000);
    const list = dir ? rows.filter((r) => directionOf(r) === dir) : rows;
    return json({ calls: list.map((r) => ({ ...r, direction: directionOf(r), call_outcome: outcomeOf(r) })) });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
