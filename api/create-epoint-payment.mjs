export const config = { runtime: "nodejs" };

import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { getAdminClient } from './_lib/supabaseServer.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email, clientId, lang } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });

  const publicKey = process.env.EPOINT_PUBLIC_KEY;
  const privateKey = process.env.EPOINT_PRIVATE_KEY;
  const amount = process.env.EPOINT_AMOUNT_AZN || "15.00";
  const currency = process.env.EPOINT_CURRENCY || "AZN";
  const orderId = clientId; // Используем clientId как order_id
  const description = 'цифровой чекап учебных функций';
  const successUrl = `${process.env.SITE_URL}/success`;
  const errorUrl = `${process.env.SITE_URL}/payment`;
  const language = lang === 'az' ? 'az' : lang === 'ru' ? 'ru' : 'en';

  const jsonString = JSON.stringify({
    public_key: publicKey,
    amount,
    currency,
    language,
    order_id: orderId,
    description,
    success_redirect_url: successUrl,
    error_redirect_url: errorUrl,
  });

  const data = Buffer.from(jsonString).toString('base64');

  const sgnString = privateKey + data + privateKey;

  const sha1Hash = crypto.createHash('sha1').update(sgnString).digest();
  const signature = Buffer.from(sha1Hash).toString('base64');

  try {
    const response = await fetch('https://epoint.az/api/1/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data, signature }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: errorBody });
    }

    const result = await response.json();
    if (result.status === 'success' && result.redirect_url) {
      const supabase = getAdminClient();
      const tempPaymentId = `temp_${clientId}`;
      const paymentData = {
        payment_id: tempPaymentId,
        status: 'pending',
        amount: amount,
        currency: currency,
        description: description,
        email: email,
        metadata: { clientId, lang },
        updated_at: new Date(),
      };

      const { error: insertError } = await supabase
        .from('payments')
        .upsert(paymentData, { onConflict: 'payment_id' });

      if (insertError) {
        console.error('Error inserting pending payment:', insertError);
        return res.status(500).json({ error: 'Failed to save pending payment' });
      }

      return res.status(200).json({ confirmation_url: result.redirect_url });
    } else {
      return res.status(400).json({ error: 'No redirect URL from ePoint' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}