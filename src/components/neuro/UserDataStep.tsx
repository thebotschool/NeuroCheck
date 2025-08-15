import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserData } from '@/types/test';
import AgeSelectAfterConsent from './AgeSelectAfterConsent';
import { Loader2 } from 'lucide-react';

interface UserDataStepProps {
  userId: string;
  onSuccess: (userData: UserData) => void;
  onGlobalLoading?: (loading: boolean) => void;
  initialName?: string;
  progress?: number;
  onBack?: () => void;
}

export const UserDataStep = ({ userId, onSuccess, onGlobalLoading, initialName, progress, onBack }: UserDataStepProps) => {
  // keep hidden age state to be set by the next screen (age bucket)
  const [age, setAge] = useState('7');
  const [childName, setChildName] = useState(initialName ?? '');
  const [email, setEmail] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // DEBUG: read auth session for logging; but do not require it.
    const authResp = await supabase.auth.getUser();
    const authId = authResp?.data?.user?.id;
    console.log('DEBUG auth id (before):', authId, 'prop userId:', userId);

    // Prefer the explicit userId passed from the promo/payment step. If absent,
    // fall back to authenticated id. If neither available, abort.
    const effectiveUserId = userId || authId;
    if (!effectiveUserId) {
      toast({ title: 'Ошибка сохранения', description: 'Отсутствует идентификатор пользователя (userId). Перезагрузите страницу и попробуйте снова.', variant: 'destructive' });
      console.error('No userId or auth id available, aborting save');
      return;
    }

    if (!email || !consentAgreed) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля и дайте согласие на обработку данных',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      onGlobalLoading && onGlobalLoading(true);
  // Use upsert to avoid duplicate key errors if a user row was created earlier
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
    user_id: effectiveUserId,
            age: age ? parseInt(age) : null,
            email,
            consent_agreed: consentAgreed,
            child_name: childName || null,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;

      const userData: UserData = {
        id: data.id,
        userId: data.user_id,
        childName: data.child_name ?? undefined,
        age: data.age,
        email: data.email,
        consentAgreed: data.consent_agreed,
        createdAt: new Date(data.created_at),
      };

      // Non-blocking: send sign-in OTP so the user can confirm their email and
      // later authenticate to access results. Failure here should not block flow.
      (async () => {
        try {
          const { error: otpError } = await supabase.auth.signInWithOtp({ email });
          if (otpError) console.warn('OTP send failed', otpError);
        } catch (e) {
          console.warn('OTP send exception', e);
        }
      })();

      toast({
        title: 'Данные сохранены',
        description: 'Переходим к проверке времени тестирования',
      });

      onSuccess(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
      const e = error as any;
      const desc = e?.message ? `${e.message}${e?.code ? ` (code ${e.code})` : ''}` : 'Не удалось сохранить данные';
      toast({
        title: 'Ошибка',
        description: desc,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      onGlobalLoading && onGlobalLoading(false);
    }
  };

  const [showAgeSelect, setShowAgeSelect] = useState(false);

  const handleContinueClick = () => {
    // Require email + consent before moving to age selection
    if (!email || !consentAgreed) {
      toast({
        title: 'Ошибка',
        description: 'Пожалуйста, введите E-mail и дайте согласие, чтобы продолжить',
        variant: 'destructive',
      });
      return;
    }
    // If both present, show the age selection screen
    setShowAgeSelect(true);
  };

  const handleAgeBucketSelect = (bucket: string) => {
    // Map bucket to a concrete age value for the slider/store. We'll pick the lower bound.
    const mapping: Record<string, number> = {
      '7-9': 7,
      '10-13': 10,
      '14-18': 14,
      '18-22': 18,
      '23+': 23,
    };
    const mapped = mapping[bucket] ?? 7;
    setAge(String(mapped));
  // After selecting age, proceed to submit but keep the age selection
  // screen visible until submission completes to avoid flashing the
  // registration screen briefly. Keep a short delay so the user sees
  // the selection highlight.
  setTimeout(() => handleSubmit(), 300);
  };

  if (showAgeSelect) {
    return <AgeSelectAfterConsent progressTarget={0.2} onSelect={handleAgeBucketSelect} onCancel={() => setShowAgeSelect(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => onBack && onBack()}
            aria-label="Назад"
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden" aria-hidden="true">
              <div className="h-3 rounded-full bg-black" style={{ width: `${Math.round((progress ?? 0) * 100)}%`, transition: 'width 600ms cubic-bezier(.2,.9,.2,1)' }} />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-semibold text-center mb-2">Регистрация участника</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Введите электронную почту и дайте согласие на обработку данных</p>

          <div className="max-w-md mx-auto space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">E-mail для получения результата *</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@mail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={consentAgreed}
                onCheckedChange={(checked) => setConsentAgreed(checked as boolean)}
              />
              <Label htmlFor="consent" className="text-sm">
                Согласен на обработку персональных данных *
              </Label>
            </div>

            <Button 
              onClick={handleContinueClick} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Сохраняем...
                </>
              ) : (
                'Продолжить'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};