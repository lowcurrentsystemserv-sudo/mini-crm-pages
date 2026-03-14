import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

function escLike(s = "") {
  return String(s).replace(/[%_,]/g, "");
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);

  if (!q) {
    return json({ ok: true, items: [] });
  }

  const needle = escLike(q);

  const res = await sbFetch(
    env,
    `objects?select=id,name,system,city,address,category,group_name,status` +
      `&or=(name.ilike.*${encodeURIComponent(needle)}*,city.ilike.*${encodeURIComponent(needle)}*,address.ilike.*${encodeURIComponent(needle)}*,system.ilike.*${encodeURIComponent(needle)}*,category.ilike.*${encodeURIComponent(needle)}*,group_name.ilike.*${encodeURIComponent(needle)}*)` +
      `&order=name.asc&limit=${limit}`
  );

  if (!res.ok) {
    return json({
      ok: false,
      step: "objectsSearch",
      error: res.data
    }, 500);
  }

  const items = (res.data || []).map(o => ({
    objectId: String(o.id ?? ""),
    name: o.name ?? "",
    system: o.system ?? "",
    city: o.city ?? "",
    address: o.address ?? "",
    category: o.category ?? "",
    group: o.group_name ?? "",
    active: o.status !== "Архив" && o.status !== "Нет",
    description: ""
  }));

  return json({ ok: true, items });
}
