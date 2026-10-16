import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Mascot } from './Mascot';
import {
  Trophy,
  Clock,
  Flame,
  TrendingUp,
  ShieldCheck,
  Coffee,
  Heart,
  Sparkles,
  Award,
  ChevronUp,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { LeaderboardStudent } from '../types';
import { sound } from '../utils/audio';

interface LeaderboardProps {
  students: LeaderboardStudent[];
}

/** 🐂 = 牛牛本人：用紅牛吉祥物取代 emoji，其餘同學照舊 */
const Avatar: React.FC<{ avatar: string; px: number }> = ({ avatar, px }) =>
  avatar === '🐂' ? (
    <span className="inline-block shrink-0" style={{ width: px, height: px }}>
      <Mascot size="sm" animated={false} className="w-full! h-full!" />
    </span>
  ) : (
    <>{avatar}</>
  );

export const Leaderboard: React.FC<LeaderboardProps> = ({ students: initialStudents }) => {
  const [students, setStudents] = useState<LeaderboardStudent[]>(initialStudents);
  const [cheeredStudentId, setCheeredStudentId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 本週結算倒數：以固定 deadline 計算剩餘時間（不會再出現分鐘歸零跳回 59 的倒流 bug）
  const [deadline] = useState(() => Date.now() + ((2 * 24 + 14) * 3600 + 32 * 60 + 45) * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeLeft = useMemo(() => {
    let rest = Math.max(0, Math.floor((deadline - now) / 1000));
    const days = Math.floor(rest / 86400);
    rest %= 86400;
    const hours = Math.floor(rest / 3600);
    rest %= 3600;
    const minutes = Math.floor(rest / 60);
    const seconds = rest % 60;
    return { days, hours, minutes, seconds };
  }, [deadline, now]);

  // cheer 後的提示 timer：unmount 時清理，避免 setState on unmounted
  const timersRef = useRef<number[]>([]);
  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    },
    []
  );

  const handleCheer = (student: LeaderboardStudent, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playSuccess();
    setCheeredStudentId(student.id);

    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, cheerCount: s.cheerCount + 1 } : s))
    );

    const cheers = ['送上了暖心咖啡 ☕！', '點燃了連勝火苗 🔥！', '送上滿滿投資元氣 🚀！'];
    const chosenCheer = cheers[Math.floor(Math.random() * cheers.length)];
    setToastMessage(`你為 ${student.school} 的 ${student.name} ${chosenCheer}`);

    timersRef.current.push(
      window.setTimeout(() => setCheeredStudentId(null), 1200),
      window.setTimeout(() => setToastMessage(null), 3000)
    );
  };

  // 依實際每週 XP 重算名次（使用者升級後名次會真的動）
  const ranked = useMemo(
    () =>
      [...students]
        .sort((a, b) => b.weeklyXp - a.weeklyXp)
        .map((s, i) => ({ ...s, rank: i + 1 })),
    [students]
  );
  const top3 = ranked.slice(0, 3);
  const ranks4to10 = ranked.slice(3, 10);
  const me = ranked.find((s) => s.isCurrentUser);
  const promotionCut = ranked[2]?.weeklyXp ?? 0;

  return (
    <div id="leaderboard-view" className="w-full max-w-xl mx-auto px-4 py-4 pb-28 space-y-5">
      {/* League Header Card */}
      <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-3xl p-5 text-white shadow-lg border-b-4 border-amber-700 relative overflow-hidden">
        {/* Decorative badge watermarks */}
        <div className="absolute -right-4 -bottom-6 opacity-20 pointer-events-none">
          <Trophy className="w-36 h-36 text-white" />
        </div>

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-white/20 backdrop-blur-xs rounded-xl shadow-xs">
              <Trophy className="w-6 h-6 text-yellow-100 fill-yellow-100" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  黃金聯賽 (Gold League)
                </h2>
                <span className="bg-white/20 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  全台大專盃
                </span>
              </div>
              <p className="text-xs text-amber-100 font-bold">每週結算 · 爭奪晉級鑽石聯賽席位</p>
            </div>
          </div>
        </div>

        {/* Countdown Timer Bar */}
        <div className="mt-3 bg-black/20 backdrop-blur-xs rounded-2xl p-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-black text-amber-100">
            <Clock className="w-4 h-4 text-amber-200" />
            <span>本輪結算倒數：</span>
            <span className="font-mono bg-black/30 px-2 py-0.5 rounded-md text-white">
              {timeLeft.days} 天 {timeLeft.hours} 時 {timeLeft.minutes} 分 {timeLeft.seconds} 秒
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-200 hidden sm:inline">
            前 3 名晉升 💎
          </span>
        </div>

        {/* Philosophy Pill */}
        <div className="mt-3 bg-white/10 backdrop-blur-xs rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-amber-50 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-yellow-200 shrink-0" />
          <span>排名機制：每週學習 XP ＋ 決策紀律勝率，摒棄投機賭博，獎勵紮實風控！</span>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-slate-700"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top 3 Podium (Duolingo / Olympic Style) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-sm">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-4 text-center">
          🏆 領先群 (Top 3 榮譽領獎台)
        </h3>

        <div className="flex items-end justify-center gap-2 sm:gap-3 pt-4 pb-2">
          {/* Rank 2 (Silver) */}
          {top3[1] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2 flex flex-col items-center">
                <span className="text-3xl mb-1 drop-shadow-sm"><Avatar avatar={top3[1].avatar} px={40} /></span>
                <span className="bg-slate-200 text-slate-700 font-black text-xs px-2 py-0.5 rounded-full border border-slate-300">
                  #2
                </span>
              </div>
              <p className="font-black text-xs text-slate-800 truncate max-w-[85px]">
                {top3[1].name}
              </p>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md mb-1">
                {top3[1].school}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-black text-slate-700">
                <span>{top3[1].weeklyXp}</span>
                <span className="text-[9px] text-slate-400">XP</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5">
                {top3[1].decisionWinRate}% 勝率
              </span>

              {/* Pedestal */}
              <div className="w-full bg-slate-100 border-t-4 border-slate-300 rounded-t-2xl h-24 flex items-center justify-center mt-2 shadow-inner">
                <span className="font-black text-xl text-slate-400">🥈</span>
              </div>
            </div>
          )}

          {/* Rank 1 (Gold - Center & Elevated) */}
          {top3[0] && (
            <div className="flex-1 flex flex-col items-center -mt-4">
              <div className="relative mb-2 flex flex-col items-center">
                <div className="absolute -top-5 text-xl animate-bounce">👑</div>
                <span className="text-4xl mb-1 drop-shadow-md"><Avatar avatar={top3[0].avatar} px={48} /></span>
                <span className="bg-amber-400 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-white shadow-xs">
                  #1
                </span>
              </div>
              <p className="font-black text-sm text-slate-900 truncate max-w-[95px]">
                {top3[0].name}
              </p>
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.2 rounded-md mb-1">
                {top3[0].school}
              </span>
              <div className="flex items-center gap-1 text-xs font-black text-amber-950">
                <span className="text-amber-600">{top3[0].weeklyXp}</span>
                <span className="text-[10px] text-slate-400">XP</span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md mt-0.5">
                {top3[0].decisionWinRate}% 紀律勝率
              </span>

              {/* Pedestal */}
              <div className="w-full bg-gradient-to-b from-amber-100 to-amber-200 border-t-4 border-amber-400 rounded-t-2xl h-32 flex items-center justify-center mt-2 shadow-xs">
                <span className="font-black text-2xl text-amber-600">🥇</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {top3[2] && (
            <div className="flex-1 flex flex-col items-center">
              <div className="relative mb-2 flex flex-col items-center">
                <span className="text-3xl mb-1 drop-shadow-sm"><Avatar avatar={top3[2].avatar} px={40} /></span>
                <span className="bg-amber-700 text-amber-100 font-black text-xs px-2 py-0.5 rounded-full border border-amber-600">
                  #3
                </span>
              </div>
              <p className="font-black text-xs text-slate-800 truncate max-w-[85px]">
                {top3[2].name}
              </p>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded-md mb-1">
                {top3[2].school}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-black text-slate-700">
                <span>{top3[2].weeklyXp}</span>
                <span className="text-[9px] text-slate-400">XP</span>
              </div>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md mt-0.5">
                {top3[2].decisionWinRate}% 勝率
              </span>

              {/* Pedestal */}
              <div className="w-full bg-amber-50 border-t-4 border-amber-600/40 rounded-t-2xl h-20 flex items-center justify-center mt-2 shadow-inner">
                <span className="font-black text-xl text-amber-700">🥉</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Promotion Zone Cutoff Line */}
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-dashed border-emerald-400" />
        </div>
        <span className="relative bg-[#D7FFB8] text-emerald-900 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border border-emerald-300 shadow-xs">
          <ChevronUp className="w-4 h-4 text-emerald-700 animate-bounce" />
          <span>晉級線：結算前 3 名晉級至 💎 鑽石聯賽</span>
        </span>
      </div>

      {/* List View for Ranks 4 to 10 */}
      <div className="space-y-2.5">
        {ranks4to10.map((student) => {
          const isUser = student.isCurrentUser;

          return (
            <div
              key={student.id}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                isUser
                  ? 'bg-emerald-50/80 border-[#58CC02] shadow-md ring-2 ring-[#58CC02]/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              {/* Left: Rank & Avatar & Info */}
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-7 text-center font-black text-sm shrink-0 ${
                    isUser ? 'text-[#58CC02]' : 'text-slate-400'
                  }`}
                >
                  #{student.rank}
                </span>

                <div className="relative shrink-0 text-2xl"><Avatar avatar={student.avatar} px={32} /></div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-slate-800 truncate">{student.name}</p>
                    {isUser && (
                      <span className="bg-[#58CC02] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                        你 (You)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                    <span>{student.school}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 text-orange-600">
                      <Flame className="w-3 h-3 fill-orange-500 text-orange-500" />
                      {student.streak}天
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: XP, Win Rate, and Cheer/Poke Button */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-slate-800">
                    {student.weeklyXp}{' '}
                    <span className="text-[10px] text-slate-400 font-bold">XP</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {student.decisionWinRate}% 紀律勝率
                  </div>
                </div>

                {/* Cheer / Poke button */}
                {!isUser ? (
                  <button
                    onClick={(e) => handleCheer(student, e)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-800 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-slate-200 hover:border-amber-300"
                    title="為同學加油打氣"
                  >
                    <Coffee className="w-3.5 h-3.5 text-amber-600" />
                    <span className="text-[11px]">{student.cheerCount}</span>
                  </button>
                ) : (
                  <div className="px-2.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 font-black text-[11px]">
                    第 {student.rank} 名
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Encouragement Footer Banner */}
      <div className="bg-slate-100 rounded-2xl p-3.5 text-center text-xs font-black text-slate-600 border border-slate-200">
        {me && me.rank <= 3 ? (
          <span className="text-[#58CC02]">你目前在晉級區（第 {me.rank} 名）！保持住，結算前守住前 3 名就能晉級 💎</span>
        ) : me ? (
          <>
            距離晉升鑽石聯賽還差{' '}
            <span className="text-[#58CC02] font-black">{promotionCut - me.weeklyXp + 1} XP</span>
            ！多完成幾堂課與時事挑戰就能迎頭趕上 🚀
          </>
        ) : (
          '完成每天的學習任務，累積每週 XP 衝擊晉級線！🚀'
        )}
      </div>
    </div>
  );
};
