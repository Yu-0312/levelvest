export type TabType = 'learn' | 'leaderboard' | 'journal' | 'badges';

export interface LeaderboardStudent {
  id: string;
  rank: number;
  name: string;
  school: string;
  avatar: string;
  weeklyXp: number;
  decisionWinRate: number; // e.g. 78%
  streak: number;
  isCurrentUser?: boolean;
  cheerCount: number;
  badgeTitle: string;
}

export interface UserStats {
  streak: number;
  gems: number;
  hearts: number;
  maxHearts: number;
  level: number;
  title: string;
  userName: string;
  xp: number;
  nextLevelXp: number;
  soundEnabled: boolean;
}

export type NodeStatus = 'completed' | 'active' | 'locked';

export interface LessonNode {
  id: string;
  unitId: string;
  title: string;
  subtitle: string;
  status: NodeStatus;
  stars: number;
  maxStars: number;
  iconType: 'book' | 'chart' | 'shield' | 'target' | 'bulb';
  description: string;
  hasInteractiveQuiz: boolean;
}

export interface Unit {
  id: string;
  unitNumber: number;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  nodes: LessonNode[];
}

export interface TradeDecision {
  id: string;
  ticker: string;
  tickerName: string;
  date: string;
  action: '買進試單' | '逢高獲利' | '嚴格停損' | '空手觀望';
  rationale: string;
  disciplineFollowed: boolean;
  strategyTag: string; // e.g., '20MA月線突破', '支撐反彈', '處置效應克服'
  outcome: '符合預期' | '正常回檔' | '觸發停損' | '待觀察';
  emotions: '冷靜理性' | '略有猶豫' | '克服FOMO';
  gainOrDisciplineScore: string;
}

export interface BehavioralBadge {
  id: string;
  icon: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
  tag: string;
}
