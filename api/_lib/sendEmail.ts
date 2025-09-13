import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendReportEmail = async (testData) => {
  try {
    const reportPath = path.resolve(process.cwd(), 'public', 'NeuroCheck_Report.md');
    const reportTemplate = await fs.readFile(reportPath, 'utf-8');

    const reportContent = reportTemplate
      .replace('{age}', testData.age)
      .replace('{cpt_results}', JSON.stringify(testData.memory_results, null, 2))
      .replace('{gonogo_results}', JSON.stringify(testData.gonogo_results, null, 2))
      .replace('{tcp_results}', JSON.stringify(testData.tcp_results, null, 2));

    await transporter.sendMail({
      from: 'results@neurocheck.ru',
      to: 'reports@neurocheck.ru',
      subject: 'Отчет о прохождении теста NeuroCheck',
      html: `
        <h1>Отчет о прохождении теста</h1>
        <p>Пользователь ${testData.email} прошел тест.</p>
      `,
      attachments: [
        {
          filename: 'NeuroCheck_Report.md',
          content: reportContent,
        },
      ],
    });
  } catch (error) {
    console.error('Error sending report email:', error);
  }
};
