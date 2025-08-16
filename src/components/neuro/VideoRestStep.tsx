
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, RotateCcw } from 'lucide-react';

interface VideoRestStepProps {
  onContinue: () => void;
  vimeoVideoId: string;
  durationMs?: number;
  devMode?: boolean;
}

export const VideoRestStep = ({ onContinue, vimeoVideoId, durationMs = 120000, devMode = false }: VideoRestStepProps) => {
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true' || devMode;

  useEffect(() => {
    const startedAt = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, durationMs - elapsed);
      setRemainingMs(remain);
      if (remain <= 0) {
        setShowContinueButton(true);
        clearInterval(i);
      }
    }, 250);

    return () => clearInterval(i);
  }, [durationMs]);

  const vimeoSrc = `https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1&loop=1&autopause=0&muted=1`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Play className="h-6 w-6" />
            Видео-перерыв
          </CardTitle>
          <CardDescription>
            Посмотрите видео, чтобы отдохнуть и восстановить концентрацию.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={vimeoSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Vimeo video player"
            ></iframe>
          </div>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Наслаждайтесь перерывом. Кнопка разблокируется по таймеру
            </p>
            <div className="text-xs text-muted-foreground">Осталось: <span className="font-mono">{String(Math.floor(remainingMs/60000)).padStart(2,'0')}:{String(Math.floor((remainingMs%60000)/1000)).padStart(2,'0')}</span></div>
            
            {!showContinueButton && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Кнопка "Продолжить" появится через {Math.round(durationMs / 60000)} мин...
                </div>
                {showDevControls && (
                  <Button variant="outline" onClick={onContinue}>
                    Перейти дальше (для тестирования)
                  </Button>
                )}
              </div>
            )}
          </div>

          {showContinueButton && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="font-semibold text-accent-foreground">
                  Отдохнули? Отлично!
                </p>
                <p className="text-sm text-muted-foreground">Переходим к следующему тесту</p>
              </div>
              
              <Button onClick={onContinue} className="w-full" size="lg">
                <ArrowRight className="mr-2 h-4 w-4" />
                Я отдохнул, продолжить
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
