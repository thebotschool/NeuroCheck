export const config = { runtime: "nodejs" };

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const resultsToHtml = (results) => {
  let table = '<table style="width: 100%; border-collapse: collapse;">'
  table += '<tr><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Result</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Value</th></tr>';
  for (const [key, value] of Object.entries(results)) {
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
    const { email, results } = req.body;

    if (!email || !results) {
      return res.status(400).json({ error: 'Email and results are required' });
    }

    const htmlBody = `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Здравствуйте!</h1>
          <p>Вы успешно завершили тестирование NeuroCheck.</p>
          <p>Ваши результаты:</p>
          ${resultsToHtml(results)}
          <p>С уважением,<br>Команда NeuroCheck</p>
        </div>
      </body>
    `;

    await resend.emails.send({
      from: 'NeuroCheck <results@neurocheck.ru>',
      to: [email],
      subject: 'Результаты вашего тестирования NeuroCheck',
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-test-results handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
