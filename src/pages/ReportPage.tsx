import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useTestSession } from '@/hooks/useTestSession';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingScreen from '@/components/neuro/LoadingScreen';
import {
  scoreTCP,
  scoreGoNoGo,
  scoreMemory,
  buildSummaryKey,
  ageGroupReverseMapping,
  ageGroupNumberToString,
} from '@/lib/scoring';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { generatePdf } from '@/lib/pdfGenerator';
import { useTranslation } from 'react-i18next';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const { test, getTestByToken } = useTestSession();
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleDownloadPdf = () => {
    if (printRef.current) {
      generatePdf(printRef.current, `neuro-report-${test?.id}`);
    }
  };

  useEffect(() => {
    if (id) {
      getTestByToken(id);
    }
  }, [id, getTestByToken]);

  useEffect(() => {
    const loadReport = async () => {
      if (test && test.tcp_results && test.gonogo_results && test.memory_results) {
        const ageNum = test.age || 3;
        const representativeAge = ageGroupReverseMapping[ageNum] || 15;

        const x = scoreTCP(test.tcp_results, representativeAge);
        const y = scoreGoNoGo(test.gonogo_results, representativeAge);
        const z = scoreMemory(test.memory_results, representativeAge);
        const summary = buildSummaryKey(x, y, z);

        if (summary) {
          try {
            const report = await loadDetailedReport(summary, ageNum);
            if (report) {
              setReportContent(report.replace(/(<!-- page-break -->\s*)+$/, ''));
            } else {
              const fallbackReport = generateFallbackReport(summary, ageNum);
              setReportContent(fallbackReport);
            }
          } catch (error) {
            console.error('Error loading detailed report:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    loadReport();
  }, [test]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t('reportPage.title')}</h1>
          <h2 className="text-xl font-bold">
            {t('reportPage.age', {
              age:
                ageGroupNumberToString[test?.age || 0] ||
                t('reportPage.ageUnknown'),
            })}
          </h2>
        </div>
        <Button onClick={handleDownloadPdf} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('reportPage.downloadPdf')}
        </Button>
      </div>

      <div className="space-y-6 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {reportContent.replace(/<!-- page-break -->/g, '')}
        </ReactMarkdown>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleDownloadPdf} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {t('reportPage.downloadPdf')}
        </Button>
      </div>

      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div
          ref={printRef}
          className="prose max-w-none p-4 border rounded-lg bg-white report-content"
        >
          {reportContent.split('<!-- page-break -->').map((page, index) => (
            <div key={index} className={index === 0 ? '' : 'page-break-before'}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{page}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
