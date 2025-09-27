import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TCPResult, GoNoGoResult, MemoryResult, Test } from '@/types/test';
import { Download, FileText } from 'lucide-react';
import {
  buildSummaryKey,
  scoreTCP,
  scoreGoNoGo,
  scoreMemory,
  ageGroupReverseMapping,
  ageGroupNumberToString,
} from '@/lib/scoring';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';
import { generatePdf } from '@/lib/pdfGenerator';
import { Link } from 'react-router-dom';

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
  devMode = false,
}: ResultsStepProps) => {
  const { t, i18n } = useTranslation();
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
        body: JSON.stringify({ token: 'dev-token-123' }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '(no body)');
        console.error('reset-dev-token failed', res.status, text);
        throw new Error(`Failed to reset dev token: ${res.status} ${text}`);
      }

      const data = await res.json();
      console.log('reset-dev-token ok:', data);

      window.location.href = `/test?token=${test.token}&dev=1`;
    } catch (error) {
      console.error(error);
      toast({
        title: t('results.errorTitle'),
        description: t('results.errorDescription'),
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
              title: t('results.fallbackTitle'),
              description: t('results.fallbackDescription'),
            });
          }

          if (test.email) {
            fetch('/api/send-test-results', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: test.email,
                results: {
                  summary,
                  report: reportContent || generateFallbackReport(summary, ageNum),
                },
                lang: i18n.language, // например 'en', 'ru', 'az', 'he'
              }),
            });

            fetch('/api/send-detailed-report', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userEmail: test.email,
                detailedReport: reportContent || generateFallbackReport(summary, ageNum),
                metrics: {
                  tcp: tcpResults,
                  gonogo: gonogoResults,
                  memory: memoryResults,
                },
                lang: i18n.language, // например 'en', 'ru', 'az', 'he'
              }),
            });
          }
        } catch (error) {
          console.error('Error loading detailed report:', error);
          toast({
            title: t('results.loadErrorTitle'),
            description: t('results.loadErrorDescription'),
            variant: 'destructive',
          });
        } finally {
          setReportLoading(false);
        }
      }
    };

    calculateScoresAndLoadReport();
  }, [tcpResults, gonogoResults, memoryResults, test.age, test.email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="avoid-break">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('results.title')}</CardTitle>
              <CardDescription>
                {t('results.age')}: {ageGroupNumberToString[test.age] || t('results.ageUnknown')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to={`/report/${test.token}`}>
                  <FileText className="mr-2 h-4 w-4" />
                  {t('results.viewReport')}
                </Link>
              </Button>
              <Button onClick={handleDownloadPdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('results.downloadPdf')}
              </Button>
              {test.token === 'dev-token-123' && (
                <Button onClick={handleResetAndStartNewTest}>{t('results.newTest')}</Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none p-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {t('results.finalMessage')}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
        {devMode && (
          <Card className="mt-4 avoid-break">
            <CardHeader>
              <CardTitle>{t('results.devInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap">{JSON.stringify(test, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div
          ref={reportRef}
          className="prose max-w-none p-4 border rounded-lg bg-white report-content"
        >
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
