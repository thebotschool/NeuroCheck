// api/verify-token.mjs
// EDGE + Supabase REST. Проверяет токен и возвращает понятный JSON.
// GET /api/verify-token?token=...   (можно и POST с { token, email })

import { getAdminClient } from './_lib/supabaseServer';

export const config = { runtime: 'edge' };

const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json' } });

export default async function handler(req) {
  try {
    let token = '';
    let email = '';
    if (req.method === 'GET') {
      const url = new URL(req.url);
      token = (url.searchParams.get('token') ?? '').toString().trim();
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        token = (body?.token ?? '').toString().trim();
        email = (body?.email ?? '').toString().trim();
      } catch {
        return json({ ok: false, error: 'invalid_json' }, 400);
      }
    } else {
      return json({ ok: false, error: 'method_not_allowed' }, 405);
    }

    if (!token) return json({ ok: false, error: 'token_required' }, 400);
    // Email is only required for the update operation, not for the initial check in NeuroCheck
    // if (req.method === 'POST' && !email) return json({ ok: false, error: 'email_required' }, 400);

    const supabase = getAdminClient();

    // Find record by token
    const { data: rows, error } = await supabase
      .from('tests')
      .select('id,used,is_completed,expires_at,started_at,email') // MODIFIED: added email
      .eq('token', token);

    if (error) {
      console.error('Supabase select failed:', error);
      return json({ ok: false, error: 'select_failed', details: error }, 500);
    }

    const row = rows?.[0];
    if (!row) return json({ ok: false, error: 'not_found' }, 200);

    // Simple validity checks
    if (row.used || row.is_completed) {
      return json({ ok: false, error: 'already_used', testId: row.id }, 200);
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return json({ ok: false, error: 'expired', testId: row.id, expires_at: row.expires_at }, 200);
    }

    // If email is provided via POST, update the record
    if (req.method === 'POST' && email) {
       if (!email) return json({ ok: false, error: 'email_required' }, 400);
      const { error: updateError } = await supabase
        .from('tests')
        .update({ email })
        .eq('id', row.id);

      if (updateError) {
        console.error('Supabase update failed:', updateError);
        return json({ ok: false, error: 'update_failed', details: updateError }, 500);
      }
      // To ensure the returned email is the one we just set
      row.email = email;
    }

    return json({ ok: true, testId: row.id, email: row.email }, 200); // MODIFIED: added email

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return json({ ok: false, error: `verify-token failed: ${msg}` }, 500);
  }
}