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

  const requestId = Number(body.requestId);
  const patch = body.patch || {};

  if (!requestId) {
    return json({ ok: false, step: "validate", error: "requestId is required" }, 400);
  }

  const dbPatch = {};
  if ("description" in patch) dbPatch.request_text = String(patch.description || "").trim() || null;
  if ("urgency" in patch) dbPatch.urgency = String(patch.urgency || "").trim() || null;
  if ("status" in patch) dbPatch.status = String(patch.status || "").trim() || null;
  if ("acceptedBy" in patch) dbPatch.accepted_by = String(patch.acceptedBy || "").trim() || null;
  if ("executor" in patch) dbPatch.executor = String(patch.executor || "").trim() || null;

  const res = await sbFetch(env, `requests?id=eq.${requestId}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(dbPatch)
  });

  if (!res.ok) {
    return json({ ok: false, step: "requestsUpdate", error: res.data }, 500);
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
