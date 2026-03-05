export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const login = String(body.login || "");
    const password = String(body.password || "");

    const r = await fetch(env.GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: new URLSearchParams({
        action: "login",
        login,
        password,
      }),
    });

    const text = await r.text();

    // Попробуем распарсить как JSON, но если не JSON — вернём сырой ответ
    let data = null;
    try { data = JSON.parse(text); } catch {}

    if (!data) {
      return new Response(JSON.stringify({
        ok: false,
        error: "GAS returned non-JSON",
        status: r.status,
        contentType: r.headers.get("content-type"),
        raw: text.slice(0, 500)
      }), { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" }});
    }

    if (!data.ok) {
      return new Response(JSON.stringify(data), { status: 401, headers: { "Content-Type":"application/json; charset=utf-8" }});
    }

    // ВРЕМЕННАЯ cookie-сессия (потом подпишем)
    const session = {
      name: data.name,
      role: data.role,
      exp: Date.now() + 12 * 60 * 60 * 1000,
    };

    const cookie = `sid=${btoa(JSON.stringify(session))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 12}`;

    return new Response(JSON.stringify({ ok:true, name:data.name, role:data.role }), {
      headers: {
        "Content-Type":"application/json; charset=utf-8",
        "Set-Cookie": cookie
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      ok: false,
      error: String(err),
      where: "pages function /api/login"
    }), { status: 500, headers: { "Content-Type":"application/json; charset=utf-8" }});
  }
}
