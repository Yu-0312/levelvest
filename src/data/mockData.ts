import { UserStats, TradeDecision, BehavioralBadge, LeaderboardStudent, DailyState, OnboardingProfile } from '../types';

export const initialStats: UserStats = {
  streak: 7,
  gems: 420,
  hearts: 5,
  maxHearts: 5,
  level: 3,
  title: '投資見習生',
  userName: '',
  xp: 140,
  nextLevelXp: 200,
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
  { id: 'rank-5', rank: 5, name: '邵鈺恩', school: '臺大大二', avatar: '🐂', weeklyXp: 850, decisionWinRate: 78, streak: 7, isCurrentUser: true, cheerCount: 16, badgeTitle: '鋼鐵紀律新手' },
  { id: 'rank-6', rank: 6, name: '郭建廷', school: '成大企管', avatar: '🐯', weeklyXp: 790, decisionWinRate: 75, streak: 6, cheerCount: 14, badgeTitle: '反FOMO戰士' },
  { id: 'rank-7', rank: 7, name: '趙品涵', school: '北大金融', avatar: '🐰', weeklyXp: 720, decisionWinRate: 73, streak: 5, cheerCount: 11, badgeTitle: '價值護航員' },
  { id: 'rank-8', rank: 8, name: '許祐任', school: '中央經研', avatar: '🐨', weeklyXp: 680, decisionWinRate: 70, streak: 4, cheerCount: 8, badgeTitle: '定期定額派' },
  { id: 'rank-9', rank: 9, name: '蔡雅筑', school: '東吳國貿', avatar: '🐱', weeklyXp: 610, decisionWinRate: 68, streak: 4, cheerCount: 7, badgeTitle: '零股探險家' },
  { id: 'rank-10', rank: 10, name: '賴冠廷', school: '中興財金', avatar: '🐶', weeklyXp: 550, decisionWinRate: 65, streak: 3, cheerCount: 5, badgeTitle: '風控學徒' },
];

export const initialTradeDecisions: TradeDecision[] = [
  {
    id: 'trade-1',
    ticker: '2330',
    tickerName: '台積電',
    date: '2026-09-18',
    action: '買進試單',
    rationale: '股價跳空帶量站上 20MA 月線，外資連 3 日買超，依策略少量建立基本部位。',
    disciplineFollowed: true,
    strategyTag: '20MA月線突破',
    outcome: '符合預期',
    emotions: '冷靜理性',
    gainOrDisciplineScore: '+100 紀律分',
  },
  {
    id: 'trade-2',
    ticker: '2454',
    tickerName: '聯發科',
    date: '2026-09-15',
    action: '嚴格停損',
    rationale: '跌破前波低點與 5MA，未出現預期強反彈，毫不猶豫執行 -4% 停損退場。',
    disciplineFollowed: true,
    strategyTag: '嚴格停損紀律',
    outcome: '觸發停損',
    emotions: '克服FOMO',
    gainOrDisciplineScore: '+100 紀律分 (保全本金)',
  },
  {
    id: 'trade-3',
    ticker: '0050',
    tickerName: '元大台灣50',
    date: '2026-09-10',
    action: '買進試單',
    rationale: '每月定期定額日執行買進，不受當天短線大盤震盪雜音干擾。',
    disciplineFollowed: true,
    strategyTag: '長期定期定額',
    outcome: '符合預期',
    emotions: '冷靜理性',
    gainOrDisciplineScore: '+100 紀律分',
  },
];

export const badgesData: BehavioralBadge[] = [
  { id: 'badge-1', icon: '🛡️', name: '鋼鐵紀律者', description: '連續 3 次嚴格遵守預設停損價，不受虧損恐懼擺佈', unlocked: true, progress: 3, maxProgress: 3, tag: '心態之盾' },
  { id: 'badge-2', icon: '🦉', name: '逆風冷靜者', description: '面對熱門飆股漲停時，拒絕無策略追高至少 5 次', unlocked: true, progress: 5, maxProgress: 5, tag: '反FOMO' },
  { id: 'badge-3', icon: '📊', name: '趨勢信徒', description: '成功運用 20MA 月線辨別多空趨勢並完成實戰挑戰', unlocked: true, progress: 2, maxProgress: 3, tag: '技術派' },
  { id: 'badge-4', icon: '🚀', name: '新手啟航', description: '在 LevelVest 完成第 1 篇投資決策日記紀錄', unlocked: true, progress: 1, maxProgress: 1, tag: '里程碑' },
  { id: 'badge-5', icon: '💎', name: '百發百中學者', description: '連續 5 個微課程測驗皆一次滿分通關', unlocked: false, progress: 3, maxProgress: 5, tag: '學霸獎章' },
  { id: 'badge-6', icon: '🔥', name: '心魔獵人', description: '通過 S6 投資心理修煉場 BOSS「心魔試煉」', unlocked: false, progress: 0, maxProgress: 1, tag: '心理戰' },
  { id: 'badge-7', icon: '🎓', name: 'LevelVest 大師', description: '通過大師認證考並完成個人投資計畫書', unlocked: false, progress: 0, maxProgress: 1, tag: '畢業' },
  { id: 'badge-8', icon: '📅', name: '紀律日連勝', description: '連續 7 天完成三項今日任務', unlocked: false, progress: 4, maxProgress: 7, tag: '習慣' },
];

export const initialDaily: DailyState = {
  date: new Date().toISOString().slice(0, 10),
  freezeDays: 1,
  tasks: [
    { id: 'd1', label: '完成 2 堂課', done: 0, target: 2 },
    { id: 'd2', label: '答對 1 題計算或數據題', done: 0, target: 1 },
    { id: 'd3', label: '寫 1 則決策日記', done: 0, target: 1 },
  ],
};
