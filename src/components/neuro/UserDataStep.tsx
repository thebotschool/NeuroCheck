import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserData } from '@/types/test';
import { Loader2 } from 'lucide-react';

interface UserDataStepProps {
  userId: string;
  onSuccess: (userData: UserData) => void;
}

export const UserDataStep = ({ userId, onSuccess }: UserDataStepProps) => {
  const [childName, setChildName] = useState('');
  const [age, setAge] = useState('7');
  const [email, setEmail] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!age || !email || !consentAgreed) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все обязательные поля и дайте согласие на обработку данных',
        variant: 'destructive',
      });
      return;
    }

    if (parseInt(age) < 7) {
      toast({
        title: 'Ошибка',
        description: 'Возраст должен быть от 7 лет',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          child_name: childName || null,
          age: parseInt(age),
          email,
          consent_agreed: consentAgreed,
        })
        .select()
        .single();

      if (error) throw error;

      const userData: UserData = {
        id: data.id,
        userId: data.user_id,
        childName: data.child_name,
        age: data.age,
        email: data.email,
        consentAgreed: data.consent_agreed,
        createdAt: new Date(data.created_at),
      };

      toast({
        title: 'Данные сохранены',
        description: 'Переходим к проверке времени тестирования',
      });

      onSuccess(userData);
    } catch (error) {
      console.error('Error saving user data:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить данные',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация участника</CardTitle>
          <CardDescription>
            Заполните данные для прохождения тестирования
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="childName">Имя ребёнка (необязательно)</Label>
            <Input
              id="childName"
              placeholder="Введите имя"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Возраст *</Label>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">7</span>
              <span className="font-medium">{age === '23' ? '23+ лет' : `${age} лет`}</span>
            </div>
            <Slider
              value={[parseInt(age)]}
              onValueChange={(v) => setAge(String(v[0]))}
              min={7}
              max={23}
              step={1}
            />
          </div>

          <div className="space-y-2">
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
            onClick={handleSubmit} 
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
        </CardContent>
      </Card>
    </div>
  );
};