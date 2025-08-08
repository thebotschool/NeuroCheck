import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CPTResult, GoNoGoResult, MemoryResult, UserData } from '@/types/test';
import { Download, Mail, MessageCircle } from 'lucide-react';

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

  const calculateScore = (value: number, thresholds: number[]): number => {
    if (value >= thresholds[0]) return 5;
    if (value >= thresholds[1]) return 4;
    if (value >= thresholds[2]) return 3;
    if (value >= thresholds[3]) return 2;
    return 1;
  };

  useEffect(() => {
    // Calculate scores for each test
    const attentionScore = calculateScore(cptResults.accuracy, [95, 90, 85, 80]);
    const selfControlScore = calculateScore(gonogoResults.accuracy, [95, 90, 85, 80]);
    const memoryScore = calculateScore(memoryResults.accuracy, [100, 80, 60, 40]);

    const summary = `X${attentionScore}-Y${selfControlScore}-Z${memoryScore}`;
    setResultSummary(summary);

    // Generate feedback based on results
    const generateFeedback = () => {
      let feedbackText = `<div class="space-y-4">
        <h3 class="text-lg font-semibold">Результаты нейропсихологического тестирования</h3>
        
        <div class="grid gap-4">
          <div class="p-4 bg-blue-50 rounded-lg">
            <h4 class="font-semibold text-blue-800">Внимание (CPT): ${attentionScore}/5</h4>
            <p class="text-sm text-blue-600">Точность: ${cptResults.accuracy.toFixed(1)}%</p>
            <p class="text-sm text-blue-600">Среднее время реакции: ${cptResults.averageReactionTime.toFixed(0)}мс</p>
          </div>
          
          <div class="p-4 bg-green-50 rounded-lg">
            <h4 class="font-semibold text-green-800">Самоконтроль (Go/No-Go): ${selfControlScore}/5</h4>
            <p class="text-sm text-green-600">Точность: ${gonogoResults.accuracy.toFixed(1)}%</p>
            <p class="text-sm text-green-600">Среднее время реакции: ${gonogoResults.averageReactionTime.toFixed(0)}мс</p>
          </div>
          
          <div class="p-4 bg-purple-50 rounded-lg">
            <h4 class="font-semibold text-purple-800">Память: ${memoryScore}/5</h4>
            <p class="text-sm text-purple-600">Точность: ${memoryResults.accuracy.toFixed(1)}%</p>
            <p class="text-sm text-purple-600">Время выполнения: ${memoryResults.timeSpent.toFixed(1)}с</p>
          </div>
        </div>

        <div class="p-4 bg-gray-50 rounded-lg">
          <h4 class="font-semibold">Общие рекомендации:</h4>
          <ul class="list-disc list-inside text-sm mt-2 space-y-1">
            ${attentionScore < 3 ? '<li>Рекомендуется работа над концентрацией внимания</li>' : ''}
            ${selfControlScore < 3 ? '<li>Полезны упражнения на развитие самоконтроля</li>' : ''}
            ${memoryScore < 3 ? '<li>Необходимы тренировки рабочей памяти</li>' : ''}
            ${attentionScore >= 4 && selfControlScore >= 4 && memoryScore >= 4 ? '<li>Отличные результаты! Продолжайте в том же духе</li>' : ''}
          </ul>
        </div>
      </div>`;

      return feedbackText;
    };

    setFeedback(generateFeedback());
  }, [cptResults, gonogoResults, memoryResults]);

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