export async function onRequestGet() {
  return new Response(JSON.stringify({
    ok: true,
    server: "pages-functions",
    time: new Date().toISOString()
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
}
