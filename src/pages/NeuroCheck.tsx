import { useState } from 'react';
import { PromoCodeStep } from '@/components/neuro/PromoCodeStep';
import { UserDataStep } from '@/components/neuro/UserDataStep';
import { TimeCheckStep } from '@/components/neuro/TimeCheckStep';
import { CPTTest } from '@/components/neuro/CPTTest';
import { HandSwitchStep } from '@/components/neuro/HandSwitchStep';
import { GoNoGoTest } from '@/components/neuro/GoNoGoTest';
import { VisualRestStep } from '@/components/neuro/VisualRestStep';
import { MemoryTest } from '@/components/neuro/MemoryTest';
import { ResultsStep } from '@/components/neuro/ResultsStep';
import { useTestSession } from '@/hooks/useTestSession';
import { TestStep, UserData, CPTResult, GoNoGoResult, MemoryResult } from '@/types/test';
import { toast } from '@/hooks/use-toast';

const NeuroCheck = () => {
  const [currentStep, setCurrentStep] = useState<TestStep>('promo-check');
  const [userId, setUserId] = useState<string>('');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [cptResults, setCptResults] = useState<CPTResult | null>(null);
  const [gonogoResults, setGonogoResults] = useState<GoNoGoResult | null>(null);
  const [memoryResults, setMemoryResults] = useState<MemoryResult | null>(null);
  const [restContext, setRestContext] = useState<'after-cpt' | 'after-gonogo' | null>(null);
  
  const { createSession, saveCPTResults, saveGoNoGoResults, saveMemoryResults, completeSession } = useTestSession();

  const handlePromoSuccess = async (newUserId: string) => {
    setUserId(newUserId);
    await createSession(newUserId);
    setCurrentStep('user-data');
  };

  const handleUserDataSuccess = (newUserData: UserData) => {
    setUserData(newUserData);
    // Временно пропускаем проверку времени: идём сразу на CPT
    setCurrentStep('cpt-test');
  };

  const handleTimeCheckSuccess = () => {
    setCurrentStep('cpt-test');
  };

  const handleCPTComplete = async (results: CPTResult) => {
    setCptResults(results);
    await saveCPTResults(results);
    setRestContext('after-cpt');
    setCurrentStep('visual-rest');
  };

  const handleCPTSkipToRest = async (results: CPTResult) => {
    // Save partial/early results and jump to rest screen
    setCptResults(results);
    await saveCPTResults(results);
    setRestContext('after-cpt');
    setCurrentStep('visual-rest');
  };

  // HandSwitchStep is not used; Go/No-Go starts after the first rest automatically

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
      // Fallback: go to memory
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
    toast({
      title: 'PDF генерируется',
      description: 'Файл будет готов через несколько секунд',
    });
    // In a real app, this would generate and download a PDF
  };

  switch (currentStep) {
    case 'promo-check':
      return <PromoCodeStep onSuccess={handlePromoSuccess} />;
    
    case 'user-data':
      return <UserDataStep userId={userId} onSuccess={handleUserDataSuccess} />;
    
    // time-check шаг временно отключён: проверка будет на лендинге
    // case 'time-check':
    //   return <TimeCheckStep onSuccess={handleTimeCheckSuccess} />;
    
    case 'cpt-test':
      return <CPTTest onComplete={handleCPTComplete} onSkip={handleCPTSkipToRest} />;
    
    // case 'hand-switch':
    //   return <HandSwitchStep onContinue={handleHandSwitchContinue} />;
    
    case 'gonogo-test':
      return <GoNoGoTest onComplete={handleGoNoGoComplete} />;
    
    case 'visual-rest':
      // Both rest periods are 2 minutes as per spec
      // Temporary bypass enabled to skip visual rest when needed
      return <VisualRestStep onContinue={handleVisualRestContinue} durationMs={120000} devBypass />;
    
    case 'memory-test':
      // Enable dev bypass to allow skipping the distractor during testing
      return <MemoryTest onComplete={handleMemoryComplete} age={userData?.age ?? 18} devBypass />;
    
    case 'results':
      if (!userData || !cptResults || !gonogoResults || !memoryResults) {
        return <div>Ошибка: недостаточно данных для отображения результатов</div>;
      }
      return (
        <ResultsStep
          userData={userData}
          cptResults={cptResults}
          gonogoResults={gonogoResults}
          memoryResults={memoryResults}
          onDownloadPDF={handleDownloadPDF}
        />
      );
    
    default:
      return <div>Неизвестный шаг тестирования</div>;
  }
};

export default NeuroCheck;