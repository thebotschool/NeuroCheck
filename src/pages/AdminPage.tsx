import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Gift } from 'lucide-react';

export default function AdminPage() {
  const [email, setEmail] = useState('');
  const [adminKey, setAdminKey] = useState(import.meta.env.VITE_ADMIN_KEY || '');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPromo, setGeneratedPromo] = useState<string | null>(null);

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !adminKey.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const response = await fetch('/api/create-promo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          adminKey: adminKey.trim(),
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setGeneratedPromo(data.token);
        toast({
          title: 'Успешно',
          description: 'Промокод создан',
        });
        setEmail(''); // Очищаем email после создания
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось создать промокод',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать промокод. Попробуйте еще раз.',
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
              Создать промокод
            </CardTitle>
            <CardDescription>
              Промокод предоставляет бесплатный доступ к тестированию
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email пользователя</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isCreating}
                  autoComplete="off"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-key">Админский ключ</Label>
                <Input
                  id="admin-key"
                  type="password"
                  placeholder="Введите админский ключ"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  disabled={isCreating}
                  autoComplete="off"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating}
                size="lg"
              >
                {isCreating ? 'Создание...' : 'Создать промокод'}
              </Button>
            </form>

            {generatedPromo && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Промокод создан!</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">
                    {generatedPromo}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedPromo)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-green-700 mt-2">
                  Отправьте этот промокод пользователю. Он может использовать его на странице доступа.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">Инструкция:</h4>
          <ol className="text-sm text-yellow-800 space-y-1">
            <li>1. Введите email пользователя, для которого создается промокод</li>
            <li>2. Введите админский ключ для авторизации</li>
            <li>3. Нажмите "Создать промокод"</li>
            <li>4. Скопируйте и отправьте промокод пользователю</li>
            <li>5. Пользователь может ввести промокод на странице /access</li>
          </ol>
        </div>
      </div>
    </div>
  );
}