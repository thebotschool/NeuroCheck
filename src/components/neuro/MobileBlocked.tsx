import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const MobileBlocked: React.FC<{ onBackToLanding?: () => void }> = ({ onBackToLanding }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('mobile-blocked.title')}</CardTitle>
          <CardDescription>{t('mobile-blocked.description')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('mobile-blocked.reason')}
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onBackToLanding && onBackToLanding()}>
                {t('mobile-blocked.back')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileBlocked;
