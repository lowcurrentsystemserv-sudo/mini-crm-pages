import { json, callGas } from "./_lib.js";
import { requireSession } from "./_session.js";

export async function onRequestPost(context) {
  const { request, env } = context;

  const s = await requireSession(request, env);
  if (!s.ok) return json({ ok: false, error: s.error }, 401);

  const body = await request.json();
  const objectId = String(body.objectId || "").trim();

  const gasRes = await callGas(env, {
    action: "suggest_work_type",
    objectId
  });

  return json(gasRes, gasRes.ok ? 200 : 500);
}
