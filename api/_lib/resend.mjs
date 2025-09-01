import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY is not defined in environment variables.');
}

const resend = new Resend(resendApiKey);

export const sendAccessEmail = async (email, accessUrl) => {
  try {
    await resend.emails.send({
      from: `NeuroCheck <${process.env.MAIL_FROM}>`,
      to: email,
      subject: 'Доступ к тестированию NeuroCheck',
      html: `
        <h1>Доступ к тестированию NeuroCheck</h1>
        <p>Здравствуйте!</p>
        <p>Вы успешно оплатили тестирование. Ваша ссылка для доступа:</p>
        <p><a href="${accessUrl}">${accessUrl}</a></p>
        <p>Ссылка действительна в течение 24 часов.</p>
        <p>С уважением,<br>Команда NeuroCheck</p>
      `,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    // Do not re-throw the error to avoid failing the webhook response
  }
};