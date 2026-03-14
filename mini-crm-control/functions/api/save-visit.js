import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const objectId = Number(body.objectId);
  const objectName = String(body.objectName || "").trim();
  const comment = String(body.comment || "").trim();
  const executor = session.session.name;
  const today = new Date().toISOString().slice(0, 10);

  if (!objectId) {
    return json({ ok: false, error: "objectId is required" }, 400);
  }

  // 1) пишем лог выполнения
  const insertLogRes = await sbFetch(env, "visits_log", {
    method: "POST",
    headers: {
      Prefer: "return=representation"
    },
    body: JSON.stringify([
      {
        created_date: today,
        object_id: objectId,
        object_name: objectName || null,
        executor: executor,
        executor_comment: comment || null
      }
    ])
  });

  if (!insertLogRes.ok) {
    return json({
      ok: false,
      step: "insertLogRes",
      error: insertLogRes.data
    }, 500);
  }

  // 2) находим открытую запись плана по этому объекту и исполнителю
  const findPlanRes = await sbFetch(
    env,
    `visit_plan?select=id,plan_date,status,object_id,executor&object_id=eq.${objectId}&executor=eq.${encodeURIComponent(executor)}&or=(status.neq.Выполнено,status.is.null)&order=plan_date.asc&limit=1`
  );

  if (!findPlanRes.ok) {
    return json({
      ok: false,
      step: "findPlanRes",
      error: findPlanRes.data
    }, 500);
  }

  const planRow = (findPlanRes.data || [])[0];

  // Если план не найден, лог уже записан — это не фатально
  if (!planRow) {
    return json({
      ok: true,
      warning: "Visit saved to log, but no active plan row found",
      log: insertLogRes.data?.[0] || null
    });
  }

  // 3) обновляем план
  const updatePlanRes = await sbFetch(
    env,
    `visit_plan?id=eq.${planRow.id}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        status: "Выполнено",
        done_date: today
      })
    }
  );

  if (!updatePlanRes.ok) {
    return json({
      ok: false,
      step: "updatePlanRes",
      error: updatePlanRes.data,
      log: insertLogRes.data?.[0] || null
    }, 500);
  }

  return json({
    ok: true,
    log: insertLogRes.data?.[0] || null,
    plan: updatePlanRes.data?.[0] || null
  });
}
