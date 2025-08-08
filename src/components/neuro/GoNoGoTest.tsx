import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoNoGoResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface GoNoGoTestProps {
  onComplete: (results: GoNoGoResult) => void;
}

const TOTAL_STIMULI = 40;
const GO_COUNT = 30;
const NOGO_COUNT = 10;
const STIMULUS_DURATION = 1500; // 1.5 seconds

export const GoNoGoTest = ({ onComplete }: GoNoGoTestProps) => {
  const [phase, setPhase] = useState<'instructions' | 'test' | 'complete'>('instructions');
  const [currentStimulus, setCurrentStimulus] = useState<'green' | 'red' | ''>('');
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [responses, setResponses] = useState<Array<{
    stimulus: 'green' | 'red';
    responded: boolean;
    reactionTime: number | null;
    timestamp: number;
  }>>([]);
  const [reactionStartTime, setReactionStartTime] = useState<number>(0);

  // Generate stimulus sequence
  const generateSequence = useCallback(() => {
    const sequence: ('green' | 'red')[] = [];
    
    // Add GO stimuli (green)
    for (let i = 0; i < GO_COUNT; i++) {
      sequence.push('green');
    }
    
    // Add NO-GO stimuli (red)
    for (let i = 0; i < NOGO_COUNT; i++) {
      sequence.push('red');
    }
    
    // Shuffle the sequence
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
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
      description: 'Нажимайте пробел на зелёный круг, не нажимайте на красный',
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
    const correctGo = responses.filter(r => r.stimulus === 'green' && r.responded).length;
    const missedGo = responses.filter(r => r.stimulus === 'green' && !r.responded).length;
    const falseAlarms = responses.filter(r => r.stimulus === 'red' && r.responded).length;
    const correctNoGo = responses.filter(r => r.stimulus === 'red' && !r.responded).length;
    
    const reactionTimes = responses
      .filter(r => r.responded && r.reactionTime)
      .map(r => r.reactionTime as number);
    
    const accuracy = ((correctGo + correctNoGo) / TOTAL_STIMULI) * 100;
    const averageReactionTime = reactionTimes.length > 0 
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length 
      : 0;

    const results: GoNoGoResult = {
      totalStimuli: TOTAL_STIMULI,
      goStimuli: GO_COUNT,
      noGoStimuli: NOGO_COUNT,
      correctGo,
      missedGo,
      falseAlarms,
      correctNoGo,
      reactionTimes,
      averageReactionTime,
      accuracy,
    };

    onComplete(results);
  };

  const progress = phase === 'test' ? (stimulusIndex / TOTAL_STIMULI) * 100 : 0;

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Тест Go/No-Go (самоконтроль)</CardTitle>
            <CardDescription>
              Проверка способности к самоконтролю и торможению импульсов
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Инструкция:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>На экране будут появляться цветные круги</li>
                <li>Каждый круг показывается 1.5 секунды</li>
                <li><strong className="text-green-600">ЗЕЛЁНЫЙ круг:</strong> нажимайте пробел (Go)</li>
                <li><strong className="text-red-600">КРАСНЫЙ круг:</strong> НЕ нажимайте ничего (No-Go)</li>
                <li>Всего будет показано 40 кругов</li>
                <li>30 зелёных и 10 красных</li>
              </ul>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-semibold text-green-600">НАЖАТЬ</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm font-semibold text-red-600">НЕ НАЖИМАТЬ</p>
                </div>
              </div>
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
          <div className="w-40 h-40 flex items-center justify-center">
            {currentStimulus && (
              <div className={`w-32 h-32 rounded-full ${
                currentStimulus === 'green' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
            )}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Зелёный - нажать пробел | Красный - не нажимать
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
            Второй тест на самоконтроль успешно пройден
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">Переходим к визуальному отдыху</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};