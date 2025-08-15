import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const MobileBlocked: React.FC<{ onBackToLanding?: () => void }> = ({ onBackToLanding }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Тест недоступен на мобильных устройствах</CardTitle>
          <CardDescription>Пожалуйста, откройте NeuroCheck на планшете или компьютере для корректного прохождения теста.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Наши тесты требуют стабильной фиксации взгляда и большого экрана.</p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => onBackToLanding && onBackToLanding()}>Вернуться</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileBlocked;
