import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
interface NameStepProps {
  userId?: string;
  progress?: number;
  onContinue: (name?: string) => void;
  onBack?: () => void;
}

export const NameStep = ({ userId, progress, onContinue, onBack }: NameStepProps) => {
  const [name, setName] = useState('');

  const handleSkip = () => {
    onContinue(undefined);
  };

  const handleSave = () => {
    onContinue(name || undefined);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => onBack && onBack()} aria-label="Назад">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
              <div className="h-3 rounded-full bg-black" style={{ width: `${Math.round((progress ?? 0) * 100)}%`, transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold text-center mb-2">Имя участника (необязательно)</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Вы можете пропустить этот шаг и ввести имя позже</p>

          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-1">
              <Label htmlFor="child-name">Имя ребёнка</Label>
              <Input id="child-name" placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">Сохранить и продолжить</Button>
              <Button variant="outline" onClick={handleSkip} className="flex-0">Пропустить</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameStep;
