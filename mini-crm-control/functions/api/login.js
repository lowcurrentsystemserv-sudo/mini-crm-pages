export async function onRequestPost({ request, env }) {
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

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return new Response(JSON.stringify({
      ok: false,
      error: "GAS returned non-JSON",
      raw: text.slice(0, 300),
    }), { status: 500, headers: { "Content-Type": "application/json" }});
  }

  // Если GAS вернул ok:false — отдадим это пользователю как есть
  if (!data.ok) {
    return new Response(JSON.stringify(data), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // временная простая cookie (позже сделаем подписанную, как планировали)
  const session = {
    name: data.name,
    role: data.role,
    exp: Date.now() + 12 * 60 * 60 * 1000,
  };

  const cookie = `sid=${btoa(JSON.stringify(session))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 12}`;

  return new Response(JSON.stringify({
    ok: true,
    name: data.name,
    role: data.role
  }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookie
    }
  });
}
