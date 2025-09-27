import { TCPResult, GoNoGoResult, MemoryResult } from '@/types/test';
import i18n from '@/i18next';

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
  let score: 1 | 2 | 3 | 4 = 4 as const;
  if (accuracy >= 85) score = 1;
  else if (accuracy >= 70) score = 2;
  else if (accuracy >= 50) score = 3;
  else score = 4;
  return score;
}

export function scoreMemoryZ(mem: MemoryResult, age: number): 'Z1' | 'Z2' | 'Z3' | 'Z4' {
  const numeric = scoreMemory(mem, age);
  switch (numeric) {
    case 1: return 'Z1';
    case 2: return 'Z2';
    case 3: return 'Z3';
    default: return 'Z4';
  }
}

export function buildSummaryKey(x: number, y: number, z: number) {
  return `X${x}-Y${y}-Z${z}`;
}

export function buildFeedbackHtml(summaryKey: string, tcp: TCPResult, gng: GoNoGoResult, mem: MemoryResult) {
  const rts = Array.isArray(tcp.reactionTimes) ? tcp.reactionTimes : [];
  const amplitude = rts.length > 0 ? Math.max(...rts) - Math.min(...rts) : 0;
  const rightMean = gng.rightHand?.averageReactionTime ?? (gng.reactionTimes && gng.reactionTimes.length ? gng.reactionTimes.reduce((a, b) => a + b, 0) / gng.reactionTimes.length : 0);
  const leftMean = gng.leftHand?.averageReactionTime ?? 0;
  const meanDiffHands = rightMean && leftMean ? Math.abs(Math.round(leftMean - rightMean)) : 0;
  return `<div class="space-y-4">
    <h3 class="text-lg font-semibold">${i18n.t('scoring.title')}</h3>
    <div class="grid gap-4">
      <div class="p-4 bg-blue-50 rounded-lg">
        <h4 class="font-semibold text-blue-800">${i18n.t('scoring.tcp.title')}</h4>
        <p class="text-sm text-blue-600">${i18n.t('scoring.tcp.accuracy')}: ${tcp.accuracy.toFixed(1)}%</p>
        <p class="text-sm text-blue-600">${i18n.t('scoring.tcp.meanRT')}: ${tcp.averageReactionTime.toFixed(0)} ${i18n.t('common.unitsOfMeasurment.ms')}</p>
        <p class="text-sm text-blue-600">${i18n.t('scoring.tcp.variability')}: ${amplitude.toFixed(0)} ${i18n.t('common.unitsOfMeasurment.ms')}</p>
      </div>
      <div class="p-4 bg-green-50 rounded-lg">
        <h4 class="font-semibold text-green-800">${i18n.t('scoring.gng.title')}</h4>
        <p class="text-sm text-green-600">${i18n.t('scoring.gng.accuracy')}: ${gng.accuracy.toFixed(1)}%</p>
        <p class="text-sm text-green-600">${i18n.t('scoring.gng.diffHands')}: ${meanDiffHands} ${i18n.t('common.unitsOfMeasurment.ms')}</p>
      </div>
      <div class="p-4 bg-purple-50 rounded-lg">
        <h4 class="font-semibold text-purple-800">${i18n.t('scoring.memory.title')}</h4>
        <p class="text-sm text-purple-600">${i18n.t('scoring.memory.accuracy')}: ${mem.accuracy.toFixed(1)}%</p>
      </div>
    </div>
    <div class="p-4 bg-gray-50 rounded-lg">
      <h4 class="font-semibold">${i18n.t('scoring.key')}: ${summaryKey}</h4>
      <p class="text-sm text-muted-foreground">${i18n.t('scoring.betaNote')}</p>
    </div>
  </div>`;
}

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
    `${i18n.t('scoring.title')}`,
    ``,
    `${i18n.t('scoring.key')}: ${summaryKey}`,
    ``,
    `${i18n.t('scoring.tcp.title')}`,
    `- ${i18n.t('scoring.tcp.accuracy')}: ${tcpAccuracy.toFixed(1)}%`,
    `- ${i18n.t('scoring.tcp.meanRT')}: ${Math.round(tcpMean)} ${i18n.t('common.unitsOfMeasurment.ms')}`,
    `- ${i18n.t('scoring.tcp.variability')}: ${Math.round(amplitude)} ${i18n.t('common.unitsOfMeasurment.ms')}`,
    ``,
    `${i18n.t('scoring.gng.title')}`,
    `- ${i18n.t('scoring.gng.accuracy')}: ${gngAccuracy.toFixed(1)}%`,
    `- ${i18n.t('scoring.gng.diffHands')}: ${meanDiffHands} ${i18n.t('common.unitsOfMeasurment.ms')}`,
    ``,
    `${i18n.t('scoring.memory.title')}`,
    `- ${i18n.t('scoring.memory.accuracy')}: ${memAccuracy.toFixed(1)}%`,
    ``,
    `${i18n.t('scoring.betaNote')}`,
    ``
  ].join('\n');
}

// --- Age-related mappings ---
export function getAgeGroupId(age: number): number {
  if (age >= 7 && age <= 9) return 1;
  if (age >= 10 && age <= 13) return 2;
  if (age >= 14 && age <= 18) return 3;
  if (age >= 19 && age <= 22) return 4;
  if (age >= 23) return 5;
  return 3; // Default to 14-18
}

export const ageGroupNumberToString: { [key: number]: string } = {
  1: '7-9',
  2: '10-13',
  3: '14-18',
  4: '19-22',
  5: '23+',
};

export const ageGroupReverseMapping: { [key: number]: number } = {
  1: 8,
  2: 11,
  3: 16,
  4: 20,
  5: 25,
};
