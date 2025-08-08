import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface PromoCodeStepProps {
  onSuccess: (userId: string) => void;
}

export const PromoCodeStep = ({ onSuccess }: PromoCodeStepProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const checkPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите промокод',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim())
        .eq('used', false)
        .single();

      if (error || !data) {
        setShowPayment(true);
        toast({
          title: 'Промокод недействителен',
          description: 'Промокод не найден или уже использован. Переходим к оплате.',
          variant: 'destructive',
        });
        return;
      }

      // Mark promo code as used
      await supabase
        .from('promo_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('code', promoCode.trim());

      toast({
        title: 'Промокод принят!',
        description: 'Промокод действителен. Переходим к регистрации.',
      });

      // Generate unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onSuccess(userId);
    } catch (error) {
      console.error('Error checking promo code:', error);
      setShowPayment(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    // For demo purposes, simulate successful payment
    toast({
      title: 'Оплата принята',
      description: 'Платеж обработан успешно. Переходим к регистрации.',
    });
    const userId = `paid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSuccess(userId);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">NeuroCheck</CardTitle>
          <CardDescription>
            Система нейропсихологического тестирования
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPayment ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="promo">Промокод</Label>
                <Input
                  id="promo"
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !loading && checkPromoCode()}
                />
              </div>
              <Button 
                onClick={checkPromoCode} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Проверить промокод
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <XCircle className="mx-auto h-12 w-12 text-destructive mb-2" />
                <h3 className="font-semibold">Промокод недействителен</h3>
                <p className="text-sm text-muted-foreground">
                  Для прохождения тестирования необходимо произвести оплату
                </p>
              </div>
              <div className="text-center p-4 bg-card rounded-lg border">
                <p className="font-semibold">Стоимость тестирования: 500 ₽</p>
              </div>
              <Button onClick={handlePayment} className="w-full" variant="default">
                Оплатить через ЮКассу
              </Button>
              <Button 
                onClick={() => setShowPayment(false)} 
                variant="outline" 
                className="w-full"
              >
                Попробовать другой промокод
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};