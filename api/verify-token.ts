// api/verify-token.ts
// EDGE + Supabase REST. Проверяет токен и возвращает понятный JSON.
// GET /api/verify-token?token=...   (можно и POST с { token })

export const config = { runtime: 'edge' };

const json = (d: any, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler(req: Request): Promise<Response> {
  try {
    let token = '';
    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = (url.searchParams.get('token') ?? '').toString().trim();
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        token = (body?.token ?? '').toString().trim();
      } catch {
        return json({ ok: false, error: 'invalid_json' }, 400);
      }
    } else {
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    if (!token) return json({ ok: false, error: 'token_required' }, 400);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({
        ok: false,
        error: 'server_misconfig',
        details: { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY }
      }, 500);
    }

    // Находим запись по токену
    const sel = await fetch(
      `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=id,used,is_completed,expires_at,started_at`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          Prefer: 'return=representation'
        }
      }
    );

    if (!sel.ok) {
      const txt = await sel.text().catch(() => '');
      console.error('Supabase select failed:', { status: sel.status, body: txt });
      return json({ ok: false, error: 'select_failed', status: sel.status, body: txt }, 500);
    }

    const rows = (await sel.json()) as Array<{
      id: string;
      used: boolean;
      is_completed: boolean;
      expires_at: string | null;
      started_at: string;
    }>;

    const row = rows[0];
    if (!row) return json({ ok: false, error: 'not_found' }, 200);

    // Простые проверки валидности
    if (row.used || row.is_completed) {
      return json({ ok: false, error: 'already_used', testId: row.id }, 200);
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return json({ ok: false, error: 'expired', testId: row.id, expires_at: row.expires_at }, 200);
    }

    // ⚠️ Ограничение 06:00–12:00 по местному времени пока НЕ enforced (оставлено на будущее),
    // чтобы не мешать тестированию.
    return json({ ok: true, testId: row.id }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `verify-token failed: ${msg}` }, 500);
  }
}