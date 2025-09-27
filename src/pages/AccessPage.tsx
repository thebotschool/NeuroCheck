import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Gift, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

export default function AccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const consentPoints = [
    t('accessPage.consent.point1'),
    t('accessPage.consent.point2'),
    t('accessPage.consent.point3'),
    t('accessPage.consent.point4'),
    t('accessPage.consent.point5'),
    t('accessPage.consent.point6'),
  ];

  const [promoCode, setPromoCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkedState, setCheckedState] = useState(new Array(consentPoints.length).fill(false));

  const handleCheckboxChange = (position: number) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    );
    setCheckedState(updatedCheckedState);
  };

  const allChecked = checkedState.every(Boolean);

  const handlePromoCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!promoCode.trim()) {
      toast({
        title: t('common.error'),
        description: t('accessPage.toasts.enterPromo'),
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/consume-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promoCode: promoCode.trim() }),
      });

      const data = await response.json();

      if (data.ok) {
        toast({
          title: t('common.success'),
          description: t('accessPage.toasts.successDescription'),
        });
        navigate(`/test?token=${data.token}`);
      } else {
        toast({
          title: t('accessPage.toasts.errorPromo'),
          description: data.error || t('accessPage.toasts.errorPromoDescription'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error consuming promo code:', error);
      toast({
        title: t('accessPage.toasts.networkError'),
        description: t('accessPage.toasts.networkErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex flex-col">
      <Header />
      <main className="flex-grow p-4">
        <div className="max-w-2xl mx-auto">
          {/* Кнопка назад */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.return-to-main')}
            </Button>
          </div>

          {/* Заголовок */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('accessPage.title')}</h1>
            <p className="text-muted-foreground">{t('accessPage.subtitle')}</p>
          </div>

          {/* Табы */}
          <Tabs defaultValue="payment" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {t('accessPage.tabs.payment')}
              </TabsTrigger>
              <TabsTrigger value="promo" className="flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {t('accessPage.tabs.promo')}
              </TabsTrigger>
            </TabsList>

            {/* Вкладка оплаты */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('accessPage.payment.title')}
                  </CardTitle>
                  <CardDescription>{t('accessPage.payment.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {t('accessPage.payment.includes.title')}
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {t('accessPage.payment.includes.item1')}</li>
                      <li>• {t('accessPage.payment.includes.item2')}</li>
                      <li>• {t('accessPage.payment.includes.item3')}</li>
                      <li>• {t('accessPage.payment.includes.item4')}</li>
                      <li>• {t('accessPage.payment.includes.item5')}</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => navigate('/payment')} 
                    className="w-full"
                    size="lg"
                    disabled={!allChecked}
                  >
                    {t('accessPage.payment.button')}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Вкладка промокода */}
            <TabsContent value="promo">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    {t('accessPage.promo.title')}
                  </CardTitle>
                  <CardDescription>{t('accessPage.promo.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePromoCodeSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-code">{t('accessPage.promo.label')}</Label>
                      <Input
                        id="promo-code"
                        type="text"
                        placeholder={t('accessPage.promo.placeholder') || ''}
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        disabled={isVerifying}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isVerifying || !allChecked}
                      size="lg"
                    >
                      {isVerifying ? t('accessPage.promo.button.checking') : t('accessPage.promo.button.apply')}
                    </Button>
                  </form>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>{t('accessPage.promo.note')}</strong> {t('accessPage.promo.note.text')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Согласие */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('accessPage.consent.title')}</CardTitle>
                <CardDescription>{t('accessPage.consent.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {consentPoints.map((point, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Checkbox
                      id={`consent-${index}`}
                      checked={checkedState[index]}
                      onCheckedChange={() => handleCheckboxChange(index)}
                    />
                    <Label htmlFor={`consent-${index}`} className="text-sm font-normal text-muted-foreground">
                      {point}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Контакты */}
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">{t('accessPage.footer.contact')}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
