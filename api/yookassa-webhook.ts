import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';
import { getAdminClient } from './_lib/supabaseServer';
import { sendAccessEmail } from './_lib/resend';
import { randomUUID } from 'crypto';

const USE_UNIFIED_TABLE = false; // Set to true to use a single 'orders' table

const readRawBody = (req: VercelRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
};

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  // --- Basic Auth --- //
  const authHeader = req.headers.authorization;
  const yookassaUser = process.env.YOOKASSA_WEBHOOK_USER;
  const yookassaPassword = process.env.YOOKASSA_WEBHOOK_PASSWORD;
  const basicAuthDisabled = process.env.WEBHOOK_BASIC_AUTH_DISABLED === 'true';

  if (!basicAuthDisabled && yookassaUser && yookassaPassword) {
    if (!authHeader) {
      return res.status(401).send('Authorization header missing');
    }
    const expectedAuth = `Basic ${Buffer.from(`${yookassaUser}:${yookassaPassword}`).toString('base64')}`;
    if (authHeader !== expectedAuth) {
      return res.status(401).send('Invalid credentials');
    }
  }

  try {
    const rawBody = await readRawBody(req);
    console.log('Webhook received:', { headers: req.headers, body: rawBody });
    
    const payload = JSON.parse(rawBody);

    if (payload.event !== 'payment.succeeded') {
      console.log(`Event ${payload.event} ignored`);
      return res.status(200).send('Event ignored');
    }

    const { object: payment } = payload;
    const paymentId = payment.id;
    
    // Более надежное извлечение email из разных источников
    let email = payment.metadata?.email || 
                payment.customer?.email || 
                payment.receipt?.customer?.email ||
                payment.confirmation?.return_url?.match(/email=([^&]+)/)?.[1];

    console.log('Payment data:', { 
      paymentId, 
      metadata: payment.metadata, 
      customer: payment.customer,
      email 
    });

    if (!email) {
      console.error(`Email not found for payment ${paymentId}. Payment data:`, JSON.stringify(payment, null, 2));
      return res.status(400).json({ 
        ok: false, 
        error: 'Email required for test access',
        paymentId 
      });
    }

    const supabase = getAdminClient();

    // Проверяем, не обработан ли уже этот платеж
    const { data: existingTest } = await supabase
      .from('tests')
      .select('id, token')
      .eq('payment_id', paymentId)
      .single();

    if (existingTest) {
      console.log(`Payment ${paymentId} already processed, test ID: ${existingTest.id}`);
      return res.status(200).json({ 
        ok: true, 
        message: 'Payment already processed',
        testId: existingTest.id 
      });
    }

    if (USE_UNIFIED_TABLE) {
      // Logic for a single 'orders' table (not implemented as per current schema)
      // const { data, error } = await supabase.from('orders').update({ status: 'paid' }).eq('payment_id', paymentId).select().single();
      // if (error) throw error;
    } else {
      // Logic for separate 'payments' and 'tests' tables
      const { error: paymentError } = await supabase.from('payments').upsert({
        payment_id: paymentId,
        status: payment.status,
        amount: payment.amount.value,
        currency: payment.amount.currency,
        description: payment.description,
        email: email,
        metadata: payment.metadata,
        updated_at: new Date(),
      }, { onConflict: 'payment_id' });

      if (paymentError) {
        console.error('Payment upsert error:', paymentError);
        throw paymentError;
      }
    }

    const token = `${randomUUID()}-${Date.now()}`;
    const tokenTtlHours = parseInt(process.env.TOKEN_TTL_HOURS || '24', 10);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + tokenTtlHours);

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert({
        email,
        token,
        payment_id: paymentId,
        expires_at: expiresAt.toISOString(),
        used: false,
      })
      .select()
      .single();

    if (testError) throw testError;

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/test?token=${token}`;

    try {
      await sendAccessEmail(email, accessUrl);
      console.log(`Access email sent to ${email} for test ${test.id}`);
    } catch (emailError) {
      console.error('Failed to send access email:', emailError);
      // Не прерываем выполнение, так как токен уже создан
    }

    console.log(`Webhook processed successfully: payment ${paymentId}, test ${test.id}, email ${email}`);
    return res.status(200).json({ ok: true, testId: test.id, email });

  } catch (error) {
    console.error('Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};
