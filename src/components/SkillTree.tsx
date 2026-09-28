import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Lock,
  Star,
  BookOpen,
  TrendingUp,
  Shield,
  Target,
  Lightbulb,
  Play,
  Sparkles,
  Skull,
} from 'lucide-react';
import { Section, Lesson, LessonProgress, QuestionKind } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

interface SkillTreeProps {
  sections: Section[];
  progress: LessonProgress;
  unlockedSectionIds: string[];
  onSelectLesson: (section: Section, lesson: Lesson) => void;
}

const kindIcon = (kind: QuestionKind, isBoss: boolean, status: 'completed' | 'active' | 'locked') => {
  if (status === 'locked') return <Lock className="w-6 h-6 text-slate-400" />;
  if (isBoss) {
    return status === 'completed' ? (
      <Check className="w-7 h-7 text-white stroke-[3.5]" />
    ) : (
      <Skull className="w-7 h-7 text-white" />
    );
  }
  if (status === 'completed') return <Check className="w-7 h-7 text-white stroke-[3.5]" />;
  switch (kind) {
    case 'concept':
      return <BookOpen className="w-7 h-7 text-white" />;
    case 'calc':
      return <TrendingUp className="w-7 h-7 text-white" />;
    case 'scenario':
    case 'dialogue':
      return <Lightbulb className="w-7 h-7 text-white" />;
    case 'data':
      return <TrendingUp className="w-7 h-7 text-white" />;
    case 'simulate':
      return <Target className="w-7 h-7 text-white" />;
    case 'detect':
      return <Shield className="w-7 h-7 text-white" />;
    case 'review':
      return <Skull className="w-7 h-7 text-white" />;
    default:
      return <Play className="w-7 h-7 text-white fill-white" />;
  }
};

export const SkillTree: React.FC<SkillTreeProps> = ({
  sections,
  progress,
  unlockedSectionIds,
  onSelectLesson,
}) => {
  const [lockedTip, setLockedTip] = useState<string | null>(null);

  const getOffset = (index: number) => {
    const pattern = ['translate-x-0', '-translate-x-8', 'translate-x-0', 'translate-x-8'];
    return pattern[index % pattern.length];
  };

  let globalIdx = 0;

  return (
    <div className="w-full max-w-md mx-auto pb-28 pt-4 px-4 select-none">
      {sections.map((section, sIdx) => {
        const unlocked = unlockedSectionIds.includes(section.id);
        const completedCount = section.lessons.filter((l) => progress[l.id]?.completed).length;
        const total = section.lessons.length;
        const isDone = unlocked && completedCount === total;
        const isActive = unlocked && !isDone;

        return (
          <div key={section.id} className="mb-10 relative">
            {/* Section header */}
            <div
              className={`rounded-2xl p-4 sm:p-5 text-white mb-8 shadow-md border-b-4 ${
                isDone
                  ? 'border-black/20'
                  : isActive
                  ? 'border-black/25'
                  : 'bg-slate-400 border-slate-600 opacity-90'
              }`}
              style={
                isDone || isActive
                  ? { background: section.color, borderBottomColor: 'rgba(0,0,0,0.22)' }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xl">{section.badge}</span>
                    <span className="text-xs font-black tracking-wider uppercase opacity-90">
                      {section.code}
                    </span>
                    {isDone && (
                      <span className="bg-black/25 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        已通關 ✅
                      </span>
                    )}
                    {isActive && (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                        進行中 🎯
                      </span>
                    )}
                    {!unlocked && (
                      <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" /> 過 BOSS 解鎖
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    {section.title}
                  </h3>
                  <p className="text-xs opacity-90 font-medium mt-1">{section.subtitle}</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-white/85 mb-1">
                  <span>進度</span>
                  <span>
                    {completedCount} / {total}
                  </span>
                </div>
                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${(completedCount / total) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lesson nodes */}
            <div className="flex flex-col items-center gap-6 relative">
              {section.lessons.map((lesson) => {
                const idx = globalIdx++;
                const p = progress[lesson.id];
                const completed = !!p?.completed;
                // active = first non-completed lesson in an unlocked section
                const sectionLessons = section.lessons;
                const firstIncomplete = sectionLessons.find((l) => !progress[l.id]?.completed);
                const active = unlocked && !completed && firstIncomplete?.id === lesson.id;
                const locked = !unlocked || (!completed && !active);

                const status: 'completed' | 'active' | 'locked' = completed
                  ? 'completed'
                  : active
                  ? 'active'
                  : 'locked';

                return (
                  <div
                    key={lesson.id}
                    className={`relative flex flex-col items-center ${getOffset(idx)}`}
                  >
                    {active && (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                        className="absolute -top-11 z-20 bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl shadow-md cursor-pointer whitespace-nowrap"
                        onClick={() => {
                          sound.playClick();
                          onSelectLesson(section, lesson);
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>開始：{lesson.title}</span>
                        </div>
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-white" />
                      </motion.div>
                    )}

                    <div className="relative group">
                      {active && (
                        <div className="absolute -inset-2 rounded-full animate-ping pointer-events-none" style={{ background: `${section.color}33` }} />
                      )}

                      <button
                        onClick={() => {
                          if (locked) {
                            sound.playError();
                            setLockedTip(lesson.id);
                            setTimeout(() => setLockedTip(null), 2200);
                          } else {
                            sound.playClick();
                            onSelectLesson(section, lesson);
                          }
                        }}
                        className={`w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-lg ${
                          active
                            ? 'hover:brightness-95 active:translate-y-1 border-b-[6px] border-black/20'
                            : completed
                            ? 'bg-amber-400 border-b-[6px] border-amber-600 hover:bg-amber-300 active:translate-y-1'
                            : 'bg-slate-200 border-b-[6px] border-slate-300 cursor-not-allowed opacity-80'
                        }`}
                        style={
                          active || (completed && lesson.isBoss)
                            ? {
                                background: completed
                                  ? '#FBBF24'
                                  : lesson.isBoss
                                  ? '#E11D48'
                                  : section.color,
                              }
                            : undefined
                        }
                      >
                        {kindIcon(lesson.kind, !!lesson.isBoss, status)}

                        {completed && (
                          <div className="absolute -bottom-2 bg-amber-500 border border-white text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                            {[0, 1, 2].map((i) => (
                              <Star
                                key={i}
                                className={`w-2 h-2 ${
                                  i < (p?.stars ?? 0) ? 'fill-white' : 'opacity-40'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {lesson.isBoss && !completed && unlocked && (
                          <div className="absolute -top-1 -right-1 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-white shadow">
                            BOSS
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="mt-2 text-center max-w-[130px]">
                      <p
                        className={`text-[11px] font-black leading-tight ${
                          active
                            ? 'text-slate-900'
                            : completed
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{lesson.code}</p>
                    </div>

                    {lockedTip === lesson.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-12 z-30 bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap"
                      >
                        🔒 先完成前面的關卡！
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mascot cheer on first active section */}
            {sIdx === 0 && (
              <div className="hidden sm:flex absolute -right-4 top-52 flex-col items-center pointer-events-none">
                <div className="bg-white border-2 border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm mb-1">
                  「一關一關來，你行的！」
                </div>
                <Mascot emotion="celebrating" size="md" />
              </div>
            )}
          </div>
        );
      })}

      {/* Footer disclaimer */}
      <div className="text-[10px] text-slate-400 leading-relaxed text-center px-2 pb-4">
        LevelVest 為投資教育產品，所有標的、數據與走勢皆為虛構範例，不構成投資建議或收益保證。
      </div>
    </div>
  );
};
