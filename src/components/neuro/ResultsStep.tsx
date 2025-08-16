import { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CPTResult, GoNoGoResult, MemoryResult, UserData } from '@/types/test';
import { Download } from 'lucide-react';
import { buildSummaryKey, scoreCPT, scoreGoNoGo, scoreMemory } from '@/lib/scoring';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { saveTestResults } from '@/lib/testResultsSaver';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';
import { generatePdf } from '@/lib/pdfGenerator';

interface ResultsStepProps {
  userData: UserData;
  cptResults: CPTResult;
  gonogoResults: GoNoGoResult;
  memoryResults: MemoryResult;
  devMode?: boolean;
}

export const ResultsStep = ({ 
  userData, 
  cptResults, 
  gonogoResults, 
  memoryResults,
  devMode = false
}: ResultsStepProps) => {
  const [resultSummary, setResultSummary] = useState<string>('');
  const [detailedReport, setDetailedReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(true);
  const [resultsSaved, setResultsSaved] = useState(false);
  const [saveResultsLoading, setSaveResultsLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const ageGroupReverseMapping: Record<number, number> = {
    1: 7,  // 7-10
    2: 11, // 11-14
    3: 15, // 15-18
    4: 19, // 19-22
    5: 23, // 23+
  };

  const ageGroupNumberToString: Record<number, string> = {
    1: '7-10',
    2: '11-14',
    3: '15-18',
    4: '19-22',
    5: '23+',
  };

  const handleDownloadPdf = () => {
    if (reportRef.current) {
      generatePdf(reportRef.current, `neuro-report-${userData.userId}`);
    }
  };

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

  useEffect(() => {
    const calculateScoresAndLoadReport = async () => {
      const ageNum = userData.age || 3;
      const representativeAge = ageGroupReverseMapping[ageNum] || 15;

      const x = scoreCPT(cptResults, representativeAge);
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
  }, [cptResults, gonogoResults, memoryResults, userData.age]);

  useEffect(() => {
    if (resultSummary && !resultsSaved) {
      handleSaveResults();
    }
  }, [resultSummary, resultsSaved, handleSaveResults]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Результаты тестирования</CardTitle>
              <CardDescription>
                Участник: {userData.childName || 'Не указано'} | Возраст: {ageGroupNumberToString[userData.age] || 'Не указано'} лет
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPdf} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Скачать PDF
            </Button>
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
                    <strong>CPT Results:</strong>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1">
                      {JSON.stringify(cptResults, null, 2)}
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