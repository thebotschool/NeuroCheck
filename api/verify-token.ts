// api/verify-token.ts
// Проверяет токен и возвращает понятный JSON.
// GET /api/verify-token?token=...   (можно и POST с { token })

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('verify-token called:', { method: req.method, query: req.query });
    
    let token = '';
    if (req.method === 'GET') {
      token = (req.query.token as string ?? '').toString().trim();
    } else if (req.method === 'POST') {
      try {
        token = (req.body?.token ?? '').toString().trim();
      } catch {
        return res.status(400).json({ ok: false, error: 'invalid_json' });
      }
    } else {
      return res.status(405).json({ ok: false, error: 'method_not_allowed' });
    }

    console.log('Extracted token:', token);
    if (!token) return res.status(400).json({ ok: false, error: 'token_required' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', { 
      SUPABASE_URL: !!SUPABASE_URL, 
      SERVICE_KEY: !!SERVICE_KEY,
      SUPABASE_URL_value: SUPABASE_URL,
      SERVICE_KEY_length: SERVICE_KEY?.length
    });
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'server_misconfig',
        details: { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY }
      });
    }

    // Находим запись по токену
    const url = `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=id,used,is_completed,expires_at`;
    console.log('Fetching URL:', url);
    
    const sel = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Prefer: 'return=representation'
      }
    });

    console.log('Supabase response status:', sel.status);
    console.log('Supabase response headers:', Object.fromEntries(sel.headers.entries()));

    if (!sel.ok) {
      const txt = await sel.text().catch(() => '');
      console.log('Supabase error response:', txt);
      return res.status(500).json({ ok: false, error: 'select_failed', status: sel.status, body: txt });
    }

    const rows = (await sel.json()) as Array<{
      id: string;
      used: boolean;
      is_completed: boolean;
      expires_at: string | null;
    }>;

    console.log('Query result:', { rowsCount: rows.length, rows });
    
    const row = rows[0];
    if (!row) {
      console.log('Token not found in database');
      return res.status(200).json({ ok: false, error: 'not_found' });
    }

    // Простые проверки валидности
    if (row.used || row.is_completed) {
      return res.status(200).json({ ok: false, error: 'already_used', testId: row.id });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(200).json({ ok: false, error: 'expired', testId: row.id, expires_at: row.expires_at });
    }

    // Time-based restriction (6:00 to 12:00)
    const now = new Date();
    const currentHour = now.getHours();
    const isDevBypass = process.env.VITE_DEV_BYPASS_ENABLED === 'true';

    if (!isDevBypass && (currentHour < 6 || currentHour >= 12)) {
      return res.status(200).json({
        ok: false,
        error: 'invalid_time',
        message: 'Мы открываем скрининг только с утра — с 6 до 12 часов. В это время дети бодрее, внимание свежее, и результаты получаются честнее и полезнее. Так мы заботимся о том, чтобы отчёт действительно помог.'
      });
    }

    return res.status(200).json({ ok: true, testId: row.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    const stack = e instanceof Error ? e.stack : 'no stack';
    console.error('verify-token error:', { msg, stack });
    return res.status(500).json({ ok: false, error: `verify-token failed: ${msg}`, stack });
  }
}