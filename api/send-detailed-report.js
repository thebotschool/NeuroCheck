const { Resend } = require('resend');

// Инициализация Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Словарь для переводов
const translations = {
  ru: {
    title: "Детальный отчет",
    user: "Пользователь",
    metrics: "Метрики",
    report: "Отчет",
    subject: (email) => `Детальный отчет о тестировании для пользователя ${email}`,
    metricHeader: "Метрика",
    valueHeader: "Значение"
  },
  en: {
    title: "Detailed Report",
    user: "User",
    metrics: "Metrics",
    report: "Report",
    subject: (email) => `Detailed testing report for user ${email}`,
    metricHeader: "Metric",
    valueHeader: "Value"
  },
  az: {
    title: "Ətraflı Hesabat",
    user: "İstifadəçi",
    metrics: "Metriklər",
    report: "Hesabat",
    subject: (email) => `İstifadəçi üçün ətraflı test hesabatı: ${email}`,
    metricHeader: "Metrika",
    valueHeader: "Dəyər"
  },
  he: {
    title: "דו\"ח מפורט",
    user: "משתמש",
    metrics: "מדדים",
    report: "דו\"ח",
    subject: (email) => `דו\"ח בדיקה מפורט עבור המשתמש ${email}`,
    metricHeader: "מדד",
    valueHeader: "ערך"
  }
};

// Функция для таблицы метрик
const metricsToHtml = (metrics, t) => {
  let table = '<table style="width: 100%; border-collapse: collapse;">';
  table += `<tr>
    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">${t.metricHeader}</th>
    <th style="border: 1px solid #ddd; padding: 8px; background-color: #f2f2f2; text-align: left;">${t.valueHeader}</th>
  </tr>`;
  for (const [key, value] of Object.entries(metrics)) {
    table += `<tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${key}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${JSON.stringify(value, null, 2)}</td>
    </tr>`;
  }
  table += '</table>';
  return table;
};

module.exports.handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userEmail, detailedReport, metrics, lang } = req.body;

    if (!userEmail || !detailedReport || !metrics) {
      return res.status(400).json({ error: 'userEmail, detailedReport, and metrics are required' });
    }

    // Динамический импорт marked внутри хендлера
    const { marked } = await import('marked');

    // Выбираем язык (по умолчанию русский)
    const t = translations[lang] || translations.ru;

    const htmlBody = `
      <body style="font-family: Arial, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">${t.title}</h1>
          <p><strong>${t.user}:</strong> ${userEmail}</p>
          <h2 style="color: #333;">${t.metrics}:</h2>
          ${metricsToHtml(metrics, t)}
          <h2 style="color: #333;">${t.report}:</h2>
          <div>${marked.parse(detailedReport)}</div>
        </div>
      </body>
    `;

    await resend.emails.send({
      from: `NeuroCheck <${process.env.MAIL_FROM}>`,
      to: [userEmail],
      subject: t.subject(userEmail),
      html: htmlBody,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error in send-detailed-report handler:', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
};