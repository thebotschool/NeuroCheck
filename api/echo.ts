// api/echo.ts
export const config = { runtime: 'edge' };
export default async function handler(req: Request) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch (e) {
    console.error('Could not parse JSON from request', e);
  }
  return new Response(JSON.stringify({ method: req.method, body }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}