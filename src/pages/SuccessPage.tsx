import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SuccessPage = () => {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const clientId = localStorage.getItem('payment_client_id');
    if (!clientId) {
      setError(t('successPage.error.noClientId'));
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
        console.error('Error fetching token:', e);
        setError(t('successPage.error.fetchToken'));
      }
    }, 3000);

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, 60000);

    const cleanup = () => {
      clearInterval(pollingInterval);
      clearTimeout(timeout);
      localStorage.removeItem('payment_client_id');
    };

    if (token || timedOut || error) {
      cleanup();
    }

    return cleanup;
  }, [token, timedOut, error, t]);

  useEffect(() => {
    if (token && email) {
      const testUrl = `${window.location.origin}/test?token=${token}`;
      fetch('/api/send-payment-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, testUrl, lang: i18n.language }), // 👈 добавили язык
      });
    }
  }, [token, email, i18n.language]);

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
      return <p className="text-gray-600">{t('successPage.redirect')}</p>;
    }
    if (timedOut) {
      return <p className="text-gray-600">{t('successPage.timedOut')}</p>;
    }
    return (
      <div>
        <p className="text-gray-600">{t('successPage.wait')}</p>
        <p className="text-sm text-gray-500 mt-4">{t('successPage.waitNote')}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {error || timedOut
            ? t('successPage.title.failure')
            : t('successPage.title.success')}
        </h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default SuccessPage;
