const express = require('express');
const path = require('path');
const { fileURLToPath } = require('url');
const dotenv = require('dotenv');
const rawBody = require('raw-body');

// Импорт хендлеров из api
const consumePromoHandler = require('./api/consume-promo.js').handler;
const consumeTokenHandler = require('./api/consume-token.js').handler;
const createEpointPaymentHandler = require('./api/create-epoint-payment.js').handler;
const createPaymentHandler = require('./api/create-payment.js').handler;
const createPromoHandler = require('./api/create-promo.js').handler;
const epointWebhookHandler = require('./api/epoint-webhook.js').handler;
const getTokenByClientIdHandler = require('./api/get-token-by-client-id.js').handler;
const resetDevTokenHandler = require('./api/reset-dev-token.js').handler;
const sendDetailedReportHandler = require('./api/send-detailed-report.js').handler;
const sendPaymentConfirmationHandler = require('./api/send-payment-confirmation.js').handler;
const sendTestResultsHandler = require('./api/send-test-results.js').handler;
const verifyTokenHandler = require('./api/verify-token.js').handler;
const yookassaWebhookHandler = require('./api/yookassa-webhook.js').handler;

// Импорт утилит из _lib
const { getAdminClient } = require('./api/_lib/supabaseServer.js');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware для обработки raw body (для вебхуков)
app.use((req, res, next) => {
  rawBody(req, {
    limit: '1mb',
    encoding: 'utf8'
  }).then(rawBody => {
    req.rawBody = rawBody;
    next();
  }).catch(next);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.post('/api/consume-promo', consumePromoHandler);
app.post('/api/consume-token', consumeTokenHandler);
app.post('/api/create-epoint-payment', createEpointPaymentHandler);
app.post('/api/create-payment', createPaymentHandler);
app.post('/api/create-promo', createPromoHandler);
app.post('/api/epoint-webhook', epointWebhookHandler);
app.get('/api/get-token-by-client-id', getTokenByClientIdHandler); // Добавлен GET
app.post('/api/get-token-by-client-id', getTokenByClientIdHandler); // Оставлен POST
app.post('/api/reset-dev-token', resetDevTokenHandler);
app.post('/api/send-detailed-report', sendDetailedReportHandler);
app.post('/api/send-payment-confirmation', sendPaymentConfirmationHandler);
app.post('/api/send-test-results', sendTestResultsHandler);
app.get('/api/verify-token', verifyTokenHandler); // Добавлен GET
app.post('/api/verify-token', verifyTokenHandler); // Оставлен POST
app.post('/api/yookassa-webhook', yookassaWebhookHandler);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ ok: false, error: 'Internal server error' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});