import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CPTResult, GoNoGoResult, MemoryResult, UserData } from '@/types/test';
import { Download, Mail, MessageCircle, FileText, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { buildFeedbackMarkdown, buildFeedbackHtml, buildSummaryKey, scoreCPT, scoreGoNoGo, scoreMemory } from '@/lib/scoring';
import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveTestResults, checkExistingResults } from '@/lib/testResultsSaver';
import { loadDetailedReport, generateFallbackReport, isReportAvailable } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';

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
  const [feedbackHtml, setFeedbackHtml] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [detailedReport, setDetailedReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [saveResultsLoading, setSaveResultsLoading] = useState(false);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [reportAvailable, setReportAvailable] = useState(false);

  const calculateScore = (value: number, thresholds: number[]): number => {
    if (value >= thresholds[0]) return 5;
    if (value >= thresholds[1]) return 4;
    if (value >= thresholds[2]) return 3;
    if (value >= thresholds[3]) return 2;
    return 1;
  };

  // Функция сохранения результатов в базу данных
  const handleSaveResults = useCallback(async () => {
    try {
      setSaveResultsLoading(true);
      
      const { success, summaryKey, error } = await saveTestResults({
        userData,
        cptResults,
        gonogoResults,
        memoryResults
      });

      if (success && summaryKey) {
        setResultsSaved(true);
        toast({
          title: 'Результаты сохранены',
          description: `Код результата: ${summaryKey}`,
        });
      } else {
        toast({
          title: 'Ошибка сохранения',
          description: error || 'Не удалось сохранить результаты',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: 'Ошибка',
        description: 'Произошла неожиданная ошибка при сохранении',
        variant: 'destructive',
      });
    } finally {
      setSaveResultsLoading(false);
    }
  }, [userData, cptResults, gonogoResults, memoryResults]);

  // Функция загрузки детального отчета
  const handleLoadDetailedReport = async () => {
    if (!resultSummary) return;
    
    try {
      setReportLoading(true);
      
      const reportContent = await loadDetailedReport(resultSummary, userData.age);
      
      if (reportContent) {
        setDetailedReport(reportContent);
        setShowDetailedReport(true);
      } else {
        // Используем fallback отчет
        const fallbackReport = generateFallbackReport(resultSummary, userData.age);
        setDetailedReport(fallbackReport);
        setShowDetailedReport(true);
        toast({
          title: 'Используется базовый отчет',
          description: 'Детальный отчет для вашей комбинации результатов пока недоступен',
        });
      }
    } catch (error) {
      console.error('Error loading detailed report:', error);
      toast({
        title: 'Ошибка загрузки отчета',
        description: 'Не удалось загрузить детальный отчет',
        variant: 'destructive',
      });
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    // New simple scoring core (placeholder thresholds)
    const x = scoreCPT(cptResults, userData.age);
    const y = scoreGoNoGo(gonogoResults, userData.age);
    const z = scoreMemory(memoryResults, userData.age);
    const summary = buildSummaryKey(x, y, z);
  setResultSummary(summary);
  setFeedback(buildFeedbackMarkdown(summary, cptResults, gonogoResults, memoryResults));
  const rawHtml = buildFeedbackHtml(summary, cptResults, gonogoResults, memoryResults);
  setFeedbackHtml(DOMPurify.sanitize(rawHtml));
    
    // Проверяем доступность детального отчета
    isReportAvailable(summary, userData.age).then(setReportAvailable);
  }, [cptResults, gonogoResults, memoryResults, userData.age]);

  // Отдельный useEffect для автоматического сохранения результатов
  useEffect(() => {
    if (resultSummary && !resultsSaved) {
      handleSaveResults();
    }
  }, [resultSummary, resultsSaved, handleSaveResults]);

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
            <CardTitle className="flex items-center justify-between">
              Детальные результаты
              <div className="flex gap-2">
                <Button
                  onClick={handleLoadDetailedReport}
                  disabled={reportLoading}
                  variant={reportAvailable ? "default" : "outline"}
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {reportLoading ? 'Загрузка...' : 'Персональный отчет'}
                </Button>
                {!reportAvailable && (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showDetailedReport ? (
              <div className="prose prose-sm max-w-none">
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50">
                  <div dangerouslySetInnerHTML={{ __html: feedbackHtml }} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Персональный отчет</h3>
                  <Button
                    onClick={() => setShowDetailedReport(false)}
                    variant="outline"
                    size="sm"
                  >
                    Показать краткие результаты
                  </Button>
                </div>
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-gray-50 prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{detailedReport}</ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className={`flex items-center text-sm ${resultsSaved ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  {resultsSaved ? 'Результаты сохранены' : 'Сохранение результатов'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {resultsSaved ? `Код: ${resultSummary}` : 'Сохранение в базу данных'}
                </p>
                {!resultsSaved && (
                  <Button 
                    onClick={handleSaveResults} 
                    className="w-full mt-2" 
                    disabled={saveResultsLoading}
                    size="sm"
                  >
                    {saveResultsLoading ? 'Сохранение...' : 'Сохранить повторно'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
           
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
                 <Button onClick={handleResend} className="w-full mt-2" disabled={resendLoading} size="sm">
                   {resendLoading ? 'Отправка...' : 'Отправить ещё раз'}
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