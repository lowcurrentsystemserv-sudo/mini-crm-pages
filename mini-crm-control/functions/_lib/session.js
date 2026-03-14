export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function requireSession(request, env) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const sid = getCookie(cookie, "sid");

    if (!sid) {
      return { ok: false, resp: json({ ok: false, error: "Not authenticated" }, 401) };
    }

    if (!env || !env.SESSIONS || typeof env.SESSIONS.get !== "function") {
      return { ok: false, resp: json({ ok: false, error: "SESSIONS binding is missing" }, 500) };
    }

    const raw = await env.SESSIONS.get(sid);

    if (!raw) {
      return { ok: false, resp: json({ ok: false, error: "Session expired" }, 401) };
    }

    let session;
    try {
      session = JSON.parse(raw);
    } catch {
      return { ok: false, resp: json({ ok: false, error: "Invalid session data" }, 500) };
    }

    return { ok: true, session };
  } catch (err) {
    return {
      ok: false,
      resp: json(
        {
          ok: false,
          error: "Session check failed",
          details: String(err)
        },
        500
      )
    };
  }
}

function getCookie(cookie, name) {
  const parts = cookie.split(";").map((s) => s.trim());
  for (const p of parts) {
    if (p.startsWith(name + "=")) return p.slice((name + "=").length);
  }
  return "";
}
