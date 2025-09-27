import React from 'react';
import { useTranslation } from 'react-i18next';

export const LoadingScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold">
          {t('common.loading')}
        </h1>
      </div>
    </div>
  );
};

export default LoadingScreen;
