import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VideoRestStepProps {
  onContinue: () => void;
  vimeoVideoId: string;
  durationMs?: number;
  devMode?: boolean;
}

export const VideoRestStep = ({ onContinue, vimeoVideoId, durationMs = 120000, devMode = false }: VideoRestStepProps) => {
  const { t } = useTranslation();

  const [showContinueButton, setShowContinueButton] = useState(false);
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [player, setPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true' || devMode;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (iframeRef.current) {
        const vimeoPlayer = new (window as any).Vimeo.Player(iframeRef.current);
        setPlayer(vimeoPlayer);
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (player) {
      player.setVolume(isMuted ? 0 : 0.5);

      const onEnded = () => {
        player.getDuration().then((duration: number) => {
          player.setCurrentTime(duration - 0.1);
          player.pause();
        });
      };

      player.on('ended', onEnded);

      return () => {
        player.off('ended', onEnded);
      };
    }
  }, [player, isMuted]);

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

  const vimeoSrc = `https://player.vimeo.com/video/${vimeoVideoId}?autoplay=1&loop=1&playsinline=1&dnt=1&controls=0&byline=0&title=0`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Play className="h-6 w-6" />
            {t('videoRest.title')}
          </CardTitle>
          <CardDescription>
            {t('videoRest.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              src={vimeoSrc}
              width="100%"
              height="100%"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              title="Vimeo video player"
            ></iframe>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMuted(prev => !prev)}
              className="absolute bottom-2 right-2 rounded-full bg-black text-white hover:bg-gray-800"
              aria-label={isMuted ? t('videoRest.unmute') : t('videoRest.mute')}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          </div>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t('videoRest.enjoy')}
            </p>
            <div className="text-xs text-muted-foreground">
              {t('videoRest.remaining')}{' '}
              <span className="font-mono">
                {String(Math.floor(remainingMs/60000)).padStart(2,'0')}:
                {String(Math.floor((remainingMs%60000)/1000)).padStart(2,'0')}
              </span>
            </div>
            
            {!showContinueButton && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  {t('videoRest.waitButton', {minutes: Math.round(durationMs / 60000)})}
                </div>
                {showDevControls && (
                  <Button variant="outline" onClick={onContinue}>
                    {t('videoRest.devSkip')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {showContinueButton && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <p className="font-semibold text-accent-foreground">
                  {t('videoRest.rested')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('videoRest.nextTest')}
                </p>
              </div>
              
              <Button onClick={onContinue} className="w-full" size="lg">
                <ArrowRight className="mr-2 h-4 w-4" />
                {t('videoRest.continue')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
