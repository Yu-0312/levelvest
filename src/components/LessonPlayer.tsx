import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Star,
  Sparkles,
  BookOpen,
  Zap,
  Gem,
} from 'lucide-react';
import { Lesson, Section } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

interface LessonPlayerProps {
  section: Section;
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (lessonId: string, stars: number, xp: number, gems: number) => void;
  onWrongAnswer: () => void;
  onCorrectCalcOrData?: () => void;
}

type Phase = 'intro' | 'quiz' | 'result';

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  section,
  lesson,
  isOpen,
  onClose,
  onComplete,
  onWrongAnswer,
  onCorrectCalcOrData,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  // 進到結算畫面時灑彩帶慶祝（BOSS 加碼）
  useEffect(() => {
    if (phase !== 'result') return;
    const timer = setTimeout(() => {
      confetti({
        particleCount: lesson?.isBoss ? 160 : 90,
        spread: lesson?.isBoss ? 100 : 70,
        origin: { y: 0.6 },
        colors: ['#58CC02', '#FFC800', '#1CB0F6', '#CE82FF', '#FF4B4B'],
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [phase, lesson?.isBoss]);

  // Reset when a new lesson opens
  const lessonId = lesson?.id;
  const [prevLessonId, setPrevLessonId] = useState<string | null>(null);
  if (lessonId && lessonId !== prevLessonId) {
    setPrevLessonId(lessonId);
    setPhase('intro');
    setQIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setWrongCount(0);
  }

  if (!isOpen || !lesson) return null;

  const questions = lesson.questions;
  const current = questions[qIndex];
  const total = questions.length;
  const stars =
    wrongCount === 0 ? 3 : wrongCount <= 1 ? 2 : wrongCount <= 2 ? 1 : 1;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    sound.playClick();
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || submitted) return;
    setSubmitted(true);
    if (selected === current.answer) {
      sound.playSuccess();
      setCorrectCount((c) => c + 1);
      if (lesson.kind === 'calc' || lesson.kind === 'data') {
        onCorrectCalcOrData?.();
      }
    } else {
      sound.playError();
      setWrongCount((w) => w + 1);
      onWrongAnswer();
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (qIndex + 1 < total) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      sound.playSuccess();
      const xp = lesson.isBoss ? 80 : 25;
      const gems = lesson.isBoss ? 40 : 12;
      onComplete(lesson.id, stars, xp, gems);
      setPhase('result');
    }
  };

  const handleClose = () => {
    sound.playClick();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-slate-100"
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-3 border-b-2 border-slate-100 bg-white"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-white"
                    style={{ background: section.color }}
                  >
                    {lesson.code}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    {section.title}
                  </span>
                  {lesson.isBoss && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      BOSS
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-800 truncate">{lesson.title}</h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {phase === 'quiz' && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${((qIndex + (submitted ? 1 : 0)) / total) * 100}%`,
                      background: `linear-gradient(90deg, ${section.color}, ${section.color}B3)`,
                    }}
                  />
                </div>
                <span className="text-[11px] font-black text-slate-500">
                  {qIndex + 1}/{total}
                </span>
              </div>
            )}
          </div>

          <div className="p-5">
            {/* INTRO */}
            {phase === 'intro' && (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Mascot
                    emotion={lesson.isBoss ? 'celebrating' : 'happy'}
                    size="md"
                    className="shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 mb-1">{lesson.subtitle}</p>
                    <div className="bg-[#F0FFF4] border border-emerald-100 rounded-2xl p-3.5">
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        {lesson.summary}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-amber-900 leading-relaxed">
                    {lesson.takeaway}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 font-bold">
                  <BookOpen className="w-4 h-4" />
                  共 {total} 題測驗 · 滿星 3 顆
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setPhase('quiz');
                  }}
                  className="w-full mt-5 py-3.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all shadow-md"
                >
                  開始測驗
                </button>
              </div>
            )}

            {/* QUIZ */}
            {phase === 'quiz' && current && (
              <div>
                <p className="text-sm font-black text-slate-800 leading-relaxed mb-4">
                  {current.q}
                </p>
                <div className="space-y-2.5">
                  {current.choices.map((choice, idx) => {
                    const isCorrect = idx === current.answer;
                    const isSelected = selected === idx;
                    let cls =
                      'border-slate-200 bg-white hover:bg-slate-50 border-b-slate-300 text-slate-700';
                    let chipCls = 'bg-slate-100 border-slate-200 text-slate-500';
                    if (submitted) {
                      if (isCorrect) {
                        cls = 'border-emerald-400 bg-emerald-50 border-b-emerald-500 text-emerald-900';
                        chipCls = 'bg-emerald-400 border-emerald-500 text-white';
                      } else if (isSelected) {
                        cls = 'border-rose-400 bg-rose-50 border-b-rose-500 text-rose-900';
                        chipCls = 'bg-rose-400 border-rose-500 text-white';
                      } else {
                        cls = 'border-slate-100 bg-slate-50 border-b-slate-100 text-slate-400';
                        chipCls = 'bg-slate-100 border-slate-200 text-slate-300';
                      }
                    } else if (isSelected) {
                      cls =
                        'border-sky-400 bg-sky-50 border-b-sky-500 text-sky-900 shadow-md';
                      chipCls = 'bg-sky-500 border-sky-600 text-white';
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(idx)}
                        disabled={submitted}
                        className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer disabled:cursor-default ${cls}`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${chipCls}`}
                          >
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1 leading-snug">{choice}</span>
                          {submitted && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          )}
                          {submitted && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-3.5 rounded-2xl border-2 ${
                        selected === current.answer
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-rose-200 bg-rose-50'
                      }`}
                    >
                      <p
                        className={`text-xs font-black mb-1 ${
                          selected === current.answer ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {selected === current.answer ? '答對了！' : '再想一下～'}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">{current.explain}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={submitted ? handleNextQuestion : handleSubmit}
                  disabled={selected === null}
                  className={`w-full mt-5 py-3.5 font-black text-base rounded-2xl transition-all ${
                    selected === null
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : submitted
                      ? 'bg-sky-500 hover:bg-sky-600 text-white border-b-4 border-sky-700 active:border-b-0 active:translate-y-1'
                      : 'bg-[#58CC02] hover:bg-[#4cb502] text-white border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 shadow-md'
                  }`}
                >
                  {submitted
                    ? qIndex + 1 < total
                      ? '下一題'
                      : '看結果'
                    : '確認答案'}
                </button>
              </div>
            )}

            {/* RESULT */}
            {phase === 'result' && (
              <div className="text-center">
                <Mascot emotion="celebrating" size="lg" className="mx-auto mb-3" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {lesson.isBoss ? 'BOSS 通關！' : '課程完成！'}
                </h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  {[0, 1, 2].map((i) => (
                    <Star
                      key={i}
                      className={`w-10 h-10 star-pop ${
                        i < stars
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'text-slate-200 fill-slate-200'
                      }`}
                      style={{ animationDelay: `${0.15 + i * 0.18}s` }}
                    />
                  ))}
                </div>
                <p className="text-slate-500 text-sm mb-4">
                  答對 {correctCount} / {total} 題
                  {wrongCount > 0 && ` · 錯 ${wrongCount} 題`}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 border-b-4 border-emerald-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-emerald-600 font-black">經驗值</p>
                      <p className="text-lg font-black text-emerald-700">
                        +{lesson.isBoss ? 80 : 25} XP
                      </p>
                    </div>
                  </div>
                  <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-3 flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-500 border-b-4 border-sky-700 flex items-center justify-center shrink-0">
                      <Gem className="w-5 h-5 text-white fill-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-sky-600 font-black">寶石</p>
                      <p className="text-lg font-black text-sky-700">
                        +{lesson.isBoss ? 40 : 12}
                      </p>
                    </div>
                  </div>
                </div>

                {lesson.isBoss && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-black text-amber-800">
                      章節 BOSS 已擊敗，下一章解鎖！
                    </p>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                )}

                <button
                  onClick={handleClose}
                  className="w-full py-3.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all shadow-md cursor-pointer"
                >
                  繼續闖關
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
