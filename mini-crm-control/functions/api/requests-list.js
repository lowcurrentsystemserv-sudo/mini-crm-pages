import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

function q(v) {
  return encodeURIComponent(String(v ?? "").trim());
}

export async function onRequestGet({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  const url = new URL(request.url);
  const status = (url.searchParams.get("status") || "").trim();
  const executor = (url.searchParams.get("executor") || "").trim();
  const qText = (url.searchParams.get("q") || "").trim();

  let path =
    `requests?select=id,created_date,object_id,object_name,request_text,urgency,status,accepted_by,executor` +
    `&order=created_date.desc`;

  if (status) path += `&status=eq.${q(status)}`;
  if (executor) path += `&executor=ilike.*${q(executor)}*`;

  if (qText) {
    path += `&or=(` +
      `object_name.ilike.*${q(qText)}*,` +
      `request_text.ilike.*${q(qText)}*,` +
      `executor.ilike.*${q(qText)}*,` +
      `accepted_by.ilike.*${q(qText)}*` +
      `)`;
  }

  const res = await sbFetch(env, path);

  if (!res.ok) {
    return json({ ok: false, step: "requestsList", error: res.data }, 500);
  }

  const rows = (res.data || []).map(r => ({
    requestId: String(r.id),
    createdAt: r.created_date || "",
    objectId: String(r.object_id ?? ""),
    objectName: r.object_name || "",
    description: r.request_text || "",
    urgency: r.urgency || "",
    status: r.status || "",
    acceptedBy: r.accepted_by || "",
    executor: r.executor || ""
  }));

  return json({ ok: true, rows });
}
