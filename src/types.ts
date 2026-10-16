export type TabType = 'learn' | 'leaderboard' | 'journal' | 'badges';

export interface LeaderboardStudent {
  id: string;
  rank: number;
  name: string;
  school: string;
  avatar: string;
  weeklyXp: number;
  decisionWinRate: number;
  streak: number;
  isCurrentUser?: boolean;
  cheerCount: number;
  badgeTitle: string;
}

export interface UserStats {
  streak: number;
  /** 最近一次「三項任務全清」的日期（在地日），連勝判定用；無則視為尚未連勝 */
  lastStreakDate?: string;
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

/** Onboarding questionnaire result — drives title & recommended path */
export interface OnboardingProfile {
  name: string;
  /** self-rated knowledge */
  knowledge: 'novice' | 'aware' | 'watcher' | 'analyst';
  /** investable capital bands the user selected */
  capitalBands: string[];
  /** risk appetite */
  risk: 'conservative' | 'balanced' | 'aggressive';
  /** main goal */
  goal: 'retire' | 'side-income' | 'grow' | 'protect';
  completedAt: string;
}

export type NodeStatus = 'completed' | 'active' | 'locked';

export type QuestionKind =
  | 'concept'
  | 'calc'
  | 'scenario'
  | 'data'
  | 'order'
  | 'detect'
  | 'simulate'
  | 'dialogue'
  | 'review';

export interface QuizQuestion {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  kind: QuestionKind;
  summary: string;
  takeaway: string;
  questions: QuizQuestion[];
  isBoss?: boolean;
}

export interface Section {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  lessons: Lesson[];
}

/** 題目鑰匙（lessonId#題號），用來追蹤錯題出現次數 */
export type QuestionKey = string;

/** 複習題庫的一題（含出處，方便複習時回顧章節） */
export interface ReviewQuestion {
  key: QuestionKey;
  question: QuizQuestion;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  sectionCode: string;
  sectionColor: string;
  /** 歷史答錯次數（越高越優先出題） */
  missCount: number;
}

export interface LessonProgressEntry {
  stars: number;
  completed: boolean;
  /** true = 以「跳關」越過此關，未實際作答 */
  skipped?: boolean;
}

export type LessonProgress = Record<string, LessonProgressEntry>;

/* ── Legacy shapes kept for journal / badges tabs ── */

export interface TradeDecision {
  id: string;
  ticker: string;
  tickerName: string;
  date: string;
  action: '買進試單' | '逢高獲利' | '嚴格停損' | '空手觀望';
  rationale: string;
  disciplineFollowed: boolean;
  strategyTag: string;
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

export interface DailyTask {
  id: string;
  label: string;
  done: number;
  target: number;
}

export interface DailyState {
  date: string;
  tasks: DailyTask[];
  freezeDays: number;
}
