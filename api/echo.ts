export const config = { runtime: 'nodejs' };
export default async (req: Request) => {
  let body: any = null; try { body = await req.json(); } catch {}
  return new Response(JSON.stringify({ method: req.method, body }), { status: 200, headers: { 'content-type': 'application/json' }});
};
