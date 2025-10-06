const { Buffer } = require('buffer');
const { getAdminClient } = require('./_lib/supabaseServer.js');
const { Resend } = require('resend');
const { randomUUID } = require('crypto');
const crypto = require('crypto');

const resend = new Resend(process.env.RESEND_API_KEY);

const translations = {
  ru: {
    subject: 'Ссылка на прохождение тестирования NeuroCheck',
    hello: 'Здравствуйте!',
    paid: 'Вы успешно оплатили тестирование NeuroCheck.',
    start: (url) =>
      `Для начала тестирования, пожалуйста, перейдите по <a href="${url}">этой ссылке</a>.`,
    regards: 'С уважением,<br>Команда NeuroCheck'
  },
  en: {
    subject: 'Your NeuroCheck testing link',
    hello: 'Hello!',
    paid: 'You have successfully paid for the NeuroCheck testing.',
    start: (url) =>
      `To start testing, please click <a href="${url}">this link</a>.`,
    regards: 'Best regards,<br>The NeuroCheck Team'
  },
  az: {
    subject: 'NeuroCheck test linkiniz',
    hello: 'Salam!',
    paid: 'Siz NeuroCheck testini uğurla ödəmisiniz.',
    start: (url) =>
      `Testə başlamaq üçün zəhmət olmasa <a href="${url}">bu linkə</a> keçin.`,
    regards: 'Hörmətlə,<br>NeuroCheck komandası'
  },
  he: {
    subject: 'קישור למבחן NeuroCheck',
    hello: 'שלום!',
    paid: 'התשלום עבור מבחן NeuroCheck בוצע בהצלחה.',
    start: (url) =>
      `כדי להתחיל את המבחן אנא לחצו <a href="${url}">כאן</a>.`,
    regards: 'בברכה,<br>צוות NeuroCheck'
  }
};

async function sendAccessEmail(email, accessUrl, lang = 'ru') {
  if (!email) {
    console.warn("⚠️ Попытка отправить письмо без email");
    return;
  }

  const t = translations[lang] || translations.ru;

  try {
    const { data, error } = await resend.emails.send({
      from: `NeuroCheck <${process.env.MAIL_FROM}>`,
      to: [email],
      subject: t.subject,
      html: `
        <h1>${t.hello}</h1>
        <p>${t.paid}</p>
        <p>${t.start(accessUrl)}</p>
        <p>${t.regards}</p>
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

module.exports.handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('📩 ePoint webhook received');

  try {
    // Используем req.rawBody, установленное middleware в server.js
    const rawBody = req.rawBody.toString();
    const params = new URLSearchParams(rawBody);
    const receivedData = params.get('data');
    const receivedSignature = params.get('signature');

    if (!receivedData || !receivedSignature) {
      return res.status(400).json({ error: 'Missing data or signature' });
    }

    const privateKey = process.env.EPOINT_PRIVATE_KEY;

    const sgnString = privateKey + receivedData + privateKey;
    const sha1Hash = crypto.createHash('sha1').update(sgnString).digest();
    const expectedSignature = Buffer.from(sha1Hash).toString('base64');

    if (expectedSignature !== receivedSignature) {
      console.error('❌ Invalid signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    const decodedData = JSON.parse(Buffer.from(receivedData, 'base64').toString('utf-8'));

    const { order_id, status, transaction, amount, message, code, bank_transaction, operation_code, rrn, card_mask, card_name } = decodedData;

    console.log(`Payment details: order_id=${order_id}, status=${status}, code=${code}, message=${message}`);

    if (status !== 'success') {
      console.log(`ℹ️ Payment failed: ${message} (code: ${code})`);
      return res.status(200).send('Payment failed');
    }

    console.log('✅ Processing successful payment');

    const clientId = order_id;

    const supabase = getAdminClient();

    // Читаем из payments по временному payment_id
    const tempPaymentId = `temp_${clientId}`;
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('email, metadata')
      .eq('payment_id', tempPaymentId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ No pending payment found:', paymentError);
      throw new Error('No pending payment for this order_id');
    }

    const email = payment.email;
    const lang = payment.metadata.lang;

    const updatedPaymentData = {
      payment_id: transaction,
      status: status,
      amount: amount,
      currency: 'AZN',
      description: 'цифровой чекап учебных функций',
      email: email,
      metadata: { ...payment.metadata, code, message, bank_transaction, operation_code, rrn, card_mask, card_name },
      updated_at: new Date(),
    };

    const { error: updateError } = await supabase
      .from('payments')
      .upsert(updatedPaymentData, { onConflict: 'payment_id' });

    if (updateError) {
      console.error('❌ Error updating payment:', updateError);
      throw updateError;
    }

    // Token и expires_at
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

    const testData = {
      email,
      token,
      payment_id: transaction,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
      used: false,
      client_id: clientId,
      lang
    };

    const { data: test, error: testError } = await supabase
      .from('tests')
      .insert(testData)
      .select()
      .single();

    if (testError) throw testError;

    const siteUrl = process.env.SITE_URL || 'http://localhost:5173';
    const accessUrl = `${siteUrl}/test?token=${token}`;

    await sendAccessEmail(email, accessUrl, lang);

    return res.status(200).json({ ok: true, testId: test.id, email });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return res.status(500).json({ ok: false, error: 'Unknown error' });
  }
};