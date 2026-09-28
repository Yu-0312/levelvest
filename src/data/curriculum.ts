import { Section } from '../types';
import { sectionsPart1 } from './curriculumPart1';
import { sectionsPart2 } from './curriculumPart2';

export const curriculum: Section[] = [...sectionsPart1, ...sectionsPart2];

export const totalLessons = curriculum.reduce((sum, s) => sum + s.lessons.length, 0);

export function findLesson(lessonId: string) {
  for (const section of curriculum) {
    const lesson = section.lessons.find((l) => l.id === lessonId);
    if (lesson) return { section, lesson };
  }
  return null;
}

export const capitalBandOptions = [
  { id: 'c0', label: '還沒有存款', hint: '先建立預算與緊急預備金' },
  { id: 'c1', label: '5 萬以下', hint: '適合零股 / 小額定期定額' },
  { id: 'c2', label: '5 – 20 萬', hint: '可建立核心 ETF 部位' },
  { id: 'c3', label: '20 – 50 萬', hint: '可做核心＋衛星配置' },
  { id: 'c4', label: '50 – 100 萬', hint: '可規劃完整投資組合' },
  { id: 'c5', label: '100 – 300 萬', hint: '需更完整的風控與再平衡' },
  { id: 'c6', label: '300 萬以上', hint: '建議搭配資產配置與傳承思考' },
];

export const knowledgeOptions = [
  {
    id: 'novice' as const,
    label: '完全新手',
    desc: '股票是什麼還不太清楚',
    title: '投資見習生',
    startHint: '從 S1 市場新手村開始最適合',
  },
  {
    id: 'aware' as const,
    label: '略知一二',
    desc: '聽過 K 線、ETF，但沒系統學過',
    title: '探索啟航者',
    startHint: '建議從 S1 複習重點後快速前進',
  },
  {
    id: 'watcher' as const,
    label: '有在觀盤',
    desc: '會看盤、買過股票或 ETF',
    title: '盤感學徒',
    startHint: '可先做 S1 快速測驗，再挑戰 S2',
  },
  {
    id: 'analyst' as const,
    label: '能獨立分析',
    desc: '自己研究過財報、技術或籌碼',
    title: '獨立研究員',
    startHint: '可從 S3–S6 補強弱項，直上大考',
  },
];
