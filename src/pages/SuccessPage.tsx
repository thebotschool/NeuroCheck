import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SuccessPage = () => {
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const clientId = localStorage.getItem('payment_client_id');
    if (!clientId) {
      setError('Не удалось найти идентификатор платежа. Пожалуйста, проверьте свою электронную почту для получения ссылки на тест.');
      return;
    }

    const pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/get-token-by-client-id?clientId=${clientId}`);
        const data = await response.json();
        if (data.token) {
          setToken(data.token);
          setEmail(data.email);
        }
      } catch (e) {
        console.error('Ошибка при получении токена:', e);
        setError('Произошла ошибка при получении статуса платежа.');
      }
    }, 3000); // Poll every 3 seconds

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 60000); // 1 minute timeout

    // Cleanup function
    const cleanup = () => {
      clearInterval(pollingInterval);
      clearTimeout(timeout);
      localStorage.removeItem('payment_client_id');
    };

    if (token || timedOut || error) {
      cleanup();
    }

    return cleanup;
  }, [token, timedOut, error]); // Rerun effect if token changes (to cleanup)

  useEffect(() => {
    if (token && email) {
      const testUrl = `${window.location.origin}/test?token=${token}`;
      fetch('/api/send-payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, testUrl }),
      });
    }
  }, [token, email]);

  useEffect(() => {
    if (token) {
      navigate(`/test?token=${token}`);
    }
  }, [token, navigate]);


  const renderContent = () => {
    if (error) {
      return <p className="text-red-500">{error}</p>;
    }
    if (token) {
      return (
        <div>
          <p className="text-gray-600">Перенаправляем на страницу теста...</p>
        </div>
      );
    }
    if (timedOut) {
      return (
        <p className="text-gray-600">
          Ссылка для тестирования была отправлена на вашу почту. Если вы не видите письма, проверьте папку 'Спам'.
        </p>
      );
    }
    return (
      <div>
        <p className="text-gray-600">Пожалуйста, подождите, мы готовим вашу ссылку для тестирования...</p>
        <p className="text-sm text-gray-500 mt-4">
          Это может занять до минуты.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Оплата прошла успешно!</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default SuccessPage;
