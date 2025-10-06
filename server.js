import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Импорт хендлеров из api
import { handler as consumePromoHandler } from './api/consume-promo.mjs';
import { handler as consumeTokenHandler } from './api/consume-token.mjs';
import { handler as createEpointPaymentHandler } from './api/create-epoint-payment.mjs';
import { handler as createPaymentHandler } from './api/create-payment.mjs';
import { handler as createPromoHandler } from './api/create-promo.mjs';
import { handler as epointWebhookHandler } from './api/epoint-webhook.mjs';
import { handler as getTokenByClientIdHandler } from './api/get-token-by-client-id.mjs';
import { handler as resetDevTokenHandler } from './api/reset-dev-token.mjs';
import { handler as sendDetailedReportHandler } from './api/send-detailed-report.mjs';
import { handler as sendPaymentConfirmationHandler } from './api/send-payment-confirmation.mjs';
import { handler as sendTestResultsHandler } from './api/send-test-results.mjs';
import { handler as verifyTokenHandler } from './api/verify-token.mjs';
import { handler as yookassaWebhookHandler } from './api/yookassa-webhook.mjs';

// Импорт утилит из _lib
import { getAdminClient } from './api/_lib/supabaseServer.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/consume-promo', consumePromoHandler);
app.post('/api/consume-token', consumeTokenHandler);
app.post('/api/create-epoint-payment', createEpointPaymentHandler);
app.post('/api/create-payment', createPaymentHandler);
app.post('/api/create-promo', createPromoHandler);
app.post('/api/epoint-webhook', epointWebhookHandler);
app.post('/api/get-token-by-client-id', getTokenByClientIdHandler);
app.post('/api/reset-dev-token', resetDevTokenHandler);
app.post('/api/send-detailed-report', sendDetailedReportHandler);
app.post('/api/send-payment-confirmation', sendPaymentConfirmationHandler);
app.post('/api/send-test-results', sendTestResultsHandler);
app.post('/api/verify-token', verifyTokenHandler);
app.post('/api/yookassa-webhook', yookassaWebhookHandler);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});