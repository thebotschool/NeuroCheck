import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { UserDataStep } from '@/components/neuro/UserDataStep';
import { TCPTest } from '@/components/neuro/TCPTest';
import { GoNoGoTest } from '@/components/neuro/GoNoGoTest';
import { VideoRestStep } from '@/components/neuro/VideoRestStep';
import { MemoryTest } from '@/components/neuro/MemoryTest';
import { ResultsStep } from '@/components/neuro/ResultsStep';
import { useTestSession } from '@/hooks/useTestSession';
import LoadingScreen from '@/components/neuro/LoadingScreen';
import MobileBlocked from '@/components/neuro/MobileBlocked';
import { useIsMobile } from '@/hooks/use-mobile';
import { TestStep, TCPResult, GoNoGoResult, MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

type TokenState = 'verifying' | 'valid' | 'invalid' | 'invalid_time';

const NeuroCheck = () => {
  const [searchParams] = useSearchParams();
  const [tokenState, setTokenState] = useState<TokenState>('verifying');
  const [invalidTimeMessage, setInvalidTimeMessage] = useState('');
  const [currentStep, setCurrentStep] = useState<TestStep>('user-data');
  const [instructionStep, setInstructionStep] = useState<'parents' | 'children'>('parents');
  const [tcpResults, setTcpResults] = useState<TCPResult | null>(null);
  const [gonogoResults, setGonogoResults] = useState<GoNoGoResult | null>(null);
  const [memoryResults, setMemoryResults] = useState<MemoryResult | null>(null);
  const [restContext, setRestContext] = useState<'after-tcp' | 'after-gonogo' | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [vimeoVideoId, setVimeoVideoId] = useState<string>('');
  const [testStarted, setTestStarted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const { test, loading, updateTestWithUserData, saveTCPResults, saveGoNoGoResults, saveMemoryResults, completeTest, getTestByToken } = useTestSession();
  const isMobile = useIsMobile();

  const handleBackToStart = useCallback(() => {
    setTestStarted(false);
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    setDevMode(searchParams.has('dev'));

    if (!token) {
      setTokenState('invalid');
      return;
    }

    fetch(`/api/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setTokenState('valid');
          getTestByToken(token);
        } else if (data.error === 'invalid_time') {
          setTokenState('invalid_time');
          setInvalidTimeMessage(data.message);
        } else {
          setTokenState('invalid');
        }
      })
      .catch(() => setTokenState('invalid'));
  }, [searchParams, getTestByToken]);

  const handleStartTest = async () => {
    setIsStarting(true);
    const token = searchParams.get('token');

    if (token) {
      const res = await fetch('/api/consume-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.consumed) {
        setTestStarted(true);
      } else {
        setTokenState('invalid');
        toast({ title: 'Ошибка', description: data.reason || 'Не удалось активировать токен.', variant: 'destructive' });
        setIsStarting(false);
      }
    }
  };

  const handleUserDataSuccess = async (name: string, age: number, email: string) => {
    if (!test) return;
    try {
      await updateTestWithUserData(test.token, name, age, email);
      setCurrentStep('tcp-test');
    } catch (e) {
      console.error('updateTestWithUserData failed', e);
    }
  };

  const handleTCPComplete = async (results: TCPResult) => {
    setTcpResults(results);
    await saveTCPResults(results);
    setRestContext('after-tcp');
    setVimeoVideoId('1110778610');
    setCurrentStep('video-rest');
  };

  const handleGoNoGoComplete = async (results: GoNoGoResult) => {
    setGonogoResults(results);
    await saveGoNoGoResults(results);
    setRestContext('after-gonogo');
    setVimeoVideoId('1110779121');
    setCurrentStep('video-rest');
  };

  const handleVideoRestContinue = () => {
    if (restContext === 'after-tcp') {
      setCurrentStep('gonogo-test');
    } else {
      setCurrentStep('memory-test');
    }
    setRestContext(null);
  };

  const handleMemoryComplete = async (results: MemoryResult) => {
    setMemoryResults(results);
    await saveMemoryResults(results);
    setCurrentStep('results');
  };

  const handleResultsComplete = useCallback(async (reportHtml: string) => {
    await completeTest(reportHtml);
  }, [completeTest]);

  if (isMobile) {
    return <MobileBlocked onBackToLanding={() => {}} />;
  }

  if (tokenState === 'verifying' || loading) {
    return <LoadingScreen />;
  }

  if (tokenState === 'invalid') {
    return <div className="min-h-screen flex items-center justify-center">Ссылка недействительна или устарела.</div>;
  }

  if (tokenState === 'invalid_time') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold">Тестирование временно недоступно</h2>
          <p className="mt-4 text-muted-foreground">
            {invalidTimeMessage}
          </p>
        </div>
      </div>
    );
  }

  if (!testStarted && tokenState === 'valid') {
    if (instructionStep === 'parents') {
      return (
        <div className="min-h-screen bg-white text-gray-900 px-6 py-12 flex items-center justify-center">
          <section className="max-w-2xl mx-auto space-y-6 text-left">
            <h2 className="text-2xl font-semibold text-center">Памятка для родителей</h2>
            <div className="space-y-4 p-6 border rounded-lg">
              <p className="font-semibold">Что это?</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Это скрининг, а не медицинская диагностика.</li>
                <li>Мы не ставим диагнозы, а показываем зоны гордости, развития и возможные трудности в учебе.</li>
                <li>Итог — отчёт для вас и учителей с конкретными рекомендациями.</li>
              </ul>
              <p className="font-semibold">Сколько времени займёт?</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Всего около 15 минут.</li>
                <li>Между тестами будут короткие мультфильмы для отдыха.</li>
              </ul>
              <p className="font-semibold">Кто проходит?</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Скрининг проходит сам ребёнок.</li>
                <li>Ваша помощь — только в начале: запустить компьютер, проверить интернет и тишину.</li>
                <li>Важно: не подсказывать во время заданий.</li>
              </ul>
              <p className="font-semibold">Что подготовить?</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Тихое, спокойное место.</li>
                <li>Компьютер/ноутбук с клавиатурой и мышкой.</li>
                <li>Удобный стол и стул.</li>
                <li>Перед началом — сходить в туалет, попить воды.</li>
              </ul>
            </div>
            <div className="text-center">
              <Button onClick={() => setInstructionStep('children')} size="lg">Далее</Button>
            </div>
          </section>
        </div>
      );
    }

    if (instructionStep === 'children') {
      return (
        <div className="min-h-screen bg-white text-gray-900 px-6 py-12 flex items-center justify-center">
          <section className="max-w-2xl mx-auto space-y-6 text-left">
            <h2 className="text-2xl font-semibold text-center">Памятка для ребёнка</h2>
            <div className="space-y-4 p-6 border rounded-lg">
                <p className="font-semibold">✨ Тебе предстоит пройти скрининг!</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Это не экзамен и не контрольная. Здесь нельзя «плохо» или «хорошо» сделать.</li>
                    <li>Мы просто посмотрим, как работает твое внимание и память.</li>
                </ul>
                <p className="font-semibold">Что будет?</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>У тебя будет три задания на компьютере.</li>
                  <li>Одно — нажимать клавишу, когда увидишь букву.</li>
                  <li>Второе — нажимать или не нажимать в игре с картинками.</li>
                  <li>Третье — запомнить картинки и расставить их потом в нужном порядке.</li>
                </ul>
                <p className="font-semibold">Что нужно сделать перед началом?</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Сесть удобно за стол.</li>
                  <li>Чтобы было тихо, никто не отвлекал.</li>
                  <li>Проверить, что всё работает на компьютере.</li>
                  <li>Попить воды и сходить в туалет.</li>
                </ul>
                <p className="font-semibold">Важно помнить:</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>Ты делаешь всё сам.</li>
                  <li>Никто не будет подсказывать.</li>
                  <li>Главное — постараться и пройти до конца.</li>
                </ul>
            </div>
            <div className="text-center space-y-2">
              <Button onClick={handleStartTest} size="lg" disabled={isStarting}>
                {isStarting ? 'Загрузка...' : 'Начать тест'}
              </Button>
              <p className="text-xs text-gray-500">
                Нажимая на кнопку, вы принимаете{' '}
                <Link to="/privacy" className="underline">
                  согласие на обработку персональных данных
                </Link>
              </p>
            </div>
          </section>
        </div>
      );
    }
  }

  if (testStarted) {
    return (
      <div>
        <div className="transition-all duration-500 ease-in-out">
          {currentStep === 'user-data' && (
            !test ? (
              <LoadingScreen />
            ) : (
              <UserDataStep
                onSuccess={handleUserDataSuccess}
                email={test.email ?? ''}
                onBack={handleBackToStart}
              />
            )
          )}
          {currentStep === 'tcp-test' && (
            <TCPTest onComplete={handleTCPComplete} onSkip={handleTCPComplete} devMode={devMode} test={test} />
          )}
          {currentStep === 'gonogo-test' && (
            <GoNoGoTest onComplete={handleGoNoGoComplete} devMode={devMode} />
          )}
          {currentStep === 'video-rest' && (
            <VideoRestStep onContinue={handleVideoRestContinue} vimeoVideoId={vimeoVideoId} devMode={devMode} />
          )}
          {currentStep === 'memory-test' && (
            <MemoryTest onComplete={handleMemoryComplete} age={test?.age ?? 3} devMode={devMode} />
          )}
          {currentStep === 'results' && (
            !test || !tcpResults || !gonogoResults || !memoryResults ? (
              <div>Ошибка: Данные для отображения результатов неполные.</div>
            ) : (
              <ResultsStep
                test={test}
                tcpResults={tcpResults}
                gonogoResults={gonogoResults}
                memoryResults={memoryResults}
                devMode={devMode}
                onComplete={handleResultsComplete}
              />
            )
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default NeuroCheck;