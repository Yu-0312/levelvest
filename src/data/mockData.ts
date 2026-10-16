import { UserStats, TradeDecision, BehavioralBadge, LeaderboardStudent, DailyState, OnboardingProfile } from '../types';
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

export const leaderboardStudents: LeaderboardStudent[] = [
  { id: 'rank-1', rank: 1, name: '林宏宇', school: '臺大財金', avatar: '🦁', weeklyXp: 1280, decisionWinRate: 88, streak: 18, cheerCount: 42, badgeTitle: '停損傳奇' },
  { id: 'rank-2', rank: 2, name: '陳思妤', school: '政大風管', avatar: '🦊', weeklyXp: 1150, decisionWinRate: 85, streak: 14, cheerCount: 38, badgeTitle: '均線大師' },
  { id: 'rank-3', rank: 3, name: '張子揚', school: '清大計財', avatar: '🦉', weeklyXp: 980, decisionWinRate: 82, streak: 10, cheerCount: 29, badgeTitle: '波段冷靜者' },
  { id: 'rank-4', rank: 4, name: '柯佳芬', school: '交大資工', avatar: '🐼', weeklyXp: 910, decisionWinRate: 80, streak: 9, cheerCount: 21, badgeTitle: '量價極致' },
  { id: 'rank-5', rank: 5, name: '邵鈺恩', school: '臺大大二', avatar: '🐂', weeklyXp: 0, decisionWinRate: 0, streak: 0, isCurrentUser: true, cheerCount: 0, badgeTitle: '鋼鐵紀律新手' },
  { id: 'rank-6', rank: 6, name: '郭建廷', school: '成大企管', avatar: '🐯', weeklyXp: 790, decisionWinRate: 75, streak: 6, cheerCount: 14, badgeTitle: '反FOMO戰士' },
  { id: 'rank-7', rank: 7, name: '趙品涵', school: '北大金融', avatar: '🐰', weeklyXp: 720, decisionWinRate: 73, streak: 5, cheerCount: 11, badgeTitle: '價值護航員' },
  { id: 'rank-8', rank: 8, name: '許祐任', school: '中央經研', avatar: '🐨', weeklyXp: 680, decisionWinRate: 70, streak: 4, cheerCount: 8, badgeTitle: '定期定額派' },
  { id: 'rank-9', rank: 9, name: '蔡雅筑', school: '東吳國貿', avatar: '🐱', weeklyXp: 610, decisionWinRate: 68, streak: 4, cheerCount: 7, badgeTitle: '零股探險家' },
  { id: 'rank-10', rank: 10, name: '賴冠廷', school: '中興財金', avatar: '🐶', weeklyXp: 550, decisionWinRate: 65, streak: 3, cheerCount: 5, badgeTitle: '風控學徒' },
];

export const initialTradeDecisions: TradeDecision[] = [];

export const badgesData: BehavioralBadge[] = [
  { id: 'badge-1', icon: '🛡️', name: '鋼鐵紀律者', description: '連續 3 次嚴格遵守預設停損價，不受虧損恐懼擺佈', unlocked: false, progress: 0, maxProgress: 3, tag: '心態之盾' },
  { id: 'badge-2', icon: '🦉', name: '逆風冷靜者', description: '面對熱門飆股漲停時，拒絕無策略追高至少 5 次', unlocked: false, progress: 0, maxProgress: 5, tag: '反FOMO' },
  { id: 'badge-3', icon: '📊', name: '趨勢信徒', description: '成功運用 20MA 月線辨別多空趨勢並完成實戰挑戰', unlocked: false, progress: 0, maxProgress: 3, tag: '技術派' },
  { id: 'badge-4', icon: '🚀', name: '新手啟航', description: '在 LevelVest 完成第 1 篇投資決策日記紀錄', unlocked: false, progress: 0, maxProgress: 1, tag: '里程碑' },
  { id: 'badge-5', icon: '💎', name: '百發百中學者', description: '連續 5 個微課程測驗皆一次滿分通關', unlocked: false, progress: 0, maxProgress: 5, tag: '學霸獎章' },
  { id: 'badge-6', icon: '🔥', name: '心魔獵人', description: '通過 S6 投資心理修煉場 BOSS「心魔試煉」', unlocked: false, progress: 0, maxProgress: 1, tag: '心理戰' },
  { id: 'badge-7', icon: '🎓', name: 'LevelVest 大師', description: '通過大師認證考並完成個人投資計畫書', unlocked: false, progress: 0, maxProgress: 1, tag: '畢業' },
  { id: 'badge-8', icon: '📅', name: '紀律日連勝', description: '連續 7 天完成三項今日任務', unlocked: false, progress: 0, maxProgress: 7, tag: '習慣' },
];

export const initialDaily: DailyState = {
  date: localDateKey(),
  freezeDays: 1,
  tasks: [
    { id: 'd1', label: '完成 2 堂課', done: 0, target: 2 },
    { id: 'd2', label: '答對 1 題計算或數據題', done: 0, target: 1 },
    { id: 'd3', label: '寫 1 則決策日記', done: 0, target: 1 },
    { id: 'd4', label: '完成 1 筆模擬下單', done: 0, target: 1 },
  ],
};
