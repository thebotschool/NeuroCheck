import type { VercelRequest, VercelResponse } from '@vercel/node';

// Быстрое создание промокода для разработки
export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Только в dev режиме
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  try {
    const { email = 'dev@example.com' } = req.body;

    const response = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/create-promo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        adminKey: process.env.ADMIN_KEY || 'admin-secret-key',
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return res.status(200).json({
        ok: true,
        token: data.token,
        email,
        accessUrl: `${req.headers.origin || 'http://localhost:3000'}/test?token=${data.token}`,
        message: 'Dev promo code created'
      });
    } else {
      throw new Error(data.error);
    }

  } catch (error) {
    console.error('Error creating dev promo code:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ 
      ok: false, 
      error: `Failed to create dev promo code: ${message}` 
    });
  }
};