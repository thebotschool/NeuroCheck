import AgeSelectAfterConsent from './AgeSelectAfterConsent';

interface UserDataStepProps {
  onSuccess: (name: string, age: number, email: string) => void;
  email: string;
  onBack?: () => void;
}

export const UserDataStep = ({ onSuccess, email, onBack }: UserDataStepProps) => {
  const ageGroupMapping: Record<string, number> = {
    '7-10': 1,
    '11-14': 2,
    '15-18': 3,
    '19-22': 4,
    '23+': 5,
  };

  const handleAgeBucketSelect = (bucket: string) => {
    const ageValue = ageGroupMapping[bucket] || null;
    if (ageValue !== null) {
      onSuccess('', ageValue, email);
    }
  };

  return <AgeSelectAfterConsent onSelect={handleAgeBucketSelect} onCancel={onBack} />;
};