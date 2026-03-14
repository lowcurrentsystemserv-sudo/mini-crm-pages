export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function decodeBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);

  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function requireSession(request) {
  try {
    const cookie = request.headers.get("Cookie") || "";
    const match = cookie.match(/sid=([^;]+)/);

    if (!match) {
      return {
        ok: false,
        resp: json({ ok: false, error: "Not authenticated" }, 401),
      };
    }

    let session;
    try {
      session = JSON.parse(decodeBase64Url(match[1]));
    } catch {
      return {
        ok: false,
        resp: json({ ok: false, error: "Invalid session" }, 401),
      };
    }

    if (!session || session.exp < Date.now()) {
      return {
        ok: false,
        resp: json({ ok: false, error: "Session expired" }, 401),
      };
    }

    return { ok: true, session };
  } catch (err) {
    return {
      ok: false,
      resp: json(
        {
          ok: false,
          error: "Session check failed",
          details: String(err),
        },
        500
      ),
    };
  }
}
