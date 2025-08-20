import type { VercelRequest, VercelResponse } from '@vercel/node';

// Тестовый endpoint для проверки webhook'а ЮКассы
export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const testPayload = {
    event: 'payment.succeeded',
    object: {
      id: `test-payment-${Date.now()}`,
      status: 'succeeded',
      amount: {
        value: '500.00',
        currency: 'RUB'
      },
      description: 'Цифровое исследование учебных функций',
      metadata: {
        email: req.body.email || 'test@example.com'
      },
      customer: {
        email: req.body.email || 'test@example.com'
      }
    }
  };

  try {
    // Отправляем тестовый webhook на наш обработчик
    const webhookUrl = `${req.headers.origin || 'http://localhost:3000'}/api/yookassa-webhook`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Добавляем Basic Auth только если он не отключен
    const basicAuthDisabled = process.env.WEBHOOK_BASIC_AUTH_DISABLED === 'true';
    if (!basicAuthDisabled && process.env.YOOKASSA_WEBHOOK_USER && process.env.YOOKASSA_WEBHOOK_PASSWORD) {
      headers['Authorization'] = `Basic ${Buffer.from(`${process.env.YOOKASSA_WEBHOOK_USER}:${process.env.YOOKASSA_WEBHOOK_PASSWORD}`).toString('base64')}`;
    }
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();

    return res.status(200).json({
      ok: true,
      webhookResponse: result,
      testPayload
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};