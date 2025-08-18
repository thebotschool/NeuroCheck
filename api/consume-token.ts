// api/consume-token.ts
import { getAdminClient } from './_lib/supabaseServer';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'content-type': 'application/json' }
  });
}

export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body: any;
    try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

    const token = (body?.token ?? '').toString().trim();
    const markAsCompleted = !!body?.markAsCompleted;
    if (!token) return json({ error: 'token_required' }, 400);

    // dev-bypass (не трогаем БД)
    const DEV = process.env.NODE_ENV !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
    const BYPASS_TOKEN = process.env.VITE_DEV_BYPASS_TOKEN || 'dev-token-123';
    if (DEV && BYPASS_ENABLED && token === BYPASS_TOKEN) {
      return json({ consumed: true, devBypass: true, testId: 'dev-bypass' });
    }

    const supabase = getAdminClient();

    const { data: test, error } = await supabase
      .from('tests')
      .select('used, expires_at, is_completed')
      .eq('token', token)
      .single();

    if (error || !test) return json({ consumed: false, reason: 'not_found' });
    if (test.used)       return json({ consumed: false, reason: 'already_used' });
    if (test.expires_at && new Date(test.expires_at) < new Date())
                         return json({ consumed: false, reason: 'expired' });

    const updates: { used: boolean; is_completed?: boolean } = { used: true };
    if (markAsCompleted) updates.is_completed = true;

    const { error: updErr } = await supabase.from('tests').update(updates).eq('token', token);
    if (updErr) return json({ consumed: false, reason: 'update_failed' }, 500);

    return json({ consumed: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `consume-token failed: ${msg}` }, 500);
  }
}
