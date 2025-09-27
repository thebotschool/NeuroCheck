import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hand, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HandSwitchStepProps {
  onContinue: () => void;
}

export const HandSwitchStep = ({ onContinue }: HandSwitchStepProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Hand className="h-6 w-6" />
            {t('hand-switch.title')}
          </CardTitle>
          <CardDescription>
            {t('hand-switch.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="p-6 bg-accent/10 rounded-lg">
              <p className="text-lg font-semibold mb-2">
                {t('hand-switch.finished')}
              </p>
              <p className="text-muted-foreground">
                {t('hand-switch.other-hand')} <strong>{t('hand-switch.example-hand')}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('hand-switch.prepare-next')}
              </p>
            </div>
          </div>

          <Button onClick={onContinue} className="w-full" size="lg">
            <ArrowRight className="mr-2 h-4 w-4" />
            {t('hand-switch.continue')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
