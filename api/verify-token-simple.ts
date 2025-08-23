// api/verify-token-simple.ts
// Упрощенная версия без логирования

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = (req.query.token as string ?? '').toString().trim();
    
    if (!token) {
      return res.status(400).json({ ok: false, error: 'token_required' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'server_misconfig'
      });
    }

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=id,used,is_completed,expires_at`,
      {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      return res.status(500).json({ 
        ok: false, 
        error: 'database_error',
        status: response.status 
      });
    }

    const rows = await response.json();
    const row = rows[0];
    
    if (!row) {
      return res.status(200).json({ ok: false, error: 'not_found' });
    }

    if (row.used || row.is_completed) {
      return res.status(200).json({ ok: false, error: 'already_used' });
    }

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(200).json({ ok: false, error: 'expired' });
    }

    return res.status(200).json({ ok: true, testId: row.id });
    
  } catch (error) {
    return res.status(500).json({ 
      ok: false, 
      error: 'internal_error',
      message: error instanceof Error ? error.message : 'unknown'
    });
  }
}