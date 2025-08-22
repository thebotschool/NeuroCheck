import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';
import { randomUUID } from 'crypto';

const USE_UNIFIED_TABLE = false;

// util
const readRawBody = (req: VercelRequest): Promise<string> =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk.toString()));
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });

export default async (req: VercelRequest, res: VercelResponse) => {
  // Временный health‑чекап
  if (req.method === 'GET') return res.status(200).send('OK: yookassa-webhook is live');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('WEBHOOK HIT', req.method, req.url, req.headers['x-vercel-deployment-url']);

  // --- Basic Auth (можно отключить флагом) --- //
  const basicAuthDisabled = process.env.WEBHOOK_BASIC_AUTH_DISABLED === 'true';
  const yookassaUser = process.env.YOOKASSA_WEBHOOK_USER;
  const yookassaPassword = process.env.YOOKASSA_WEBHOOK_PASSWORD;

  if (!basicAuthDisabled && yookassaUser && yookassaPassword) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Authorization header missing');
    const expectedAuth = 'Basic ' + Buffer.from(`${yookassaUser}:${yookassaPassword}`).toString('base64');
    if (authHeader !== expectedAuth) return res.status(401).send('Invalid credentials');
  }

  if (req.method === 'POST' && req.query?.echo === '1') {
    // Примитивный эхо-ответ без чтения body
    return res.status(200).json({ ok: true, msg: 'echo', headers: req.headers });
  }

  try {
    const rawBody = await readRawBody(req);
    console.log('BODY LEN', rawBody?.length ?? 0);

    if (!rawBody) {
      console.warn('Empty body on webhook');
      return res.status(400).json({ ok: false, error: 'Empty body' });
    }

    const payload = JSON.parse(rawBody);
    console.log('YK webhook hit', {
      event: payload?.event,
      payment_id: payload?.object?.id,
      status: payload?.object?.status,
    });

    if (payload.event !== 'payment.succeeded') {
      return res.status(200).send('Event ignored');
    }

    // ⚠️ ЛЕНИВЫЕ ИМПОРТЫ здесь:
    const { getAdminClient } = await import('./_lib/supabaseServer');
    const { sendAccessEmail } = await import('./_lib/mailersend');

    const payment = payload.object;
    const paymentId = payment.id;
    let email = payment.metadata?.email || payment.customer?.email || '';

    if (!email) console.warn(`Email missing for payment ${paymentId}`);

    const supabase = getAdminClient();

    if (!USE_UNIFIED_TABLE) {
      const { error: paymentError } = await supabase.from('payments').upsert({
        payment_id: paymentId,
        status: payment.status,
        amount: payment.amount.value,
        currency: payment.amount.currency,
        description: payment.description,
        email,
        metadata: payment.metadata,
        updated_at: new Date(),
      }, { onConflict: 'payment_id' });

      if (paymentError) throw paymentError;
    }

    const token = `${randomUUID()}-${Date.now()}`;

    const supa = getAdminClient();
    const { data: test, error: testError } = await supa
      .from('tests')
      .insert({
        email,
        token,
        payment_id: paymentId,
        expires_at: null, // Токен живет вечно
        used: false,
      })
      .select()
      .single();

    if (testError) throw testError;

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/test?token=${token}`;

    await sendAccessEmail(email, accessUrl);

    return res.status(200).json({ ok: true, testId: test.id, email });

  } catch (error) {
    console.error('Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};
