export const config = { runtime: "nodejs" };

import { Buffer } from 'buffer';
import { getAdminClient } from './_lib/supabaseServer.mjs';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const USE_UNIFIED_TABLE = false; // Set to true if you ever move to a single 'orders' table

const readRawBody = (req) => {
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

async function sendAccessEmail(email, accessUrl) {
  if (!email) {
    console.warn("⚠️ Попытка отправить письмо без email");
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'NeuroCheck <noreply@neurocheck.ru>',
      to: [email],
      subject: 'Ссылка на прохождение тестирования NeuroCheck',
      html: `
        <h1>Здравствуйте!</h1>
        <p>Вы успешно оплатили тестирование NeuroCheck.</p>
        <p>Для начала тестирования, пожалуйста, перейдите по <a href="${accessUrl}">этой ссылке</a>.</p>
        <p>С уважением,<br>Команда NeuroCheck</p>
      `,
    });

    if (error) {
      console.error("❌ Ошибка при отправке письма через Resend:", error);
      throw error;
    }

    console.log("✅ Письмо успешно отправлено:", data);
  } catch (e) {
    console.error("❌ sendAccessEmail failed:", e);
    throw e;
  }
}

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('📩 Yookassa webhook received');

  try {
    const rawBody = await readRawBody(req);
    console.log('Raw body:', rawBody);

    const payload = JSON.parse(rawBody);
    console.log('Parsed payload:', payload);

    if (payload.event !== 'payment.succeeded') {
      console.log(`ℹ️ Event ignored: ${payload.event}`);
      return res.status(200).send('Event ignored');
    }

    console.log('✅ Processing payment.succeeded event');
    const { object: payment } = payload;
    const paymentId = payment.id;
    let email = payment.metadata?.email || payment.customer?.email || '';
    const clientId = payment.metadata?.clientId;

    console.log(`💳 Payment ID: ${paymentId}, Email: ${email}, Client ID: ${clientId}`);

    const supabase = getAdminClient();
    console.log('🔗 Supabase client created');

    if (!USE_UNIFIED_TABLE) {
      console.log('📥 Upserting payment record...');
      const paymentData = {
        payment_id: paymentId,
        status: payment.status,
        amount: payment.amount.value,
        currency: payment.amount.currency,
        description: payment.description,
        email,
        metadata: payment.metadata,
        updated_at: new Date(),
      };
      console.log('Payment data:', paymentData);

      const { error: paymentError } = await supabase
        .from('payments')
        .upsert(paymentData, { onConflict: 'payment_id' });

      if (paymentError) {
        console.error('❌ Error upserting payment:', paymentError);
        throw paymentError;
      }
      console.log('✅ Payment record saved');
    }

    const token = `${randomUUID()}-${Date.now()}`;
    const tokenTtlHoursRaw = process.env.TOKEN_TTL_HOURS;
    let expiresAt = null;

    if (tokenTtlHoursRaw) {
      const tokenTtlHours = parseInt(tokenTtlHoursRaw, 10);
      if (!isNaN(tokenTtlHours)) {
        expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + tokenTtlHours);
      }
    }

    console.log('📥 Inserting test record...');
    const testData = {
      email,
      token,
      payment_id: paymentId,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      used: false,
      client_id: clientId,
    };
    console.log('Test data:', testData);

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.error('❌ Error inserting test record:', testError);
      throw testError;
    }
    console.log('✅ Test record inserted:', test);

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/test?token=${token}`;

    console.log(`📧 Sending access email to ${email} with URL: ${accessUrl}`);
    await sendAccessEmail(email, accessUrl);

    return res.status(200).json({ ok: true, testId: test.id, email });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};