import { json } from "../_lib/supabase.js";

export async function onRequestGet() {
  return json({ ok: true, step: "import supabase helper ok" });
}
