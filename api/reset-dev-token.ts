// api/reset-dev-token.ts
// EDGE + Supabase REST. Сбрасывает dev-токен, чтобы можно было начать тест заново.
//
// Доступ:
// - development/preview: если VITE_DEV_BYPASS_ENABLED === 'true'
// - production: только если token === DEV_BYPASS_TOKEN (по умолчанию 'dev-token-123')
//
// Требуемые env на сервере (Vercel → Project Env):
// SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY
// (опц.) VITE_DEV_BYPASS_ENABLED='true'
// (опц.) VITE_DEV_BYPASS_TOKEN='dev-token-123'

export const config = { runtime: 'edge' };

const json = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    // Читаем тело (может быть пустым)
    let body: any = null;
    try { body = await req.json(); } catch {}

    const DEV_BYPASS_TOKEN = (process.env.VITE_DEV_BYPASS_TOKEN ?? 'dev-token-123').toString();
    const requestedToken = (body?.token ?? DEV_BYPASS_TOKEN).toString();

    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'production'; // 'production' | 'preview' | 'development'
    const isNonProd = env !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';

    // Разрешение:
    // - в dev/preview при включённом флаге
    // - в prod ТОЛЬКО если трогаем dev-токен
    const allowed = (isNonProd && BYPASS_ENABLED) || (BYPASS_ENABLED && requestedToken === DEV_BYPASS_TOKEN);
    if (!allowed) {
      return json({ error: 'forbidden', env, tokenAllowedInProd: DEV_BYPASS_TOKEN }, 403);
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({
        error: 'server_misconfig',
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY
      }, 500);
    }

    // 1) UPSERT записи (если нет) — благодаря unique (token) обновит существующую
    {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          // merge-duplicates использует unique индекс (token) как условие UPSERT
          Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify({
          token: requestedToken,
          payment_id: 'dev-payment',
          age: 10,
          email: 'dev@example.com',
          used: false,
          is_completed: false,
          current_step: 1,
          started_at: new Date().toISOString(),
          completed_at: null,
          expires_at: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString(), // +90 дней
          cpt_results: null,
          gonogo_results: null,
          memory_results: null
        })
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        return json({ ok: false, step: 'upsert', status: resp.status, body: txt }, 500);
      }
    }

    // 2) PATCH — принудительно сбрасываем поля на «стартовые»
    {
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(requestedToken)}`, {
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
          // Можно продлевать «жизнь» токена:
          expires_at: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString()
        })
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        return json({ ok: false, step: 'patch', status: resp.status, body: txt }, 500);
      }
    }

    return json({ ok: true, token: requestedToken });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `reset-dev-token(edge) failed: ${msg}` }, 500);
  }
}