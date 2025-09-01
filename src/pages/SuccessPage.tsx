import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = localStorage.getItem('payment_client_id');
    if (!clientId) {
      setError('Не удалось найти идентификатор платежа. Пожалуйста, проверьте свою электронную почту для получения ссылки на тест.');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/get-token-by-client-id?clientId=${clientId}`);
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          clearInterval(interval);
          localStorage.removeItem('payment_client_id');
        }
      } catch (e) {
        console.error('Ошибка при получении токена:', e);
      }
    }, 3000); // Poll every 3 seconds

    // Clear interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleGoToTest = () => {
    if (token) {
      navigate(`/test?token=${token}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Оплата прошла успешно!</h2>
        {error && <p className="text-red-500">{error}</p>}
        {!token && !error && (
          <p className="text-gray-600">Пожалуйста, подождите, мы готовим вашу ссылку для тестирования...</p>
        )}
        {token && (
          <div>
            <p className="text-gray-600">Ваша ссылка на тест готова.</p>
            <button
              onClick={handleGoToTest}
              className="mt-4 w-full bg-black text-white py-2 rounded"
            >
              Перейти к тестированию
            </button>
          </div>
        )}
         {!token && !error && (
            <p className="text-sm text-gray-500 mt-4">
                Если ссылка не появится в течение минуты, проверьте почту.
            </p>
         )}
      </div>
    </div>
  );
};

export default SuccessPage;
