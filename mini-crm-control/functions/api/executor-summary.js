import { json } from "../_lib/supabase.js";

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    hasSessionsBinding: !!env.SESSIONS,
    sessionsType: typeof env.SESSIONS
  });
}
