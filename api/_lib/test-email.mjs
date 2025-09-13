import { sendReportEmail } from './sendEmail.js';

const testData = {
  email: 'test@example.com',
  age: 10,
  memory_results: { score: 100, details: 'some details' },
  gonogo_results: { score: 95, details: 'some details' },
  tcp_results: { score: 98, details: 'some details' },
};

console.log('Sending test email...');
sendReportEmail(testData)
  .then(() => console.log('Test email sent successfully!'))
  .catch((error) => console.error('Error sending test email:', error));
