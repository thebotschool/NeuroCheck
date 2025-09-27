import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Copy, Gift, Eye, EyeOff, LockKeyhole, Calendar as CalendarIcon, Database } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { DbTable } from '@/components/admin/DbTable';
import { ReportDownloader } from '@/components/admin/ReportDownloader';

const SESSION_STORAGE_KEY = 'neurocheck-admin-auth';

export default function AdminPage() {
  const { t } = useTranslation();
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
  const [adminKey, setAdminKey] = useState('');
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [generatedPromos, setGeneratedPromos] = useState<string[]>([]);

  // DB Viewer State
  const [testsData, setTestsData] = useState<Record<string, any>[]>([]);
  const [promoCodesData, setPromoCodesData] = useState<Record<string, any>[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctKey = import.meta.env.VITE_ADMIN_KEY;
    if (correctKey && keyInput === correctKey) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
      setAuthError('');
      setAdminKey(keyInput);
    } else {
      setAuthError(t('adminPage.login.error'));
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1 || !adminKey.trim()) {
      toast({ title: t('common.error'), description: t('common.adminKeyEmpty'), variant: 'destructive' });
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
        toast({ title: t('common.success'), description: `${t('common.createPromo.success')}: ${data.tokens.length}` });
      } else {
        toast({ title: t('common.error'), description: data.error || t('common.createPromo.success'), variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error creating promo code:', error);
      toast({ title: t('common.error'), description: t('common.createPromo.success'), variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const fetchTableData = async (tableName: 'tests' | 'promo_codes') => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw error;
      if (tableName === 'tests') {
        setTestsData(data || []);
        setPromoCodesData([]);
      } else {
        setPromoCodesData(data || []);
        setTestsData([]);
      }
      toast({ title: t('common.success'), description: `${t('common.tableLoaded')} ${tableName}` });
    } catch (error: any) {
      setFetchError(`${t('common.db.error')}: ${error.message}`);
      toast({ title: t('common.error'), description: t('common.loadError'), variant: 'destructive' });
    } finally {
      setIsFetching(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: t('common.copied'), description: t('common.promoCopied') });
    });
  };

  const copyAllToClipboard = () => {
    const allPromos = generatedPromos.join('\n');
    navigator.clipboard.writeText(allPromos).then(() => {
      toast({ title: t('common.copied'), description: t('common.allPromoCopied') });
    });
  };

  if (!isAuthenticated) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LockKeyhole className="h-5 w-5" />
                        {t('adminPage.login.title')}
                    </CardTitle>
                    <CardDescription>
                        {t('adminPage.login.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="login-admin-key">{t('adminPage.login.label')}</Label>
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
                            {t('adminPage.login.button')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t('adminPage.title')}</h1>
          <p className="text-muted-foreground">{t('adminPage.subtitle')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gift className="h-5 w-5" />{t('adminPage.create.title')}</CardTitle>
            <CardDescription>{t('adminPage.create.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePromo} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t('adminPage.create.quantity')}</Label>
                  <Input id="quantity" type="number" min="1" max="100" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)} disabled={isCreating} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_uses">{t('adminPage.create.maxUses')}</Label>
                  <Input id="max_uses" type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)} disabled={isCreating} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">{t('adminPage.create.expires')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !expiresAt && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP") : <span>{t('adminPage.create.expires.placeholder')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={expiresAt} onSelect={setExpiresAt} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bound_email">{t('adminPage.create.boundEmail')}</Label>
                <Input id="bound_email" type="email" placeholder="user@example.com" value={boundEmail} onChange={(e) => setBoundEmail(e.target.value)} disabled={isCreating} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-key">{t('adminPage.create.adminKey')}</Label>
                <div className="relative">
                  <Input id="admin-key" type={showAdminKey ? 'text' : 'password'} placeholder={t('adminPage.create.adminKey.placeholder') || ''} value={adminKey} onChange={(e) => setAdminKey(e.target.value)} disabled={isCreating} autoComplete="off" className="pr-10" />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowAdminKey((prev) => !prev)}>
                    {showAdminKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isCreating} size="lg">
                {isCreating ? t('adminPage.create.button.loading') : t('adminPage.create.button')}
              </Button>
            </form>

            {generatedPromos.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-green-900">{t('common.createPromo.success')}</h4>
                  <Button variant="ghost" size="sm" onClick={copyAllToClipboard}>
                    <Copy className="h-4 w-4 mr-2" />
                    {t('adminPage.create.copyAll')}
                  </Button>
                </div>
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />{t('adminPage.db.title')}</CardTitle>
            <CardDescription>{t('adminPage.db.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={() => fetchTableData('tests')} disabled={isFetching}>
                {isFetching ? t('common.loading') : t('adminPage.db.loadTests')}
              </Button>
              <Button onClick={() => fetchTableData('promo_codes')} disabled={isFetching}>
                {isFetching ? t('common.loading') : t('adminPage.db.loadPromo')}
              </Button>
            </div>
            {fetchError && (
              <p className="text-sm text-red-500">{fetchError}</p>
            )}
            {testsData.length > 0 && 
              <DbTable 
                title="Tests" 
                data={testsData} 
                excludeColumns={['tcp_results', 'gonogo_results', 'memory_results']}
                actions={(row) => <ReportDownloader test={row} />}
              />
            }
            {promoCodesData.length > 0 && <DbTable title="Promo Codes" data={promoCodesData} />}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
