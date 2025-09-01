import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Gift, Eye, EyeOff, LockKeyhole, Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SESSION_STORAGE_KEY = 'neurocheck-admin-auth';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true'
  );
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>();
  const [boundEmail, setBoundEmail] = useState('');
  const [adminKey, setAdminKey] = useState(''); // Start with empty, will be filled on login
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPromos, setGeneratedPromos] = useState<string[]>([]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctKey = import.meta.env.VITE_ADMIN_KEY;
    if (correctKey && keyInput === correctKey) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setAuthError('');
      setAdminKey(keyInput); // Pre-fill the admin key for promo creation
    } else {
      setAuthError('Неверный ключ доступа');
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1 || !adminKey.trim()) {
      toast({ title: 'Ошибка', description: 'Админский ключ не может быть пустым.', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    setGeneratedPromos([]);

    const payload = {
      quantity,
      adminKey: adminKey.trim(),
      max_uses: maxUses,
      expires_at: expiresAt?.toISOString(),
      user_id: boundEmail.trim() || null,
    };

    try {
      const response = await fetch('/api/create-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.ok) {
        setGeneratedPromos(data.tokens);
        toast({ title: 'Успешно', description: `Создано промокодов: ${data.tokens.length}` });
      } else {
        toast({ title: 'Ошибка', description: data.error || 'Не удалось создать промокоды', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({ title: 'Ошибка', description: 'Не удалось создать промокоды.', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Скопировано', description: 'Промокод скопирован в буфер обмена' });
    });
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LockKeyhole className="h-5 w-5" />
                        Доступ к панели администратора
                    </CardTitle>
                    <CardDescription>
                        Пожалуйста, введите ключ доступа для продолжения.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-admin-key">Ключ доступа</Label>
                            <Input
                                id="login-admin-key"
                                type="password"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="••••••••••••"
                            />
                        </div>
                        {authError && (
                            <p className="text-sm text-red-500">{authError}</p>
                        )}
                        <Button type="submit" className="w-full">
                            Войти
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Админ панель</h1>
          <p className="text-muted-foreground">Создание промокодов для доступа к тестированию</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />Создать промокоды</CardTitle>
            <CardDescription>Настройте параметры и создайте один или несколько промокодов.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromo} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Количество промокодов</Label>
                  <Input id="quantity" type="number" min="1" max="100" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} disabled={isCreating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Кол-во активаций (на 1 код)</Label>
                  <Input id="max_uses" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)} disabled={isCreating} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Срок действия (необязательно)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !expiresAt && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP") : <span>Выберите дату</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bound_email">Привязать к Email (необязательно)</Label>
                <Input id="bound_email" type="email" placeholder="user@example.com" value={boundEmail} onChange={(e) => setBoundEmail(e.target.value)} disabled={isCreating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-key">Админский ключ (для подтверждения)</Label>
                <div className="relative">
                  <Input id="admin-key" type={showAdminKey ? 'text' : 'password'} placeholder="Введите админский ключ" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} disabled={isCreating} autoComplete="off" className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowAdminKey((prev) => !prev)}>
                    {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isCreating} size="lg">
                {isCreating ? 'Создание...' : 'Создать промокоды'}
              </Button>
            </form>

            {generatedPromos.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Промокоды созданы!</h4>
                <ul className="space-y-2">
                  {generatedPromos.map((promo) => (
                    <li key={promo} className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-white border rounded text-sm font-mono">{promo}</code>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(promo)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}