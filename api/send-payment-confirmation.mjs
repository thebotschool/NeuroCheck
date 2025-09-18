export const config = { runtime: "nodejs" };

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, testUrl } = req.body;

    if (!email || !testUrl) {
      return res.status(400).json({ error: 'Email and testUrl are required' });
    }

    await resend.emails.send({
      from: 'NeuroCheck <noreply@neurocheck.ru>',
      to: [email],
      subject: 'Ссылка на прохождение тестирования NeuroCheck',
      html: `
        <h1>Здравствуйте!</h1>
        <p>Вы успешно оплатили тестирование NeuroCheck.</p>
        <p>Для начала тестирования, пожалуйста, перейдите по <a href="${testUrl}">этой ссылке</a>.</p>
        <p>С уважением,<br>Команда NeuroCheck</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-payment-confirmation handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
