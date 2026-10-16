import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  XCircle,
  Heart,
  HeartPulse,
  BookOpen,
  Sparkles,
  Gem,
} from 'lucide-react';
import { ReviewQuestion } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

interface HeartReviewQuizProps {
  isOpen: boolean;
  hearts: number;
  maxHearts: number;
  pool: ReviewQuestion[];
  onClose: () => void;
  /** 答對 1 題 → 恢復 1 顆心（App 端封頂 maxHearts） */
  onEarnHeart: () => void;
  /** 複習中答對 → 該題錯題數 -1（弱點消除） */
  onCorrect: (key: string) => void;
  /** 複習中答錯 → 加強該題的錯題權重 */
  onWrong: (key: string) => void;
  /** 一輪複習結束：回報答對題數，用來發放小額 XP */
  onComplete: (correct: number, total: number) => void;
  /** 「改用寶石／箴言補血」：打開補血彈窗 */
  onOpenRefill: () => void;
}

type Phase = 'intro' | 'quiz' | 'result';

const ROUND_SIZE = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 選題：錯題優先（依錯誤次數排序），不足再從已解鎖題庫補滿，最後打亂出題順序 */
function pickRound(pool: ReviewQuestion[]): ReviewQuestion[] {
  const missed = pool.filter((q) => q.missCount > 0).sort((a, b) => b.missCount - a.missCount);
  const rest = pool.filter((q) => q.missCount === 0);
  const picked = shuffle(missed).slice(0, ROUND_SIZE);
  if (picked.length < ROUND_SIZE) {
    picked.push(...shuffle(rest).slice(0, ROUND_SIZE - picked.length));
  }
  return shuffle(picked);
}

export const HeartReviewQuiz: React.FC<HeartReviewQuizProps> = ({
  isOpen,
  hearts,
  maxHearts,
  pool,
  onClose,
  onEarnHeart,
  onCorrect,
  onWrong,
  onComplete,
  onOpenRefill,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  /** 本題是否成功 +1 心（避免畫面重複顯示） */
  const [earnedThisQuestion, setEarnedThisQuestion] = useState(false);

  // 每次打開都重新開一輪新題目
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setPhase('intro');
      setRoundIndex((i) => i + 1);
      setQIndex(0);
      setSelected(null);
      setSubmitted(false);
      setCorrectCount(0);
      setWrongCount(0);
      setEarnedThisQuestion(false);
    }
  }

  const round = useMemo(() => pickRound(pool), [pool, roundIndex]);

  if (!isOpen) return null;

  const current = round[qIndex];
  const total = round.length;
  const canLeave = hearts > 0;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    sound.playClick();
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || submitted || !current) return;
    setSubmitted(true);
    if (selected === current.question.answer) {
      sound.playSuccess();
      setCorrectCount((c) => c + 1);
      onCorrect(current.key);
      if (hearts < maxHearts) {
        onEarnHeart();
        setEarnedThisQuestion(true);
      }
    } else {
      sound.playError();
      setWrongCount((w) => w + 1);
      onWrong(current.key);
    }
  };

  const handleNextQuestion = () => {
    sound.playClick();
    if (qIndex + 1 < total) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
      setEarnedThisQuestion(false);
    } else {
      onComplete(correctCount, total);
      setPhase('result');
    }
  };

  const handleRetry = () => {
    sound.playClick();
    setRoundIndex((i) => i + 1);
    setPhase('quiz');
    setQIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrectCount(0);
    setWrongCount(0);
    setEarnedThisQuestion(false);
  };

  // 已解鎖章節都沒有題目可抽時的保險（理論上不會發生）
  if (total === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center">
          <p className="text-sm font-bold text-slate-600 mb-4">目前沒有可複習的題目</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#58CC02] text-white font-black rounded-2xl"
          >
            好的
          </button>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="錯題複習回血"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-rose-100"
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 px-5 pt-4 pb-3 border-b-2 border-rose-100 bg-white"
            style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-white" />
                    複習回血
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    答對 1 題恢復 1 顆心
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-800 truncate">
                  {phase === 'result' ? '複習完成' : '錯題複習'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  <Heart className="w-4 h-4 fill-rose-500" />
                  {hearts}/{maxHearts}
                </span>
                {canLeave && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClose();
                    }}
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {phase === 'quiz' && (
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-rose-400 to-rose-300"
                    style={{ width: `${((qIndex + (submitted ? 1 : 0)) / total) * 100}%` }}
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
                  <Mascot emotion="thinking" size="md" className="shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-rose-400 mb-1">愛心用完了！</p>
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5">
                      <p className="text-sm text-slate-800 leading-relaxed font-medium">
                        先別急著繼續闖關——複習{' '}
                        {Math.min(ROUND_SIZE, total)} 題舊觀念，
                        <span className="text-rose-600 font-black">答對 1 題就恢復 1 顆 ❤️</span>
                        ！錯過的題目會優先出現。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-amber-900 leading-relaxed">
                    複習答錯不扣心（已經沒有心可扣了），放心作答！
                  </p>
                </div>

                <button
                  onClick={() => {
                    sound.playClick();
                    setPhase('quiz');
                  }}
                  className="w-full mt-5 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-base rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <HeartPulse className="w-5 h-5" />
                  開始複習 · 恢復心心
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenRefill();
                  }}
                  className="w-full mt-2.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <Gem className="w-3.5 h-3.5" />
                  改用寶石／蒙格心法補血
                </button>
              </div>
            )}

            {/* QUIZ */}
            {phase === 'quiz' && current && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full text-white shrink-0"
                    style={{ background: current.sectionColor }}
                  >
                    {current.sectionCode}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 truncate">
                    複習：{current.sectionTitle} · {current.lessonTitle}
                  </span>
                  {current.missCount > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 shrink-0">
                      曾錯 {current.missCount} 次
                    </span>
                  )}
                </div>

                <p className="text-sm font-black text-slate-800 leading-relaxed mb-4">
                  {current.question.q}
                </p>
                <div className="space-y-2.5">
                  {current.question.choices.map((choice, idx) => {
                    const isCorrect = idx === current.question.answer;
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
                      cls = 'border-sky-400 bg-sky-50 border-b-sky-500 text-sky-900 shadow-md';
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

                {/* Explanation + 回血提示 */}
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`mt-4 p-3.5 rounded-2xl border-2 ${
                        selected === current.question.answer
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-rose-200 bg-rose-50'
                      }`}
                    >
                      <p
                        className={`text-xs font-black mb-1 ${
                          selected === current.question.answer ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {selected === current.question.answer
                          ? earnedThisQuestion
                            ? '答對了！❤️ +1 心已恢復'
                            : '答對了！（心心已滿）'
                          : '答錯了～再想一下'}
                      </p>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {current.question.explain}
                      </p>
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
                      : 'bg-rose-500 hover:bg-rose-600 text-white border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 shadow-md'
                  }`}
                >
                  {submitted ? (qIndex + 1 < total ? '下一題' : '看結果') : '確認答案'}
                </button>
              </div>
            )}

            {/* RESULT */}
            {phase === 'result' && (
              <div className="text-center">
                <Mascot
                  emotion={hearts > 0 ? 'celebrating' : 'oops'}
                  size="lg"
                  className="mx-auto mb-3"
                />
                <h3 className="text-2xl font-black text-slate-800 mb-2">
                  {hearts > 0 ? '回血成功！' : '再接再厲！'}
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  答對 {correctCount} / {total} 題
                  {wrongCount > 0 && ` · 錯 ${wrongCount} 題`}
                </p>

                <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-3 mb-5 flex items-center justify-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <p className="text-sm font-black text-rose-700">
                    目前心心 {hearts} / {maxHearts}
                  </p>
                </div>

                {hearts > 0 ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onClose();
                    }}
                    className="w-full py-3.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all shadow-md cursor-pointer"
                  >
                    回去繼續闖關
                  </button>
                ) : (
                  <div>
                    <p className="text-xs text-slate-500 font-bold mb-3">
                      一顆心都沒回復，再練一次就有信心了！
                    </p>
                    <button
                      onClick={handleRetry}
                      className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-base rounded-2xl border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-5 h-5" />
                      再複習一次
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
