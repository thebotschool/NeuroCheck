import React from 'react';

const SuccessPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-900">Оплата прошла успешно!</h2>
        <p className="text-gray-600">Мы отправили письмо со ссылкой для прохождения теста на вашу электронную почту.</p>
      </div>
    </div>
  );
};

export default SuccessPage;
