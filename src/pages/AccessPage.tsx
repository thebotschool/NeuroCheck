import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, Gift, ArrowLeft } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const consentPoints = [
  'Добровольно предоставляю ИП Кунявский Юрий (далее — Оператор) персональные данные (email, возраст школьника, результаты скрининга) для предоставления услуги **NeuroCheck — цифровое исследование учебных функций школьника**, включая проведение скрининга, формирование отчёта и отправку рекомендаций.',
  'Соглашаюсь на обработку, хранение, систематизацию, использование и передачу (при необходимости, с соблюдением конфиденциальности) моих персональных данных в соответствии с Федеральным законом РФ №152-ФЗ "О персональных данных".',
  'Разрешаю обработку данных школьника (возраст, результаты тестов), предоставленных мной как законным представителем, для целей формирования отчёта и рекомендаций, соответствующих ФГОС.',
  'Подтверждаю, что ознакомлен(а) с Политикой конфиденциальности и Публичной офертой на сайте neurocheck.ru, и принимаю их условия.',
  'Даю согласие на получение информационных сообщений (например, отчёта, уведомлений о новых функциях) на указанный email. Я могу отозвать это согласие, написав на support@neurocheck.ru.',
  'Понимаю, что данные обрабатываются с использованием защищённых технологий, хранятся не более 12 месяцев (или иного срока, указанного в Политике конфиденциальности) и не передаются третьим лицам без моего согласия, за исключением случаев, предусмотренных законом.',
];

export default function AccessPage() {
  const navigate = useNavigate();
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
        title: 'Ошибка',
        description: 'Введите промокод',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);

    try {
      // В dev режиме проверяем напрямую через Supabase
      if (import.meta.env.DEV) {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/tests?token=eq.${encodeURIComponent(promoCode.trim())}&select=id,used,is_completed,expires_at`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Database query failed');
        }
        
        const rows = await response.json();
        const row = rows[0];
        
        let data;
        if (!row) {
          data = { ok: false, error: 'not_found' };
        } else if (row.used || row.is_completed) {
          data = { ok: false, error: 'already_used' };
        } else if (row.expires_at && new Date(row.expires_at) < new Date()) {
          data = { ok: false, error: 'expired' };
        } else {
          data = { ok: true, testId: row.id };
        }
        
        if (data.ok) {
          navigate(`/test?token=${encodeURIComponent(promoCode.trim())}`);
          return;
        } else {
          let errorMessage = 'Неверный промокод';
          
          if (data.error === 'not_found') {
            errorMessage = 'Промокод не найден';
          } else if (data.error === 'already_used') {
            errorMessage = 'Промокод уже использован';
          } else if (data.error === 'expired') {
            errorMessage = 'Промокод истек';
          }

          toast({
            title: 'Ошибка',
            description: errorMessage,
            variant: 'destructive',
          });
          return;
        }
      }
      
      // Проверяем промокод (токен) через API (для продакшена)
      const response = await fetch(`/api/verify-token?token=${encodeURIComponent(promoCode.trim())}`);
      const data = await response.json();

      if (data.ok) {
        // Промокод валидный, переходим к тестированию
        navigate(`/test?token=${encodeURIComponent(promoCode.trim())}`);
      } else {
        // Промокод невалидный
        let errorMessage = 'Неверный промокод';
        
        if (data.error === 'not_found') {
          errorMessage = 'Промокод не найден';
        } else if (data.error === 'already_used') {
          errorMessage = 'Промокод уже использован';
        } else if (data.error === 'expired') {
          errorMessage = 'Промокод истек';
        } else if (data.error === 'invalid_time') {
          errorMessage = data.message;
        }

        toast({
          title: 'Ошибка',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error verifying promo code:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить промокод. Попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Кнопка назад */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Button>
        </div>

        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Доступ к тестированию</h1>
          <p className="text-muted-foreground">
            Выберите способ получения доступа к NeuroCheck
          </p>
        </div>

        {/* Табы с выбором */}
        <Tabs defaultValue="payment" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Оплата
            </TabsTrigger>
            <TabsTrigger value="promo" className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Промокод
            </TabsTrigger>
          </TabsList>

          {/* Вкладка оплаты */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Оплата тестирования
                </CardTitle>
                <CardDescription>
                  Стоимость: 500 ₽ • Время прохождения: ~15 минут
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Что входит в тестирование:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Тест на внимание (TCP)</li>
                    <li>• Тест на самоконтроль (Go/No-Go)</li>
                    <li>• Тест на память</li>
                    <li>• Персональный отчет с рекомендациями</li>
                    <li>• Отправка результатов на email</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={() => navigate('/payment')} 
                  className="w-full"
                  size="lg"
                  disabled={!allChecked}
                >
                  Перейти к оплате
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
                  Промокод
                </CardTitle>
                <CardDescription>
                  Если у вас есть промокод, введите его ниже
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePromoCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="promo-code">Промокод</Label>
                    <Input
                      id="promo-code"
                      type="text"
                      placeholder="Введите промокод"
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
                    {isVerifying ? 'Проверка...' : 'Применить промокод'}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Примечание:</strong> Промокод предоставляет бесплатный доступ к тестированию. 
                    Если у вас нет промокода, вы можете приобрести доступ через оплату.
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
              <CardTitle>Согласие на обработку персональных данных</CardTitle>
              <CardDescription>
                Нажимая кнопку "Оплатить" или "Применить промокод", я, как Заказчик (родитель или законный представитель школьника), подтверждаю, что:
              </CardDescription>
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
                    {point.replace(/\*\*/g, '')}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Есть вопросы? Свяжитесь с нами по email: support@neurocheck.ru
          </p>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <Link to="/privacy" className="underline">Политика обработки персональных данных</Link>
          <span className="mx-2">|</span>
          <Link to="/offer" className="underline">Публичная оферта</Link>
        </div>
      </div>
    </div>
  );
}
