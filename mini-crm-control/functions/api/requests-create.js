import { json, sbFetch } from "../_lib/supabase.js";
import { requireSession } from "../_lib/session.js";

export async function onRequestPost({ request, env }) {
  const session = await requireSession(request);
  if (!session.ok) return session.resp;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, step: "parseBody", error: "Invalid JSON body" }, 400);
  }

  const objectId = Number(body.objectId);
  const objectName = String(body.objectName || "").trim();
  const description = String(body.description || "").trim();
  const urgency = String(body.urgency || "Средняя").trim();
  const status = String(body.status || "Новая").trim();
  const acceptedBy = String(body.acceptedBy || session.session.name || "").trim();
  const executor = String(body.executor || "").trim();
  const today = new Date().toISOString().slice(0, 10);

  if (!objectId) {
    return json({ ok: false, step: "validate", error: "objectId is required" }, 400);
  }

  const res = await sbFetch(env, "requests", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify([{
      created_date: today,
      object_id: objectId,
      object_name: objectName || null,
      request_text: description || null,
      urgency,
      status,
      accepted_by: acceptedBy || null,
      executor: executor || null
    }])
  });

  if (!res.ok) {
    return json({ ok: false, step: "requestsCreate", error: res.data }, 500);
  }

  const row = res.data?.[0];
  return json({
    ok: true,
    row: row ? {
      requestId: String(row.id),
      createdAt: row.created_date || "",
      objectId: String(row.object_id ?? ""),
      objectName: row.object_name || "",
      description: row.request_text || "",
      urgency: row.urgency || "",
      status: row.status || "",
      acceptedBy: row.accepted_by || "",
      executor: row.executor || ""
    } : null
  });
}
