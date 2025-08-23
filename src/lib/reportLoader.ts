import { ageGroupNumberToString } from './scoring';

export function getAgeGroupFromId(ageGroupId: number): string {
  switch (ageGroupId) {
    case 1: return '7_9';
    case 2: return '10_13';
    case 3: return '14_18';
    case 4: return '19_22';
    case 5: return '23_plus';
    default: return '14_18'; // Fallback to the most common group
  }
}

export async function loadDetailedReport(summaryKey: string, ageGroupId: number): Promise<string | null> {
  try {
    const ageGroup = getAgeGroupFromId(ageGroupId);
    
    // Пытаемся загрузить отчет из внешней папки data
    const response = await fetch(`/data/reports_${ageGroup}_md/${summaryKey}.md`);
    
    if (!response.ok) {
      console.warn(`Report not found: reports_${ageGroup}_md/${summaryKey}.md`);
      return null;
    }
    
    const reportContent = await response.text();
    return reportContent;
  } catch (error) {
    console.error('Error loading detailed report:', error);
    return null;
  }
}

/**
 * Проверяет, доступен ли детальный отчет для данного кода и возраста
 */
export async function isReportAvailable(summaryKey: string, ageGroupId: number): Promise<boolean> {
  try {
    const ageGroup = getAgeGroupFromId(ageGroupId);
    const response = await fetch(`/data/reports_${ageGroup}_md/${summaryKey}.md`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Список всех возможных X-Y-Z комбинаций (для предзагрузки или проверки)
 */
export function getAllPossibleSummaryKeys(): string[] {
  const keys: string[] = [];
  for (let x = 1; x <= 4; x++) {
    for (let y = 1; y <= 4; y++) {
      for (let z = 1; z <= 4; z++) {
        keys.push(`X${x}-Y${y}-Z${z}`);
      }
    }
  }
  return keys;
}

/**
 * Генерирует fallback отчет, если детальный отчет не найден
 */
export function generateFallbackReport(summaryKey: string, ageGroupId: number): string {
  const [x, y, z] = summaryKey.match(/X(\d)-Y(\d)-Z(\d)/)?.slice(1) || ['1', '1', '1'];
  const memoryLevel = 5 - parseInt(z);
  
  return `# Краткий отчет (${summaryKey})\n\n## Результаты тестирования (возраст: ${ageGroupNumberToString[ageGroupId] || 'Не указано'} лет)\n\n**Код результата:** ${summaryKey}\n\n### Тест внимания (TCP): Уровень ${x}/4\n${getScoreDescription('attention', parseInt(x))}\n\n### Тест самоконтроля (Go/No-Go): Уровень ${y}/4  \n${getScoreDescription('control', parseInt(y))}\n\n### Тест памяти: Уровень ${memoryLevel}/4\n${getScoreDescription('memory', parseInt(z))}\n\n---\n\n*Детальный отчет для данной комбинации результатов пока недоступен. Обратитесь к специалисту для получения персонализированных рекомендаций.*
`;
}

function getScoreDescription(testType: 'attention' | 'control' | 'memory', score: number): string {
  const descriptions = {
    attention: {
      1: 'Требуется поддержка в развитии устойчивости внимания',
      2: 'Внимание развито ниже среднего уровня', 
      3: 'Хороший уровень концентрации внимания',
      4: 'Отличная устойчивость и концентрация внимания'
    },
    control: {
      1: 'Требуется работа над развитием самоконтроля',
      2: 'Самоконтроль развит ниже среднего уровня',
      3: 'Хороший уровень самоконтроля и торможения реакций', 
      4: 'Отличный самоконтроль и способность к торможению'
    },
    memory: {
      1: 'Отличная зрительная память и способность к запоминанию',
      2: 'Хороший уровень зрительной рабочей памяти',
      3: 'Зрительная память развита ниже среднего уровня',
      4: 'Требуется поддержка в развитии зрительной памяти'
    }
  };
  
  return descriptions[testType][score as keyof typeof descriptions[typeof testType]] || 'Не определено';
}

