import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import { Copy } from 'lucide-react';

type TokenState = 'verifying' | 'valid' | 'invalid' | 'requires_email';

const NeuroCheck = () => {
  const { t } = useTranslation();
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
      setVerificationError(t('neuro.errors.tokenNotFound'));
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
          setVerificationError(data.error || t('neuro.errors.unknownTokenError'));
        }
      })
      .catch(() => {
        setTokenState('invalid');
        setVerificationError(t('neuro.errors.serverError'));
      });
  }, [searchParams, getTestByToken, t]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = searchParams.get('token');
    if (!userEmail || !token) {
      toast({ title: t('common.error'), description: t('neuro.errors.invalidEmail'), variant: 'destructive' });
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
        toast({ title: t('common.error'), description: data.error || t('neuro.errors.saveEmailFailed'), variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: t('common.error'), description: t('neuro.errors.networkError'), variant: 'destructive' });
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
        setVerificationError(data.reason || t('neuro.errors.activateTokenFailed'));
        toast({ title: t('neuro.errors.error'), description: data.reason || t('neuro.errors.activateTokenFailed'), variant: 'destructive' });
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
    await completeTest();
    if (test) {
      await getTestByToken(test.token);
      setIsTestReadyForResults(true);
    }
    setCurrentStep('results');
  };

  if (isMobile) {
    return <MobileBlocked onBackToLanding={() => { }} />;
  }

  if (tokenState === 'verifying' || loading) {
    return <LoadingScreen />;
  }

  if (tokenState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('neuro.invalidLink', { error: verificationError })}
      </div>
    );
  }

  if (tokenState === 'requires_email') {
    return (
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleEmailSubmit}>
            <DialogHeader>
              <DialogTitle>{t('neuro.emailModal.title')}</DialogTitle>
              <DialogDescription>{t('neuro.emailModal.description')}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  {t('neuro.emailModal.emailLabel')}
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
                {isSubmittingEmail ? t('neuro.emailModal.saving') : t('neuro.emailModal.submit')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  if (!testStarted && tokenState === 'valid') {
    const isTimeRestrictionEnabled = import.meta.env.VITE_TIME_RESTRICTION_ENABLED === 'true';
    const currentHour = new Date().getHours();
    const isTimeValid = currentHour >= 6 && currentHour < 12;

    if (!isTimeRestrictionEnabled || isTimeValid || timeBypassed) {
      if (instructionStep === 'parents') {
        return (
          <div className="min-h-screen bg-white text-gray-900 px-6 py-12 flex items-center justify-center">
            <section className="max-w-2xl mx-auto space-y-6 text-left">
              <h2 className="text-2xl font-semibold text-center">{t('neuro.parents.title')}</h2>
              <div className="space-y-4 p-6 border rounded-lg">
                <p className="font-semibold">{t('neuro.parents.whatIs')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.parents.whatIs.1')}</li>
                  <li>{t('neuro.parents.whatIs.2')}</li>
                  <li>{t('neuro.parents.whatIs.3')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.parents.time')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.parents.time.1')}</li>
                  <li>{t('neuro.parents.time.2')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.parents.who')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.parents.who.1')}</li>
                  <li>{t('neuro.parents.who.2')}</li>
                  <li>{t('neuro.parents.who.3')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.parents.prepare')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.parents.prepare.1')}</li>
                  <li>{t('neuro.parents.prepare.2')}</li>
                  <li>{t('neuro.parents.prepare.3')}</li>
                  <li>{t('neuro.parents.prepare.4')}</li>
                </ul>
              </div>
              <div className="text-center">
                <Button onClick={() => setInstructionStep('children')} size="lg">
                  {t('neuro.parents.next')}
                </Button>
              </div>
            </section>
          </div>
        );
      }

      if (instructionStep === 'children') {
        return (
          <div className="min-h-screen bg-white text-gray-900 px-6 py-12 flex items-center justify-center">
            <section className="max-w-2xl mx-auto space-y-6 text-left">
              <h2 className="text-2xl font-semibold text-center">{t('neuro.children.title')}</h2>
              <div className="space-y-4 p-6 border rounded-lg">
                <p className="font-semibold">{t('neuro.children.intro')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.children.intro.1')}</li>
                  <li>{t('neuro.children.intro.2')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.children.what')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.children.what.1')}</li>
                  <li>{t('neuro.children.what.2')}</li>
                  <li>{t('neuro.children.what.3')}</li>
                  <li>{t('neuro.children.what.4')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.children.prepare')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.children.prepare.1')}</li>
                  <li>{t('neuro.children.prepare.2')}</li>
                  <li>{t('neuro.children.prepare.3')}</li>
                  <li>{t('neuro.children.prepare.4')}</li>
                </ul>
                <p className="font-semibold">{t('neuro.children.remember')}</p>
                <ul className="list-disc list-inside space-y-2 text-sm">
                  <li>{t('neuro.children.remember.1')}</li>
                  <li>{t('neuro.children.remember.2')}</li>
                  <li>{t('neuro.children.remember.3')}</li>
                </ul>
              </div>
              <div className="text-center space-y-2">
                <Button onClick={handleStartTest} size="lg" disabled={isStarting}>
                  {isStarting ? t('common.loading') : t('neuro.children.startTest')}
                </Button>
                <p className="text-xs text-gray-500">
                  {t('neuro.children.consentText')}{' '}
                  <Link to="/privacy" className="underline">
                    {t('neuro.children.consent')}
                  </Link>
                </p>
              </div>
            </section>
          </div>
        );
      }
    } else {
      const testUrl = window.location.href;
      const copyToClipboard = () => {
        navigator.clipboard.writeText(testUrl).then(() => {
          toast({ title: t('neuro.timeBlocked.copy') });
        });
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold">{t('neuro.timeBlocked.title')}</h2>
            <p className="mt-4 text-muted-foreground">{t('neuro.timeBlocked.text')}</p>
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="font-semibold text-gray-800">{t('neuro.timeBlocked.saveLink')}</p>
              <div className="mt-2 flex items-center gap-2">
                <Input type="text" readOnly value={testUrl} className="flex-1" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {devMode && (
              <div className="mt-6">
                <Button onClick={() => setTimeBypassed(true)}>{t('neuro.timeBlocked.dev')}</Button>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  if (testStarted) {
    let content: JSX.Element;
    switch (currentStep) {
      case 'user-data':
        content = test ? (
          <UserDataStep
            onSuccess={handleUserDataSuccess}
            email={test.email ?? ''}
            onBack={handleBackToStart}
          />
        ) : (
          <LoadingScreen />
        );
        break;
      case 'tcp-test':
        content = <TCPTest onComplete={handleTCPComplete} onSkip={handleTCPComplete} devMode={devMode} test={test} />;
        break;
      case 'gonogo-test':
        content = <GoNoGoTest onComplete={handleGoNoGoComplete} devMode={devMode} />;
        break;
      case 'video-rest':
        content = <VideoRestStep onContinue={handleVideoRestContinue} vimeoVideoId={vimeoVideoId} devMode={devMode} />;
        break;
      case 'memory-test':
        content = <MemoryTest onComplete={handleMemoryComplete} age={test?.age ?? 3} devMode={devMode} />;
        break;
      case 'results':
        if (!isTestReadyForResults || !test) {
          content = <LoadingScreen />;
        } else if (!tcpResults) {
          content = <div>{t('neuro.error.tcp')}</div>;
        } else if (!gonogoResults) {
          content = <div>{t('neuro.error.gonogo')}</div>;
        } else if (!memoryResults) {
          content = <div>{t('neuro.error.memory')}</div>;
        } else {
          content = (
            <ResultsStep
              test={test}
              tcpResults={tcpResults}
              gonogoResults={gonogoResults}
              memoryResults={memoryResults}
              devMode={devMode}
            />
          );
        }
        break;
      default:
        content = <div>{t('neuro.unknownStep', { step: currentStep })}</div>;
    }

    return (
      <div>
        <div className="transition-all duration-500 ease-in-out">{content}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>{t('neuro.unexpectedState')}</p>
    </div>
  );
};

export default NeuroCheck;