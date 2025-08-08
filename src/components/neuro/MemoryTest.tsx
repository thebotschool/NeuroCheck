import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

interface MemoryTestProps {
  onComplete: (results: MemoryResult) => void;
  age: number;
  // temporary dev bypass to skip distractor
  devBypass?: boolean;
}

const DISPLAY_PER_CARD_MS = 1500; // 1.5 seconds per card
const DISTRACTOR_MS = 120000; // 2 minutes

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

export const MemoryTest = ({ onComplete, age, devBypass = false }: MemoryTestProps) => {
  type Phase = 'instructions' | 'memorize' | 'distract' | 'reconstruct' | 'complete';
  const [phase, setPhase] = useState<Phase>('instructions');
  const sequenceLength = useMemo(() => {
    if (age >= 19) return 10;
    if (age >= 14) return 8;
    return 6; // 7–13
  }, [age]);

  const [targetSequence, setTargetSequence] = useState<typeof CARD_IMAGES>([]);
  const [currentMemorizeIndex, setCurrentMemorizeIndex] = useState<number>(0);
  const [remainingDistractMs, setRemainingDistractMs] = useState<number>(DISTRACTOR_MS);

  // Reconstruction state
  const [poolCards, setPoolCards] = useState<typeof CARD_IMAGES>([]);
  const [slots, setSlots] = useState<Array<number | null>>([]); // ids in order or null
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [reconstructionStart, setReconstructionStart] = useState<number | null>(null);
  const [firstDropSlot, setFirstDropSlot] = useState<number | null>(null);

  const generateTargetSequence = useCallback(() => {
    const shuffled = [...CARD_IMAGES].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, sequenceLength);
  }, [sequenceLength]);

  const startMemorizePhase = () => {
    const seq = generateTargetSequence();
    setTargetSequence(seq);
    setCurrentMemorizeIndex(0);
    setPhase('memorize');
    toast({ title: 'Запоминание последовательности', description: `Длина: ${sequenceLength}. Запоминайте порядок` });
  };

  // Run memorize presentation one-by-one
  useEffect(() => {
    if (phase !== 'memorize') return;
    if (currentMemorizeIndex >= sequenceLength) {
      // move to distractor
      setPhase('distract');
      setRemainingDistractMs(DISTRACTOR_MS);
      return;
    }
    const t = setTimeout(() => {
      setCurrentMemorizeIndex(i => i + 1);
    }, DISPLAY_PER_CARD_MS);
    return () => clearTimeout(t);
  }, [phase, currentMemorizeIndex, sequenceLength]);

  const showDevControls = import.meta.env.VITE_SHOW_DEV_CONTROLS === 'true' || devBypass;

  // Distractor countdown
  useEffect(() => {
    if (phase !== 'distract') return;
    const started = Date.now();
    const i = setInterval(() => {
      const elapsed = Date.now() - started;
      const remain = Math.max(0, DISTRACTOR_MS - elapsed);
      setRemainingDistractMs(remain);
      if (remain <= 0) {
        clearInterval(i);
        // Setup reconstruction
        const shuffled = [...targetSequence].sort(() => Math.random() - 0.5);
        setPoolCards(shuffled);
        setSlots(new Array(sequenceLength).fill(null));
        setReconstructionStart(Date.now());
        setFirstDropSlot(null);
        setPhase('reconstruct');
      }
    }, 250);
    return () => clearInterval(i);
  }, [phase, sequenceLength, targetSequence]);

  const skipDistractorNow = () => {
    // Same transition as natural timeout
    const shuffled = [...targetSequence].sort(() => Math.random() - 0.5);
    setPoolCards(shuffled);
    setSlots(new Array(sequenceLength).fill(null));
    setReconstructionStart(Date.now());
    setFirstDropSlot(null);
    setPhase('reconstruct');
  };

  const calculateResults = () => {
    const targetIds = targetSequence.map(c => c.id);
    const placedIds = slots.map(id => id ?? -1);
    const correctPositions = placedIds.reduce((acc, id, idx) => acc + (id === targetIds[idx] ? 1 : 0), 0);
    const substitutionErrors = placedIds.filter(id => id !== -1 && !targetIds.includes(id)).length;
    const orderErrors = sequenceLength - correctPositions;
    const startPosition = firstDropSlot ?? -1;
    const reconstructionTimeMs = reconstructionStart ? Date.now() - reconstructionStart : 0;
    // Store total time spent in milliseconds to keep units consistent across tests
    const timeSpent = reconstructionTimeMs;
    const correctCards = placedIds.filter(id => targetIds.includes(id)).length;
    const incorrectCards = sequenceLength - correctCards;
    const accuracy = (correctPositions / sequenceLength) * 100;

    const results: MemoryResult = {
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
    };
    onComplete(results);
  };

  // Drag & Drop handlers
  const onDragStart = (cardId: number) => setDraggingId(cardId);
  const onDragEnd = () => setDraggingId(null);
  const onDropToSlot = (slotIndex: number) => {
    if (draggingId == null) return;
    setSlots(prev => {
      const next = [...prev];
      next[slotIndex] = draggingId;
      return next;
    });
    setPoolCards(prev => prev.filter(c => c.id !== draggingId));
    if (firstDropSlot === null) setFirstDropSlot(slotIndex);
    setDraggingId(null);
  };
  const onRemoveFromSlot = (slotIndex: number) => {
    setSlots(prev => {
      const next = [...prev];
      const id = next[slotIndex];
      if (id != null) {
        const card = CARD_IMAGES.find(c => c.id === id);
        if (card) setPoolCards(prevPool => [...prevPool, card]);
      }
      next[slotIndex] = null;
      return next;
    });
  };

  const renderCard = (card: typeof CARD_IMAGES[0]) => {
    return (
      <div
        key={card.id}
        draggable
        onDragStart={() => onDragStart(card.id)}
        onDragEnd={onDragEnd}
        className={`w-20 h-20 ${card.color} rounded-lg flex items-center justify-center cursor-grab border-2 transition-all hover:border-primary/50`}
      >
        <div className="text-white font-bold text-xs text-center">{card.shape}</div>
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
                <li>На экране по очереди появятся {sequenceLength} карточек (по 1.5 сек каждая). Запоминайте порядок.</li>
                <li>Затем будет 2-минутный отвлекающий этап.</li>
                <li>После этого восстановите порядок, перетаскивая карточки в пустые ячейки сверху.</li>
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
            <CardTitle>Запомните последовательность</CardTitle>
            <CardDescription>
              {currentMemorizeIndex}/{sequenceLength}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40">
              {targetSequence[currentMemorizeIndex] && (
                <div className={`w-24 h-24 ${targetSequence[currentMemorizeIndex].color} rounded-lg flex items-center justify-center`}>
                  <div className="text-white font-bold text-sm">{targetSequence[currentMemorizeIndex].shape}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'distract') {
    const mm = String(Math.floor(remainingDistractMs / 60000)).padStart(2, '0');
    const ss = String(Math.floor((remainingDistractMs % 60000) / 1000)).padStart(2, '0');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Отвлекающий этап</CardTitle>
            <CardDescription>Осталось: {mm}:{ss}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                <div className="absolute inset-4 rounded-full bg-emerald-400/20 animate-ping [animation-delay:200ms]" />
                <div className="absolute inset-8 rounded-full bg-emerald-400/20 animate-ping [animation-delay:400ms]" />
                <div className="absolute inset-12 rounded-full bg-emerald-400/30" />
              </div>
            </div>
            {showDevControls && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={skipDistractorNow}>
                  Пропустить отвлекающий этап (для тестирования)
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
        <div className="w-full max-w-2xl mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Заполнено: {slots.filter(s => s != null).length}/{sequenceLength}</span>
          </div>
          <Progress value={(slots.filter(s => s != null).length / sequenceLength) * 100} className="h-2" />
        </div>

        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle>Восстановите порядок</CardTitle>
            <CardDescription>Перетащите карточки снизу в ячейки сверху</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 justify-items-center mb-6">
              {slots.map((id, idx) => (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropToSlot(idx)}
                  className={`w-20 h-20 rounded-lg border-2 flex items-center justify-center ${id ? 'border-primary' : 'border-dashed border-muted-foreground/40'}`}
                >
                  {id ? (
                    <div
                      className={`w-18 h-18 ${CARD_IMAGES.find(c => c.id === id)?.color} rounded-lg flex items-center justify-center cursor-pointer`}
                      onClick={() => onRemoveFromSlot(idx)}
                    >
                      <div className="text-white font-bold text-xs">{CARD_IMAGES.find(c => c.id === id)?.shape}</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 justify-items-center">
              {poolCards.map(card => renderCard(card))}
            </div>
            <div className="mt-6 text-center">
              <Button 
                onClick={() => { setPhase('complete'); calculateResults(); }}
                disabled={slots.some(s => s == null)}
                variant={slots.every(s => s != null) ? 'default' : 'outline'}
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