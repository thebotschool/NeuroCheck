import { ageGroupNumberToString } from './scoring';
import i18n from '@/i18next';

export function getAgeGroupFromId(ageGroupId: number): string {
  switch (ageGroupId) {
    case 1: return '7_9';
    case 2: return '10_13';
    case 3: return '14_18';
    case 4: return '19_22';
    case 5: return '23_plus';
    default: return '14_18'; // Fallback
  }
}

export async function loadDetailedReport(summaryKey: string, ageGroupId: number): Promise<string | null> {
  try {
    const ageGroup = getAgeGroupFromId(ageGroupId);
    const language = i18n.language || 'ru'; // Fallback to Russian if language is not set
    const response = await fetch(`/data/${language}/reports_${ageGroup}_md/${summaryKey}.md`);
    if (!response.ok) {
      console.warn(`Report not found: /data/${language}/reports_${ageGroup}_md/${summaryKey}.md`);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.error('Error loading detailed report:', error);
    return null;
  }
}

export async function isReportAvailable(summaryKey: string, ageGroupId: number): Promise<boolean> {
  try {
    const ageGroup = getAgeGroupFromId(ageGroupId);
    const language = i18n.language || 'ru'; // Fallback to Russian if language is not set
    const response = await fetch(`/data/${language}/reports_${ageGroup}_md/${summaryKey}.md`, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

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

export function generateFallbackReport(summaryKey: string, ageGroupId: number): string {
  const [x, y, z] = summaryKey.match(/X(\d)-Y(\d)-Z(\d)/)?.slice(1) || ['1', '1', '1'];
  const memoryLevel = 5 - parseInt(z);

  const age = ageGroupNumberToString[ageGroupId] || i18n.t('report.fallback.ageUnknown');

  const report =
    i18n.t('report.fallback.title', { summaryKey }) + '\n\n' +
    i18n.t('report.fallback.results', { age }) + '\n\n' +
    i18n.t('report.fallback.code') + ': ' + summaryKey + '\n\n' +
    i18n.t('report.tests.attention') + ' ' + x + '/4\n' +
    getScoreDescription('attention', parseInt(x)) + '\n\n' +
    i18n.t('report.tests.control') + ' ' + y + '/4\n' +
    getScoreDescription('control', parseInt(y)) + '\n\n' +
    i18n.t('report.tests.memory') + ' ' + memoryLevel + '/4\n' +
    getScoreDescription('memory', parseInt(z)) + '\n\n' +
    i18n.t('report.fallback.note');

  return report;
}

function getScoreDescription(testType: 'attention' | 'control' | 'memory', score: number): string {
  return i18n.t(`report.descriptions.${testType}.${score}`);
}