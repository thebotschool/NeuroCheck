import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TCPResult, GoNoGoResult, MemoryResult, Test } from '@/types/test';
import { Download } from 'lucide-react';
import { buildSummaryKey, scoreTCP, scoreGoNoGo, scoreMemory, ageGroupReverseMapping, ageGroupNumberToString } from '@/lib/scoring';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDetailedReport, generateFallbackReport, getAgeGroup } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';
import { generatePdf } from '@/lib/pdfGenerator';

interface ResultsStepProps {
  test: Test;
  tcpResults: TCPResult;
  gonogoResults: GoNoGoResult;
  memoryResults: MemoryResult;
  devMode?: boolean;
}

export const ResultsStep = ({ 
  test,
  tcpResults, 
  gonogoResults, 
  memoryResults,
  devMode = false
}: ResultsStepProps) => {
  const [resultSummary, setResultSummary] = useState<string>('');
  const [detailedReport, setDetailedReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (reportRef.current) {
      generatePdf(reportRef.current, `neuro-report-${test.id}`);
    }
  };

  const handleResetAndStartNewTest = async () => {
    try {
      const res = await fetch('/api/reset-dev-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'dev-token-123' })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        console.error('reset-dev-token failed', res.status, text);
        throw new Error(`Failed to reset dev token: ${res.status} ${text}`);
      }

      const data = await res.json();
      console.log('reset-dev-token ok:', data);
      
      // Redirect to start a new test
      window.location.href = `/test?token=${test.token}&dev=1`;
    } catch (error) {
      console.error(error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить сессию для разработки.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    const calculateScoresAndLoadReport = async () => {
      const ageNum = test.age || 3;
      const representativeAge = ageGroupReverseMapping[ageNum] || 15;

      const x = scoreTCP(tcpResults, representativeAge);
      const y = scoreGoNoGo(gonogoResults, representativeAge);
      const z = scoreMemory(memoryResults, representativeAge);
      const summary = buildSummaryKey(x, y, z);
      setResultSummary(summary);

      if (summary) {
        try {
          setReportLoading(true);
          const reportContent = await loadDetailedReport(summary, ageNum);
          if (reportContent) {
            setDetailedReport(reportContent);
          } else {
            const fallbackReport = generateFallbackReport(summary, ageNum);
            setDetailedReport(fallbackReport);
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
      }
    };

    calculateScoresAndLoadReport();
  }, [tcpResults, gonogoResults, memoryResults, test.age]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="avoid-break">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Результаты тестирования</CardTitle>
              <CardDescription>
                Возраст: {ageGroupNumberToString[test.age] || 'Не указано'} лет
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleDownloadPdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Скачать PDF
              </Button>
              {test.token === 'dev-token-123' && (
                <Button onClick={handleResetAndStartNewTest}>
                  Начать новый тест
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {`🎉 **Супер, ты молодец!** 🌟  

Поздравляем, ты прошёл(ла) **NeuroCheck**! Это было крутое приключение, и ты справился(ась) на все 100%! 💪 Твои старания помогут сделать учёбу ещё интереснее и легче.  

📬 **Что дальше?**  
Мы отправим результаты твоим родителям на почту. Поговори с ними о том, как всё прошло — они будут рады услышать, какой ты чемпион!  

🚀 **Удачи в учёбе!** Продолжай сиять, и пусть каждый день приносит новые открытия! Если хочешь больше идей, как учиться с радостью, загляни с родителями в наш Telegram-канал [**"PROdetej | Больше, чем просто учеба"**](https://t.me/ennkki).  

**Ты — звезда!** ✨`}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div ref={reportRef} className="prose max-w-none p-4 border rounded-lg bg-white report-content">
          {detailedReport.split('<!-- page-break -->').map((page, index) => (
            <div key={index} className="page-container">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{page}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};