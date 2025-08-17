import { TCPResult, GoNoGoResult, MemoryResult } from '@/types/test';

// NOTE: Placeholder simple thresholds; refine with domain data later.
export function scoreTCP(tcp: TCPResult, age: number): 1 | 2 | 3 | 4 {
  const omissions = tcp.misses;
  const commissions = tcp.falseAlarms;
  const mean = tcp.averageReactionTime || 0;
  const sd = tcp.sdReactionTime || 0;
  let score: 1 | 2 | 3 | 4 = 4 as const;
  if (omissions > 5 || commissions > 10 || mean > 600 || sd > 300) score = 1;
  else if (omissions > 3 || commissions > 6 || mean > 500 || sd > 250) score = 2;
  else if (omissions > 1 || commissions > 3 || mean > 450 || sd > 200) score = 3;
  return score;
}

export function scoreGoNoGo(gng: GoNoGoResult, age: number): 1 | 2 | 3 | 4 {
  const right = gng.rightHand;
  const left = gng.leftHand;
  const totalFalse = (right?.falseAlarms || 0) + (left?.falseAlarms || 0);
  const totalMissed = (right?.missedGo || 0) + (left?.missedGo || 0);
  let score: 1 | 2 | 3 | 4 = 4 as const;
  if (totalFalse > 12 || totalMissed > 15) score = 1;
  else if (totalFalse > 8 || totalMissed > 10) score = 2;
  else if (totalFalse > 4 || totalMissed > 6) score = 3;
  return score;
}

export function scoreMemory(mem: MemoryResult, age: number): 1 | 2 | 3 | 4 {
  const correct = mem.correctPositions ?? mem.correctCards ?? 0;
  const total = mem.totalCards || 0;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  let score: 1 | 2 | 3 | 4 = 4 as const; // Z4 (worst)
  if (accuracy >= 85) score = 1; // Z1 (best)
  else if (accuracy >= 70) score = 2; // Z2
  else if (accuracy >= 50) score = 3; // Z3
  else score = 4; // Z4
  return score;
}

// Helper: return Z-code label exactly as specified by the user
export function scoreMemoryZ(mem: MemoryResult, age: number): 'Z1' | 'Z2' | 'Z3' | 'Z4' {
  const numeric = scoreMemory(mem, age);
  // numeric: 1 -> Z1, 2 -> Z2, 3 -> Z3, 4 -> Z4
  switch (numeric) {
    case 1:
      return 'Z1';
    case 2:
      return 'Z2';
    case 3:
      return 'Z3';
    default:
      return 'Z4';
  }
}

export function buildSummaryKey(x: number, y: number, z: number) {
  return `X${x}-Y${y}-Z${z}`;
}

export function buildFeedbackHtml(summaryKey: string, tcp: TCPResult, gng: GoNoGoResult, mem: MemoryResult) {
  const rts = Array.isArray(tcp.reactionTimes) ? tcp.reactionTimes : [];
  const amplitude = rts.length > 0 ? Math.max(...rts) - Math.min(...rts) : 0;
  // Mean RT difference between hands for Go/No-Go (if available)
  const rightMean = gng.rightHand?.averageReactionTime ?? (gng.reactionTimes && gng.reactionTimes.length ? gng.reactionTimes.reduce((a,b)=>a+b,0)/gng.reactionTimes.length : 0);
  const leftMean = gng.leftHand?.averageReactionTime ?? 0;
  const meanDiffHands = rightMean && leftMean ? Math.abs(Math.round(leftMean - rightMean)) : 0;
  return `<div class="space-y-4">
    <h3 class="text-lg font-semibold">Результаты нейропсихологического тестирования</h3>
    <div class="grid gap-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800">Внимание (TCP)</h4>
        <p class="text-sm text-blue-600">Точность: ${tcp.accuracy.toFixed(1)}%</p>
        <p class="text-sm text-blue-600">Среднее время реакции (Mean RT): ${tcp.averageReactionTime.toFixed(0)} мс</p>
        <p class="text-sm text-blue-600">Вариативность реакции (SD RT, стандартное отклонение): ${amplitude.toFixed(0)} мс</p>
      </div>
      <div class="p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800">Самоконтроль (Go/No-Go)</h4>
        <p class="text-sm text-green-600">Точность: ${gng.accuracy.toFixed(1)}%</p>
        <p class="text-sm text-green-600">Разница среднего времени реакции между руками: ${meanDiffHands} мс</p>
      </div>
      <div class="p-4 bg-purple-50 rounded-lg">
        <h4 class="font-semibold text-purple-800">Память</h4>
        <p class="text-sm text-purple-600">Точность: ${mem.accuracy.toFixed(1)}%</p>
      </div>
    </div>
    <div class="p-4 bg-gray-50 rounded-lg">
      <h4 class="font-semibold">Ключ: ${summaryKey}</h4>
      <p class="text-sm text-muted-foreground">Бета-версия скоринга. Для клинического использования требуется уточнение порогов.</p>
    </div>
  </div>`;
}

// Returns the same feedback as `buildFeedbackHtml` but formatted as Markdown
export function buildFeedbackMarkdown(summaryKey: string, tcp: TCPResult, gng: GoNoGoResult, mem: MemoryResult) {
  const rts = Array.isArray(tcp.reactionTimes) ? tcp.reactionTimes : [];
  const amplitude = rts.length > 0 ? Math.max(...rts) - Math.min(...rts) : 0;
  const rightMean = gng.rightHand?.averageReactionTime ?? (gng.reactionTimes && gng.reactionTimes.length ? gng.reactionTimes.reduce((a, b) => a + b, 0) / gng.reactionTimes.length : 0);
  const leftMean = gng.leftHand?.averageReactionTime ?? 0;
  const meanDiffHands = rightMean && leftMean ? Math.abs(Math.round(leftMean - rightMean)) : 0;

  const tcpAccuracy = tcp.accuracy ?? 0;
  const tcpMean = tcp.averageReactionTime ?? 0;
  const memAccuracy = mem.accuracy ?? 0;
  const gngAccuracy = gng.accuracy ?? 0;

  return [
    `### Результаты нейропсихологического тестирования`,
    ``,
    `**Ключ:** ${summaryKey}`,
    ``,
    `#### Внимание (TCP)`,
    `- Точность: ${tcpAccuracy.toFixed(1)}%`,
    `- Среднее время реакции (Mean RT): ${Math.round(tcpMean)} мс`,
    `- Вариативность реакции (SD / amplitude): ${Math.round(amplitude)} мс`,
    ``,
    `#### Самоконтроль (Go/No-Go)`,
    `- Точность: ${gngAccuracy.toFixed(1)}%`,
    `- Разница среднего времени реакции между руками: ${meanDiffHands} мс`,
    ``,
    `#### Память`,
    `- Точность: ${memAccuracy.toFixed(1)}%`,
    ``,
    `> Бета-версия скоринга. Для клинического использования требуется уточнение порогов.`,
    ``
  ].join('\n');
}


// --- Age-related mappings ---

// Mapping from the numeric age group ID in the DB to the age range string
export const ageGroupNumberToString: { [key: number]: string } = {
  1: '7-9',
  2: '10-13',
  3: '14-18',
  4: '19-22',
  5: '23+',
};

// Mapping from the numeric age group ID to a representative age for scoring
export const ageGroupReverseMapping: { [key: number]: number } = {
  1: 8,   // Representative for 7-9
  2: 11,  // Representative for 10-13
  3: 16,  // Representative for 14-18
  4: 20,  // Representative for 19-22
  5: 25,  // Representative for 23+
};
