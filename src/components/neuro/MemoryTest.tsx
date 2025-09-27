import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MemoryTestProps {
  onComplete: (results: MemoryResult) => void;
  age: number;
  devMode?: boolean;
}

const DISPLAY_PER_CARD_MS = 1500;
const DISTRACTOR_MS = 120000;
const IMAGE_SRCS = Array.from({ length: 12 }, (_, i) => `/images/${i + 1}.png`);

export const MemoryTest = ({ onComplete, age, devMode = false }: MemoryTestProps) => {
  const { t } = useTranslation();
  type Phase = 'instructions' | 'memorize' | 'distract' | 'reconstruct' | 'complete';
  const [phase, setPhase] = useState<Phase>('instructions');
  const sequenceLength = useMemo(() => {
    if (age === 5) return 12;
    if (age === 4) return 10;
    if (age >= 2) return 8;
    return 6;
  }, [age]);

  const [targetSequence, setTargetSequence] = useState<string[]>([]);
  const [currentMemorizeIndex, setCurrentMemorizeIndex] = useState<number>(1);
  const [remainingDistractMs, setRemainingDistractMs] = useState<number>(DISTRACTOR_MS);
  const [remainingFixationMs, setRemainingFixationMs] = useState<number>(0);

  const [poolCards, setPoolCards] = useState<string[]>([]);
  const [slots, setSlots] = useState<Array<string | null>>([]);
  const [draggingSrc, setDraggingSrc] = useState<string | null>(null);
  const [reconstructionStart, setReconstructionStart] = useState<number | null>(null);
  const [firstDropSlot, setFirstDropSlot] = useState<number | null>(null);
  const [placementSequence, setPlacementSequence] = useState<number[]>([]);

  const [player, setPlayer] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const generateTargetSequence = useCallback(() => {
    const shuffled = [...IMAGE_SRCS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, sequenceLength);
  }, [sequenceLength]);

  const startMemorizePhase = () => {
    const seq = generateTargetSequence();
    setTargetSequence(seq);
    setCurrentMemorizeIndex(1);
    setPhase('memorize');
    setPlacementSequence([]);
    toast({ title: t('memoryTest.memorize.title'), description: t('memoryTest.instructions.step1', { count: sequenceLength }) });
  };

  useEffect(() => {
    if (phase !== 'memorize') return;
    if (currentMemorizeIndex <= sequenceLength) {
      const tmr = setTimeout(() => setCurrentMemorizeIndex(i => i + 1), DISPLAY_PER_CARD_MS);
      return () => clearTimeout(tmr);
    } else {
      const tmr = setTimeout(() => {
        setPhase('distract');
        setRemainingDistractMs(DISTRACTOR_MS);
      }, DISPLAY_PER_CARD_MS);
      return () => clearTimeout(tmr);
    }
  }, [phase, currentMemorizeIndex, sequenceLength]);

  useEffect(() => {
    if (phase !== 'fixation') return;
    const started = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - started;
      const remain = Math.max(0, 10000 - elapsed);
      setRemainingFixationMs(remain);
      if (remain <= 0) {
        clearInterval(i);
        setPhase('distract');
        setRemainingDistractMs(DISTRACTOR_MS);
      }
    }, 250);
    return () => clearInterval(i);
  }, [phase]);

  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true' || devMode;

  useEffect(() => {
    if (phase !== 'distract') return;
    const started = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - started;
      const remain = Math.max(0, DISTRACTOR_MS - elapsed);
      setRemainingDistractMs(remain);
      if (remain <= 0) {
        clearInterval(i);
        const shuffled = [...targetSequence].sort(() => Math.random() - 0.5);
        setPoolCards(shuffled);
        setSlots(new Array(sequenceLength).fill(null));
        setReconstructionStart(Date.now());
        setFirstDropSlot(null);
        setPlacementSequence([]);
        setPhase('reconstruct');
      }
    }, 250);
    return () => clearInterval(i);
  }, [phase, sequenceLength, targetSequence]);

  useEffect(() => {
    if (phase === 'distract') {
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
    }
  }, [phase]);

  useEffect(() => {
    if (player) player.setVolume(isMuted ? 0 : 0.5);
  }, [player, isMuted]);

  const skipDistractorNow = () => {
    const shuffled = [...targetSequence].sort(() => Math.random() - 0.5);
    setPoolCards(shuffled);
    setSlots(new Array(sequenceLength).fill(null));
    setReconstructionStart(Date.now());
    setFirstDropSlot(null);
    setPlacementSequence([]);
    setPhase('reconstruct');
  };

  const calculateResults = () => {
    const placedIds = slots.map(src => src ?? '');
    const correctPositions = placedIds.reduce((acc, src, idx) => acc + (src === targetSequence[idx] ? 1 : 0), 0);
    const substitutionErrors = placedIds.filter(src => src !== '' && !targetSequence.includes(src)).length;
    const orderErrors = sequenceLength - correctPositions;
    const startPosition = firstDropSlot ?? -1;
    const reconstructionTimeMs = reconstructionStart ? Date.now() - reconstructionStart : 0;
    const timeSpent = reconstructionTimeMs;
    const correctCards = placedIds.filter(src => targetSequence.includes(src)).length;
    const incorrectCards = sequenceLength - correctCards;
    const accuracy = sequenceLength > 0 ? (correctPositions / sequenceLength) * 100 : 0;
    onComplete({
      totalCards: sequenceLength,
      correctCards,
      incorrectCards,
      timeSpent,
      accuracy,
      correctPositions,
      orderErrors,
      substitutionErrors,
      startPosition,
      reconstructionTime: reconstructionTimeMs,
      placementSequence,
    });
  };

  const handleSkipTest = () => {
    onComplete({
      totalCards: 0,
      correctCards: 0,
      incorrectCards: 0,
      timeSpent: 0,
      accuracy: 0,
      correctPositions: 0,
      orderErrors: 0,
      substitutionErrors: 0,
      startPosition: -1,
      reconstructionTime: 0,
      placementSequence: [],
    });
  };

  const onDragStart = (src: string) => setDraggingSrc(src);
  const onDragEnd = () => setDraggingSrc(null);
  const onDropToSlot = (slotIndex: number) => {
    if (draggingSrc == null) return;
    if (slots[slotIndex] !== null) return;
    setPlacementSequence(prev => [...prev, slotIndex + 1]);
    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = draggingSrc;
      return next;
    });
    setPoolCards(prev => prev.filter(src => src !== draggingSrc));
    if (firstDropSlot === null) setFirstDropSlot(slotIndex);
    setDraggingSrc(null);
  };
  const onRemoveFromSlot = (slotIndex: number) => {
    setSlots(prev => {
      const next = [...prev];
      const src = next[slotIndex];
      if (src != null) {
        setPoolCards(prevPool => [...prevPool, src]);
      }
      next[slotIndex] = null;
      return next;
    });
  };

  const renderCard = (src: string) => (
    <div
      key={src}
      draggable
      onDragStart={() => onDragStart(src)}
      onDragEnd={onDragEnd}
      className="w-20 h-20 rounded-lg cursor-grab border-2 transition-all hover:border-primary/50 overflow-hidden"
    >
      <img src={src} alt="card" className="w-full h-full object-cover" />
    </div>
  );

  // Renders for each phase
  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t('memoryTest.title')}</CardTitle>
            <CardDescription>{t('memoryTest.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">{t('memoryTest.instructions.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t('memoryTest.instructions.step1', { count: sequenceLength })}</li>
                <li>{t('memoryTest.instructions.step2')}</li>
                <li>{t('memoryTest.instructions.step3')}</li>
              </ul>
            </div>
            <div className="text-center space-x-2">
              <Button onClick={startMemorizePhase} size="lg">
                {t('memoryTest.button.start')}
              </Button>
              {devMode && (
                <Button onClick={handleSkipTest} size="lg" variant="outline">
                  {t('memoryTest.button.skip')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'memorize') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-6xl">
          <CardHeader className="text-center">
            <CardTitle>{t('memoryTest.memorize.title')}</CardTitle>
            <CardDescription>{t('memoryTest.memorize.card', { current: Math.min(currentMemorizeIndex, sequenceLength), total: sequenceLength })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-flow-col auto-cols-fr gap-2 py-4">
              {Array.from({ length: sequenceLength }).map((_, index) => {
                const cardSrc = targetSequence[index];
                const isVisible = index < currentMemorizeIndex;
                return (
                  <div key={index} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/40 flex items-center justify-center overflow-hidden">
                    {isVisible && cardSrc && <img src={cardSrc} alt="card" className="w-full h-full object-cover" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'fixation') {
    const ss = String(Math.ceil(remainingFixationMs / 1000)).padStart(2, '0');
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-6xl">
          <CardHeader className="text-center">
            <CardTitle>{t('memoryTest.memorize.title')}</CardTitle>
            <CardDescription>{t('memoryTest.fixation.remaining', { seconds: ss })}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-flow-col auto-cols-fr gap-2 py-4">
              {targetSequence.map((cardSrc, index) => (
                <div key={index} className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/40 flex items-center justify-center overflow-hidden">
                  <img src={cardSrc} alt="card" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'distract') {
    const mm = String(Math.floor(remainingDistractMs / 60000)).padStart(2, '0');
    const ss = String(Math.floor((remainingDistractMs % 60000) / 1000)).padStart(2, '0');
    const vimeoSrc = `https://player.vimeo.com/video/1110248215?autoplay=1&loop=1&playsinline=1&dnt=1&controls=0&byline=0&title=0`;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>{t('memoryTest.distract.title')}</CardTitle>
            <CardDescription>{t('memoryTest.distract.remaining', { minutes: mm, seconds: ss })}</CardDescription>
          </CardHeader>
          <CardContent>
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
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
            </div>
            {showDevControls && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={skipDistractorNow}>
                  {t('memoryTest.distract.skip')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'reconstruct') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="w-full max-w-6xl mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">{t('memoryTest.reconstruct.filled', { filled: slots.filter(s => s != null).length, total: sequenceLength })}</span>
          </div>
        </div>
        <Card className="w-full max-w-6xl">
          <CardHeader className="text-center">
            <CardTitle>{t('memoryTest.reconstruct.title')}</CardTitle>
            <CardDescription>{t('memoryTest.reconstruct.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-flow-col auto-cols-fr gap-2 mb-6">
              {slots.map((src, idx) => (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropToSlot(idx)}
                  className={`aspect-square rounded-lg border-2 flex items-center justify-center ${src ? 'border-transparent' : 'border-dashed border-muted-foreground/40'} overflow-hidden`}
                >
                  {src ? (
                    <div className="w-full h-full cursor-pointer" onClick={() => onRemoveFromSlot(idx)}>
                      <img src={src} alt="card" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2">{poolCards.map(src => renderCard(src))}</div>
            <div className="mt-6 text-center">
              <Button onClick={() => { setPhase('complete'); calculateResults(); }} disabled={slots.some(s => s == null)} variant={slots.every(s => s != null) ? 'default' : 'outline'}>
                {t('memoryTest.reconstruct.finish')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('memoryTest.complete.title')}</CardTitle>
          <CardDescription>{t('memoryTest.complete.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">{t('memoryTest.complete.processing')}</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
