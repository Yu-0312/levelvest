import React, { useEffect, useMemo, useState } from 'react';
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
import { LessonPlayer } from './components/LessonPlayer';
import { OnboardingSurvey } from './components/OnboardingSurvey';
import { DailyTasks } from './components/DailyTasks';
import { TradeJournal } from './components/TradeJournal';
import { Leaderboard } from './components/Leaderboard';
import { HeartRefillModal } from './components/HeartRefillModal';
import { SkipGradeModal } from './components/SkipGradeModal';
import { SettingsModal } from './components/SettingsModal';
import { WisdomModal } from './components/WisdomModal';
import { sound } from './utils/audio';

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
}

function loadSave(): SaveState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SaveState;
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
  const [students, setStudents] = useState<LeaderboardStudent[]>(leaderboardStudents);

  const [currentTab, setCurrentTab] = useState<TabType>('learn');
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [isHeartRefillOpen, setIsHeartRefillOpen] = useState(false);
  const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);
  /** 跳級確認彈窗的目標章節 */
  const [jumpTarget, setJumpTarget] = useState<Section | null>(null);
  /** 設定彈窗（含重置進度） */
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  /** 地圖上目前關卡離開視線時，顯示「繼續闖關」懸浮按鈕 */
  const [showContinue, setShowContinue] = useState(false);

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
    });
  }, [onboarded, profile, stats, progress, unlockedSections, tradeDecisions, badges, daily]);

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
    setStats((prev) => {
      const nextHearts = Math.max(0, prev.hearts - 1);
      if (nextHearts === 0) setIsHeartRefillOpen(true);
      return { ...prev, hearts: nextHearts };
    });
  };

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
    setProgress((prev) => {
      const updated: LessonProgress = {
        ...prev,
        [lessonId]: { stars: Math.max(stars, prev[lessonId]?.stars ?? 0), completed: true },
      };
      if (activeSection) maybeUnlockNext(activeSection.id, updated);
      return updated;
    });

    setStats((prev) => {
      let newXp = prev.xp + xp;
      let newLevel = prev.level;
      let newNextLevelXp = prev.nextLevelXp;
      let newTitle = prev.title;
      if (newXp >= newNextLevelXp) {
        newLevel += 1;
        newXp -= newNextLevelXp;
        newNextLevelXp = Math.round(newNextLevelXp * 1.35);
        if (newLevel >= 5 && profile) newTitle = '紀律鍛造者';
        if (newLevel >= 8 && profile) newTitle = '校園投資傳奇';
      }
      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextLevelXp,
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

  const handleWrongAnswer = () => {
    handleDeductHeart();
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

  // Onboarding gate
  if (!onboarded) {
    return <OnboardingSurvey onComplete={handleOnboard} />;
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
          <Leaderboard students={students} userXp={stats.xp} />
        )}

        {currentTab === 'journal' && (
          <TradeJournal
            decisions={tradeDecisions}
            badges={badges}
            onAddDecision={handleLogDecision}
          />
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
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 py-2 px-3 shadow-lg md:hidden">
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
        />
      )}

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
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onReset={handleResetProgress}
        stats={stats}
      />

      <WisdomModal
        isOpen={isWisdomModalOpen}
        onClose={() => setIsWisdomModalOpen(false)}
        onClaimHeart={handleClaimWisdomHeart}
      />
    </div>
  );
}
