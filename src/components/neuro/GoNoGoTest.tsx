import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Timer } from '@/components/neuro/Timer';
import { GoNoGoResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';
import { HandSwitchStep } from '@/components/neuro/HandSwitchStep';

import { useTranslation } from 'react-i18next';

interface GoNoGoTestProps {
  onComplete: (results: GoNoGoResult) => void;
  devMode?: boolean;
}

const BLOCK_DURATION_MS = 60000; // 1 minute per test block
const STIMULUS_DURATION = 800; // ~800ms per stimulus
const GO_RATIO = 0.8; // 80% Go

export const GoNoGoTest = ({ onComplete, devMode = false }: GoNoGoTestProps) => {
  const { t } = useTranslation();

  type Phase = 'instructions' | 'practiceRight' | 'testRight' | 'handSwitch' | 'practiceLeft' | 'testLeft' | 'complete';
  const [phase, setPhase] = useState<Phase>('instructions');
  const [currentStimulus, setCurrentStimulus] = useState<'green' | 'red' | ''>('');
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [sequence, setSequence] = useState<('green' | 'red')[]>([]);
  const [blockStartTime, setBlockStartTime] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState<number>(BLOCK_DURATION_MS);
  const reactionStartRef = useRef<number>(0);
  const responseWindowOpenRef = useRef<boolean>(true);
  const currentIndexRef = useRef<number>(0);
  const currentStimulusRef = useRef<'green' | 'red' | ''>('');
  const prevStimulusRef = useRef<'green' | 'red' | ''>('');
  const prevIndexRef = useRef<number>(-1);
  const prevStartRef = useRef<number>(0);
  const nextAllowedTsRef = useRef<number>(0); // refractory after accepted press
  const [appear, setAppear] = useState<boolean>(false);
  const [appearId, setAppearId] = useState<number>(0);
  const [rightFalseAlarmsCount, setRightFalseAlarmsCount] = useState<number>(0);
  const [leftFalseAlarmsCount, setLeftFalseAlarmsCount] = useState<number>(0);
  const [feedback, setFeedback] = useState(false);

  const [rightResponses, setRightResponses] = useState<Array<{ stimulus: 'green' | 'red'; responded: boolean; reactionTime: number | null; timestamp: number; hrStart?: number }>>([]);
  const [leftResponses, setLeftResponses] = useState<Array<{ stimulus: 'green' | 'red'; responded: boolean; reactionTime: number | null; timestamp: number; hrStart?: number }>>([]);

  const generateSequence = useCallback((count: number) => {
    const goCount = Math.round(count * GO_RATIO);
    const noGoCount = count - goCount;
    const seq: ('green' | 'red')[] = [];
    for (let i = 0; i < goCount; i++) seq.push('green');
    for (let i = 0; i < noGoCount; i++) seq.push('red');
    for (let i = seq.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seq[i], seq[j]] = [seq[j], seq[i]];
    }
    return seq;
  }, []);

  const isTestPhase = useCallback((p: Phase) => p === 'testRight' || p === 'testLeft', []);
  const isPracticePhase = useCallback((p: Phase) => p === 'practiceRight' || p === 'practiceLeft', []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const isSpace = event.code === 'Space' || event.key === ' ' || event.key === 'Spacebar';
    if (!isSpace) return;
    if (event.repeat) return;

    setFeedback(true);
    setTimeout(() => setFeedback(false), 150);
    if (!(isTestPhase(phase) || isPracticePhase(phase))) return;
    if (!currentStimulusRef.current) return;
    event.preventDefault();
    if (!responseWindowOpenRef.current) return;

    const now = performance.now();
    const GRACE_MS = 200; // extended grace window
    const REFRACTORY_MS = 200;
    if (now < nextAllowedTsRef.current) return;

    const registerResponse = (
      setter: typeof setRightResponses,
      indexToUpdate: number,
      startTs: number,
      stimulusForIndex: 'green' | 'red'
    ) => {
      setter(prev => {
        const next = prev.slice();
        while (next.length <= indexToUpdate) {
          next.push({ stimulus: stimulusForIndex, responded: false, reactionTime: null, timestamp: Date.now(), hrStart: startTs });
        }
        if (!next[indexToUpdate].responded) {
          const rt = Math.max(20, Math.round(now - (startTs || reactionStartRef.current)));
          next[indexToUpdate] = { ...next[indexToUpdate], responded: true, reactionTime: rt };
        }
        return next;
      });
    };

    const withinGrace = now - reactionStartRef.current < GRACE_MS;
    const prevResponded = (phase === 'testRight' || phase === 'practiceRight')
      ? (rightResponses[prevIndexRef.current]?.responded ?? false)
      : (leftResponses[prevIndexRef.current]?.responded ?? false);
    const assignToPrevious =
      prevIndexRef.current >= 0 &&
      prevStimulusRef.current === 'green' &&
      withinGrace &&
      !prevResponded &&
      (currentStimulusRef.current === 'red' || currentStimulusRef.current === 'green');
    const targetIndex = assignToPrevious ? prevIndexRef.current : currentIndexRef.current;
    const targetStart = assignToPrevious ? prevStartRef.current : reactionStartRef.current;
    const targetStimulus = assignToPrevious ? (prevStimulusRef.current as 'green' | 'red') : (currentStimulusRef.current as 'green' | 'red');

    if (targetStimulus === 'red') {
      // count explicit presses on red as false alarms, but do not mark response entries
      if (phase === 'testRight' || phase === 'practiceRight') {
        setRightFalseAlarmsCount(v => v + 1);
      } else if (phase === 'testLeft' || phase === 'practiceLeft') {
        setLeftFalseAlarmsCount(v => v + 1);
      }
    } else {
      if (phase === 'testRight' || phase === 'practiceRight') {
        registerResponse(setRightResponses, targetIndex, targetStart, targetStimulus);
      } else if (phase === 'testLeft' || phase === 'practiceLeft') {
        registerResponse(setLeftResponses, targetIndex, targetStart, targetStimulus);
      }
    }

    // Close response window to avoid repeats leaking into next stimulus
    responseWindowOpenRef.current = false;
    nextAllowedTsRef.current = now + REFRACTORY_MS;
  }, [phase, rightResponses, leftResponses, isTestPhase, isPracticePhase]);



  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startBlock = useCallback((nextPhase: Phase) => {
    setPhase(nextPhase);
    setStimulusIndex(0);
    setSequence(generateSequence(Math.floor(BLOCK_DURATION_MS / STIMULUS_DURATION)));
    setBlockStartTime(Date.now());
    setRemainingMs(BLOCK_DURATION_MS);
  }, [generateSequence]);

  const startTest = () => {
    toast({
      title: 'Go/No-Go',
      description: t('gonogo.toast.start'),
    });
    setSequence(generateSequence(3));
    setPhase('practiceRight');
    setStimulusIndex(0);
    setBlockStartTime(Date.now());
    setRemainingMs(BLOCK_DURATION_MS);
  };

  useEffect(() => {
    const inRun = isTestPhase(phase) || isPracticePhase(phase);
    if (!inRun) return;
    if (stimulusIndex < sequence.length) {
      const stimulus = sequence[stimulusIndex];
      // keep previous stimulus context for grace attribution
      prevStimulusRef.current = currentStimulusRef.current;
      prevIndexRef.current = currentIndexRef.current;
      prevStartRef.current = reactionStartRef.current;
      setCurrentStimulus(stimulus);
      currentStimulusRef.current = stimulus;
      currentIndexRef.current = stimulusIndex;
      reactionStartRef.current = performance.now();
      responseWindowOpenRef.current = true;
      nextAllowedTsRef.current = 0; // reset refractory on new stimulus
      // trigger appearance animation reliably on each stimulus
      setAppear(false);
      setAppearId(id => id + 1);
      requestAnimationFrame(() => setAppear(true));
      const add = (setter: typeof setRightResponses) => setter(prev => {
        const next = prev.slice();
        // ensure slot exists for early presses that happen before add executes
        if (!next[stimulusIndex]) {
          next[stimulusIndex] = { stimulus, responded: false, reactionTime: null, timestamp: Date.now(), hrStart: reactionStartRef.current };
        }
        return next;
      });
      if (phase === 'testRight' || phase === 'practiceRight') add(setRightResponses);
      if (phase === 'testLeft' || phase === 'practiceLeft') add(setLeftResponses);
      const timer = setTimeout(() => {
        setStimulusIndex(prev => prev + 1);
        setAppear(false);
      }, STIMULUS_DURATION);
      return () => clearTimeout(timer);
    } else {
      if (phase === 'practiceRight') {
        startBlock('testRight');
      } else if (phase === 'testRight') {
        // Show hand switch screen between blocks
        setPhase('handSwitch');
      } else if (phase === 'practiceLeft') {
        startBlock('testLeft');
      } else if (phase === 'testLeft') {
        setPhase('complete');
      }
    }
  }, [phase, stimulusIndex, sequence, generateSequence, isTestPhase, isPracticePhase, startBlock]);

  useEffect(() => {
    if (!isTestPhase(phase)) return;
    if (!blockStartTime) return;
    const i = setInterval(() => {
      const elapsed = Date.now() - blockStartTime;
      const remain = Math.max(0, BLOCK_DURATION_MS - elapsed);
      setRemainingMs(remain);
      if (remain <= 0) {
        setStimulusIndex(sequence.length);
      }
    }, 250);
    return () => clearInterval(i);
  }, [phase, blockStartTime, sequence.length, isTestPhase]);

  const computeHand = useCallback((arr: typeof rightResponses) => {
    const correctGo = arr.filter(r => r.stimulus === 'green' && r.responded).length;
    const missedGo = arr.filter(r => r.stimulus === 'green' && !r.responded).length;
    const falseAlarms = arr.filter(r => r.stimulus === 'red' && r.responded).length;
    const correctNoGo = arr.filter(r => r.stimulus === 'red' && !r.responded).length;
    const rts = arr.filter(r => r.responded && r.reactionTime).map(r => r.reactionTime as number);
    const averageReactionTime = rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : 0;
    const sdReactionTime = (() => {
      const n = rts.length;
      if (n <= 1) return 0;
      const mean = averageReactionTime;
      const variance = rts.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (n - 1);
      return Math.sqrt(variance);
    })();
    return { correctGo, missedGo, falseAlarms, correctNoGo, reactionTimes: rts, averageReactionTime, sdReactionTime };
  }, []);

  useEffect(() => {
    if (phase !== 'complete') return;
    // Drop first 3 practice responses from each side if present
    const rightTrim = rightResponses.slice(3);
    const leftTrim = leftResponses.slice(3);
    const right = computeHand(rightTrim);
    const left = computeHand(leftTrim);
    const totalStimuli = rightTrim.length + leftTrim.length;
    const goStimuli = rightTrim.filter(r => r.stimulus === 'green').length + leftTrim.filter(r => r.stimulus === 'green').length;
    const noGoStimuli = totalStimuli - goStimuli;
    const correctGoAgg = right.correctGo + left.correctGo;
    const correctNoGoAgg = rightTrim.filter(r => r.stimulus === 'red' && !r.responded).length + leftTrim.filter(r => r.stimulus === 'red' && !r.responded).length;
    const accuracy = totalStimuli > 0 ? ((correctGoAgg + correctNoGoAgg) / totalStimuli) * 100 : 0;
    const combinedRTs = [...right.reactionTimes, ...left.reactionTimes];
    const averageReactionTime = combinedRTs.length ? combinedRTs.reduce((a, b) => a + b, 0) / combinedRTs.length : 0;
    onComplete({
      totalStimuli,
      goStimuli,
      noGoStimuli,
      accuracy,
      rightHand: {
        correctGo: right.correctGo,
        missedGo: right.missedGo,
        falseAlarms: right.falseAlarms,
        reactionTimes: right.reactionTimes,
        averageReactionTime: right.averageReactionTime,
        sdReactionTime: right.sdReactionTime,
      },
      leftHand: {
        correctGo: left.correctGo,
        missedGo: left.missedGo,
        falseAlarms: left.falseAlarms,
        reactionTimes: left.reactionTimes,
        averageReactionTime: left.averageReactionTime,
        sdReactionTime: left.sdReactionTime,
      },
      // legacy aggregates for compatibility
      correctGo: correctGoAgg,
      missedGo: right.missedGo + left.missedGo,
      falseAlarms: right.falseAlarms + left.falseAlarms,
      correctNoGo: correctNoGoAgg,
      reactionTimes: combinedRTs,
      averageReactionTime,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);



  const handleSkip = () => {
    // Skip behavior: from right-hand phases → hand switch screen;
    // from left-hand phases → finish and go to rest via onComplete
    if (phase === 'practiceRight' || phase === 'testRight') {
      setPhase('handSwitch');
    } else if (phase === 'practiceLeft' || phase === 'testLeft') {
      setPhase('complete');
    }
  };

  const { activeFalseAlarms, activeMisses, activeMeanRt, activeSdRt, meanDiffBetweenHands } = useMemo(() => {
    const isRight = phase === 'testRight' || phase === 'practiceRight';
    const isLeft = phase === 'testLeft' || phase === 'practiceLeft';
    const arr = isRight ? rightResponses : isLeft ? leftResponses : [];
    const falseAlarms = isRight ? rightFalseAlarmsCount : isLeft ? leftFalseAlarmsCount : 0;
    const misses = arr.filter(r => r.stimulus === 'green' && !r.responded).length;
    const rts = arr
      .filter(r => r.stimulus === 'green' && r.responded && r.reactionTime)
      .map(r => r.reactionTime as number);
    const meanRt = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : 0;
    const sdRt = (() => {
      const n = rts.length;
      if (n <= 1) return 0;
      const mean = rts.reduce((a, b) => a + b, 0) / n;
      const variance = rts.reduce((acc, t) => acc + Math.pow(t - mean, 2), 0) / (n - 1);
      return Math.round(Math.sqrt(variance));
    })();
    let meanDiff: number | null = null;
    if (isLeft) {
      const rightRts = rightResponses
        .filter(r => r.stimulus === 'green' && r.responded && r.reactionTime)
        .map(r => r.reactionTime as number);
      const rightMean = rightRts.length ? rightRts.reduce((a, b) => a + b, 0) / rightRts.length : 0;
      meanDiff = Math.abs(meanRt - Math.round(rightMean));
    }
    return {
      activeFalseAlarms: falseAlarms,
      activeMisses: misses,
      activeMeanRt: meanRt,
      activeSdRt: sdRt,
      meanDiffBetweenHands: meanDiff,
    };
  }, [phase, rightResponses, leftResponses, rightFalseAlarmsCount, leftFalseAlarmsCount]);

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>{t('gonogo.title')}</CardTitle>
            <CardDescription>{t('gonogo.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">{t('gonogo.instruction.title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t('gonogo.instruction.item1')}</li>
                <li>{t('gonogo.instruction.item2')}</li>
                <li>
                  <strong className="text-green-600">{t('gonogo.instruction.greenLabel')}</strong>
                  {' — '}
                  {t('gonogo.instruction.greenAction')}.
                  {' '}
                  <strong className="text-red-600">{t('gonogo.instruction.redLabel')}</strong>
                  {' — '}
                  {t('gonogo.instruction.redAction')}.
                </li>
                <li>{t('gonogo.instruction.item4')}</li>

              </ul>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-semibold text-green-600">{t('gonogo.visual.go')}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 mx-auto mb-2" style={{ borderRadius: 8 }}></div>
                  <p className="text-sm font-semibold text-red-600">{t('gonogo.visual.nogo')}</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Button onClick={startTest} size="lg">
                {t('gonogo.start')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isTestPhase(phase) || isPracticePhase(phase)) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4 transition-all ${feedback ? 'border-4 border-blue-400' : 'border-4 border-transparent'}`}>
        <div className="w-full max-w-md mb-8 relative">
          {isTestPhase(phase) && (
            <Timer durationMs={BLOCK_DURATION_MS} className="absolute -top-6 right-0 text-xs text-muted-foreground" />
          )}

          <p className="text-center text-sm text-muted-foreground mt-2">
            {isPracticePhase(phase)
              ? t('gonogo.practice')
              : t('gonogo.running')} · {phase === 'testRight' || phase === 'practiceRight'
                ? t('gonogo.right-hand')
                : t('gonogo.left-hand')}
          </p>
          {devMode && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>{t('gonogo.dev.false-alarms')}</span>
                <span>{activeFalseAlarms}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('gonogo.dev.omissions')}</span>
                <span>{activeMisses}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('gonogo.dev.mean-rt')}</span>
                <span>{activeMeanRt}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('gonogo.dev.sd-rt')}</span>
                <span>{activeSdRt}</span>
              </div>
              {(phase === 'testLeft' || phase === 'practiceLeft') && (
                <div className="col-span-2 flex justify-between">
                  <span>{t('gonogo.dev.diff-between-hands')}</span>
                  <span>{meanDiffBetweenHands ?? 0}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="w-40 h-40 mx-auto flex items-center justify-center">
            {currentStimulus && (
              currentStimulus === 'green' ? (
                <div
                  key={appearId}
                  className={`w-32 h-32 rounded-full bg-green-500 transition-all duration-200 ease-out ${appear ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} shadow-lg`}
                />
              ) : (
                <div
                  key={appearId}
                  className={`w-32 h-32 bg-red-500 transition-all duration-200 ease-out ${appear ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} shadow-lg`}
                  style={{ borderRadius: 8 }}
                />
              )
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {t('gonogo.hint')}
          </p>
          {devMode && (
            <div className="mt-6">
              <Button variant="outline" onClick={handleSkip}>{t('gonogo.skip')}</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === 'handSwitch') {
    return (
      <HandSwitchStep onContinue={() => {
        setSequence(generateSequence(3));
        setPhase('practiceLeft');
        setStimulusIndex(0);
        setBlockStartTime(Date.now());
        setRemainingMs(BLOCK_DURATION_MS);
      }} />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('gonogo.completed.title')}</CardTitle>
          <CardDescription>{t('gonogo.completed.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">{t('gonogo.completed.next')}</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};