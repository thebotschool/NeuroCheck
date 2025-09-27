import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TimeCheckStepProps {
  onSuccess: () => void;
  onBack?: () => void;
}

export const TimeCheckStep = ({ onSuccess, onBack }: TimeCheckStepProps) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isTimeValid, setIsTimeValid] = useState(false);
  const requireWindow = import.meta.env.VITE_REQUIRE_TIME_WINDOW !== 'true';
  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true';

  useEffect(() => {
    if (!requireWindow) {
      onSuccess();
      return;
    }
    const checkTime = () => {
      const now = new Date();
      setCurrentTime(now);

      const hour = now.getHours();
      const day = now.getDay();

      const isWeekday = day >= 1 && day <= 5;
      const isValidHour = hour >= 9 && hour < 10;

      setIsTimeValid(isWeekday && isValidHour);
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [requireWindow, onSuccess]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('ru-RU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => onBack && onBack()}
            aria-label={t('timeCheck.back')}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Clock className="h-6 w-6" />
              {t('timeCheck.title')}
            </CardTitle>
            <CardDescription>{t('timeCheck.subtitle')}</CardDescription>
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
                    {t('timeCheck.availableTitle')}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {t('timeCheck.availableSubtitle')}
                  </p>
                </div>
                <Button onClick={onSuccess} className="w-full">
                  {t('timeCheck.startButton')}
                </Button>
                {showDevControls && (
                  <Button variant="outline" className="w-full" onClick={onSuccess}>
                    {t('timeCheck.skipDev')}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <Clock className="mx-auto h-8 w-8 text-destructive mb-2" />
                  <p className="text-destructive font-semibold">
                    {t('timeCheck.unavailableTitle')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('timeCheck.unavailableSubtitle')}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {t('timeCheck.tryLater')}
                    </p>
                  </div>
                  {(!requireWindow || showDevControls) && (
                    <Button variant="outline" className="w-full" onClick={onSuccess}>
                      {t('timeCheck.continueNow')}
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
