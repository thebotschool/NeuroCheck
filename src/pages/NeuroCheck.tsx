import { useState, useEffect } from 'react';
import { PromoCodeStep } from '@/components/neuro/PromoCodeStep';
import { UserDataStep } from '@/components/neuro/UserDataStep';
import { TimeCheckStep } from '@/components/neuro/TimeCheckStep';
import NameStep from '@/components/neuro/NameStep';
import { CPTTest } from '@/components/neuro/CPTTest';
import { HandSwitchStep } from '@/components/neuro/HandSwitchStep';
import { GoNoGoTest } from '@/components/neuro/GoNoGoTest';
import { VisualRestStep } from '@/components/neuro/VisualRestStep';
import { MemoryTest } from '@/components/neuro/MemoryTest';
import { ResultsStep } from '@/components/neuro/ResultsStep';
import { useTestSession } from '@/hooks/useTestSession';
import LoadingScreen from '@/components/neuro/LoadingScreen';
import MobileBlocked from '@/components/neuro/MobileBlocked';
import { useIsMobile } from '@/hooks/use-mobile';
import { TestStep, UserData, CPTResult, GoNoGoResult, MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

const NeuroCheck = () => {
  const [currentStep, setCurrentStep] = useState<TestStep>('promo-check');
  const [userId, setUserId] = useState<string>('');
  const [pendingName, setPendingName] = useState<string | undefined>(undefined);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cptResults, setCptResults] = useState<CPTResult | null>(null);
  const [gonogoResults, setGonogoResults] = useState<GoNoGoResult | null>(null);
  const [memoryResults, setMemoryResults] = useState<MemoryResult | null>(null);
  const [restContext, setRestContext] = useState<'after-cpt' | 'after-gonogo' | null>(null);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDevMode(params.has('dev'));
  }, []);

  const { createSession, saveCPTResults, saveGoNoGoResults, saveMemoryResults, completeSession, loading } = useTestSession();
  const [globalLoading, setGlobalLoading] = useState(false);
  const isMobile = useIsMobile();
  const [firstTestCompleted, setFirstTestCompleted] = useState(false);
  const [progress, setProgress] = useState(0);

  const handlePromoSuccess = async (newUserId: string) => {
    setUserId(newUserId);
    setCurrentStep('name-step');
  };

  // progress mapping
  useEffect(() => {
    switch (currentStep) {
      case 'promo-check': setProgress(0); break;
      case 'name-step': setProgress(0.05); break; // 5%
      case 'user-data': setProgress(0.1); break; // 10%
      case 'cpt-test': setProgress(0.15); break; // age finished -> 15%
      case 'visual-rest':
        setProgress(restContext === 'after-cpt' ? 0.4 : 0.7);
        break;
      case 'hand-switch': setProgress(0.55); break;
      case 'gonogo-test': setProgress(0.55); break;
      case 'memory-test': setProgress(0.7); break;
      case 'results': setProgress(1); break;
      default: break;
    }
  }, [currentStep, restContext]);

  const handleUserDataSuccess = async (newUserData: UserData) => {
    // set progress to 15% (age saved) before starting test
    setProgress(0.15);
    try {
      await createSession(newUserData.userId);
    } catch (e) {
      console.error('createSession failed', e);
      toast({ title: 'Ошибка', description: 'Не удалось создать сессию тестирования', variant: 'destructive' });
    }
    setUserData(newUserData);
    setCurrentStep('cpt-test');
  };

  const handleCPTComplete = async (results: CPTResult) => {
    setCptResults(results);
    await saveCPTResults(results);
    setFirstTestCompleted(true);
    setRestContext('after-cpt');
    setCurrentStep('visual-rest');
  };

  const handleCPTSkipToRest = async (results: CPTResult) => {
    setCptResults(results);
    await saveCPTResults(results);
    setFirstTestCompleted(true);
    setRestContext('after-cpt');
    setCurrentStep('visual-rest');
  };

  const handleGoNoGoComplete = async (results: GoNoGoResult) => {
    setGonogoResults(results);
    await saveGoNoGoResults(results);
    setRestContext('after-gonogo');
    setCurrentStep('visual-rest');
  };

  const handleVisualRestContinue = () => {
    if (restContext === 'after-cpt') {
      setRestContext(null);
      setCurrentStep('gonogo-test');
    } else if (restContext === 'after-gonogo') {
      setRestContext(null);
      setCurrentStep('memory-test');
    } else {
      setCurrentStep('memory-test');
    }
  };

  const handleMemoryComplete = async (results: MemoryResult) => {
    setMemoryResults(results);
    await saveMemoryResults(results);
    await completeSession();
    setCurrentStep('results');
  };

  const handleDownloadPDF = () => {
    toast({ title: 'PDF генерируется', description: 'Файл будет готов через несколько секунд' });
  };

  if (isMobile) return <MobileBlocked onBackToLanding={() => setCurrentStep('promo-check')} />;

  const showProgress = !['cpt-test', 'gonogo-test', 'memory-test'].includes(currentStep);

  let content: JSX.Element;
  switch (currentStep) {
    case 'promo-check':
      content = <PromoCodeStep onSuccess={handlePromoSuccess} />;
      break;

    case 'name-step':
      content = (loading || globalLoading)
        ? <LoadingScreen progress={0} title="Сохранение данных" subtitle="Пожалуйста, подождите" />
        : (
          <NameStep
            userId={userId}
            progress={progress}
            onContinue={(name) => {
              setPendingName(name);
              setProgress(0.1);
              setTimeout(() => setCurrentStep('user-data'), 400);
            }}
            onBack={() => setCurrentStep('promo-check')}
          />
        );
      break;

    case 'user-data':
      content = (loading || globalLoading)
        ? <LoadingScreen progress={0} title="Сохранение данных" subtitle="Пожалуйста, подождите..." />
        : (
          <UserDataStep
            userId={userId}
            progress={progress}
            onSuccess={handleUserDataSuccess}
            onGlobalLoading={setGlobalLoading}
            initialName={pendingName}
            onBack={!firstTestCompleted ? () => setCurrentStep('name-step') : undefined}
          />
        );
      break;

    case 'cpt-test':
      content = <CPTTest onComplete={handleCPTComplete} onSkip={handleCPTSkipToRest} devMode={devMode} />;
      break;

    case 'gonogo-test':
      content = <GoNoGoTest onComplete={handleGoNoGoComplete} devMode={devMode} />;
      break;

    case 'visual-rest':
      content = <VisualRestStep onContinue={handleVisualRestContinue} durationMs={120000} devMode={devMode} />;
      break;

    case 'memory-test':
      content = <MemoryTest onComplete={handleMemoryComplete} age={userData?.age ?? 18} devMode={devMode} />;
      break;

    case 'results':
      content = (!userData || !cptResults || !gonogoResults || !memoryResults)
        ? <div>Ошибка: недостаточно данных для отображения результатов</div>
        : (
          <ResultsStep
            userData={userData}
            cptResults={cptResults}
            gonogoResults={gonogoResults}
            memoryResults={memoryResults}
            onDownloadPDF={handleDownloadPDF}
          />
        );
      break;

    default:
      content = <div>Неизвестный шаг тестирования</div>;
  }

  return (
    <div>
      <div className="transition-all duration-500 ease-in-out">
        {content}
      </div>
    </div>
  );
};


export default NeuroCheck;