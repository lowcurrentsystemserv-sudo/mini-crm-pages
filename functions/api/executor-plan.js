function decodeBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);
  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function getSid(request) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/sid=([^;]+)/);
  return m ? m[1] : null;
}

async function getSession(request) {
  const sid = getSid(request);
  if (!sid) return null;
  try {
    const session = JSON.parse(decodeBase64Url(sid));
    if (session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function onRequestGet({ request, env }) {
  const session = await getSession(request);
  if (!session) {
    return new Response(JSON.stringify({ ok:false, error:"Not authenticated" }), {
      status: 401,
      headers: { "Content-Type":"application/json; charset=utf-8" }
    });
  }

  const r = await fetch(env.GAS_URL, {
    method: "POST",
    headers: { "Content-Type":"application/x-www-form-urlencoded;charset=UTF-8" },
    body: new URLSearchParams({
      action: "executor_plan",
      userName: session.name
    })
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "Content-Type":"application/json; charset=utf-8" }
  });
}
