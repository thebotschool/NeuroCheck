import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Gift, Eye, EyeOff } from 'lucide-react';

export default function AdminPage() {
  const [quantity, setQuantity] = useState(1);
  const [adminKey, setAdminKey] = useState(import.meta.env.VITE_ADMIN_KEY || '');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPromos, setGeneratedPromos] = useState<string[]>([]);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1 || !adminKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректное количество и админский ключ',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    setGeneratedPromos([]); // Clear previous promos

    try {
      const response = await fetch('/api/create-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: quantity,
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setGeneratedPromos(data.tokens);
        toast({
          title: 'Успешно',
          description: `Создано промокодов: ${data.tokens.length}`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать промокоды',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать промокоды. Попробуйте еще раз.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Скопировано',
        description: 'Промокод скопирован в буфер обмена',
      });
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Админ панель</h1>
          <p className="text-muted-foreground">
            Создание промокодов для бесплатного доступа к тестированию
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Создать промокоды
            </CardTitle>
            <CardDescription>
              Промокоды предоставляют бесплатный доступ к тестированию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Количество промокодов</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                  disabled={isCreating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-key">Админский ключ</Label>
                <div className="relative">
                  <Input
                    id="admin-key"
                    type={showAdminKey ? 'text' : 'password'}
                    placeholder="Введите админский ключ"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    disabled={isCreating}
                    autoComplete="off"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAdminKey((prev) => !prev)}
                  >
                    {showAdminKey ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {showAdminKey ? 'Скрыть ключ' : 'Показать ключ'}
                    </span>
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating}
                size="lg"
              >
                {isCreating ? 'Создание...' : 'Создать промокоды'}
              </Button>
            </form>

            {generatedPromos.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Промокоды созданы!</h4>
                <ul className="space-y-2">
                  {generatedPromos.map((promo) => (
                    <li key={promo} className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                        {promo}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(promo)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-green-700 mt-2">
                  Отправьте эти промокоды пользователям.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Инструкция:</h4>
          <ol className="text-sm text-yellow-800 space-y-1">
            <li>1. Введите количество промокодов</li>
            <li>2. Введите админский ключ для авторизации</li>
            <li>3. Нажмите "Создать промокоды"</li>
            <li>4. Скопируйте и отправьте промокоды пользователям</li>
            <li>5. Пользователь может ввести промокод на странице /access</li>
          </ol>
        </div>
      </div>
    </div>
  );
}