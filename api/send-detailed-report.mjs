export const config = { runtime: "nodejs" };

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userEmail, detailedReport, metrics } = req.body;

    if (!userEmail || !detailedReport || !metrics) {
      return res.status(400).json({ error: 'userEmail, detailedReport, and metrics are required' });
    }

    await resend.emails.send({
      from: 'NeuroCheck <noreply@neurocheck.ru>',
      to: ['reports@neurocheck.ru'],
      subject: `Детальный отчет о тестировании для пользователя ${userEmail}`,
      html: `
        <h1>Детальный отчет</h1>
        <p><strong>Пользователь:</strong> ${userEmail}</p>
        <h2>Метрики:</h2>
        <pre>${JSON.stringify(metrics, null, 2)}</pre>
        <h2>Отчет:</h2>
        <div>${detailedReport}</div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-detailed-report handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
