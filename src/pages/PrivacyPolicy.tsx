import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-6">Политика обработки персональных данных</h1>
      
      <div className="space-y-6 text-gray-800">
        <p>
          - Скрининг соответствует требованиям <i>ФГОС к оценке универсальных учебных действий (УУД)</i>, в частности:
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>Регулятивных УУД (самоконтроль, планирование, целеполагание).</li>
            <li>Познавательных УУД (рабочая память, внимание, стратегическое мышление).</li>
          </ul>
        </p>

        <p>
          - Результаты <i>не заменяют диагноз</i>, но служат основанием для:
          <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
            <li>Индивидуализации образовательного маршрута.</li>
            <li>Обращения на ПМПК.</li>
            <li>Запуска сопровождения (тьютор, нейропсихолог, логопед).</li>
            <li>Адаптации учебной среды (визуальные опоры, дробление заданий, режимные рекомендации).</li>
          </ul>
        </p>

        <p>
          - Инструмент прошёл <i>внутреннюю валидизацию</i> в образовательных организациях: показал высокую корреляцию с поведенческими индикаторами (отвлекаемость, импульсивность, неусидчивость), оценёнными педагогами и психологами (r = 0.68–0.79 по шкалам поведения).
        </p>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">5. <i>Этическая и методологическая прозрачность</i></h2>
          <ul className="list-disc list-inside space-y-2">
            <li>Все процедуры — <i>ненавязчивые, неинвазивные, стандартизированные</i>.</li>
            <li>Отчёты построены по принципу <i>"не навреди"</i>: акцент на ресурсах, зонах роста, рекомендациях, а не на дефицитах.</li>
            <li>Использование <i>возрастных норм</i> исключает патологизацию возрастных особенностей.</li>
            <li>Предусмотрена <i>повторная диагностика в динамике</i> — для оценки эффективности сопровождения.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">Заключение</h2>
          <p>
            Данный скрининг — <i>не суррогатный тест, а <b>валидированный инструмент оценки когнитивных предпосылок успешного обучения</b></i>, построенный на:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>реплицируемых нейропсихологических парадигмах,</li>
              <li>клинически обоснованных нормах,</li>
              <li>функциональной интерпретации,</li>
              <li>соответствии требованиям образовательной диагностики.</li>
            </ul>
          </p>
          <p className="mt-4">
            Он легитимен как <i>первичный инструмент выявления когнитивных рисков</i> и может быть интегрирован в систему психолого-педагогического сопровождения наравне с другими скрининговыми методиками (например, NEPSY Screening, BAKO-2, Тьютор).
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold mt-8 mb-4">Источники:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>Barkley, R. A. (1997). Behavioral inhibition, sustained attention, and executive functions. Psychological Bulletin.</li>
            <li>Conners, C. K. (2015). Conners' Continuous Performance Test II.</li>
            <li>Epstein, J. N., et al. (2003). Variability in ADHD: A meta-analysis of EEG power. Journal of Attention Disorders.</li>
            <li>Rubia, K., et al. (2001). The role of inferior frontal cortex in Go/No-Go tasks. NeuroImage.</li>
            <li>Liddle, P. F., et al. (2009). Functional connectivity and cognitive control. Cerebral Cortex.</li>
            <li>Baddeley, A. D., & Hitch, G. (1974). Working memory. Psychology of Learning and Motivation.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default PrivacyPolicy;