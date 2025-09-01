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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TokenState = 'verifying' | 'valid' | 'invalid' | 'requires_email';

const NeuroCheck = () => {
  const [searchParams] = useSearchParams();
  const [tokenState, setTokenState] = useState<TokenState>('verifying');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const [currentStep, setCurrentStep] = useState<TestStep>('user-data');
  const [instructionStep, setInstructionStep] = useState<'parents' | 'children'>('parents');
  const [tcpResults, setTcpResults] = useState<TCPResult | null>(null);
  const [gonogoResults, setGonogoResults] = useState<GoNoGoResult | null>(null);
  const [memoryResults, setMemoryResults] = useState<MemoryResult | null>(null);
  const [restContext, setRestContext] = useState<'after-tcp' | 'after-gonogo' | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [vimeoVideoId, setVimeoVideoId] = useState<string>('');
  const [testStarted, setTestStarted] = useState(false);
  const [timeBypassed, setTimeBypassed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isTestReadyForResults, setIsTestReadyForResults] = useState(false);

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
      setVerificationError('Токен не найден.');
      return;
    }

    fetch(`/api/verify-token?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          if (data.email) {
            setTokenState('valid');
            getTestByToken(token);
          } else {
            setTokenState('requires_email');
            setIsEmailModalOpen(true);
          }
        } else {
          setTokenState('invalid');
          setVerificationError(data.error || 'Неизвестная ошибка проверки токена.');
        }
      })
      .catch(() => {
        setTokenState('invalid');
        setVerificationError('Не удалось связаться с сервером.');
      });
  }, [searchParams, getTestByToken]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchParams.get('token');
    if (!userEmail || !token) {
      toast({ title: 'Ошибка', description: 'Введите корректный email', variant: 'destructive' });
      return;
    }

    setIsSubmittingEmail(true);
    try {
      const response = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email: userEmail }),
      });
      const data = await response.json();
      if (data.ok) {
        setIsEmailModalOpen(false);
        setTokenState('valid');
        getTestByToken(token);
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось сохранить email', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Произошла ошибка сети', variant: 'destructive' });
    } finally {
      setIsSubmittingEmail(false);
    }
  };

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
        setVerificationError(data.reason || 'Не удалось активировать токен.');
        toast({ title: 'Ошибка', description: data.reason || 'Не удалось активировать токен.', variant: 'destructive' });
        setIsStarting(false);
      }
    }
  };

  // ... (rest of the component is the same)

  if (isMobile) {
    return <MobileBlocked onBackToLanding={() => {}} />;
  }

  if (tokenState === 'verifying' || loading) {
    return <LoadingScreen />;
  }

  if (tokenState === 'invalid') {
    return <div className="min-h-screen flex items-center justify-center">Ссылка недействительна или устарела. {verificationError && `(${verificationError})`}</div>;
  }

  if (tokenState === 'requires_email') {
    return (
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEmailSubmit}>
            <DialogHeader>
              <DialogTitle>Введите ваш Email</DialogTitle>
              <DialogDescription>
                Этот email необходим для отправки результатов тестирования. Мы не будем использовать его для других целей.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSubmittingEmail}>
                {isSubmittingEmail ? 'Сохранение...' : 'Сохранить и продолжить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // ... (rest of the rendering logic)
};