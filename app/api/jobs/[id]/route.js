import { json } from "@/lib/guard";
import { sb, fetchRows, dbError } from "@/lib/supabase";
import { isUuid } from "@/lib/jobs";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const id = params?.id;
  if (!isUuid(id)) return json({ error: "Bad job id." }, 400);
  try {
    const j = await sb(`jobs?id=eq.${id}&select=*`);
    const job = j.ok && Array.isArray(j.data) ? j.data[0] : null;
    if (!job) return json({ error: "Job not found." }, 404);
    const leads = await fetchRows(`select=id,name,category,city,website,email,phone&job_id=eq.${id}&order=id.asc`, 5000, "leads");
    return json({ job, leads });
  } catch (e) {
    const { status, error } = dbError(e);
    return json({ error }, status);
  }
}
