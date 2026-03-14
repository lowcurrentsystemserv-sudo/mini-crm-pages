import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  const executor = session.session.name;

  const planRes = await sbFetch(
    env,
    `visit_plan?select=id,plan_date,object_id,object_name,executor,status,done_date,dispatcher_text,work_type&executor=eq.${encodeURIComponent(executor)}&or=(status.neq.Выполнено,status.is.null)&order=plan_date.asc`
  );

  if (!planRes.ok) {
    return json({
      ok: false,
      step: "planRes",
      error: planRes.data
    }, 500);
  }

  const planRows = planRes.data || [];
  const objectIds = [...new Set(planRows.map(r => r.object_id).filter(Boolean))];

  let objectsMap = {};

  if (objectIds.length > 0) {
    const idsFilter = objectIds.join(",");
    const objRes = await sbFetch(
      env,
      `objects?select=id,city,address,group_name,system&id=in.(${idsFilter})`
    );

    if (!objRes.ok) {
      return json({
        ok: false,
        step: "objRes",
        error: objRes.data
      }, 500);
    }

    objectsMap = Object.fromEntries((objRes.data || []).map(o => [o.id, o]));
  }

  const rows = planRows.map(r => {
    const extra = objectsMap[r.object_id] || {};

    return {
      date: r.plan_date || "",
      objectId: r.object_id || "",
      object: r.object_name || "",
      executor: r.executor || "",
      status: r.status || "",
      doneDate: r.done_date || "",
      description: r.dispatcher_text || "",
      workType: r.work_type || "",
      city: extra.city || "",
      address: extra.address || "",
      group: extra.group_name || "",
      system: extra.system || ""
    };
  });

  return json({ ok: true, rows });
}
