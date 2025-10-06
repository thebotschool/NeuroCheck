const { randomUUID } = require('crypto');

module.exports.handler = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const { email, clientId } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!clientId) return res.status(400).json({ error: 'clientId is required' });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const idempotenceKey = randomUUID();

  const paymentPayload = {
    amount: {
      value: '850.00',
      currency: 'RUB',
    },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: `${process.env.SITE_URL}/success`,
    },
    description: 'цифровой чекап учебных функций',
    metadata: { email, clientId },
    receipt: {
      customer: {
        email: email
      },
      items: [
        {
          description: 'цифровой чекап учебных функций',
          quantity: '1.00',
          amount: {
            value: '850.00',
            currency: 'RUB'
          },
          vat_code: '1',
          payment_mode: 'full_prepayment',
          payment_subject: 'commodity'
        }
      ]
    }
  };

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: errorBody });
    }

    const payment = await response.json();
    return res.status(200).json({ confirmation_url: payment.confirmation.confirmation_url });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};