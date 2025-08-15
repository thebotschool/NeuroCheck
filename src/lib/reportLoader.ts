/**
 * Загрузчик детальных отчетов по X-Y-Z кодам и возрасту
 */

export function getAgeGroup(age: number): string {
  if (age >= 7 && age <= 9) return '7_9';
  if (age >= 10 && age <= 13) return '10_13';
  if (age >= 14 && age <= 18) return '14_18';
  if (age >= 19 && age <= 22) return '19_22';
  return '23+';
}

export async function loadDetailedReport(summaryKey: string, age: number): Promise<string | null> {
  try {
    const ageGroup = getAgeGroup(age);
    
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
export async function isReportAvailable(summaryKey: string, age: number): Promise<boolean> {
  try {
    const ageGroup = getAgeGroup(age);
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
export function generateFallbackReport(summaryKey: string, age: number): string {
  const ageGroup = getAgeGroup(age);
  const [x, y, z] = summaryKey.match(/X(\d)-Y(\d)-Z(\d)/)?.slice(1) || ['1', '1', '1'];
  
  return `# Краткий отчет (${summaryKey})

## Результаты тестирования (возраст: ${age} лет)

**Код результата:** ${summaryKey}

### Тест внимания (CPT): Уровень ${x}/4
${getScoreDescription('attention', parseInt(x))}

### Тест самоконтроля (Go/No-Go): Уровень ${y}/4  
${getScoreDescription('control', parseInt(y))}

### Тест памяти: Уровень ${z}/4
${getScoreDescription('memory', parseInt(z))}

---

*Детальный отчет для данной комбинации результатов пока недоступен. Обратитесь к специалисту для получения персонализированных рекомендаций.*
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
      1: 'Требуется поддержка в развитии зрительной памяти',
      2: 'Зрительная память развита ниже среднего уровня',
      3: 'Хороший уровень зрительной рабочей памяти',
      4: 'Отличная зрительная память и способность к запоминанию'
    }
  };
  
  return descriptions[testType][score as keyof typeof descriptions[typeof testType]] || 'Не определено';
}
