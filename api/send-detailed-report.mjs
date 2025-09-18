export const config = { runtime: "nodejs" };

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const metricsToHtml = (metrics) => {
  let table = '<table style="width: 100%; border-collapse: collapse;">'
  table += '<tr><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Metric</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Value</th></tr>';
  for (const [key, value] of Object.entries(metrics)) {
    table += `<tr><td style="border: 1px solid #ddd; padding: 8px;">${key}</td><td style="border: 1px solid #ddd; padding: 8px;">${JSON.stringify(value, null, 2)}</td></tr>`;
  }
  table += '</table>';
  return table;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userEmail, detailedReport, metrics } = req.body;

    if (!userEmail || !detailedReport || !metrics) {
      return res.status(400).json({ error: 'userEmail, detailedReport, and metrics are required' });
    }

    const htmlBody = `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Детальный отчет</h1>
          <p><strong>Пользователь:</strong> ${userEmail}</p>
          <h2 style="color: #333;">Метрики:</h2>
          ${metricsToHtml(metrics)}
          <h2 style="color: #333;">Отчет:</h2>
          <div>${detailedReport}</div>
        </div>
      </body>
    `;

    await resend.emails.send({
      from: 'NeuroCheck <results@neurocheck.ru>',
      to: ['neurochecking@gmail.com'],
      subject: `Детальный отчет о тестировании для пользователя ${userEmail}`,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-detailed-report handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
