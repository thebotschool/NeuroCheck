import { getAdminClient } from './_lib/supabaseServer';

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// фиксируем node-runtime (не edge)
export const config = { runtime: 'nodejs' };

export default async function handler(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

    let body: any;
    try {
      body = await req.json();
    } catch { 
      return json({ error: 'invalid_json' }, 400);
    }

    const token = (body?.token ?? '').toString().trim();
    const markAsCompleted = !!body?.markAsCompleted;
    if (!token) return json({ error: 'token_required' }, 400);

    // DEV BYPASS — не трогаем БД
    const DEV = process.env.NODE_ENV !== 'production';
    const BYPASS_ENABLED = process.env.VITE_DEV_BYPASS_ENABLED === 'true';
    const BYPASS_TOKEN = process.env.VITE_DEV_BYPASS_TOKEN || 'dev-token-123';
    if (DEV && BYPASS_ENABLED && token === BYPASS_TOKEN) {
      return json({ consumed: true, devBypass: true, testId: 'dev-bypass' });
    }

    const supabase = getAdminClient();

    // читаем текущее состояние
    const { data: test, error } = await supabase
      .from('tests')
      .select('used, expires_at, is_completed')
      .eq('token', token)
      .single();

    if (error || !test) return json({ consumed: false, reason: 'not_found' }, 200);

    if (test.used) return json({ consumed: false, reason: 'already_used' }, 200);

    if (test.expires_at && new Date(test.expires_at) < new Date()) {
      return json({ consumed: false, reason: 'expired' }, 200);
    }

    const updates: { used: boolean; is_completed?: boolean } = { used: true };
    if (markAsCompleted) updates.is_completed = true;

    const { error: updateError } = await supabase
      .from('tests')
      .update(updates)
      .eq('token', token);

    if (updateError) return json({ consumed: false, reason: 'update_failed' }, 500);

    return json({ consumed: true }, 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    // всегда JSON, чтобы фронт не падал на HTML
    return json({ ok: false, error: `consume-token failed: ${msg}` }, 500);
  }
}
