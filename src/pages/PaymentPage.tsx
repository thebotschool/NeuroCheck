import { useState } from 'react';

export const PaymentPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      console.error('Ошибка от сервера:', data);
      alert('Ошибка при создании платежа');
      return;
    }

    if (data.confirmation_url) {
      window.location.href = data.confirmation_url;
    } else {
      alert('Не удалось получить ссылку на оплату');
    }
  } catch (e) {
    console.error('Ошибка запроса:', e);
    alert('Ошибка при создании оплаты');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Оплата тестирования</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Введите email"
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button
          onClick={handlePay}
          className="w-full bg-black text-white py-2 rounded"
          disabled={loading || !email}
        >
          {loading ? 'Создание оплаты...' : 'Перейти к оплате'}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;