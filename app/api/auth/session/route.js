import { json } from "@/lib/guard";
import { COOKIE, readSession } from "@/lib/session";

export const dynamic = "force-dynamic";

// Lets the login page confirm the browser actually kept the session cookie before it navigates.
export async function GET(request) {
  const email = await readSession(request.cookies.get(COOKIE)?.value);
  return json({ signedIn: Boolean(email) });
}
