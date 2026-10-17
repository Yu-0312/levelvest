import { UserStats, TradeDecision, BehavioralBadge, DailyState, OnboardingProfile } from '../types';
import { localDateKey } from '../utils/date';

// 初始狀態刻意「乾淨起跑」：新使用者／重置後不應自稱連勝 7 天、Lv.3 或預填日記，
// 競賽評審用無痕視窗試玩時才看得到真實的從零開始體驗。
export const initialStats: UserStats = {
  streak: 0,
  gems: 0,
  hearts: 5,
  maxHearts: 5,
  level: 1,
  title: '投資見習生',
  userName: '',
  xp: 0,
  nextLevelXp: 100,
  soundEnabled: true,
};

export function titleFromProfile(profile: OnboardingProfile): string {
  const map: Record<OnboardingProfile['knowledge'], string> = {
    novice: '投資見習生',
    aware: '探索啟航者',
    watcher: '盤感學徒',
    analyst: '獨立研究員',
  };
  return map[profile.knowledge] ?? '投資見習生';
}

export const initialTradeDecisions: TradeDecision[] = [];

export const badgesData: BehavioralBadge[] = [
  { id: 'badge-1', icon: '🛡️', name: '鋼鐵紀律者', description: '連續 3 次嚴格遵守預設停損價，不受虧損恐懼擺佈', unlocked: false, progress: 0, maxProgress: 3, tag: '心態之盾' },
  { id: 'badge-4', icon: '🚀', name: '新手啟航', description: '在 LevelVest 完成第 1 篇投資決策日記紀錄', unlocked: false, progress: 0, maxProgress: 1, tag: '里程碑' },
  { id: 'badge-5', icon: '💎', name: '百發百中學者', description: '連續 5 個微課程測驗皆一次滿分通關', unlocked: false, progress: 0, maxProgress: 5, tag: '學霸獎章' },
  { id: 'badge-6', icon: '🔥', name: '心魔獵人', description: '通過 S6 投資心理修煉場 BOSS「心魔試煉」', unlocked: false, progress: 0, maxProgress: 1, tag: '心理戰' },
  { id: 'badge-8', icon: '📅', name: '紀律日連勝', description: '連續 7 天完成三項今日任務', unlocked: false, progress: 0, maxProgress: 7, tag: '習慣' },
];

export const initialDaily: DailyState = {
  date: localDateKey(),
  tasks: [
    { id: 'd1', label: '完成 2 堂課', done: 0, target: 2 },
    { id: 'd2', label: '答對 1 題計算或數據題', done: 0, target: 1 },
    { id: 'd3', label: '寫 1 則決策日記', done: 0, target: 1 },
    { id: 'd4', label: '完成 1 筆模擬下單', done: 0, target: 1 },
  ],
};
