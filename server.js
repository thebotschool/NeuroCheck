const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const rawBody = require('raw-body');

// Импорт хендлеров из api
const { handler: consumePromoHandler } = require('./api/consume-promo.js');
const { handler: consumeTokenHandler } = require('./api/consume-token.js');
const { handler: createEpointPaymentHandler } = require('./api/create-epoint-payment.js');
const { handler: createPaymentHandler } = require('./api/create-payment.js');
const { handler: createPromoHandler } = require('./api/create-promo.js');
const { handler: epointWebhookHandler } = require('./api/epoint-webhook.js');
const { handler: getTokenByClientIdHandler } = require('./api/get-token-by-client-id.js');
const { handler: resetDevTokenHandler } = require('./api/reset-dev-token.js');
const { handler: sendDetailedReportHandler } = require('./api/send-detailed-report.js');
const { handler: sendPaymentConfirmationHandler } = require('./api/send-payment-confirmation.js');
const { handler: sendTestResultsHandler } = require('./api/send-test-results.js');
const { handler: verifyTokenHandler } = require('./api/verify-token.js');
const { handler: yookassaWebhookHandler } = require('./api/yookassa-webhook.js');

// Импорт утилит из _lib
const { getAdminClient } = require('./api/_lib/supabaseServer.js');

dotenv.config();

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
app.post('/api/reset-dev-token', resetDevTokenHandler);
app.post('/api/send-detailed-report', sendDetailedReportHandler);
app.post('/api/send-payment-confirmation', sendPaymentConfirmationHandler);
app.post('/api/send-test-results', sendTestResultsHandler);
app.get('/api/verify-token', verifyTokenHandler); // Добавлен GET
app.post('/api/yookassa-webhook', yookassaWebhookHandler);

app.use(express.static(path.join(__dirname, 'dist')));

// Изменяем на регулярное выражение для wildcard
app.get(/.*/, (req, res) => {
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