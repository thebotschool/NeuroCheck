import { MailerSend, EmailParams, Sender, Recipient, Attachment } from 'mailersend';

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

const FROM_EMAIL = process.env.MAIL_FROM || 'info@test-eqvygm0ko3dl0p7w.mlsender.net';
const FROM_NAME = 'NeuroCheck';

export const sendAccessEmail = async (email: string, accessUrl: string) => {
  try {
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(email, '')];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('Доступ к тестированию NeuroCheck')
      .setHtml(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Доступ к тестированию NeuroCheck</h1>
          <p>Здравствуйте!</p>
          <p>Вы успешно оплатили тестирование. Ваша ссылка для доступа:</p>
          <div style="margin: 20px 0;">
            <a href="${accessUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Пройти тестирование
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Или скопируйте ссылку: <br>
            <code style="background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${accessUrl}</code>
          </p>
          <p style="color: #666; font-size: 14px;">
            Ссылка не имеет срока действия - вы можете пройти тестирование в любое удобное время.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 12px;">
            С уважением,<br>
            Команда NeuroCheck
          </p>
        </div>
      `)
      .setText(`
        Доступ к тестированию NeuroCheck
        
        Здравствуйте!
        
        Вы успешно оплатили тестирование. Ваша ссылка для доступа:
        ${accessUrl}
        
        Ссылка не имеет срока действия - вы можете пройти тестирование в любое удобное время.
        
        С уважением,
        Команда NeuroCheck
      `);

    const response = await mailerSend.email.send(emailParams);
    console.log('Access email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending access email:', error);
    throw error;
  }
};

export const sendResultsEmail = async (
  email: string, 
  reportHtml: string, 
  testId: string,
  pdfBuffer?: Buffer
) => {
  try {
    const sentFrom = new Sender(FROM_EMAIL, FROM_NAME);
    const recipients = [new Recipient(email, '')];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject('Результаты тестирования NeuroCheck')
      .setHtml(`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Результаты тестирования NeuroCheck</h1>
          <p>Здравствуйте!</p>
          <p>Ваше тестирование успешно завершено. Ниже представлены результаты:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${reportHtml}
          </div>
          
          ${pdfBuffer ? '<p>Детальный отчет также прикреплен к письму в формате PDF.</p>' : ''}
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #666; font-size: 12px;">
            С уважением,<br>
            Команда NeuroCheck
          </p>
        </div>
      `)
      .setText(`
        Результаты тестирования NeuroCheck
        
        Здравствуйте!
        
        Ваше тестирование успешно завершено. Результаты доступны в прикрепленном файле или по ссылке в личном кабинете.
        
        С уважением,
        Команда NeuroCheck
      `);

    // Добавляем PDF как вложение, если он есть
    if (pdfBuffer) {
      const attachments = [
        new Attachment(
          pdfBuffer.toString('base64'),
          `neuro-report-${testId}.pdf`,
          'attachment'
        )
      ];
      emailParams.setAttachments(attachments);
    }

    const response = await mailerSend.email.send(emailParams);
    console.log('Results email sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending results email:', error);
    throw error;
  }
};