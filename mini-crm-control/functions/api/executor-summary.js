import { json, callGas } from "./_lib.js";
import { requireSession } from "./_session.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const s = await requireSession(request, env);
  if (!s.ok) return json({ ok: false, error: s.error }, 401);

  const gasRes = await callGas(env, {
    action: "executor_summary",
    userName: s.session.name
  });

  return json(gasRes, gasRes.ok ? 200 : 500);
}
