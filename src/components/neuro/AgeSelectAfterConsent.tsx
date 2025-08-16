import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Props {
  onSelect: (ageBucket: string) => void; // '7-9' | '10-13' | '14-18' | '18-22' | '23+'
  onCancel?: () => void;
  progressTarget?: number; // 0..1
}

export const AgeSelectAfterConsent: React.FC<Props> = ({ onSelect, onCancel, progressTarget = 0.2 }) => {
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Math.min(1, progressTarget));
    // animate to target after mount
    const t = setTimeout(() => setProgress(target), 50);
    return () => clearTimeout(t);
  }, [progressTarget]);

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
        {/* Top progress bar with left arrow */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => onCancel && onCancel()} aria-label="Назад">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-3 rounded-full bg-black"
                style={{ width: `${Math.round(progress * 100)}%`, transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl p-4"> 
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-center">Сколько лет вашему ребёнку?</h2>
            <p className="text-xs text-muted-foreground text-center mt-2">Выберите одну из категорий возраста</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {options.map((opt) => {
              const isSelected = selected === opt.key;
              return (
                <Button
                  key={opt.key}
                  onClick={() => setSelected(opt.key)}
                  className={
                    `flex flex-row items-center justify-start gap-4 py-4 px-5 focus:outline-none transition-shadow text-left ` +
                    (isSelected
                      ? 'border-blue-500 shadow-md ring-1 ring-blue-100 rounded-2xl'
                      : 'border border-gray-200 hover:border-blue-400 hover:shadow-sm hover:bg-white rounded-2xl')
                  }
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
