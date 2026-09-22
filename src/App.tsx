import React, { useState } from 'react';
import {
  MapPin,
  BookMarked,
  Award,
  Trophy,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Shield,
  Zap,
} from 'lucide-react';
import {
  TabType,
  UserStats,
  Unit,
  LessonNode,
  TradeDecision,
  BehavioralBadge,
  LeaderboardStudent,
} from './types';
import {
  initialStats,
  unitsData,
  initialTradeDecisions,
  badgesData,
  leaderboardStudents,
} from './data/mockData';
import { Header } from './components/Header';
import { SkillTree } from './components/SkillTree';
import { LessonModal } from './components/LessonModal';
import { TradeJournal } from './components/TradeJournal';
import { Leaderboard } from './components/Leaderboard';
import { HeartRefillModal } from './components/HeartRefillModal';
import { WisdomModal } from './components/WisdomModal';
import { GenericReviewModal } from './components/GenericReviewModal';
import { sound } from './utils/audio';

export default function App() {
  const [stats, setStats] = useState<UserStats>(initialStats);
  const [units, setUnits] = useState<Unit[]>(unitsData);
  const [tradeDecisions, setTradeDecisions] = useState<TradeDecision[]>(initialTradeDecisions);
  const [badges, setBadges] = useState<BehavioralBadge[]>(badgesData);
  const [students, setStudents] = useState<LeaderboardStudent[]>(leaderboardStudents);
  const [currentTab, setCurrentTab] = useState<TabType>('learn');

  // Modals state
  const [activeLessonNode, setActiveLessonNode] = useState<LessonNode | null>(null);
  const [isInteractiveLessonOpen, setIsInteractiveLessonOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isHeartRefillOpen, setIsHeartRefillOpen] = useState(false);
  const [isWisdomModalOpen, setIsWisdomModalOpen] = useState(false);

  // Sound toggle
  const handleToggleSound = () => {
    const nextVal = !stats.soundEnabled;
    sound.enabled = nextVal;
    setStats((prev) => ({ ...prev, soundEnabled: nextVal }));
    if (nextVal) sound.playClick();
  };

  // Heart deduction on wrong quiz answer
  const handleDeductHeart = () => {
    setStats((prev) => {
      const nextHearts = Math.max(0, prev.hearts - 1);
      if (nextHearts === 0) {
        setIsHeartRefillOpen(true);
      }
      return { ...prev, hearts: nextHearts };
    });
  };

  // Heart refill with Gems (50 Gems for full 5 hearts)
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

  // Wisdom refill (+1 heart)
  const handleClaimWisdomHeart = () => {
    setStats((prev) => ({
      ...prev,
      hearts: Math.min(prev.maxHearts, prev.hearts + 1),
    }));
  };

  // Complete lesson rewards
  const handleCompleteLesson = (xpGained: number, gemsGained: number) => {
    setStats((prev) => {
      let newXp = prev.xp + xpGained;
      let newLevel = prev.level;
      let newNextLevelXp = prev.nextLevelXp;
      let newTitle = prev.title;

      if (newXp >= newNextLevelXp) {
        newLevel += 1;
        newXp -= newNextLevelXp;
        newNextLevelXp = Math.round(newNextLevelXp * 1.4);
        if (newLevel === 4) newTitle = '臺大當沖獵手';
        if (newLevel >= 5) newTitle = '校園紀律傳奇';
      }

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp: newNextLevelXp,
        title: newTitle,
        gems: prev.gems + gemsGained,
      };
    });

    // Update user's weekly XP in leaderboard
    setStudents((prev) =>
      prev.map((s) => (s.isCurrentUser ? { ...s, weeklyXp: s.weeklyXp + xpGained } : s))
    );

    // Update Unit 2 Node 4 status to 3 stars
    setUnits((prevUnits) =>
      prevUnits.map((u) => {
        if (u.id === 'unit-2') {
          return {
            ...u,
            nodes: u.nodes.map((n) =>
              n.id === 'node-4'
                ? { ...n, stars: 3, status: 'completed' as const }
                : n
            ),
          };
        }
        if (u.id === 'unit-3') {
          // Unlock unit 3 node 5!
          return {
            ...u,
            nodes: u.nodes.map((n, idx) =>
              idx === 0 ? { ...n, status: 'active' as const } : n
            ),
          };
        }
        return u;
      })
    );

    // Update 20MA badge progress
    setBadges((prevBadges) =>
      prevBadges.map((b) =>
        b.id === 'badge-3'
          ? { ...b, progress: Math.min(b.maxProgress, b.progress + 1), unlocked: true }
          : b
      )
    );
  };

  // Log trade decision to journal
  const handleLogDecision = (decision: TradeDecision) => {
    setTradeDecisions((prev) => [decision, ...prev]);

    // Check / update "新手啟航" and "鋼鐵紀律者" badge
    setBadges((prevBadges) =>
      prevBadges.map((b) => {
        if (b.id === 'badge-4') {
          return { ...b, progress: 1, unlocked: true };
        }
        if (b.id === 'badge-1') {
          const newProgress = Math.min(b.maxProgress, b.progress + 1);
          return { ...b, progress: newProgress, unlocked: newProgress >= b.maxProgress };
        }
        return b;
      })
    );
  };

  // Node selection from Skill Tree
  const handleSelectNode = (node: LessonNode) => {
    setActiveLessonNode(node);
    if (node.id === 'node-4') {
      // Main interactive 3-step micro-lesson
      setIsInteractiveLessonOpen(true);
    } else {
      // Concept review modal for other nodes
      setIsReviewModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-['Nunito',_'Noto_Sans_TC',_system-ui,_sans-serif]">
      {/* Top Header / Gamification Bar (Always Visible) */}
      <Header
        stats={stats}
        onToggleSound={handleToggleSound}
        onOpenHeartRefill={() => setIsHeartRefillOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-xl mx-auto flex flex-col">
        {/* Navigation Tabs (Top Pill Selector for Desktop & Tablets) */}
        <div className="pt-3 px-4 flex items-center justify-center">
          <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 shadow-inner text-xs font-black">
            <button
              id="tab-learn"
              onClick={() => {
                sound.playClick();
                setCurrentTab('learn');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'learn'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4 text-[#58CC02]" />
              <span>學習地圖</span>
            </button>

            <button
              id="tab-leaderboard"
              onClick={() => {
                sound.playClick();
                setCurrentTab('leaderboard');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'leaderboard'
                  ? 'bg-white text-amber-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-400" />
              <span>社群聯賽</span>
            </button>

            <button
              id="tab-journal"
              onClick={() => {
                sound.playClick();
                setCurrentTab('journal');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'journal'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookMarked className="w-4 h-4 text-emerald-600" />
              <span>決策日記</span>
              {tradeDecisions.length > 0 && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
                  {tradeDecisions.length}
                </span>
              )}
            </button>

            <button
              id="tab-badges"
              onClick={() => {
                sound.playClick();
                setCurrentTab('badges');
              }}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'badges'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500" />
              <span>成就勳章</span>
            </button>
          </div>
        </div>

        {/* Tab 1: The Duolingo Skill Tree Path */}
        {currentTab === 'learn' && (
          <div className="flex-1 flex flex-col justify-start">
            <SkillTree
              units={units}
              activeNodeId="node-4"
              onSelectNode={handleSelectNode}
            />
          </div>
        )}

        {/* Tab 2: Social Leaderboard & Leagues */}
        {currentTab === 'leaderboard' && (
          <Leaderboard students={students} userXp={stats.xp} />
        )}

        {/* Tab 3: Trade Journal & Ticker Passport */}
        {currentTab === 'journal' && (
          <TradeJournal
            decisions={tradeDecisions}
            badges={badges}
            onAddDecision={handleLogDecision}
          />
        )}

        {/* Tab 4: Dedicated Behavioral Badges Showcase */}
        {currentTab === 'badges' && (
          <div className="max-w-md mx-auto w-full px-4 py-6 pb-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 text-center shadow-xs">
              <div className="w-16 h-16 mx-auto mb-2 bg-amber-100 rounded-full flex items-center justify-center">
                <Award className="w-9 h-9 text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-slate-800">行為金融榮譽堂</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                培養巴菲特級別的心理素質。每一個徽章，都代表你戰勝了一次市場人性弱點！
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
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {b.description}
                    </p>
                    {/* Progress bar */}
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

      {/* Bottom Sticky Navigation Bar for Mobile */}
      <nav
        id="bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 py-2 px-3 shadow-lg md:hidden"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('learn');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'learn'
                ? 'text-[#58CC02] font-black scale-105'
                : 'text-slate-400 font-bold hover:text-slate-600'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px]">學習地圖</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('leaderboard');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'leaderboard'
                ? 'text-amber-600 font-black scale-105'
                : 'text-slate-400 font-bold hover:text-slate-600'
            }`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[10px]">社群聯賽</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('journal');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'journal'
                ? 'text-emerald-700 font-black scale-105'
                : 'text-slate-400 font-bold hover:text-slate-600'
            }`}
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px]">決策日記</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCurrentTab('badges');
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              currentTab === 'badges'
                ? 'text-amber-600 font-black scale-105'
                : 'text-slate-400 font-bold hover:text-slate-600'
            }`}
          >
            <Award className="w-5 h-5" />
            <span className="text-[10px]">紀律勳章</span>
          </button>
        </div>
      </nav>

      {/* Interactive Micro-Lesson Modal (3-step flow for Node 4 "20MA 月線生命線") */}
      {activeLessonNode && (
        <LessonModal
          node={activeLessonNode}
          hearts={stats.hearts}
          isOpen={isInteractiveLessonOpen}
          onClose={() => setIsInteractiveLessonOpen(false)}
          onDeductHeart={handleDeductHeart}
          onCompleteLesson={handleCompleteLesson}
          onLogDecisionToJournal={handleLogDecision}
          onNavigateToJournal={() => setCurrentTab('journal')}
        />
      )}

      {/* Generic Review / Practice Modal for completed nodes */}
      <GenericReviewModal
        node={activeLessonNode}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReward={(xp, gems) => {
          setStats((prev) => ({
            ...prev,
            xp: prev.xp + xp,
            gems: prev.gems + gems,
          }));
        }}
      />

      {/* Heart Refill Modal */}
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

      {/* Charlie Munger Wisdom Modal */}
      <WisdomModal
        isOpen={isWisdomModalOpen}
        onClose={() => setIsWisdomModalOpen(false)}
        onClaimHeart={handleClaimWisdomHeart}
      />
    </div>
  );
}
