export const config = { runtime: 'edge' };

export default function handler() {
  return new Response(JSON.stringify({ ok: true, runtime: 'edge' }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}
