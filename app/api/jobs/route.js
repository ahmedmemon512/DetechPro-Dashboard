import { json } from "@/lib/guard";
import { sb, dbError } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await sb("jobs?select=id,query,location,max_results,status,auto_call,run_at,lead_count,call_count,created_at&order=created_at.desc&limit=15");
    if (!r.ok) throw new Error(`supabase_${r.status}`);
    return json({ jobs: r.data || [] });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
