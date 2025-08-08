import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Ticket } from 'lucide-react';

interface PromoCodeStepProps {
  onSuccess: (userId: string) => void;
}

export const PromoCodeStep = ({ onSuccess }: PromoCodeStepProps) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

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
        toast({
          title: 'Промокод недействителен',
          description: 'Промокод не найден или уже использован.',
          variant: 'destructive',
        });
        return;
      }

      await supabase
        .from('promo_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('code', promoCode.trim());

      toast({
        title: 'Промокод принят!',
        description: 'Переходим к регистрации.',
      });

      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      onSuccess(userId);
    } catch (error) {
      console.error('Error checking promo code:', error);
      toast({ title: 'Ошибка', description: 'Не удалось проверить промокод', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const continueWithPayment = () => {
    toast({ title: 'Продолжение', description: 'Переходим к регистрации.' });
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
        <CardContent className="space-y-6">
          <div className="grid gap-3">
            <Button
              className="w-full"
              onClick={() => {
                setPaymentOpen(true);
                setPromoOpen(false);
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" /> Оплатить картой
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setPromoOpen(true);
                setPaymentOpen(false);
              }}
            >
              <Ticket className="mr-2 h-4 w-4" /> У меня есть промокод
            </Button>
          </div>

          {paymentOpen && (
            <div className="space-y-4 border rounded-lg p-4">
              <div className="text-center">
                <p className="font-semibold">Стоимость тестирования: 500 ₽</p>
                <p className="text-sm text-muted-foreground">Форма оплаты появится здесь</p>
              </div>
              <Button className="w-full" onClick={continueWithPayment}>
                Продолжить
              </Button>
            </div>
          )}

          {promoOpen && (
            <div className="space-y-3 border rounded-lg p-4">
              <Input
                id="promo"
                placeholder="Введите промокод"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) checkPromoCode();
                }}
              />
              <Button className="w-full" onClick={checkPromoCode} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Проверяем...
                  </>
                ) : (
                  'Продолжить'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};