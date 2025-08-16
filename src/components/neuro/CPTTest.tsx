import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CPTResult, UserData } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface CPTTestProps {
  onComplete: (results: CPTResult) => void;
  onSkip?: (results: CPTResult) => void;
  devMode?: boolean;
  userData?: UserData | null;
}

const TOTAL_STIMULI = 120;
const TARGET_COUNT = 18; // ~15% targets

export const CPTTest = ({ onComplete, onSkip, devMode = false, userData = null }: CPTTestProps) => {
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
  const reactionStartRef = useRef<number>(0);
  const responseWindowOpenRef = useRef<boolean>(true);
  const [responseFeedback, setResponseFeedback] = useState<null | 'hit' | 'false'>(null);
  const currentIndexRef = useRef<number>(0);
  const currentStimulusRef = useRef<string>('');

  const generateSequence = useCallback(() => {
    const letters = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l => l !== 'X');
    const sequence: string[] = [];
    
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

      setResponseFeedback(isHit ? 'hit' : 'false');
    }
  }, [phase]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startTest = () => {
    setPhase('test');
    setStimulusIndex(0);
    setResponses([]);
    currentIndexRef.current = 0;
    currentStimulusRef.current = '';
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
    const misses = targetsShown - hits;
    const falseAlarms = responses.filter(r => r.stimulus !== 'X' && r.responded).length;
    const correctRejections = (totalShown - targetsShown) - falseAlarms;
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
    reactionStartRef.current = performance.now();
    responseWindowOpenRef.current = true;

    setResponses(prev => {
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
        next[stimulusIndex] = {
          ...next[stimulusIndex],
          stimulus,
          hrStart: next[stimulusIndex].hrStart ?? reactionStartRef.current,
        };
      }
      return next;
    });
  }, [phase, stimulusIndex, sequence, onComplete, computeResults]);

  useEffect(() => {
    if (phase !== 'test' || stimulusIndex >= TOTAL_STIMULI) return;

    const randomDuration = Math.random() * 400 + 800; // 800ms to 1200ms
    const timer = setTimeout(() => {
      setStimulusIndex(prev => Math.min(prev + 1, TOTAL_STIMULI));
    }, randomDuration);

    return () => clearTimeout(timer);
  }, [phase, stimulusIndex]);

  const handleSkip = () => {
    const results = computeResults();
    if (onSkip) {
      onSkip(results);
    } else {
      onComplete(results);
    }
  };

  const progress = phase === 'test' ? (stimulusIndex / TOTAL_STIMULI) * 100 : 0;

  const {
    liveMisses,
    liveFalseAlarms,
    liveMeanRt,
    liveSdRt,
  } = useMemo(() => {
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
    return {
      liveMisses: responses.filter(r => r.stimulus === 'X' && !r.responded).length,
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
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden mb-4" aria-hidden="true">
              <div className="h-3 rounded-full bg-black" style={{ width: '20%', transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }} />
            </div>
            <CardTitle>Тест на внимание (CPT)</CardTitle>
            <CardDescription>
              Проверка устойчивости внимания и реакции
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {devMode && userData && (
              <div className="p-4 border rounded-md bg-gray-50">
                <h4 className="font-semibold text-sm mb-2">Dev Mode: User Data</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>
            )}
            <div className="space-y-4">
              <h3 className="font-semibold">Инструкция:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Тест займет около 2 минут. На экране будут появляться русские и английские буквы одна за другой.</li>
                <li>Каждая буква показывается на короткое время (от 800 до 1200 мс).</li>
                <li><strong>Нажимайте ПРОБЕЛ только когда видите букву X</strong></li>
                <li>Не нажимайте пробел при других буквах.</li>
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
        <div className="w-full max-w-md mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            {stimulusIndex} / {TOTAL_STIMULI}
          </p>
          {devMode && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Ошибки пропуска (Omissions)</span><span>{liveMisses}</span></div>
              <div className="flex justify-between"><span>Ошибки ложного отклика (Commissions)</span><span>{liveFalseAlarms}</span></div>
              <div className="flex justify-between"><span>Среднее время реакции (Mean RT), мс</span><span>{liveMeanRt}</span></div>
              <div className="flex justify-between"><span>Вариативность реакции (SD RT, стандартное отклонение), мс</span><span>{liveSdRt}</span></div>
            </div>
          )}
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
          {devMode && (
            <div className="mt-6">
              <Button variant="outline" onClick={handleSkip}>Пропустить тест</Button>
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