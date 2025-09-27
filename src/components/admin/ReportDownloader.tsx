import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { generatePdf } from '@/lib/pdfGenerator';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';
import { scoreTCP, scoreGoNoGo, scoreMemory, buildSummaryKey, getAgeGroupId } from '@/lib/scoring';
import { useTranslation } from 'react-i18next';

interface ReportDownloaderProps {
  test: Record<string, any>;
}

export const ReportDownloader: React.FC<ReportDownloaderProps> = ({ test }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const handleDownload = async () => {
    setIsGenerating(true);

    try {
      let summaryKey = test.summary?.summaryKey;
      let ageGroupId = test.age_group_id;

      if (!summaryKey || !ageGroupId) {
        if (test.tcp_results && test.gonogo_results && test.memory_results && test.age) {
          const x = scoreTCP(test.tcp_results, test.age);
          const y = scoreGoNoGo(test.gonogo_results, test.age);
          const z = scoreMemory(test.memory_results, test.age);
          summaryKey = buildSummaryKey(x, y, z);
          ageGroupId = getAgeGroupId(test.age);
        } else {
          toast({
            title: t('report.error-title'),
            description: t('report.error-no-data'),
            variant: 'destructive'
          });
          setIsGenerating(false);
          return;
        }
      }

      let content = await loadDetailedReport(summaryKey, ageGroupId);
      if (!content) {
        content = generateFallbackReport(summaryKey, ageGroupId);
        toast({
          title: t('report.warning-title'),
          description: t('report.warning-description')
        });
      }
      setReportContent(content);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: t('report.error-title'),
        description: t('report.error-generate'),
        variant: 'destructive'
      });
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (reportContent && reportRef.current) {
      generatePdf(reportRef.current, `NeuroCheck_Report_${test.id}`);
      setReportContent(null); // Clean up
      setIsGenerating(false);
    }
  }, [reportContent, test.id]);

  const canGenerate =
    test.summary?.summaryKey ||
    (test.tcp_results && test.gonogo_results && test.memory_results && test.age);

  return (
    <>
      <Button onClick={handleDownload} disabled={isGenerating || !canGenerate} size="sm">
        {isGenerating ? t('report.generating') : t('report.download')}
      </Button>
      {reportContent && (
        <div style={{ position: 'absolute', left: '-9999px' }}>
          <div ref={reportRef} className="prose p-8">
            <ReactMarkdown>{reportContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </>
  );
};
