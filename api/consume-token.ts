// api/consume-token.ts  (EDGE + REST)
export const config = { runtime: 'edge' };

const json = (d: Record<string, unknown>, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

interface RequestBody {
  token?: string;
  markAsCompleted?: boolean;
}

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    const token = (body?.token ?? '').toString().trim();
    const markAsCompleted = !!body?.markAsCompleted;
    if (!token) return json({ error: 'token_required' }, 400);

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: 'server_misconfig', SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY }, 500);
    }

    // 1) SELECT tests by token
    const sel = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=used,expires_at,is_completed,id`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
      // Edge: fetch доступен из коробки
    });

    if (!sel.ok) {
      return json({ consumed: false, reason: 'select_failed', status: sel.status }, 500);
    }
    const rows = (await sel.json()) as Array<{ used: boolean; expires_at: string | null; is_completed: boolean; id: string }>;
    const row = rows[0];
    if (!row) return json({ consumed: false, reason: 'not_found' });

    if (row.used) return json({ consumed: false, reason: 'already_used' });
    if (row.expires_at && new Date(row.expires_at) < new Date()) return json({ consumed: false, reason: 'expired' });

    // 2) UPDATE used / is_completed
    const updates: { used: boolean; is_completed?: boolean } = { used: true };
    if (markAsCompleted) updates.is_completed = true;

    const upd = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(updates),
    });

    if (!upd.ok) {
      const txt = await upd.text().catch(() => '');
      return json({ consumed: false, reason: 'update_failed', status: upd.status, body: txt }, 500);
    }

    return json({ consumed: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `consume-token(edge) failed: ${msg}` }, 500);
  }
}
