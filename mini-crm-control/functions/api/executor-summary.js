import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session.ok) return session.resp;

  return json({
    ok: true,
    debug: {
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasServiceRoleKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
      executor: session.session.name
    }
  });
}
