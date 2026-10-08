import { json, sameOrigin, cookieOpts } from "@/lib/guard";
import { COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!sameOrigin(request)) return json({ error: "Forbidden" }, 403);
  const res = json({ ok: true });
  res.cookies.set(COOKIE, "", cookieOpts(request, 0));
  return res;
}