import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CPTResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface CPTTestProps {
  onComplete: (results: CPTResult) => void;
}

const TOTAL_STIMULI = 40;
const TARGET_COUNT = 6;
const STIMULUS_DURATION = 1000; // 1 second

export const CPTTest = ({ onComplete }: CPTTestProps) => {
  const [phase, setPhase] = useState<'instructions' | 'test' | 'complete'>('instructions');
  const [currentStimulus, setCurrentStimulus] = useState<string>('');
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{
    stimulus: string;
    responded: boolean;
    reactionTime: number | null;
    timestamp: number;
  }>>([]);
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);

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
    if (event.code === 'Space' && phase === 'test' && currentStimulus) {
      event.preventDefault();
      const reactionTime = Date.now() - reactionStartTime;
      
      setResponses(prev => {
        const newResponses = [...prev];
        if (newResponses[stimulusIndex - 1]) {
          newResponses[stimulusIndex - 1] = {
            ...newResponses[stimulusIndex - 1],
            responded: true,
            reactionTime,
          };
        }
        return newResponses;
      });
    }
  }, [phase, currentStimulus, reactionStartTime, stimulusIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const startTest = () => {
    setPhase('test');
    setStimulusIndex(0);
    setResponses([]);
    toast({
      title: 'Тест начался',
      description: 'Нажимайте пробел, когда видите букву X',
    });
  };

  useEffect(() => {
    if (phase === 'test') {
      if (stimulusIndex < TOTAL_STIMULI) {
        const stimulus = sequence[stimulusIndex];
        setCurrentStimulus(stimulus);
        setReactionStartTime(Date.now());
        
        setResponses(prev => [...prev, {
          stimulus,
          responded: false,
          reactionTime: null,
          timestamp: Date.now(),
        }]);

        const timer = setTimeout(() => {
          setStimulusIndex(prev => prev + 1);
          setCurrentStimulus('');
        }, STIMULUS_DURATION);

        return () => clearTimeout(timer);
      } else {
        // Test complete
        setPhase('complete');
        calculateResults();
      }
    }
  }, [phase, stimulusIndex, sequence]);

  const calculateResults = () => {
    const hits = responses.filter(r => r.stimulus === 'X' && r.responded).length;
    const misses = responses.filter(r => r.stimulus === 'X' && !r.responded).length;
    const falseAlarms = responses.filter(r => r.stimulus !== 'X' && r.responded).length;
    const correctRejections = responses.filter(r => r.stimulus !== 'X' && !r.responded).length;
    
    const reactionTimes = responses
      .filter(r => r.responded && r.reactionTime)
      .map(r => r.reactionTime as number);
    
    const accuracy = ((hits + correctRejections) / TOTAL_STIMULI) * 100;
    const averageReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;

    const results: CPTResult = {
      totalStimuli: TOTAL_STIMULI,
      targetsPresented: TARGET_COUNT,
      hits,
      misses,
      falseAlarms,
      correctRejections,
      reactionTimes,
      accuracy,
      averageReactionTime,
    };

    onComplete(results);
  };

  const progress = phase === 'test' ? (stimulusIndex / TOTAL_STIMULI) * 100 : 0;

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
                <li>На экране будут появляться буквы одна за другой</li>
                <li>Каждая буква показывается 1 секунду</li>
                <li><strong>Нажимайте пробел только когда видите букву X</strong></li>
                <li>Не нажимайте пробел при других буквах</li>
                <li>Всего будет показано 40 букв</li>
                <li>Среди них 6 раз встретится буква X</li>
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="w-full max-w-md mb-8">
          <Progress value={progress} className="h-2" />
          <p className="text-center text-sm text-muted-foreground mt-2">
            {stimulusIndex} / {TOTAL_STIMULI}
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-32 h-32 flex items-center justify-center border-2 border-primary rounded-lg bg-card">
            <span className="text-6xl font-bold">
              {currentStimulus}
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Нажмите пробел, если видите букву X
          </p>
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