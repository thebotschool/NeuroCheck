import { CPTResult, GoNoGoResult, MemoryResult } from '@/types/test';

// NOTE: Placeholder simple thresholds; refine with domain data later.
export function scoreCPT(cpt: CPTResult, age: number): 1 | 2 | 3 | 4 {
  const omissions = cpt.misses;
  const commissions = cpt.falseAlarms;
  const mean = cpt.averageReactionTime || 0;
  const sd = cpt.sdReactionTime || 0;
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
  const correct = mem.correctPositions ?? mem.correctCards;
  const total = mem.totalCards;
  const accuracy = (correct / total) * 100;
  let score: 1 | 2 | 3 | 4 = 4 as const;
  if (accuracy < 40) score = 1;
  else if (accuracy < 60) score = 2;
  else if (accuracy < 80) score = 3;
  return score;
}

export function buildSummaryKey(x: number, y: number, z: number) {
  return `X${x}-Y${y}-Z${z}`;
}

export function buildFeedbackHtml(summaryKey: string, cpt: CPTResult, gng: GoNoGoResult, mem: MemoryResult) {
  const rts = Array.isArray(cpt.reactionTimes) ? cpt.reactionTimes : [];
  const amplitude = rts.length > 0 ? Math.max(...rts) - Math.min(...rts) : 0;
  // Mean RT difference between hands for Go/No-Go (if available)
  const rightMean = gng.rightHand?.averageReactionTime ?? (gng.reactionTimes && gng.reactionTimes.length ? gng.reactionTimes.reduce((a,b)=>a+b,0)/gng.reactionTimes.length : 0);
  const leftMean = gng.leftHand?.averageReactionTime ?? 0;
  const meanDiffHands = rightMean && leftMean ? Math.abs(Math.round(leftMean - rightMean)) : 0;
  return `<div class="space-y-4">
    <h3 class="text-lg font-semibold">Результаты нейропсихологического тестирования</h3>
    <div class="grid gap-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800">Внимание (CPT)</h4>
        <p class="text-sm text-blue-600">Точность: ${cpt.accuracy.toFixed(1)}%</p>
        <p class="text-sm text-blue-600">Среднее время реакции (Mean RT): ${cpt.averageReactionTime.toFixed(0)} мс</p>
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


