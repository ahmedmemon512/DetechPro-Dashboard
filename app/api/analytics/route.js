import { json, clampInt } from "@/lib/guard";
import { fetchRows, dbError } from "@/lib/supabase";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

const COLS = "call_id,restaurant_name,phone,call_outcome,products_interested,in_voicemail,duration_seconds,started_at,direction";

export async function GET(request) {
  const sp = new URL(request.url).searchParams;
  const days = clampInt(sp.get("days"), 1, 365, 30);
  const dir = ["inbound", "outbound"].includes(sp.get("direction")) ? sp.get("direction") : null;
  const since = new Date(Date.now() - days * 86400000);
  const since2 = new Date(Date.now() - days * 2 * 86400000);
  try {
    const rows = await fetchRows(
      `select=${COLS}&started_at=gte.${encodeURIComponent(since2.toISOString())}&order=started_at.desc`,
      10000
    );
    return json(computeStats(rows, since, days, dir));
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
