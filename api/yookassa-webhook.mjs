import { Buffer } from 'buffer';
import { getAdminClient } from './_lib/supabaseServer.mjs';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

const USE_UNIFIED_TABLE = false; // Set to true if you ever move to a single 'orders' table

// Словарь переводов
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

// Теперь sendAccessEmail принимает язык
async function sendAccessEmail(email, accessUrl, lang = 'ru') {
  if (!email) {
    console.warn("⚠️ Попытка отправить письмо без email");
    return;
  }

  const t = translations[lang] || translations.ru;

  try {
    const { data, error } = await resend.emails.send({
      from: `NeuroCheck <${process.env.MAIL_FROM}>`,
      // from: 'NeuroCheck <onboarding@resend.dev>',
      to: [email],
      // to: 'delivered@resend.dev',
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

export const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  console.log('📩 Yookassa webhook received');

  try {
    const rawBody = req.rawBody.toString();
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
    const lang = payment.metadata?.lang || 'ru'; // <-- язык из metadata, если передаёте при создании платежа

    console.log(`💳 Payment ID: ${paymentId}, Email: ${email}, Client ID: ${clientId}, Lang: ${lang}`);

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
      lang // сохраняем язык
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
    await sendAccessEmail(email, accessUrl, lang);

    return res.status(200).json({ ok: true, testId: test.id, email });
  } catch (error) {
    console.error('❌ Webhook Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};