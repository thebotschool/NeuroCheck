export const config = { runtime: "nodejs" };

import { Buffer } from 'buffer';
import { getAdminClient } from './_lib/supabaseServer.mjs';
import { sendAccessEmail } from './_lib/resend.mjs';
import { randomUUID } from 'crypto';

const USE_UNIFIED_TABLE = false; // Set to true to use a single 'orders' table

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

export default async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('Yookassa webhook received');

  try {
    const rawBody = await readRawBody(req);
    console.log('Webhook raw body:', rawBody);

    const payload = JSON.parse(rawBody);
    console.log('Webhook payload:', payload);

    if (payload.event !== 'payment.succeeded') {
      console.log(`Event ignored: ${payload.event}`);
      return res.status(200).send('Event ignored');
    }

    console.log('Processing payment.succeeded event');
    const { object: payment } = payload;
    const paymentId = payment.id;
    let email = payment.metadata?.email || payment.customer?.email;
    const clientId = payment.metadata?.clientId;

    console.log(`Payment ID: ${paymentId}, Email: ${email}, Client ID: ${clientId}`);

    if (!email) {
      console.warn(`Email not found in metadata or customer info for payment ${paymentId}.`);
      email = '';
    }

    const supabase = getAdminClient();
    console.log('Supabase client created');

    if (USE_UNIFIED_TABLE) {
      // Logic for a single 'orders' table (not implemented as per current schema)
    } else {
      console.log('Upserting payment record...');
      const paymentData = {
        payment_id: paymentId,
        status: payment.status,
        amount: payment.amount.value,
        currency: payment.amount.currency,
        description: payment.description,
        email: email,
        metadata: payment.metadata,
        updated_at: new Date(),
      };
      console.log('Payment data to upsert:', paymentData);

      const { error: paymentError } = await supabase.from('payments').upsert(paymentData, { onConflict: 'payment_id' });

      if (paymentError) {
        console.error('Error upserting payment:', paymentError);
        throw paymentError;
      }
      console.log('Payment record upserted successfully');
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

    console.log('Inserting test record...');
    const testData = {
      email,
      token,
      payment_id: paymentId,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      used: false,
      client_id: clientId,
    };
    console.log('Test data to insert:', testData);

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert(testData)
      .select()
      .single();

    if (testError) {
      console.error('Error inserting test record:', testError);
      throw testError;
    }
    console.log('Test record inserted successfully:', test);

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/test?token=${token}`;

    console.log(`Sending access email to ${email} with URL: ${accessUrl}`);
    await sendAccessEmail(email, accessUrl);
    console.log('Access email sent');

    return res.status(200).json({ ok: true, testId: test.id, email });

  } catch (error) {
    console.error('Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};