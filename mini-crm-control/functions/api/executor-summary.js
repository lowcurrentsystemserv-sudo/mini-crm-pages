import { json } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session.ok) return session.resp;

  return json({
    ok: true,
    step: "session ok",
    user: session.session.name
  });
}
