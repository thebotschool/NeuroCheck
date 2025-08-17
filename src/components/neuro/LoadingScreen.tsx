import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold">Загрузка...</h1>
      </div>
    </div>
  );
};

export default LoadingScreen;
