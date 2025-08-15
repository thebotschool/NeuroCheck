import React from 'react';

interface LoadingScreenProps {
  progress?: number; // 0..100
  title?: string;
  subtitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress = 0, title = 'Загрузка', subtitle = 'Пожалуйста, подождите...' }) => {
  const pct = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-6">
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }
      `}</style>

      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold">{title}</h1>
          <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: 'transparent' }}>
          <div className="mb-6">
            {/* Decorative hero area — you can replace with images or SVGs */}
            <div className="w-full h-40 rounded-xl bg-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-semibold">Подготовка отчёта</div>
                <div className="text-xs text-muted-foreground mt-1">Это может занять несколько секунд</div>
              </div>
            </div>
          </div>

          <div className="relative h-14 rounded-full bg-gray-200 overflow-hidden">
            <div
              aria-hidden
              className="absolute left-0 top-0 h-full"
              style={{
                width: `${pct}%`,
                transition: 'width 700ms cubic-bezier(.2,.9,.2,1)',
                background: 'linear-gradient(90deg,#6D28D9 0%, #A78BFA 40%, #FDE68A 70%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 3s linear infinite',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="font-semibold text-sm md:text-base">{pct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
