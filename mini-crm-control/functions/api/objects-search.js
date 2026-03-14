import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

function escLike(s = "") {
  return String(s).replace(/[%_,]/g, "");
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  const executor = session.session.name;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);

  if (!q) {
    return json({ ok: true, items: [] });
  }

  const needle = escLike(q);

  // 1) берем только план текущего исполнителя со статусом "Запланирован"
  const planRes = await sbFetch(
    env,
    `visit_plan?select=object_id,object_name,dispatcher_text,work_type` +
      `&executor=eq.${encodeURIComponent(executor)}` +
      `&status=eq.${encodeURIComponent("Запланирован")}` +
      `&limit=500`
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

  if (objectIds.length === 0) {
    return json({ ok: true, items: [] });
  }

  const idsFilter = objectIds.join(",");

  // 2) ищем только среди этих объектов
  const objRes = await sbFetch(
    env,
    `objects?select=id,name,system,city,address,category,group_name,status` +
      `&id=in.(${idsFilter})` +
      `&or=(` +
      `name.ilike.*${encodeURIComponent(needle)}*,` +
      `city.ilike.*${encodeURIComponent(needle)}*,` +
      `address.ilike.*${encodeURIComponent(needle)}*,` +
      `system.ilike.*${encodeURIComponent(needle)}*,` +
      `category.ilike.*${encodeURIComponent(needle)}*,` +
      `group_name.ilike.*${encodeURIComponent(needle)}*` +
      `)` +
      `&order=name.asc&limit=${limit}`
  );

  if (!objRes.ok) {
    return json({
      ok: false,
      step: "objRes",
      error: objRes.data
    }, 500);
  }

  const planMap = Object.fromEntries(
    planRows.map(r => [
      String(r.object_id),
      {
        description: r.dispatcher_text || "",
        workType: r.work_type || ""
      }
    ])
  );

  const items = (objRes.data || []).map(o => {
    const extra = planMap[String(o.id)] || {};
    return {
      objectId: String(o.id ?? ""),
      name: o.name ?? "",
      system: o.system ?? "",
      city: o.city ?? "",
      address: o.address ?? "",
      category: o.category ?? "",
      group: o.group_name ?? "",
      active: true,
      description: extra.description || "",
      workType: extra.workType || ""
    };
  });

  return json({ ok: true, items });
}
