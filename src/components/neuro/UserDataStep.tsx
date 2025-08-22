import AgeSelectAfterConsent from './AgeSelectAfterConsent';

interface UserDataStepProps {
  onSuccess: (name: string, age: number, email: string) => void;
  email: string;
  onBack?: () => void;
}

export const UserDataStep = ({ onSuccess, email, onBack }: UserDataStepProps) => {
  const ageGroupMapping: Record<string, number> = {
    '7-9': 1,     // 7-9 в отображении
    '10-13': 2,   // 10-13 в отображении  
    '14-18': 3,   // 14-18 в отображении
    '19-22': 4,   // 19-22 в отображении
    '23+': 5,     // 23+ в отображении
  };

  const handleAgeBucketSelect = (bucket: string) => {
    const ageValue = ageGroupMapping[bucket] || null;
    if (ageValue !== null) {
      onSuccess('', ageValue, email);
    }
  };

  return <AgeSelectAfterConsent onSelect={handleAgeBucketSelect} onCancel={onBack} />;
};