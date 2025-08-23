import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTestSession } from '@/hooks/useTestSession';
import { loadDetailedReport, generateFallbackReport } from '@/lib/reportLoader';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LoadingScreen from '@/components/neuro/LoadingScreen';
import { scoreTCP, scoreGoNoGo, scoreMemory, buildSummaryKey, ageGroupReverseMapping, ageGroupNumberToString } from '@/lib/scoring';

const ReportPage = () => {
  const { id } = useParams<{ id: string }>();
  const { test, getTestByToken } = useTestSession();
  const [reportContent, setReportContent] = useState('');
  const [loading, setLoading] = useState(true);

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
              setReportContent(report);
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
      <h1 className="text-3xl font-bold mb-6">Отчет о прохождении NeuroCheck</h1>
      <h2 className="text-xl font-bold mb-6">Возраст: {ageGroupNumberToString[test?.age || 0] || 'Не указано'}</h2>
      <div className="space-y-6 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default ReportPage;
