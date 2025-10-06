// api/verify-token.mjs
// NODEJS + Supabase REST. Проверяет токен и возвращает понятный JSON.
// GET /api/verify-token?token=...   (можно и POST с { token, email })

import { getAdminClient } from './_lib/supabaseServer.mjs';

export const handler = async (req, res) => {
  try {
    let token = '';
    let email = '';
    if (req.method === 'GET') {
      token = (req.query.token ?? '').toString().trim();
    } else if (req.method === 'POST') {
      const body = req.body;
      token = (body?.token ?? '').toString().trim();
      email = (body?.email ?? '').toString().trim();
    } else {
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    if (!token) return res.status(400).json({ ok: false, error: 'token_required' });
    // Email is only required for the update operation, not for the initial check in NeuroCheck
    // if (req.method === 'POST' && !email) return res.status(400).json({ ok: false, error: 'email_required' });

    const supabase = getAdminClient();

    // Find record by token
    const { data: rows, error } = await supabase
      .from('tests')
      .select('id,used,is_completed,expires_at,started_at,email') // MODIFIED: added email
      .eq('token', token);

    if (error) {
      console.error('Supabase select failed:', error);
      return res.status(500).json({ ok: false, error: 'select_failed', details: error });
    }

    const row = rows?.[0];
    if (!row) return res.status(200).json({ ok: false, error: 'not_found' });

    // Simple validity checks
    if (row.used || row.is_completed) {
      return res.status(200).json({ ok: false, error: 'already_used', testId: row.id });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(200).json({ ok: false, error: 'expired', testId: row.id, expires_at: row.expires_at });
    }

    // If email is provided via POST, update the record
    if (req.method === 'POST' && email) {
      if (!email) return res.status(400).json({ ok: false, error: 'email_required' });
      const { error: updateError } = await supabase
        .from('tests')
        .update({ email })
        .eq('id', row.id);

      if (updateError) {
        console.error('Supabase update failed:', updateError);
        return res.status(500).json({ ok: false, error: 'update_failed', details: updateError });
      }
      // To ensure the returned email is the one we just set
      row.email = email;
    }

    return res.status(200).json({ ok: true, testId: row.id, email: row.email }); // MODIFIED: added email

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return res.status(500).json({ ok: false, error: `verify-token failed: ${msg}` });
  }
};