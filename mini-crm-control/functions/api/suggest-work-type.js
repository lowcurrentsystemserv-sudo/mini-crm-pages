import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body", step: "parseBody" }, 400);
  }

  const objectId = Number(body.objectId);
  if (!objectId) {
    return json({ ok: false, error: "objectId is required", step: "validateBody" }, 400);
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const res = await sbFetch(
    env,
    `visits_log?select=created_date&object_id=eq.${objectId}&order=created_date.desc&limit=200`
  );

  if (!res.ok) {
    return json({ ok: false, error: res.data, step: "visitsLogRes" }, 500);
  }

  const rows = res.data || [];

  let hasThisYear = false;
  let hasThisMonth = false;

  for (const row of rows) {
    if (!row.created_date) continue;

    const d = new Date(row.created_date);
    if (Number.isNaN(d.getTime())) continue;

    const y = d.getFullYear();
    const m = d.getMonth() + 1;

    if (y === currentYear) {
      hasThisYear = true;
      if (m === currentMonth) {
        hasThisMonth = true;
        break;
      }
    }
  }

  let type = "Первичное";
  if (hasThisYear && !hasThisMonth) type = "Плановое";
  if (hasThisMonth) type = "Заявка";

  return json({ ok: true, type });
}
