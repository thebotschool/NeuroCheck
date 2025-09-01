import { getAdminClient } from './_lib/supabaseServer.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { promoCode } = req.body;

    if (!promoCode) {
      return res.status(400).json({ error: 'Промокод не может быть пустым' });
    }

    const supabase = getAdminClient();

    const { data, error } = await supabase.rpc('consume_promo_code', {
      promo_code_to_consume: promoCode,
    });

    if (error) {
      console.error('RPC error consuming promo code:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }

    // RPC functions in Supabase return an array of results, even if it's just one.
    const result = data[0];

    if (result.error_code) {
      return res.status(400).json({ error: result.error_message, code: result.error_code });
    }

    return res.status(200).json({ ok: true, token: result.new_test_token });

  } catch (e) {
    console.error('Error in consume-promo handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}