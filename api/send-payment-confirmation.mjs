import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// шаблоны писем
const emailTemplates = {
  ru: {
    subject: 'Ссылка на прохождение тестирования NeuroCheck',
    html: (testUrl) => `
      <h1>Здравствуйте!</h1>
      <p>Вы успешно оплатили тестирование NeuroCheck.</p>
      <p>Для начала тестирования, пожалуйста, перейдите по <a href="${testUrl}">этой ссылке</a>.</p>
      <p>С уважением,<br>Команда NeuroCheck</p>
    `
  },
  en: {
    subject: 'Your NeuroCheck testing link',
    html: (testUrl) => `
      <h1>Hello!</h1>
      <p>You have successfully purchased NeuroCheck testing.</p>
      <p>Please click <a href="${testUrl}">this link</a> to start your test.</p>
      <p>Best regards,<br>The NeuroCheck Team</p>
    `
  },
  az: {
    subject: 'NeuroCheck testinə keçid linki',
    html: (testUrl) => `
      <h1>Salam!</h1>
      <p>Siz NeuroCheck testini uğurla satın aldınız.</p>
      <p>Testə başlamaq üçün zəhmət olmasa <a href="${testUrl}">bu linkə</a> keçin.</p>
      <p>Hörmətlə,<br>NeuroCheck komandası</p>
    `
  },
  he: {
    subject: 'קישור למבחן NeuroCheck',
    html: (testUrl) => `
      <h1>שלום!</h1>
      <p>רכשת בהצלחה את מבחן NeuroCheck.</p>
      <p>כדי להתחיל את המבחן, לחץ על <a href="${testUrl}">קישור זה</a>.</p>
      <p>בברכה,<br>צוות NeuroCheck</p>
    `
  },
};

export const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, testUrl, lang } = req.body;

    if (!email || !testUrl) {
      return res.status(400).json({ error: 'Email and testUrl are required' });
    }

    // выбор языка, по умолчанию русский
    const chosenLang = emailTemplates[lang] ? lang : 'ru';
    const { subject, html } = emailTemplates[chosenLang];

    await resend.emails.send({
      from: 'NeuroCheck <noreply@neurocheck.ru>',
      // from: 'NeuroCheck <onboarding@resend.dev>',
      to: [email],
      // to: 'delivered@resend.dev',
      subject: subject,
      html: html(testUrl),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-payment-confirmation handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};