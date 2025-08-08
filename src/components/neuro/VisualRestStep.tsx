import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, ArrowRight } from 'lucide-react';

interface VisualRestStepProps {
  onContinue: () => void;
}

export const VisualRestStep = ({ onContinue }: VisualRestStepProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);

  useEffect(() => {
    // Show continue button after 60 seconds or when video is watched
    const timer = setTimeout(() => {
      setShowContinueButton(true);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  const handleVideoEnd = () => {
    setShowContinueButton(true);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Play className="h-6 w-6" />
            Визуальный отдых
          </CardTitle>
          <CardDescription>
            Расслабьтесь и посмотрите короткий мультфильм
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&controls=1&modestbranding=1&rel=0"
              title="Relaxing Animation"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsPlaying(true)}
            ></iframe>
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Наслаждайтесь небольшим перерывом перед последним тестом
            </p>
            
            {!showContinueButton && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="h-4 w-4 animate-spin" />
                Кнопка "Продолжить" появится через минуту...
              </div>
            )}
          </div>

          {showContinueButton && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="font-semibold text-accent-foreground">
                  Отдохнули? Отлично!
                </p>
                <p className="text-sm text-muted-foreground">
                  Переходим к последнему тесту на память
                </p>
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