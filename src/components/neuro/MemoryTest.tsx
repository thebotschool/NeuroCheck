import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface MemoryTestProps {
  onComplete: (results: MemoryResult) => void;
}

const TOTAL_CARDS = 5;
const DISPLAY_TIME = 3000; // 3 seconds
const TEST_TIME = 60000; // 60 seconds

const CARD_IMAGES = [
  { id: 1, shape: 'circle', color: 'bg-blue-500' },
  { id: 2, shape: 'square', color: 'bg-red-500' },
  { id: 3, shape: 'triangle', color: 'bg-green-500' },
  { id: 4, shape: 'diamond', color: 'bg-yellow-500' },
  { id: 5, shape: 'star', color: 'bg-purple-500' },
  { id: 6, shape: 'circle', color: 'bg-orange-500' },
  { id: 7, shape: 'square', color: 'bg-pink-500' },
  { id: 8, shape: 'triangle', color: 'bg-cyan-500' },
  { id: 9, shape: 'diamond', color: 'bg-indigo-500' },
  { id: 10, shape: 'star', color: 'bg-teal-500' },
];

export const MemoryTest = ({ onComplete }: MemoryTestProps) => {
  const [phase, setPhase] = useState<'instructions' | 'memorize' | 'test' | 'complete'>('instructions');
  const [targetCards, setTargetCards] = useState<typeof CARD_IMAGES>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(TEST_TIME / 1000);
  const [testStartTime, setTestStartTime] = useState<number>(0);

  const generateTargetCards = useCallback(() => {
    const shuffled = [...CARD_IMAGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_CARDS);
  }, []);

  const startMemorizePhase = () => {
    const cards = generateTargetCards();
    setTargetCards(cards);
    setPhase('memorize');
    
    toast({
      title: 'Запомните карточки',
      description: 'У вас есть 3 секунды',
    });

    setTimeout(() => {
      setPhase('test');
      setTestStartTime(Date.now());
      toast({
        title: 'Выберите карточки',
        description: 'Перетащите те карточки, которые вы видели',
      });
    }, DISPLAY_TIME);
  };

  useEffect(() => {
    if (phase === 'test') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setPhase('complete');
            calculateResults();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [phase]);

  const calculateResults = () => {
    const targetIds = targetCards.map(card => card.id);
    const correctCards = selectedCards.filter(id => targetIds.includes(id)).length;
    const incorrectCards = selectedCards.filter(id => !targetIds.includes(id)).length;
    const timeSpent = (Date.now() - testStartTime) / 1000;
    const accuracy = (correctCards / TOTAL_CARDS) * 100;

    const results: MemoryResult = {
      totalCards: TOTAL_CARDS,
      correctCards,
      incorrectCards,
      timeSpent,
      accuracy,
    };

    onComplete(results);
  };

  const handleCardSelect = (cardId: number) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(prev => prev.filter(id => id !== cardId));
    } else if (selectedCards.length < TOTAL_CARDS) {
      setSelectedCards(prev => [...prev, cardId]);
    }
  };

  const renderCard = (card: typeof CARD_IMAGES[0], isSelected = false) => {
    return (
      <div
        key={card.id}
        className={`w-20 h-20 ${card.color} rounded-lg flex items-center justify-center cursor-pointer border-2 transition-all ${
          isSelected ? 'border-primary border-4 scale-105' : 'border-transparent hover:border-primary/50'
        }`}
        onClick={() => phase === 'test' && handleCardSelect(card.id)}
      >
        <div className="text-white font-bold text-xs text-center">
          {card.shape}
        </div>
      </div>
    );
  };

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Тест на рабочую зрительную память</CardTitle>
            <CardDescription>
              Проверка способности запоминать и воспроизводить визуальную информацию
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Инструкция:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>На экране появятся 5 карточек с цветными фигурами</li>
                <li>Вы увидите их в течение 3 секунд</li>
                <li>Запомните все карточки</li>
                <li>После этого появится поле с 10 карточками</li>
                <li>Нажмите на те 5 карточек, которые вы видели ранее</li>
                <li>У вас есть 60 секунд на выполнение</li>
              </ul>
            </div>
            <div className="text-center">
              <Button onClick={startMemorizePhase} size="lg">
                Начать тест
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'memorize') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Запомните эти карточки</CardTitle>
            <CardDescription>3 секунды</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {targetCards.map(card => renderCard(card))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'test') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <div className="w-full max-w-lg mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Выбрано: {selectedCards.length}/{TOTAL_CARDS}</span>
            <span className="text-sm">Время: {timeLeft}с</span>
          </div>
          <Progress value={(selectedCards.length / TOTAL_CARDS) * 100} className="h-2" />
        </div>

        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Выберите карточки, которые вы видели</CardTitle>
            <CardDescription>Нажмите на 5 карточек</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {CARD_IMAGES.map(card => renderCard(card, selectedCards.includes(card.id)))}
            </div>
            <div className="mt-4 text-center">
              <Button 
                onClick={() => {
                  setPhase('complete');
                  calculateResults();
                }}
                disabled={selectedCards.length !== TOTAL_CARDS}
                variant={selectedCards.length === TOTAL_CARDS ? 'default' : 'outline'}
              >
                Завершить тест
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
          <CardTitle>Тест завершён!</CardTitle>
          <CardDescription>
            Все три теста успешно пройдены
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="mb-4">Обрабатываем результаты...</p>
            <div className="animate-pulse">
              <div className="h-2 bg-primary rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};