import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  BookMarked,
  Award,
  Trophy,
  Target,
} from 'lucide-react';
import {
  TabType,
  UserStats,
  TradeDecision,
  BehavioralBadge,
  LeaderboardStudent,
  OnboardingProfile,
  LessonProgress,
  Section,
  Lesson,
  DailyState,
  ReviewQuestion,
} from './types';
import {
  initialStats,
  initialTradeDecisions,
  badgesData,
  leaderboardStudents,
  initialDaily,
  titleFromProfile,
} from './data/mockData';
import { curriculum } from './data/curriculum';
import { Header } from './components/Header';
import { SkillTree } from './components/SkillTree';
import { DailyTasks } from './components/DailyTasks';
import { HeartRefillModal } from './components/HeartRefillModal';
import { HeartReviewQuiz } from './components/HeartReviewQuiz';
import { SkipGradeModal } from './components/SkipGradeModal';
import { WisdomModal } from './components/WisdomModal';
import { AITutor, type TutorContext } from './components/AITutor';
import { sound } from './utils/audio';

// 依需載入：起跑測驗、課程播放器、排行榜、日記都各自切成獨立 chunk，
// 首屏只載入地圖主畫面（含 motion/ confetti 的模組延後載入）。
const LessonPlayer = React.lazy(() =>
  import('./components/LessonPlayer').then((m) => ({ default: m.LessonPlayer }))
);
const OnboardingSurvey = React.lazy(() =>
  import('./components/OnboardingSurvey').then((m) => ({ default: m.OnboardingSurvey }))
);
const TradeJournal = React.lazy(() =>
  import('./components/TradeJournal').then((m) => ({ default: m.TradeJournal }))
);
const Leaderboard = React.lazy(() =>
  import('./components/Leaderboard').then((m) => ({ default: m.Leaderboard }))
);
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);

const LS_KEY = 'levelvest-save-v1';

interface SaveState {
  onboarded: boolean;
  profile: OnboardingProfile | null;
  stats: UserStats;
  progress: LessonProgress;
  unlockedSections: string[];
  trades: TradeDecision[];
  badges: BehavioralBadge[];
  daily: DailyState;
  /** 錯題紀錄：questionKey → 答錯次數（複習時優先出題） */
  missed: Record<string, number>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 每日任務：跨日自動歸零；同一天則沿用進度 */
function normalizeDaily(saved: DailyState | undefined): DailyState {
  const fresh: DailyState = {
    date: today(),
    freezeDays: typeof saved?.freezeDays === 'number' ? saved.freezeDays : initialDaily.freezeDays,
    tasks: initialDaily.tasks.map((t) => ({ ...t })),
  };
  if (!saved || !Array.isArray(saved.tasks) || saved.date !== fresh.date) return fresh;
  return {
    ...fresh,
    tasks: fresh.tasks.map((t) => {
      const prev = saved.tasks.find((x) => x.id === t.id);
      const done = prev ? Number(prev.done) : 0;
      return { ...t, done: Number.isFinite(done) ? Math.min(t.target, done) : 0 };
    }),
  };
}

/**
 * 讀檔並補齊／校正欄位：舊版本存檔、損毀資料或缺欄位時以預設值兜底，
 * 避免整頁白屏。
 */
function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SaveState> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      onboarded: parsed.onboarded === true,
      profile: parsed.profile ?? null,
      stats: { ...initialStats, ...(parsed.stats ?? {}) },
      progress: parsed.progress ?? {},
      unlockedSections:
        Array.isArray(parsed.unlockedSections) && parsed.unlockedSections.length > 0
          ? parsed.unlockedSections
          : ['s1'],
      trades: Array.isArray(parsed.trades) ? parsed.trades : initialTradeDecisions,
      badges:
        Array.isArray(parsed.badges) && parsed.badges.length > 0 ? parsed.badges : badgesData,
      daily: normalizeDaily(parsed.daily),
      missed:
        parsed.missed && typeof parsed.missed === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.missed).filter(
                ([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0
              )
            )
          : {},
    };
  } catch {
    return null;
  }
}

function persist(state: SaveState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/** 動態 chunk 載入中的占位畫面 */
function ScreenFallback({ label = '載入中…' }: { label?: string }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-[#F0F9FF] via-white to-[#F8FAFC]"
      role="status"
      aria-live="polite"
    >
      <div className="w-10 h-10 rounded-full border-4 border-[#58CC02] border-t-transparent animate-spin" />
      <p className="text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

export default function App() {
  const saved = useMemo(() => loadSave(), []);

  const [onboarded, setOnboarded] = useState(saved?.onboarded ?? false);
  const [profile, setProfile] = useState<OnboardingProfile | null>(saved?.profile ?? null);
  const [stats, setStats] = useState<UserStats>(saved?.stats ?? initialStats);
  const [progress, setProgress] = useState<LessonProgress>(saved?.progress ?? {});
  const [unlockedSections, setUnlockedSections] = useState<string[]>(
    saved?.unlockedSections ?? ['s1']
  );
  const [tradeDecisions, setTradeDecisions] = useState<TradeDecision[]>(
    saved?.trades ?? initialTradeDecisions
  );
  const [badges, setBadges] = useState<BehavioralBadge[]>(saved?.badges ?? badgesData);
  const [daily, setDaily] = useState<DailyState>(saved?.daily ?? initialDaily);
  /** 錯題紀錄：questionKey（lessonId#題號）→ 答錯次數 */
  const [missed, setMissed] = useState<Record<string, number>>(saved?.missed ?? {});
  const [students, setStudents] = useState<LeaderboardStudent[]>(leaderboardStudents);

  const [currentTab, setCurrentTab] = useState<TabType>('learn');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [isHeartRefillOpen, setIsHeartRefillOpen] = useState(false);
  /** 複習回血測驗（愛心歸零時強制進入） */
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);
  /** 跳級確認彈窗的目標章節 */
  const [jumpTarget, setJumpTarget] = useState<Section | null>(null);
  /** 設定彈窗（含重置進度） */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  /** 地圖上目前關卡離開視線時，顯示「繼續闖關」懸浮按鈕 */
  const [showContinue, setShowContinue] = useState(false);
  /** AI 對話導師：目前帶入的錯題情境（null = 關閉） */
  const [tutorContext, setTutorContext] = useState<TutorContext | null>(null);

  // Persist
  useEffect(() => {
    persist({
      onboarded,
      profile,
      stats,
      progress,
      unlockedSections,
      trades: tradeDecisions,
      badges,
      daily,
      missed,
    });
  }, [onboarded, profile, stats, progress, unlockedSections, tradeDecisions, badges, daily, missed]);

  // 音效開關以存檔為準：原先只在手動切換時才套用，重新整理後舊設定會失效
  useEffect(() => {
    sound.enabled = stats.soundEnabled;
  }, [stats.soundEnabled]);

  // 監聽捲動，判斷「當前關卡」是否還在畫面內
  useEffect(() => {
    if (currentTab !== 'learn') {
      setShowContinue(false);
      return;
    }
    const onScroll = () => {
      const el = document.getElementById('active-lesson-node');
      if (!el) {
        setShowContinue(false);
        return;
      }
      const r = el.getBoundingClientRect();
      const visible = r.top < window.innerHeight * 0.75 && r.bottom > window.innerHeight * 0.35;
      setShowContinue(!visible);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [currentTab, progress, unlockedSections]);

  const handleOnboard = (p: OnboardingProfile) => {
    const title = titleFromProfile(p);
    setProfile(p);
    setStats((prev) => ({
      ...prev,
      userName: p.name,
      title,
    }));
    setOnboarded(true);
  };

  const handleToggleSound = () => {
    const nextVal = !stats.soundEnabled;
    sound.enabled = nextVal;
    setStats((prev) => ({ ...prev, soundEnabled: nextVal }));
    if (nextVal) sound.playClick();
  };

  const handleDeductHeart = () => {
    setStats((prev) => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }));
  };

  // 愛心歸零時自動開啟錯題複習（答題回血，答對 1 題回 1 顆心）
  useEffect(() => {
    if (stats.hearts === 0) setIsReviewOpen(true);
  }, [stats.hearts]);

  const handleRefillWithGems = () => {
    if (stats.gems < 50) return;
    sound.playSuccess();
    setStats((prev) => ({
      ...prev,
      gems: prev.gems - 50,
      hearts: prev.maxHearts,
    }));
    setIsHeartRefillOpen(false);
  };

  const handleClaimWisdomHeart = () => {
    setStats((prev) => ({
      ...prev,
      hearts: Math.min(prev.maxHearts, prev.hearts + 1),
    }));
  };

  /** 重置學習進度：清除此瀏覽器存檔，回到起跑前測驗（設定彈窗用） */
  const handleResetProgress = () => {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    sound.enabled = initialStats.soundEnabled;
    setOnboarded(false);
    setProfile(null);
    setStats(initialStats);
    setProgress({});
    setUnlockedSections(['s1']);
    setTradeDecisions(initialTradeDecisions);
    setBadges(badgesData);
    setDaily({ ...initialDaily, tasks: initialDaily.tasks.map((t) => ({ ...t })) });
    setMissed({});
    setIsReviewOpen(false);
    setStudents(leaderboardStudents);
    setCurrentTab('learn');
    setActiveSection(null);
    setActiveLesson(null);
    setIsLessonOpen(false);
  };

  /** Unlock next section if current section's BOSS is completed */
  const maybeUnlockNext = (sectionId: string, updated: LessonProgress) => {
    const section = curriculum.find((s) => s.id === sectionId);
    if (!section) return;
    const boss = section.lessons.find((l) => l.isBoss);
    if (!boss || !updated[boss.id]?.completed) return;
    const idx = curriculum.findIndex((s) => s.id === sectionId);
    const next = curriculum[idx + 1];
    if (next) {
      setUnlockedSections((prev) =>
        prev.includes(next.id) ? prev : [...prev, next.id]
      );
    }
  };

  const handleCompleteLesson = (lessonId: string, stars: number, xp: number, gems: number) => {
    const updated: LessonProgress = {
      ...progress,
      [lessonId]: {
        stars: Math.max(stars, progress[lessonId]?.stars ?? 0),
        completed: true,
      },
    };
    setProgress(updated);
    // 解鎖下一章的檢查移到更新函式外（在 updater 內呼叫 setState 會被 StrictMode 重複執行）
    if (activeSection) maybeUnlockNext(activeSection.id, updated);

    setStats((prev) => {
      let xpPool = prev.xp + xp;
      let level = prev.level;
      let nextLevelXp = prev.nextLevelXp;
      // 一次獎勵可能跨多級（例如一次拿滿星通過 BOSS），改用迴圈結算
      while (xpPool >= nextLevelXp) {
        level += 1;
        xpPool -= nextLevelXp;
        nextLevelXp = Math.round(nextLevelXp * 1.35);
      }
      let newTitle = prev.title;
      if (profile) {
        if (level >= 8) newTitle = '校園投資傳奇';
        else if (level >= 5) newTitle = '紀律鍛造者';
      }
      return {
        ...prev,
        xp: xpPool,
        level,
        nextLevelXp,
        title: newTitle,
        gems: prev.gems + gems,
      };
    });

    // Daily tasks
    setDaily((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === 'd1') return { ...t, done: Math.min(t.target, t.done + 1) };
        return t;
      }),
    }));

    // Leaderboard sync
    setStudents((prev) =>
      prev.map((s) => (s.isCurrentUser ? { ...s, weeklyXp: s.weeklyXp + xp } : s))
    );
  };

  const handleWrongAnswer = (questionKey: string) => {
    handleDeductHeart();
    // 記入錯題本：複習時優先出題
    setMissed((prev) => ({
      ...prev,
      [questionKey]: (prev[questionKey] ?? 0) + 1,
    }));
  };

  /** 複習中答錯：只記錯題，不扣心（已經是 0） */
  const handleReviewWrong = (questionKey: string) => {
    setMissed((prev) => ({
      ...prev,
      [questionKey]: (prev[questionKey] ?? 0) + 1,
    }));
  };

  /** 複習答對 1 題 → 恢復 1 顆心（封頂 maxHearts） */
  const handleEarnHeart = () => {
    setStats((prev) => ({
      ...prev,
      hearts: Math.min(prev.maxHearts, prev.hearts + 1),
    }));
  };

  /** 統一的 XP 給與（含升級判定與排行榜同步） */
  const grantXp = (xp: number) => {
    if (xp <= 0) return;
    setStats((prev) => {
      let xpPool = prev.xp + xp;
      let level = prev.level;
      let nextLevelXp = prev.nextLevelXp;
      // 一次獎勵可能跨多級，改用迴圈結算（與通關結算一致）
      while (xpPool >= nextLevelXp) {
        level += 1;
        xpPool -= nextLevelXp;
        nextLevelXp = Math.round(nextLevelXp * 1.35);
      }
      let newTitle = prev.title;
      if (profile) {
        if (level >= 8) newTitle = '校園投資傳奇';
        else if (level >= 5) newTitle = '紀律鍛造者';
      }
      return {
        ...prev,
        xp: xpPool,
        level,
        nextLevelXp,
        title: newTitle,
      };
    });
    setStudents((prev) =>
      prev.map((s) => (s.isCurrentUser ? { ...s, weeklyXp: s.weeklyXp + xp } : s))
    );
  };

  /** 複習一輪結束：發放小額 XP（每題 5 XP） */
  const handleReviewComplete = (correct: number, _total: number) => {
    grantXp(correct * 5);
  };

  const handleLogDecision = (decision: TradeDecision) => {
    setTradeDecisions((prev) => [decision, ...prev]);
    setDaily((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === 'd3' ? { ...t, done: Math.min(t.target, t.done + 1) } : t
      ),
    }));
    setBadges((prev) =>
      prev.map((b) => {
        if (b.id === 'badge-4') return { ...b, progress: 1, unlocked: true };
        if (b.id === 'badge-1') {
          const newProgress = Math.min(b.maxProgress, b.progress + 1);
          return { ...b, progress: newProgress, unlocked: newProgress >= b.maxProgress };
        }
        return b;
      })
    );
  };

  const handleSelectLesson = (section: Section, lesson: Lesson) => {
    // 愛心歸零 → 不能開始新關卡，先做錯題複習回血
    if (stats.hearts === 0) {
      setIsReviewOpen(true);
      return;
    }
    setActiveSection(section);
    setActiveLesson(lesson);
    setIsLessonOpen(true);
  };

  /** 跳關：把目標關之前（同一章內）未完成的關卡標記為「已跳過」，並直接打開目標關 */
  const handleSkipToLesson = (section: Section, lesson: Lesson) => {
    setProgress((prev) => {
      const updated: LessonProgress = { ...prev };
      const idx = section.lessons.findIndex((l) => l.id === lesson.id);
      for (let i = 0; i < idx; i++) {
        const l = section.lessons[i];
        if (!updated[l.id]?.completed) {
          updated[l.id] = { stars: 0, completed: true, skipped: true };
        }
      }
      return updated;
    });
    sound.playSuccess();
    handleSelectLesson(section, lesson);
  };

  /** 跳級：解鎖目標章節（含中間所有章節），既有進度不受影響 */
  const handleConfirmJump = () => {
    if (!jumpTarget) return;
    const idx = curriculum.findIndex((s) => s.id === jumpTarget.id);
    const toAdd = curriculum.slice(0, idx + 1).map((s) => s.id);
    setUnlockedSections((prev) => Array.from(new Set([...prev, ...toAdd])));
    setJumpTarget(null);
  };

  /** 這次跳級會一併解鎖、目前尚未解鎖的章節（確認彈窗清單用） */
  const sectionsToUnlock = useMemo(() => {
    if (!jumpTarget) return [];
    const idx = curriculum.findIndex((s) => s.id === jumpTarget.id);
    return curriculum.slice(0, idx + 1).filter((s) => !unlockedSections.includes(s.id));
  }, [jumpTarget, unlockedSections]);

  /** 複習題庫：已解鎖章節的所有題目，附上錯題次數（錯題優先出題） */
  const reviewPool = useMemo<ReviewQuestion[]>(() => {
    const pool: ReviewQuestion[] = [];
    for (const section of curriculum) {
      if (!unlockedSections.includes(section.id)) continue;
      for (const lesson of section.lessons) {
        lesson.questions.forEach((question, i) => {
          const key = `${lesson.id}#${i}`;
          pool.push({
            key,
            question,
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            sectionTitle: section.title,
            sectionCode: lesson.code,
            sectionColor: section.color,
            missCount: missed[key] ?? 0,
          });
        });
      }
    }
    return pool;
  }, [unlockedSections, missed]);

  // Onboarding gate
  if (!onboarded) {
    return (
      <Suspense fallback={<ScreenFallback label="載入中…" />}>
        <OnboardingSurvey onComplete={handleOnboard} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] via-white to-[#F8FAFC] flex flex-col font-['Nunito',_'Noto_Sans_TC',_system-ui,_sans-serif]">
      <Header
        stats={stats}
        onToggleSound={handleToggleSound}
        onOpenHeartRefill={() => setIsHeartRefillOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 w-full max-w-xl mx-auto flex flex-col">
        {/* Tabs */}
        <div className="pt-3 px-4 flex items-center justify-center">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner text-xs font-black">
            {(
              [
                ['learn', '學習地圖', MapPin, 'text-[#58CC02]'],
                ['leaderboard', '社群聯賽', Trophy, 'text-amber-500'],
                ['journal', '決策日記', BookMarked, 'text-emerald-600'],
                ['badges', '成就勳章', Award, 'text-amber-500'],
              ] as const
            ).map(([tab, label, Icon, color]) => (
              <button
                key={tab}
                onClick={() => {
                  sound.playClick();
                  setCurrentTab(tab);
                }}
                aria-current={currentTab === tab ? 'page' : undefined}
                className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === tab
                    ? 'bg-white text-slate-800 shadow-md scale-[1.03]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {currentTab === 'learn' && (
          <div className="flex-1 flex flex-col">
            <div className="px-4 pt-3">
              <DailyTasks daily={daily} userName={stats.userName || '同學'} />
            </div>
            <SkillTree
              sections={curriculum}
              progress={progress}
              unlockedSectionIds={unlockedSections}
              onSelectLesson={handleSelectLesson}
              onSkipToLesson={handleSkipToLesson}
              onJumpToSection={setJumpTarget}
            />
          </div>
        )}

        {currentTab === 'leaderboard' && (
          <Suspense fallback={<ScreenFallback label="載入排行榜…" />}>
            <Leaderboard students={students} userXp={stats.xp} />
          </Suspense>
        )}

        {currentTab === 'journal' && (
          <Suspense fallback={<ScreenFallback label="載入決策日記…" />}>
            <TradeJournal
              decisions={tradeDecisions}
              badges={badges}
              onAddDecision={handleLogDecision}
            />
          </Suspense>
        )}

        {currentTab === 'badges' && (
          <div className="max-w-md mx-auto w-full px-4 py-6 pb-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                <Award className="w-9 h-9 text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800">行為金融榮譽堂</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                每一個徽章，都代表你戰勝了一次市場人性弱點！
              </p>
            </div>

            <div className="space-y-3">
              {badges.map((b) => (
                <div
                  key={b.id}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                    b.unlocked
                      ? 'bg-white border-amber-300 shadow-sm'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="text-3xl shrink-0 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-sm text-slate-800">{b.name}</h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {b.tag}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{b.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#58CC02] h-full rounded-full transition-all"
                          style={{ width: `${(b.progress / b.maxProgress) * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-black text-slate-500">
                        {b.progress} / {b.maxProgress}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav
        aria-label="主要分頁導覽"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 py-2 px-3 shadow-lg md:hidden"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          {(
            [
              ['learn', '學習地圖', MapPin],
              ['leaderboard', '社群聯賽', Trophy],
              ['journal', '決策日記', BookMarked],
              ['badges', '紀律勳章', Award],
            ] as const
          ).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => {
                sound.playClick();
                setCurrentTab(tab);
              }}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-2xl transition-all cursor-pointer ${
                currentTab === tab
                  ? 'text-[#58CC02] font-black scale-105 bg-[#F0FFF4] border border-emerald-100'
                  : 'text-slate-400 font-bold hover:text-slate-600 border border-transparent'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 繼續闖關懸浮按鈕：當前關卡離開視線時出現 */}
      {currentTab === 'learn' && showContinue && (
        <button
          onClick={() => {
            sound.playClick();
            document
              .getElementById('active-lesson-node')
              ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }}
          className="fixed bottom-20 md:bottom-6 right-4 z-40 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-sm pl-3.5 pr-4 py-2.5 rounded-full border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center gap-1.5 cursor-pointer rise-in"
        >
          <Target className="w-4 h-4 fill-white" />
          繼續闖關
        </button>
      )}

      {/* Lesson player */}
      {activeSection && activeLesson && (
        <Suspense fallback={<ScreenFallback label="準備闖關…" />}>
          <LessonPlayer
            section={activeSection}
            lesson={activeLesson}
            isOpen={isLessonOpen}
            onClose={() => setIsLessonOpen(false)}
            onComplete={handleCompleteLesson}
            onWrongAnswer={handleWrongAnswer}
            onCorrectCalcOrData={() => {
              setDaily((prev) => ({
                ...prev,
                tasks: prev.tasks.map((t) =>
                  t.id === 'd2' ? { ...t, done: Math.min(t.target, t.done + 1) } : t
                ),
              }));
            }}
            onAskTutor={setTutorContext}
          />
        </Suspense>
      )}

      {/* AI 對話導師：由課程答錯畫面帶入題目情境 */}
      <AITutor
        isOpen={tutorContext !== null}
        context={tutorContext}
        onClose={() => setTutorContext(null)}
      />

      <SkipGradeModal
        targetSection={jumpTarget}
        toUnlock={sectionsToUnlock}
        isOpen={!!jumpTarget}
        onClose={() => setJumpTarget(null)}
        onConfirm={handleConfirmJump}
      />

      <HeartRefillModal
        hearts={stats.hearts}
        maxHearts={stats.maxHearts}
        gems={stats.gems}
        isOpen={isHeartRefillOpen}
        onClose={() => setIsHeartRefillOpen(false)}
        onRefillWithGems={handleRefillWithGems}
        onReadMungerWisdom={() => {
          setIsHeartRefillOpen(false);
          setIsWisdomModalOpen(true);
        }}
        onReviewPractice={() => {
          setIsHeartRefillOpen(false);
          setIsReviewOpen(true);
        }}
      />

      {/* 錯題複習回血：愛心歸零時強制進入，答對 1 題恢復 1 顆心 */}
      <HeartReviewQuiz
        isOpen={isReviewOpen}
        hearts={stats.hearts}
        maxHearts={stats.maxHearts}
        pool={reviewPool}
        onClose={() => setIsReviewOpen(false)}
        onEarnHeart={handleEarnHeart}
        onWrong={handleReviewWrong}
        onComplete={handleReviewComplete}
        onOpenRefill={() => {
          setIsReviewOpen(false);
          setIsHeartRefillOpen(true);
        }}
      />

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onReset={handleResetProgress}
          stats={stats}
        />
      </Suspense>

      <WisdomModal
        isOpen={isWisdomModalOpen}
        onClose={() => setIsWisdomModalOpen(false)}
        onClaimHeart={handleClaimWisdomHeart}
      />
    </div>
  );
}
