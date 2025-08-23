import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomBytes } from 'crypto';

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, adminKey } = req.body;

    // Простая проверка админского ключа
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key';
    if (adminKey !== ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Динамический импорт
    const { getAdminClient } = await import('./_lib/supabaseServer');
    const supabase = getAdminClient();

    // Создаем промокод (токен)
    const token = `promo-${randomBytes(4).toString('hex')}`;

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        email,
        token,
        payment_id: null, // Промокод не связан с платежом
        expires_at: null, // Промокод живет вечно
        used: false,
      })
      .select()
      .single();

    if (testError) {
      console.error('Error creating promo code:', testError);
      throw testError;
    }

    console.log(`Promo code created: ${token} for ${email}`);

    return res.status(200).json({ 
      ok: true, 
      token,
      testId: test.id,
      email,
      message: 'Promo code created successfully'
    });

  } catch (error) {
    console.error('Error creating promo code:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to create promo code: ${message}` 
    });
  }
};