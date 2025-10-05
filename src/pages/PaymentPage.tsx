import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Предполагаю, что используешь shadcn/ui

export const PaymentPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSystem, setPaymentSystem] = useState('yookassa'); // По умолчанию YooKassa
  const { t, i18n } = useTranslation();

  const handlePay = async () => {
    setLoading(true);
    try {
      const clientId = crypto.randomUUID();
      localStorage.setItem('payment_client_id', clientId);

      const endpoint = paymentSystem === 'epoint' ? '/api/create-epoint-payment' : '/api/create-payment';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clientId, lang: i18n.language }), // Добавляем lang
      });

      const contentType = response.headers.get('content-type');
      const data = contentType?.includes('application/json')
        ? await response.json()
        : await response.text();

      if (!response.ok) {
        console.error('Server error:', data);
        alert(t('paymentPage.error.server'));
        return;
      }

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        alert(t('paymentPage.error.noLink'));
      }
    } catch (e) {
      console.error('Request error:', e);
      alert(t('paymentPage.error.request'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {t('paymentPage.title')}
        </h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('paymentPage.email.placeholder')}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <div className="space-y-2">
          <label>{t('paymentPage.selectSystem')}</label>
          <Select value={paymentSystem} onValueChange={setPaymentSystem}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment system" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yookassa">YooKassa (RUB)</SelectItem>
              <SelectItem value="epoint">ePoint (AZN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={handlePay}
          className="w-full bg-black text-white py-2 rounded"
          disabled={loading || !email}
        >
          {loading
            ? t('paymentPage.button.loading')
            : t('paymentPage.button.pay')}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;