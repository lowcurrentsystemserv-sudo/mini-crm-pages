function decodeBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);

  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export async function onRequestGet({ request }) {

  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/sid=([^;]+)/);

  if (!match) {
    return new Response(JSON.stringify({
      ok:false,
      error:"No session"
    }),{
      status:401,
      headers:{ "Content-Type":"application/json" }
    });
  }

  try {

    const session = JSON.parse(decodeBase64Url(match[1]));

    if(session.exp < Date.now()){
      return new Response(JSON.stringify({
        ok:false,
        error:"Session expired"
      }),{
        status:401,
        headers:{ "Content-Type":"application/json" }
      });
    }

    return new Response(JSON.stringify({
      ok:true,
      user:session
    }),{
      headers:{ "Content-Type":"application/json" }
    });

  } catch(e){

    return new Response(JSON.stringify({
      ok:false,
      error:"Invalid session"
    }),{
      status:401,
      headers:{ "Content-Type":"application/json" }
    });

  }
}
