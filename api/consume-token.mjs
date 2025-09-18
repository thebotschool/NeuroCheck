// api/consume-token.mjs  (NODEJS + REST)
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

    const body = req.body;

    const token = (body?.token ?? '').toString().trim();
    const markAsCompleted = !!body?.markAsCompleted;
    if (!token) return res.status(400).json({ error: 'token_required' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'server_misconfig', SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY });
    }

    // 1) SELECT tests by token
    const sel = await fetch(`${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=*`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation',
      },
    });

    if (!sel.ok) {
      return res.status(500).json({ consumed: false, reason: 'select_failed', status: sel.status });
    }
    const rows = await sel.json();
    const row = rows[0];
    if (!row) return res.status(200).json({ consumed: false, reason: 'not_found' });

    if (row.used) return res.status(200).json({ consumed: false, reason: 'already_used' });
    if (row.expires_at && new Date(row.expires_at) < new Date()) return res.status(200).json({ consumed: false, reason: 'expired' });

    // 2) UPDATE used / is_completed
    const updates = { used: true };
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
      return res.status(500).json({ consumed: false, reason: 'update_failed', status: upd.status, body: txt });
    }

    if (markAsCompleted) {
      // await sendReportEmail(row);
    }

    return res.status(200).json({ consumed: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ ok: false, error: `consume-token(nodejs) failed: ${msg}` });
  }
}