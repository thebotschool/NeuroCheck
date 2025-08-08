import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CPTResult, GoNoGoResult, MemoryResult, UserData } from '@/types/test';
import { Download, Mail, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { buildFeedbackHtml, buildSummaryKey, scoreCPT, scoreGoNoGo, scoreMemory } from '@/lib/scoring';

interface ResultsStepProps {
  userData: UserData;
  cptResults: CPTResult;
  gonogoResults: GoNoGoResult;
  memoryResults: MemoryResult;
  onDownloadPDF: () => void;
}

export const ResultsStep = ({ 
  userData, 
  cptResults, 
  gonogoResults, 
  memoryResults,
  onDownloadPDF 
}: ResultsStepProps) => {
  const [resultSummary, setResultSummary] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);

  const calculateScore = (value: number, thresholds: number[]): number => {
    if (value >= thresholds[0]) return 5;
    if (value >= thresholds[1]) return 4;
    if (value >= thresholds[2]) return 3;
    if (value >= thresholds[3]) return 2;
    return 1;
  };

  useEffect(() => {
    // New simple scoring core (placeholder thresholds)
    const x = scoreCPT(cptResults, userData.age);
    const y = scoreGoNoGo(gonogoResults, userData.age);
    const z = scoreMemory(memoryResults, userData.age);
    const summary = buildSummaryKey(x, y, z);
    setResultSummary(summary);
    setFeedback(buildFeedbackHtml(summary, cptResults, gonogoResults, memoryResults));
  }, [cptResults, gonogoResults, memoryResults, userData.age]);

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await supabase.from('messages_queue').insert({ user_id: userData.userId, email_sent: false, telegram_sent: false });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Результаты тестирования</CardTitle>
            <CardDescription>
              Участник: {userData.childName || 'Не указано'} | Возраст: {userData.age} лет
            </CardDescription>
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {resultSummary}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Detailed Results */}
        <Card>
          <CardHeader>
            <CardTitle>Детальные результаты</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              dangerouslySetInnerHTML={{ __html: feedback }}
              className="prose prose-sm max-w-none"
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid md:grid-cols-3 gap-4">
           <Card>
            <CardContent className="p-4">
              <Button onClick={onDownloadPDF} className="w-full" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Скачать PDF
              </Button>
            </CardContent>
          </Card>
          
           <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="mr-2 h-4 w-4" />
                  Email отправлен
                </div>
                <p className="text-xs text-muted-foreground">
                  Результаты отправлены на {userData.email}
                </p>
                 <Button onClick={handleResend} className="w-full mt-2" disabled={resendLoading}>
                   Отправить ещё раз на e-mail
                 </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Telegram уведомление
                </div>
                <p className="text-xs text-muted-foreground">
                  Отчёт отправлен специалисту
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{cptResults.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Точность внимания</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{gonogoResults.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Самоконтроль</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{memoryResults.accuracy.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Память</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};