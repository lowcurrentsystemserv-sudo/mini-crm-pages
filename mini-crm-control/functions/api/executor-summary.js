import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  const executor = session.session.name;
  const today = new Date().toISOString().slice(0, 10);

  const activeRes = await sbFetch(
    env,
    `visit_plan?select=id,executor,status,work_type,plan_date,object_name&limit=10`
  );

  const doneRes = await sbFetch(
    env,
    `visits_log?select=id,executor,created_date,object_name&limit=10`
  );

  return json({
    ok: true,
    debug: {
      executorFromSession: executor,
      today,
      visitPlanSample: activeRes.data,
      visitsLogSample: doneRes.data
    }
  });
}
