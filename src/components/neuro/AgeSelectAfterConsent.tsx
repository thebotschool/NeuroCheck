import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onSelect: (ageBucket: string) => void; // '7-9' | '10-13' | '14-18' | '18-22' | '23+'
  onCancel?: () => void;
}

export const AgeSelectAfterConsent: React.FC<Props> = ({ onSelect, onCancel }) => {
  const options = [
    { key: '7-10', label: '7–10 лет' },
    { key: '11-14', label: '11–14 лет' },
    { key: '15-18', label: '15–18 лет' },
    { key: '19-22', label: '19–22 года' },
    { key: '23+', label: '23+ лет' },
  ];
  const emojiMap: Record<string, string> = {
    '7-10': '🧒',
    '11-14': '👦',
    '15-18': '🧑',
    '19-22': '🧑‍🎓',
    '23+': '👩',
  };

  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      const t = setTimeout(() => {
        onSelect(selected);
      }, 300); // show highlight briefly before continuing
      return () => clearTimeout(t);
    }
  }, [selected, onSelect]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => onCancel && onCancel()} aria-label="Назад">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        </div>

        <div className="rounded-2xl p-4"> 
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-center">Сколько лет вашему ребёнку?</h2>
            <p className="text-xs text-muted-foreground text-center mt-2">Выберите одну из категорий возраста</p>
          </div>

          <div className="flex flex-col gap-4 max-w-sm mx-auto">
            {options.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <Button
                  key={opt.key}
                  variant="outline"
                  onClick={() => setSelected(opt.key)}
                  className={`w-full flex flex-row items-center justify-start gap-4 py-8 px-5 text-left rounded-2xl ${
                    isSelected ? 'border-blue-500 border-2 shadow-lg' : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mr-3">{emojiMap[opt.key]}</div>
                  <span className="text-base font-medium">{opt.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeSelectAfterConsent;
