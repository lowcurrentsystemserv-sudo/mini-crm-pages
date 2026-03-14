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

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request, env);
  if (!session.ok) return session.resp;

  const executor = session.session.name;
  const today = new Date().toISOString().slice(0, 10);

  const activeRes = await sbFetch(
    env,
    `visit_plan?select=id,work_type,status&executor=eq.${encodeURIComponent(executor)}&status=neq.Выполнено`
  );

  if (!activeRes.ok) {
    return json({ ok: false, error: activeRes.data }, 500);
  }

  const doneRes = await sbFetch(
    env,
    `visits_log?select=id&executor=eq.${encodeURIComponent(executor)}&created_date=eq.${today}`
  );

  if (!doneRes.ok) {
    return json({ ok: false, error: doneRes.data }, 500);
  }

  const rows = activeRes.data || [];

  const summary = {
    totalActive: rows.length,
    plannedCount: rows.filter(r => r.work_type === "Плановое").length,
    requestCount: rows.filter(r => r.work_type === "Заявка").length,
    primaryCount: rows.filter(r => r.work_type === "Первичное").length,
    doneToday: (doneRes.data || []).length,
  };

  return json({ ok: true, summary });
}
