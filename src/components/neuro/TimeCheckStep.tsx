import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

interface TimeCheckStepProps {
  onSuccess: () => void;
  progress?: number;
  onBack?: () => void;
}

export const TimeCheckStep = ({ onSuccess, progress, onBack }: TimeCheckStepProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimeValid, setIsTimeValid] = useState(false);
  const requireWindow = import.meta.env.VITE_REQUIRE_TIME_WINDOW !== 'true';
  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true';

  useEffect(() => {
    if (!requireWindow) {
      // Auto-skip if window is not required
      onSuccess();
      return;
    }
    const checkTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const hour = now.getHours();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Check if it's weekday (Monday-Friday) and between 9:00-10:00
      const isWeekday = day >= 1 && day <= 5;
      const isValidHour = hour >= 9 && hour < 10;
      
      setIsTimeValid(isWeekday && isValidHour);
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    
    return () => clearInterval(interval);
  }, [requireWindow, onSuccess]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => onBack && onBack()}
            aria-label="Назад"
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
              <div className="h-3 rounded-full bg-black" style={{ width: `${Math.round((progress ?? 0.2) * 100)}%`, transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }} />
            </div>
          </div>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              Проверка времени
            </CardTitle>
            <CardDescription>
              Тестирование доступно только в определённое время
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-2xl font-mono font-bold">
                {formatTime(currentTime)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(currentTime)}
              </div>
            </div>

            {isTimeValid ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-semibold">
                    Время для тестирования доступно!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Можно начинать прохождение тестов
                  </p>
                </div>
                <Button onClick={onSuccess} className="w-full">
                  Начать тестирование
                </Button>
                {showDevControls && (
                  <Button variant="outline" className="w-full" onClick={onSuccess}>
                    Пропустить проверку времени (dev)
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <Clock className="mx-auto h-8 w-8 text-destructive mb-2" />
                  <p className="text-destructive font-semibold">
                    Тестирование недоступно
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Тест доступен только <strong>с 9:00 до 10:00</strong> по будням (понедельник - пятница)
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Попробуйте позже в разрешённое время
                    </p>
                  </div>
                  {(!requireWindow || showDevControls) && (
                    <Button variant="outline" className="w-full" onClick={onSuccess}>
                      Продолжить сейчас (для тестирования)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
