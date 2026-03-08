function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

async function callGas(env, formObj) {
  const body = new URLSearchParams(formObj);

  const r = await fetch(env.GAS_URL, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    }
  });

  const text = await r.text();

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "GAS returned non-JSON",
      raw: text.slice(0, 300)
    };
  }
}

function decodeBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);

  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function requireSession(request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/sid=([^;]+)/);

  if (!match) return { ok: false, error: "No session" };

  try {
    const session = JSON.parse(decodeBase64Url(match[1]));

    if (session.exp < Date.now()) {
      return { ok: false, error: "Session expired" };
    }

    return { ok: true, session };
  } catch (e) {
    return { ok: false, error: "Invalid session" };
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  const s = await requireSession(request);
  if (!s.ok) return json({ ok: false, error: s.error }, 401);

  const gasRes = await callGas(env, {
    action: "executor_summary",
    userName: s.session.name
  });

  return json(gasRes, gasRes.ok ? 200 : 500);
}
