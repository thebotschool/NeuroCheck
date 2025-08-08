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
  
  const { createSession, saveCPTResults, saveGoNoGoResults, saveMemoryResults, completeSession } = useTestSession();

  const handlePromoSuccess = async (newUserId: string) => {
    setUserId(newUserId);
    await createSession(newUserId);
    setCurrentStep('user-data');
  };

  const handleUserDataSuccess = (newUserData: UserData) => {
    setUserData(newUserData);
    setCurrentStep('time-check');
  };

  const handleTimeCheckSuccess = () => {
    setCurrentStep('cpt-test');
  };

  const handleCPTComplete = async (results: CPTResult) => {
    setCptResults(results);
    await saveCPTResults(results);
    setCurrentStep('hand-switch');
  };

  const handleHandSwitchContinue = () => {
    setCurrentStep('gonogo-test');
  };

  const handleGoNoGoComplete = async (results: GoNoGoResult) => {
    setGonogoResults(results);
    await saveGoNoGoResults(results);
    setCurrentStep('visual-rest');
  };

  const handleVisualRestContinue = () => {
    setCurrentStep('memory-test');
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
    
    case 'time-check':
      return <TimeCheckStep onSuccess={handleTimeCheckSuccess} />;
    
    case 'cpt-test':
      return <CPTTest onComplete={handleCPTComplete} />;
    
    case 'hand-switch':
      return <HandSwitchStep onContinue={handleHandSwitchContinue} />;
    
    case 'gonogo-test':
      return <GoNoGoTest onComplete={handleGoNoGoComplete} />;
    
    case 'visual-rest':
      return <VisualRestStep onContinue={handleVisualRestContinue} />;
    
    case 'memory-test':
      return <MemoryTest onComplete={handleMemoryComplete} />;
    
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