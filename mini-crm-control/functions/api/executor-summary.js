export async function onRequestGet() {
  return new Response(
    JSON.stringify({ ok: true, step: "executor-summary alive" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  );
}
