import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { generatePdf } from '@/lib/pdfGenerator';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import { toast } from '@/hooks/use-toast';

interface ReportDownloaderProps {
  test: Record<string, any>;
}

export const ReportDownloader: React.FC<ReportDownloaderProps> = ({ test }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!test.summary?.summaryKey || !test.age_group_id) {
      toast({ title: 'Ошибка', description: 'Недостаточно данных для создания отчета.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    try {
      let content = await loadDetailedReport(test.summary.summaryKey, test.age_group_id);
      if (!content) {
        content = generateFallbackReport(test.summary.summaryKey, test.age_group_id);
        toast({ title: 'Внимание', description: 'Детальный отчет не найден, сгенерирован краткий отчет.' });
      }
      setReportContent(content);
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ title: 'Ошибка', description: 'Не удалось сгенерировать отчет.', variant: 'destructive' });
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

  return (
    <>
      <Button onClick={handleDownload} disabled={isGenerating} size="sm">
        {isGenerating ? 'Генерация...' : 'Скачать отчет'}
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