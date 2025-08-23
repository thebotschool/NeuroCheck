import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token parameter required' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('Debug token check:', {
      token,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SERVICE_KEY,
      supabaseUrl: SUPABASE_URL?.substring(0, 20) + '...',
    });

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({
        error: 'Missing environment variables',
        details: {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_KEY
        }
      });
    }

    // Динамический импорт Supabase клиента
    const { getAdminClient } = await import('./_lib/supabaseServer');
    const supabase = getAdminClient();

    // Проверяем токен через Supabase клиент
    const { data, error } = await supabase
      .from('tests')
      .select('id, token, used, is_completed, expires_at, started_at, email, payment_id')
      .eq('token', token)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        error: 'Database error',
        details: error
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Token not found',
        token
      });
    }

    return res.status(200).json({
      ok: true,
      data,
      checks: {
        exists: !!data,
        used: data.used,
        completed: data.is_completed,
        expired: data.expires_at ? new Date(data.expires_at) < new Date() : false,
        hasPayment: !!data.payment_id,
      }
    });

  } catch (error) {
    console.error('Debug token error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
};