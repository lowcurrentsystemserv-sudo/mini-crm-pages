function decodeBase64Url(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = str.length % 4;
  if (pad) str += "=".repeat(4 - pad);

  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function getSession(request){
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/sid=([^;]+)/);
  if(!match) return null;

  try{
    const session = JSON.parse(decodeBase64Url(match[1]));
    if(session.exp < Date.now()) return null;
    return session;
  }catch(e){
    return null;
  }
}

export async function onRequestGet({request, env}){

  const session = getSession(request);

  if(!session){
    return new Response(JSON.stringify({
      ok:false,
      error:"Not authenticated"
    }),{
      status:401,
      headers:{ "Content-Type":"application/json" }
    });
  }

  const r = await fetch(env.GAS_URL,{
    method:"POST",
    headers:{
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body:new URLSearchParams({
      action:"bootstrap",
      userName:session.name
    })
  });

  const text = await r.text();

  return new Response(text,{
    headers:{ "Content-Type":"application/json" }
  });

}
