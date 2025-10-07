const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const resultsToHtml = (results) => {
  let table = '<table style="width: 100%; border-collapse: collapse;">';
  table += '<tr><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Result</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Value</th></tr>';

  for (const [key, value] of Object.entries(results)) {
    if (key === 'report' && typeof value === 'string') {
      // Placeholder для marked, будет обработан внутри хендлера
      table += `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${value}</td>
      </tr>`;
    } else {
      table += `<tr>
        <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${JSON.stringify(value, null, 2)}</td>
      </tr>`;
    }
  }
  table += '</table>';
  return table;
};

// Шаблоны писем
const emailTemplates = {
  ru: {
    subject: 'Результаты вашего тестирования NeuroCheck',
    html: (resultsHtml) => `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Здравствуйте!</h1>
          <p>Вы успешно завершили тестирование NeuroCheck.</p>
          <p>Ваши результаты:</p>
          ${resultsHtml}
          <p>С уважением,<br>Команда NeuroCheck</p>
        </div>
      </body>
    `
  },
  en: {
    subject: 'Your NeuroCheck Test Results',
    html: (resultsHtml) => `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Hello!</h1>
          <p>You have successfully completed the NeuroCheck test.</p>
          <p>Your results:</p>
          ${resultsHtml}
          <p>Best regards,<br>The NeuroCheck Team</p>
        </div>
      </body>
    `
  },
  az: {
    subject: 'NeuroCheck testinizin nəticələri',
    html: (resultsHtml) => `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Salam!</h1>
          <p>Siz NeuroCheck testini uğurla başa vurdunuz.</p>
          <p>Nəticələriniz:</p>
          ${resultsHtml}
          <p>Hörmətlə,<br>NeuroCheck komandası</p>
        </div>
      </body>
    `
  },
  he: {
    subject: 'תוצאות מבחן ה-NeuroCheck שלך',
    html: (resultsHtml) => `
      <body style="font-family: Arial, sans-serif; line-height: 1.6; direction: rtl; text-align: right;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">שלום!</h1>
          <p>סיימת בהצלחה את מבחן NeuroCheck.</p>
          <p>התוצאות שלך:</p>
          ${resultsHtml}
          <p>בברכה,<br>צוות NeuroCheck</p>
        </div>
      </body>
    `
  },
};

module.exports.handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, results, lang } = req.body;

    if (!email || !results) {
      return res.status(400).json({ error: 'Email and results are required' });
    }

    // Динамический импорт marked внутри хендлера
    const { marked } = await import('marked');

    // Переопределяем resultsToHtml с использованием marked
    const resultsToHtmlWithMarked = (results) => {
      let table = '<table style="width: 100%; border-collapse: collapse;">';
      table += '<tr><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Result</th><th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">Value</th></tr>';

      for (const [key, value] of Object.entries(results)) {
        if (key === 'report' && typeof value === 'string') {
          const htmlReport = marked.parse(value);
          table += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${htmlReport}</td>
          </tr>`;
        } else {
          table += `<tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${JSON.stringify(value, null, 2)}</td>
          </tr>`;
        }
      }
      table += '</table>';
      return table;
    };

    const chosenLang = emailTemplates[lang] ? lang : 'ru';
    const { subject, html } = emailTemplates[chosenLang];

    const htmlBody = html(resultsToHtmlWithMarked(results));

    await resend.emails.send({
      from: `NeuroCheck <${process.env.SITE_URL}>`,
      to: [email],
      subject: subject,
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-test-results handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};