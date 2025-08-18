// api/reset-dev-token.ts
export const config = { runtime: 'edge' };

const json = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    // Безопасность: этот ресет доступен только в деве и только при включённом флаге
    const DEV = process.env.NODE_ENV !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
    if (!DEV || !BYPASS_ENABLED) return json({ error: 'forbidden' }, 403);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: 'server_misconfig', SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY }, 500);
    }

    // Тело запроса (опционально можно принять token/id, но для dev режима обычно фиксируем)
    let body: any = null;
    try { body = await req.json(); } catch {}
    const token = (body?.token ?? process.env.VITE_DEV_BYPASS_TOKEN ?? 'dev-token-123').toString();

    // 1) Убедимся, что запись существует (если нет — создадим)
    const upsert = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation'
      },
      body: JSON.stringify({
        token,
        payment_id: 'dev-payment',
        age: 10,
        used: false,
        is_completed: false,
        current_step: 1,
        started_at: new Date().toISOString(),
        completed_at: null,
        expires_at: new Date(Date.now() + 90*24*3600*1000).toISOString(), // +90 дней
        cpt_results: null,
        gonogo_results: null,
        memory_results: null,
        email: 'dev@example.com'
      })
    });

    if (!upsert.ok) {
      const txt = await upsert.text().catch(() => '');
      return json({ ok: false, step: 'upsert', status: upsert.status, body: txt }, 500);
    }

    // 2) На всякий случай принудительно сбросим поля (если запись уже была)
    const patch = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        used: false,
        is_completed: false,
        current_step: 1,
        completed_at: null,
        cpt_results: null,
        gonogo_results: null,
        memory_results: null,
        // expires_at можно продлевать по желанию:
        expires_at: new Date(Date.now() + 90*24*3600*1000).toISOString()
      })
    });

    if (!patch.ok) {
      const txt = await patch.text().catch(() => '');
      return json({ ok: false, step: 'patch', status: patch.status, body: txt }, 500);
    }

    return json({ ok: true, token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `reset-dev-token(edge) failed: ${msg}` }, 500);
  }
}