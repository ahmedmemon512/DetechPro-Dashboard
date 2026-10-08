import { json } from "@/lib/guard";
import { fetchRows, dbError } from "@/lib/supabase";
import { outcomeOf } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const id = String(params.id || "");
  if (!/^[A-Za-z0-9_-]{6,80}$/.test(id)) return json({ error: "Invalid call id." }, 400);
  try {
    const rows = await fetchRows(`select=*&call_id=eq.${encodeURIComponent(id)}&limit=1`, 1);
    if (!rows.length) return json({ error: "Call not found." }, 404);
    const r = rows[0];
    return json({ call: { ...r, call_outcome: outcomeOf(r), transcript: String(r.transcript || "").slice(0, 20000) } });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
