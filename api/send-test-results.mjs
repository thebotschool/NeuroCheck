
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, results } = req.body;

    if (!email || !results) {
      return res.status(400).json({ error: 'Email and results are required' });
    }

    await resend.emails.send({
      from: 'NeuroCheck <noreply@neurocheck.ru>',
      to: [email],
      subject: 'Результаты вашего тестирования NeuroCheck',
      html: `
        <h1>Здравствуйте!</h1>
        <p>Вы успешно завершили тестирование NeuroCheck.</p>
        <p>Ваши результаты:</p>
        <pre>${JSON.stringify(results, null, 2)}</pre>
        <p>С уважением,<br>Команда NeuroCheck</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-test-results handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
