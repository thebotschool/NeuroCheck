import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TCPResult, GoNoGoResult, MemoryResult, Test } from '@/types/test';
import { Download } from 'lucide-react';
import { buildSummaryKey, scoreTCP, scoreGoNoGo, scoreMemory, ageGroupReverseMapping, ageGroupNumberToString } from '@/lib/scoring';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
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
          const reportContent = await loadDetailedReport(summary, representativeAge);
          if (reportContent) {
            setDetailedReport(reportContent);
          } else {
            const fallbackReport = generateFallbackReport(summary, representativeAge);
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
        <Card>
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
          <CardContent ref={reportRef}>
            {reportLoading ? (
              <div className="text-center p-8">
                <p>Загрузка отчета...</p>
              </div>
            ) : (
              <div className="prose max-w-none p-4 border rounded-lg bg-gray-50">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{detailedReport}</ReactMarkdown>
              </div>
            )}
            {devMode && (
              <div className="mt-6 p-4 border rounded-md bg-gray-50">
                <h4 className="font-semibold text-sm mb-2">Dev Mode: Raw Results</h4>
                <div className="text-xs space-y-2">
                  <div>
                    <strong>Result Summary:</strong> {resultSummary}
                  </div>
                  <div>
                    <strong>TCP Results:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(tcpResults, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>Go/No-Go Results:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(gonogoResults, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <strong>Memory Results:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(memoryResults, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};