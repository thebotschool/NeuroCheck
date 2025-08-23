// api/debug-promo.ts
// Отладочный endpoint для проверки промокодов в базе данных

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = (req.query.token as string ?? '').toString().trim();
    
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Debug info:', {
      token,
      SUPABASE_URL: !!SUPABASE_URL,
      SERVICE_KEY: !!SERVICE_KEY,
      SUPABASE_URL_value: SUPABASE_URL,
      SERVICE_KEY_length: SERVICE_KEY?.length
    });
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        error: 'Missing environment variables',
        details: { 
          SUPABASE_URL: !!SUPABASE_URL, 
          SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY,
          SUPABASE_URL_value: SUPABASE_URL,
          SERVICE_KEY_length: SERVICE_KEY?.length
        }
      });
    }

    // Если токен указан, ищем конкретный
    if (token) {
      const url = `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(token)}&select=*`;
      console.log('Fetching URL:', url);
      
      const sel = await fetch(url, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        }
      });

      console.log('Response status:', sel.status);
      console.log('Response headers:', Object.fromEntries(sel.headers.entries()));

      if (!sel.ok) {
        const errorText = await sel.text().catch(() => 'Failed to read error text');
        console.log('Error response:', errorText);
        return res.status(500).json({ 
          error: 'Database query failed', 
          status: sel.status,
          errorText,
          url
        });
      }

      const rows = await sel.json();
      console.log('Query result:', rows);
      return res.json({ token, found: rows.length > 0, data: rows, url });
    }

    // Иначе показываем последние 10 записей
    const url = `${SUPABASE_URL}/rest/v1/tests?select=token,used,is_completed,expires_at,created_at&order=created_at.desc&limit=10`;
    const sel = await fetch(url, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      }
    });

    if (!sel.ok) {
      const errorText = await sel.text().catch(() => 'Failed to read error text');
      return res.status(500).json({ 
        error: 'Database query failed', 
        status: sel.status,
        errorText,
        url
      });
    }

    const rows = await sel.json();
    return res.json({ message: 'Last 10 tokens', data: rows });

  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    const stack = e instanceof Error ? e.stack : 'no stack';
    console.error('Debug endpoint error:', { msg, stack });
    return res.status(500).json({ error: `Debug failed: ${msg}`, stack });
  }
}