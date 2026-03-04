export async function onRequestPost(context) {

  const body = await context.request.json();
  const login = body.login;
  const password = body.password;

  const gasUrl = context.env.GAS_URL;

  const response = await fetch(gasUrl, {
    method: "POST",
    headers: {
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      action:"login",
      login:login,
      password:password
    })
  });

  const data = await response.json();

  if(!data.ok){
    return new Response(JSON.stringify({
      ok:false,
      error:"invalid login"
    }),{
      headers:{ "Content-Type":"application/json" }
    });
  }

  const session = {
    name:data.name,
    role:data.role,
    exp:Date.now() + 1000*60*60*12
  };

  const cookie = `sid=${btoa(JSON.stringify(session))}; Path=/; HttpOnly; Secure; SameSite=Lax`;

  return new Response(JSON.stringify({
    ok:true,
    name:data.name,
    role:data.role
  }),{
    headers:{
      "Content-Type":"application/json",
      "Set-Cookie":cookie
    }
  });
}
