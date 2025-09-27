import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { TCPResult, Test, UserData } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface TCPTestProps {
  onComplete: (results: TCPResult) => void;
  onSkip?: (results: TCPResult) => void;
  devMode?: boolean;
  userData?: UserData | null;
  test?: Test | null;
}

const TOTAL_STIMULI = 120;
const TARGET_COUNT = 18; // ~15% targets

export const TCPTest = ({ onComplete, onSkip, devMode = false }: TCPTestProps) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'instructions' | 'test' | 'complete'>('instructions');
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [responses, setResponses] = useState<
    Array<{
      stimulus: string;
      responded: boolean;
      reactionTime: number | null;
      timestamp: number;
    }>
  >([]);
  const [responseFeedback, setResponseFeedback] = useState<null | 'hit' | 'false'>(null);

  // Refs
  const reactionStartRef = useRef<number>(0);
  const completedRef = useRef(false);
  const currentIndexRef = useRef(stimulusIndex);
  const currentStimulusRef = useRef<string>('');
  const responsesRef = useRef(responses);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  const generateSequence = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== 'X');
    const sequence: string[] = [];
    const targetPositions = new Set<number>();
    while (targetPositions.size < TARGET_COUNT) {
      targetPositions.add(Math.floor(Math.random() * TOTAL_STIMULI));
    }
    for (let i = 0; i < TOTAL_STIMULI; i++) {
      sequence.push(targetPositions.has(i) ? 'X' : letters[Math.floor(Math.random() * letters.length)]);
    }
    return sequence;
  };

  const sequence = useMemo(() => generateSequence(), []);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (phase !== 'test' || event.code !== 'Space' || event.repeat) {
        return;
      }
      event.preventDefault();

      const reactionTime = performance.now() - reactionStartRef.current;
      const isHit = currentStimulusRef.current === 'X';

      setResponseFeedback(isHit ? 'hit' : 'false');

      setResponses(prev => {
        const indexToUpdate = currentIndexRef.current;
        if (!prev[indexToUpdate] || prev[indexToUpdate].responded) {
          return prev;
        }
        const newResponses = [...prev];
        newResponses[indexToUpdate] = {
          ...newResponses[indexToUpdate],
          responded: true,
          reactionTime: Math.max(0, Math.round(reactionTime)),
        };
        return newResponses;
      });
    },
    [phase],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const computeResults = useCallback((): TCPResult => {
    const finalResponses = responsesRef.current;
    const totalShown = finalResponses.length;
    const targetsShown = finalResponses.filter(r => r.stimulus === 'X').length;
    const hits = finalResponses.filter(r => r.stimulus === 'X' && r.responded).length;
    const misses = targetsShown - hits;
    const falseAlarms = finalResponses.filter(r => r.stimulus !== 'X' && r.responded).length;
    const correctRejections = totalShown - targetsShown - falseAlarms;

    const hitReactionTimes = finalResponses
      .filter(r => r.stimulus === 'X' && r.responded && r.reactionTime != null)
      .map(r => r.reactionTime as number);

    const accuracy = totalShown > 0 ? ((hits + correctRejections) / totalShown) * 100 : 0;

    const averageReactionTime =
      hitReactionTimes.length > 0
        ? hitReactionTimes.reduce((a, b) => a + b, 0) / hitReactionTimes.length
        : 0;

    const sdReactionTime = (() => {
      const n = hitReactionTimes.length;
      if (n < 2) return 0;
      const mean = averageReactionTime;
      const variance = hitReactionTimes.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (n - 1);
      return Math.sqrt(variance);
    })();

    return {
      totalStimuli: totalShown,
      targetsPresented: targetsShown,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      reactionTimes: hitReactionTimes,
      accuracy,
      averageReactionTime,
      sdReactionTime,
    };
  }, []);

  const startTest = () => {
    setPhase('test');
    setStimulusIndex(0);
    setResponses([]);
    completedRef.current = false;
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    toast({
      title: t('tcp.startTitle'),
      description: t('tcp.startDescription'),
    });
  };

  useEffect(() => {
    if (phase !== 'test' || stimulusIndex >= TOTAL_STIMULI) return;

    const stimulus = sequence[stimulusIndex];
    currentStimulusRef.current = stimulus;
    currentIndexRef.current = stimulusIndex;

    setResponseFeedback(null);
    reactionStartRef.current = performance.now();

    setResponses(prev => {
      const newResponses = [...prev];
      newResponses[stimulusIndex] = {
        stimulus,
        responded: false,
        reactionTime: null,
        timestamp: Date.now(),
      };
      return newResponses;
    });
  }, [phase, stimulusIndex, sequence]);

  useEffect(() => {
    if (phase !== 'test' || stimulusIndex >= TOTAL_STIMULI) return;

    const timer = setTimeout(() => {
      setStimulusIndex(prev => prev + 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [phase, stimulusIndex]);

  useEffect(() => {
    if (phase === 'test' && stimulusIndex >= TOTAL_STIMULI && !completedRef.current) {
      completedRef.current = true;
      setPhase('complete');
      onComplete(computeResults());
    }
  }, [phase, stimulusIndex, onComplete, computeResults]);

  const handleSkip = () => {
    if (onSkip) {
      onSkip(computeResults());
    }
  };

  const { liveMisses, liveFalseAlarms, liveMeanRt, liveSdRt } = useMemo(() => {
    const rts = responses
      .filter(r => r.stimulus === 'X' && r.responded && r.reactionTime != null)
      .map(r => r.reactionTime as number);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    const sdRt = (() => {
      if (rts.length < 2) return 0;
      const mean = meanRt;
      const variance = rts.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (rts.length - 1);
      return Math.round(Math.sqrt(variance));
    })();
    const liveTargets = responses.filter(r => r.stimulus === 'X');
    return {
      liveMisses: liveTargets.filter(r => !r.responded).length,
      liveFalseAlarms: responses.filter(r => r.stimulus !== 'X' && r.responded).length,
      liveMeanRt: meanRt,
      liveSdRt: sdRt,
    };
  }, [responses]);

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t('tcp.title')}</CardTitle>
            <CardDescription>{t('tcp.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">{t('tcp.instructionsTitle')}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t('tcp.instructions1')}</li>
                <li>{t('tcp.instructions2')}</li>
                <li>
                  <strong>{t('tcp.instructions3')}</strong>
                </li>
                <li>{t('tcp.instructions4')}</li>
              </ul>
            </div>
            <div className="text-center">
              <Button onClick={startTest} size="lg">
                {t('tcp.startButton')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'test') {
    const stimulusToShow = sequence[stimulusIndex] || '';
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="w-full max-w-md mb-8">
          <p className="text-center text-sm text-muted-foreground mt-2">
            {stimulusIndex} / {TOTAL_STIMULI}
          </p>
          {devMode && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div>
                <span>{t('tcp.devMisses')}</span> {liveMisses}
              </div>
              <div>
                <span>{t('tcp.devFalse')}</span> {liveFalseAlarms}
              </div>
              <div>
                <span>{t('tcp.devMeanRt')}</span> {liveMeanRt} мс
              </div>
              <div>
                <span>{t('tcp.devSdRt')}</span> {liveSdRt} мс
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <div
            className={`w-40 h-40 flex items-center justify-center rounded-lg border-2 ${
              responseFeedback === 'hit' ? 'bg-green-500 border-green-600' : ''
            } ${responseFeedback === 'false' ? 'bg-red-500 border-red-600' : ''} ${
              responseFeedback === null ? 'bg-card border-primary' : ''
            } mx-auto`}
          >
            <span className={`text-7xl font-bold ${responseFeedback ? 'text-white' : ''}`}>
              {stimulusToShow}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('tcp.pressSpace')}</p>
          {devMode && (
            <div className="mt-6">
              <Button variant="outline" onClick={handleSkip}>
                {t('tcp.skip')}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('tcp.completeTitle')}</CardTitle>
          <CardDescription>{t('tcp.completeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">{t('tcp.completeNext')}</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
