import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Timer } from '@/components/neuro/Timer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CPTResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface CPTTestProps {
  onComplete: (results: CPTResult) => void;
  onSkip?: (results: CPTResult) => void;
}

const TOTAL_STIMULI = 120; // 2 minutes at 1s per stimulus
const TARGET_COUNT = 18; // ~15% targets (similar ratio to 6/40)
const STIMULUS_DURATION = 1000; // 1 second

export const CPTTest = ({ onComplete, onSkip }: CPTTestProps) => {
  const [phase, setPhase] = useState<'instructions' | 'test' | 'complete'>('instructions');
  const [currentStimulus, setCurrentStimulus] = useState<string>('');
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{
    stimulus: string;
    responded: boolean;
    reactionTime: number | null;
    timestamp: number;
    hrStart?: number;
  }>>([]);
  // High-resolution, monotonic start time for current stimulus
  const reactionStartRef = useRef<number>(0);
  // Response window flag (kept for potential future use; currently always open)
  const responseWindowOpenRef = useRef<boolean>(true);
  const [responseFeedback, setResponseFeedback] = useState<null | 'hit' | 'false'>(null);
  const currentIndexRef = useRef<number>(0);
  const currentStimulusRef = useRef<string>('');
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(TOTAL_STIMULI * STIMULUS_DURATION);

  // Generate stimulus sequence
  const generateSequence = useCallback(() => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'Y', 'Z'];
    const sequence: string[] = [];
    
    // Add X targets randomly
    const targetPositions = new Set<number>();
    while (targetPositions.size < TARGET_COUNT) {
      targetPositions.add(Math.floor(Math.random() * TOTAL_STIMULI));
    }
    
    for (let i = 0; i < TOTAL_STIMULI; i++) {
      if (targetPositions.has(i)) {
        sequence.push('X');
      } else {
        sequence.push(letters[Math.floor(Math.random() * letters.length)]);
      }
    }
    
    return sequence;
  }, []);

  const [sequence] = useState(() => generateSequence());

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
    if (isSpace && phase === 'test' && currentStimulusRef.current) {
      event.preventDefault();
      if (event.repeat) return; // игнорируем удержание клавиши
      const isHit = currentStimulusRef.current === 'X';

      setResponses(prev => {
        const indexToUpdate = currentIndexRef.current;
        const next = prev.slice();
        // гарантируем наличие текущей записи даже при очень раннем нажатии
        while (next.length <= indexToUpdate) {
          next.push({
            stimulus: currentStimulusRef.current,
            responded: false,
            reactionTime: null,
            timestamp: Date.now(),
            hrStart: reactionStartRef.current,
          });
        }
        const start = next[indexToUpdate].hrStart ?? reactionStartRef.current;
        const reactionTime = Math.max(0, Math.round(performance.now() - start));
        if (!next[indexToUpdate].responded) {
          next[indexToUpdate] = {
            ...next[indexToUpdate],
            responded: true,
            reactionTime,
          };
        }
        return next;
      });

      // Визуальная обратная связь
      setResponseFeedback(isHit ? 'hit' : 'false');
    }
  }, [phase]);

  useEffect(() => {
    const listener = (e: KeyboardEvent) => handleKeyPress(e);
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleKeyPress]);

  const startTest = () => {
    setPhase('test');
    setStimulusIndex(0);
    setResponses([]);
    currentIndexRef.current = 0;
    currentStimulusRef.current = '';
    setTestStartTime(Date.now());
    setRemainingMs(TOTAL_STIMULI * STIMULUS_DURATION);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    toast({
      title: 'Тест начался',
      description: 'Нажимайте пробел, когда видите букву X',
    });
  };

  const computeResults = useCallback(() => {
    const totalShown = responses.length;
    const targetsShown = responses.filter(r => r.stimulus === 'X').length;

    const hits = responses.filter(r => r.stimulus === 'X' && r.responded).length;
    const misses = responses.filter(r => r.stimulus === 'X' && !r.responded).length; // Omissions
    const falseAlarms = responses.filter(r => r.stimulus !== 'X' && r.responded).length; // Commissions
    const correctRejections = responses.filter(r => r.stimulus !== 'X' && !r.responded).length;

    const hitReactionTimes = responses
      .filter(r => r.stimulus === 'X' && r.responded && r.reactionTime)
      .map(r => r.reactionTime as number);

    const accuracy = totalShown > 0 ? ((hits + correctRejections) / totalShown) * 100 : 0;
    const averageReactionTime = hitReactionTimes.length > 0
      ? hitReactionTimes.reduce((a, b) => a + b, 0) / hitReactionTimes.length
      : 0;

    const sdReactionTime = (() => {
      const n = hitReactionTimes.length;
      if (n <= 1) return 0;
      const mean = averageReactionTime;
      const variance = hitReactionTimes.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (n - 1);
      return Math.sqrt(variance);
    })();

    const results: CPTResult = {
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
    return results;
  }, [responses]);

  // 1) На каждое изменение индекса подготавливаем текущий стимул и фиксируем старт реакции
  useEffect(() => {
    if (phase !== 'test') return;
    if (stimulusIndex >= TOTAL_STIMULI) {
      setPhase('complete');
      onComplete(computeResults());
      return;
    }

    const stimulus = sequence[stimulusIndex];
    setCurrentStimulus(stimulus);
    currentStimulusRef.current = stimulus;
    currentIndexRef.current = stimulusIndex;
    setResponseFeedback(null);
    // Фиксируем старт сразу; окно приёма открыто
    reactionStartRef.current = performance.now();
    responseWindowOpenRef.current = true;

    setResponses(prev => {
      // Preserve any existing response for this index (in case of early keypress)
      const next = prev.slice();
      if (!next[stimulusIndex]) {
        next[stimulusIndex] = {
          stimulus,
          responded: false,
          reactionTime: null,
          timestamp: Date.now(),
          hrStart: reactionStartRef.current,
        };
      } else {
        // Keep responded/reactionTime if already set, just ensure stimulus is correct
        next[stimulusIndex] = {
          ...next[stimulusIndex],
          stimulus,
          hrStart: next[stimulusIndex].hrStart ?? reactionStartRef.current,
        };
      }
      return next;
    });
  }, [phase, stimulusIndex, sequence, onComplete, computeResults]);

  // 2) Таймер смены стимула живёт отдельно, чтобы обновление responses не сбрасывало таймер
  useEffect(() => {
    if (phase !== 'test') return;
    if (stimulusIndex >= TOTAL_STIMULI) return;

    const timer = setTimeout(() => {
      setStimulusIndex(prev => Math.min(prev + 1, TOTAL_STIMULI));
    }, STIMULUS_DURATION);

    return () => clearTimeout(timer);
  }, [phase, stimulusIndex]);

  // 3) Угловой таймер обратного отсчёта (2:00)
  useEffect(() => {
    if (phase !== 'test' || !testStartTime) return;
    const i = setInterval(() => {
      const elapsed = Date.now() - testStartTime;
      const remain = Math.max(0, TOTAL_STIMULI * STIMULUS_DURATION - elapsed);
      setRemainingMs(remain);
      if (remain <= 0) {
        // завершить тест, если время истекло (страховка)
        setStimulusIndex(TOTAL_STIMULI);
      }
    }, 250);
    return () => clearInterval(i);
  }, [phase, testStartTime]);

  const mm = Math.floor(remainingMs / 60000)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor((remainingMs % 60000) / 1000)
    .toString()
    .padStart(2, '0');

  // calculate and finish now (skip)
  const calculateResults = () => onComplete(computeResults());

  const handleSkip = () => {
    const results: CPTResult = computeResults();
    if (onSkip) {
      onSkip(results);
    } else {
      onComplete(results);
    }
  };

  const progress = phase === 'test' ? (stimulusIndex / TOTAL_STIMULI) * 100 : 0;

  const {
    hits: liveHits,
    misses: liveMisses,
    falseAlarms: liveFalseAlarms,
    correctRejections: liveCorrectRejections,
    meanRt: liveMeanRt,
    sdRt: liveSdRt,
    targetsShown: liveTargetsShown,
    totalShown: liveTotalShown,
  } = useMemo(() => {
    const totalShown = responses.length;
    const targetsShown = responses.filter(r => r.stimulus === 'X').length;
    const hits = responses.filter(r => r.stimulus === 'X' && r.responded).length;
    const misses = responses.filter(r => r.stimulus === 'X' && !r.responded).length;
    const falseAlarms = responses.filter(r => r.stimulus !== 'X' && r.responded).length;
    const correctRejections = responses.filter(r => r.stimulus !== 'X' && !r.responded).length;
    const rts = responses
      .filter(r => r.stimulus === 'X' && r.responded && r.reactionTime)
      .map(r => r.reactionTime as number);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    const sdRt = (() => {
      const n = rts.length;
      if (n <= 1) return 0;
      const mean = rts.reduce((a, b) => a + b, 0) / n;
      const variance = rts.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (n - 1);
      return Math.round(Math.sqrt(variance));
    })();
    return { hits, misses, falseAlarms, correctRejections, meanRt, sdRt, targetsShown, totalShown };
  }, [responses]);

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Тест на внимание (CPT)</CardTitle>
            <CardDescription>
              Проверка устойчивости внимания и реакции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Инструкция:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Тест длится 2 минуты. На экране будут появляться буквы одна за другой</li>
                <li>Каждая буква показывается 1 секунду</li>
                <li><strong>Нажимайте ПРОБЕЛ только когда видите букву X</strong></li>
                <li>Не нажимайте пробел при других буквах</li>
              </ul>
            </div>
            <div className="text-center">
              <Button onClick={startTest} size="lg">
                Начать тест
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'test') {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Timer durationMs={TOTAL_STIMULI * STIMULUS_DURATION} className="absolute top-4 right-4 text-xs text-muted-foreground" />
        <div className="w-full max-w-md mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            {stimulusIndex} / {TOTAL_STIMULI}
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Ошибки пропуска (Omissions)</span><span>{liveMisses}</span></div>
            <div className="flex justify-between"><span>Ошибки ложного отклика (Commissions)</span><span>{liveFalseAlarms}</span></div>
            <div className="flex justify-between"><span>Среднее время реакции (Mean RT), мс</span><span>{liveMeanRt}</span></div>
            <div className="flex justify-between"><span>Вариативность реакции (SD RT, стандартное отклонение), мс</span><span>{liveSdRt}</span></div>
          </div>
        </div>
        
        <div className="text-center">
          <div
            className={
              `w-40 h-40 flex items-center justify-center rounded-lg border-2 ` +
              `${responseFeedback === 'hit' ? 'bg-green-500 border-green-600' : ''} ` +
              `${responseFeedback === 'false' ? 'bg-red-500 border-red-600' : ''} ` +
              `${responseFeedback === null ? 'bg-card border-primary' : ''} mx-auto`
            }
          >
            <span className={`text-7xl font-bold ${responseFeedback ? 'text-white' : ''}`}>
              {currentStimulus}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Нажмите пробел, если видите букву X
          </p>
          <div className="mt-6">
            <Button variant="outline" onClick={handleSkip}>Пропустить тест</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Тест завершён!</CardTitle>
          <CardDescription>
            Первый тест на внимание успешно пройден
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">Переходим к следующему этапу</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};