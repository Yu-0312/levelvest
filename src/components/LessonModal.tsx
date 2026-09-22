import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  BookmarkPlus,
  Sparkles,
  Shield,
  Layers,
  HelpCircle,
  Award,
} from 'lucide-react';
import { LessonNode, TradeDecision } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

interface LessonModalProps {
  node: LessonNode;
  hearts: number;
  isOpen: boolean;
  onClose: () => void;
  onDeductHeart: () => void;
  onCompleteLesson: (xpGained: number, gemsGained: number) => void;
  onLogDecisionToJournal: (decision: TradeDecision) => void;
  onNavigateToJournal: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  node,
  hearts,
  isOpen,
  onClose,
  onDeductHeart,
  onCompleteLesson,
  onLogDecisionToJournal,
  onNavigateToJournal,
}) => {
  // Step in lesson: 1 = Concept & Interactive Chart, 2 = Interactive Challenge, 3 = Passport Log & Rewards
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Card 1 interactive state: toggle chart scenarios
  const [conceptScenario, setConceptScenario] = useState<'bull' | 'bear'>('bull');

  // Card 2 challenge state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Card 3 passport custom note
  const [journalNote, setJournalNote] = useState<string>('依照 20MA 突破策略順勢試單，跌破月線立即嚴守停損防線。');
  const [hasLoggedToJournal, setHasLoggedToJournal] = useState<boolean>(false);

  if (!isOpen) return null;

  // Options for Challenge 2
  const options = [
    {
      id: 'A',
      label: '恐高不買，等跌停再撿',
      desc: '市場強勢上攻時盲目盼望跌停，往往只會錯過趨勢，或在崩盤時接到掉下來的刀子。',
      isCorrect: false,
    },
    {
      id: 'B',
      label: '順勢少量試單，跌破月線即嚴格停損',
      desc: '正確！站上 20MA 順勢試單，並以月線作為清晰客觀的停損防守線，兼顧勝率與風控！',
      isCorrect: true,
    },
    {
      id: 'C',
      label: '借錢全押融資梭哈',
      desc: '極度危險！過度槓桿與一次性重押是新手在股市提早破產的最常見致命傷。',
      isCorrect: false,
    },
  ];

  const handleSubmitAnswer = () => {
    if (!selectedOption || hasSubmitted) return;

    setHasSubmitted(true);
    const chosen = options.find((o) => o.id === selectedOption);
    const correct = !!chosen?.isCorrect;
    setIsCorrect(correct);

    if (correct) {
      sound.playSuccess();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#58CC02', '#FFC800', '#2563EB', '#F43F5E'],
        });
      } catch {
        // Safe confetti fallback
      }
    } else {
      sound.playError();
      onDeductHeart();
    }
  };

  const handleNextStep = () => {
    sound.playClick();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Award XP & Gems when moving to passport
      onCompleteLesson(10, 15);
      sound.playCoin();
      setStep(3);
    }
  };

  const handleSaveDecision = () => {
    sound.playSuccess();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#F59E0B'],
      });
    } catch {
      // Safe fallback
    }

    const newDecision: TradeDecision = {
      id: `trade-${Date.now()}`,
      ticker: '2330',
      tickerName: '台積電',
      date: new Date().toISOString().split('T')[0],
      action: '買進試單',
      rationale: journalNote || '帶量長紅突破 20MA，外資買超，依策略少量進場並設月線為停損點。',
      disciplineFollowed: true,
      strategyTag: '20MA月線突破',
      outcome: '待觀察',
      emotions: '冷靜理性',
      gainOrDisciplineScore: '+100 紀律分',
    };

    onLogDecisionToJournal(newDecision);
    setHasLoggedToJournal(true);
  };

  return (
    <div
      id="lesson-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border-4 border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Lesson Top Bar */}
        <div className="px-4 py-3 border-b-2 border-slate-100 flex items-center justify-between gap-3 bg-slate-50/80">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 max-w-xs bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="bg-[#58CC02] h-full rounded-full transition-all duration-500"
              style={{
                width: step === 1 ? '33%' : step === 2 ? '66%' : '100%',
              }}
            />
          </div>

          {/* Hearts counter */}
          <div className="flex items-center gap-1 font-black text-rose-500 text-sm">
            <Heart className="w-4 h-4 fill-rose-500" />
            <span>{hearts}</span>
          </div>
        </div>

        {/* Modal Body with Step Transitions */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {/* ---------------- CARD 1: BITE-SIZED CONCEPT ---------------- */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Header tag */}
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black tracking-wide">
                    核心概念 · 第 1 / 3 步
                  </span>
                  <span className="text-xs text-slate-400 font-bold">20MA 生命線入門</span>
                </div>

                <div className="flex items-start gap-3">
                  <Mascot emotion="happy" size="sm" className="shrink-0" />
                  <div className="bg-[#D7FFB8]/40 border border-[#58CC02]/40 rounded-2xl p-3.5 text-slate-800 text-sm leading-relaxed font-bold">
                    「<span className="text-emerald-700 font-black">20MA（月線）</span>代表過去 20 天全市場投資人的平均買進成本。股價站上月線代表短線多頭強勢；跌破月線往往是下車保護本金的訊號！」
                  </div>
                </div>

                {/* Interactive Chart Toggle Visual */}
                <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-4 h-4 text-emerald-600" /> 均線互動圖解模擬
                    </span>

                    {/* Toggle Scenario buttons */}
                    <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setConceptScenario('bull');
                        }}
                        className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                          conceptScenario === 'bull'
                            ? 'bg-[#58CC02] text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        多頭站上 20MA
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          setConceptScenario('bear');
                        }}
                        className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                          conceptScenario === 'bear'
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        空頭跌破 20MA
                      </button>
                    </div>
                  </div>

                  {/* SVG Chart Display */}
                  <div className="w-full bg-white rounded-xl border border-slate-200 p-3 shadow-inner">
                    <svg viewBox="0 0 400 180" className="w-full h-44">
                      {/* Grid lines */}
                      <line x1="20" y1="40" x2="380" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="20" y1="90" x2="380" y2="90" stroke="#f1f5f9" strokeDasharray="3 3" />
                      <line x1="20" y1="140" x2="380" y2="140" stroke="#f1f5f9" strokeDasharray="3 3" />

                      {conceptScenario === 'bull' ? (
                        <>
                          {/* 20MA curved line (Orange) - Gentle uptrend */}
                          <path
                            d="M 30 135 C 100 130 180 120 250 100 C 310 85 340 75 370 70"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Candlesticks before breakout */}
                          {/* Candle 1 (red / up) */}
                          <line x1="60" y1="125" x2="60" y2="145" stroke="#EF4444" strokeWidth="1.5" />
                          <rect x="54" y="128" width="12" height="12" fill="#EF4444" rx="1.5" />

                          {/* Candle 2 (green / down in TW, but using high-contrast red/green) */}
                          <line x1="110" y1="115" x2="110" y2="140" stroke="#10B981" strokeWidth="1.5" />
                          <rect x="104" y="120" width="12" height="15" fill="#10B981" rx="1.5" />

                          {/* Candle 3 (hovering at MA) */}
                          <line x1="160" y1="105" x2="160" y2="135" stroke="#EF4444" strokeWidth="1.5" />
                          <rect x="154" y="112" width="12" height="14" fill="#EF4444" rx="1.5" />

                          {/* Breakthrough Candle 4: Large Red Candle突破 (Taiwan style: Red = Up!) */}
                          <line x1="230" y1="75" x2="230" y2="125" stroke="#EF4444" strokeWidth="2" />
                          <rect x="222" y="82" width="16" height="35" fill="#EF4444" rx="2" />

                          {/* Candle 5: Sustained above MA */}
                          <line x1="290" y1="55" x2="290" y2="95" stroke="#EF4444" strokeWidth="2" />
                          <rect x="282" y="60" width="16" height="25" fill="#EF4444" rx="2" />

                          {/* Candle 6: Continues bull run */}
                          <line x1="350" y1="40" x2="350" y2="78" stroke="#EF4444" strokeWidth="2" />
                          <rect x="342" y="45" width="16" height="25" fill="#EF4444" rx="2" />

                          {/* Annotations */}
                          <g>
                            <rect x="200" y="24" width="110" height="24" rx="12" fill="#FEF2F2" stroke="#EF4444" strokeWidth="1.5" />
                            <text x="255" y="40" fill="#B91C1C" fontSize="11" fontWeight="bold" textAnchor="middle">
                              🚀 帶量突破月線！
                            </text>
                            <line x1="230" y1="50" x2="230" y2="76" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
                          </g>

                          <text x="315" y="105" fill="#D97706" fontSize="11" fontWeight="bold">
                            20MA 成本生命線
                          </text>
                        </>
                      ) : (
                        <>
                          {/* 20MA curved line (Orange) - Flat or starting downward curvature */}
                          <path
                            d="M 30 65 C 100 70 180 80 250 100 C 310 115 340 125 370 135"
                            fill="none"
                            stroke="#F59E0B"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Candlesticks before breakdown */}
                          <line x1="60" y1="45" x2="60" y2="75" stroke="#EF4444" strokeWidth="1.5" />
                          <rect x="54" y="50" width="12" height="15" fill="#EF4444" rx="1.5" />

                          <line x1="120" y1="55" x2="120" y2="85" stroke="#10B981" strokeWidth="1.5" />
                          <rect x="114" y="60" width="12" height="18" fill="#10B981" rx="1.5" />

                          {/* Breakdown Candle (Green in Taiwan = Falling down) */}
                          <line x1="220" y1="80" x2="220" y2="135" stroke="#10B981" strokeWidth="2" />
                          <rect x="212" y="90" width="16" height="38" fill="#10B981" rx="2" />

                          {/* Follow-up drop */}
                          <line x1="290" y1="115" x2="290" y2="155" stroke="#10B981" strokeWidth="2" />
                          <rect x="282" y="122" width="16" height="26" fill="#10B981" rx="2" />

                          {/* Annotations */}
                          <g>
                            <rect x="180" y="24" width="130" height="24" rx="12" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" />
                            <text x="245" y="40" fill="#047857" fontSize="11" fontWeight="bold" textAnchor="middle">
                              ⚠️ 跌破月線，停損警戒！
                            </text>
                            <line x1="220" y1="50" x2="220" y2="88" stroke="#10B981" strokeWidth="1.5" strokeDasharray="2 2" />
                          </g>

                          <text x="310" y="80" fill="#D97706" fontSize="11" fontWeight="bold">
                            20MA 成本生命線
                          </text>
                        </>
                      )}
                    </svg>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        20MA (20日平均線)
                      </span>
                      <span>💡 台股慣例：紅 K 代表收漲，綠 K 代表收跌</span>
                    </div>
                  </div>
                </div>

                {/* Key Takeaway Pill */}
                <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-900 font-bold">
                    口訣：<span className="underline decoration-emerald-400">線上做多、破線離場</span>。不帶個人預設立場，讓均線成為你的紀律指南針！
                  </p>
                </div>

                {/* Continue button */}
                <button
                  onClick={handleNextStep}
                  className="w-full py-3.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>聽懂了，進入實戰挑戰！</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

            {/* ---------------- CARD 2: INTERACTIVE CHART CHALLENGE ---------------- */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Header tag */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black">
                    實戰模擬考題 · 第 2 / 3 步
                  </span>
                  <span className="text-xs font-bold text-[#58CC02] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> 答對獎勵: +10 XP, +15 Gems
                  </span>
                </div>

                {/* Scenario Header with Stock Badge */}
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-3.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-white font-black text-xs px-2.5 py-1 rounded-lg">
                        2330
                      </span>
                      <h4 className="font-black text-slate-800 text-base">台積電 TSMC</h4>
                      <span className="bg-red-50 text-red-600 text-xs font-black px-2 py-0.5 rounded-md border border-red-200">
                        +3.8%
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">今日盤中突破</span>
                  </div>

                  <p className="text-slate-800 text-sm font-bold leading-relaxed mb-3">
                    台積電（2330）今天帶量長紅<span className="text-red-600 font-black">突破 20MA</span>，外資連續買超 3 天。此時你的最佳紀律決策是？
                  </p>

                  {/* Simulated Mini Chart */}
                  <div className="bg-slate-950 text-white p-3 rounded-xl relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] mb-2 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 font-mono">20MA: 955.0</span>
                        <span className="text-red-400 font-mono font-bold">現價: 978.0</span>
                      </div>
                      <span className="bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        外資連 3 買 +18,400 張 🔥
                      </span>
                    </div>

                    <svg viewBox="0 0 360 85" className="w-full h-20">
                      {/* Grid */}
                      <line x1="10" y1="20" x2="350" y2="20" stroke="#1e293b" />
                      <line x1="10" y1="50" x2="350" y2="50" stroke="#1e293b" />

                      {/* 20MA line */}
                      <path
                        d="M 15 55 Q 120 54 220 48 T 340 38"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                      />

                      {/* Candlesticks */}
                      <rect x="50" y="44" width="8" height="14" fill="#10B981" rx="1" />
                      <rect x="90" y="48" width="8" height="12" fill="#EF4444" rx="1" />
                      <rect x="130" y="50" width="8" height="10" fill="#10B981" rx="1" />
                      <rect x="170" y="42" width="8" height="16" fill="#EF4444" rx="1" />
                      <rect x="210" y="45" width="8" height="12" fill="#10B981" rx="1" />
                      <rect x="250" y="38" width="10" height="20" fill="#EF4444" rx="1" />
                      {/* Big Breakout Candle */}
                      <rect x="290" y="16" width="14" height="38" fill="#EF4444" rx="2" />
                      <line x1="297" y1="10" x2="297" y2="58" stroke="#EF4444" strokeWidth="2" />

                      {/* Volume bars below */}
                      <rect x="50" y="70" width="8" height="10" fill="#475569" />
                      <rect x="90" y="68" width="8" height="12" fill="#475569" />
                      <rect x="130" y="72" width="8" height="8" fill="#475569" />
                      <rect x="170" y="65" width="8" height="15" fill="#475569" />
                      <rect x="210" y="70" width="8" height="10" fill="#475569" />
                      <rect x="250" y="60" width="10" height="20" fill="#475569" />
                      {/* Massive volume bar */}
                      <rect x="290" y="45" width="14" height="35" fill="#EF4444" />
                    </svg>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <div className="space-y-2.5">
                  {options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    let borderClass = 'border-slate-200 hover:border-slate-300 bg-white';

                    if (hasSubmitted) {
                      if (opt.isCorrect) {
                        borderClass = 'border-[#58CC02] bg-[#D7FFB8]/30 text-emerald-900';
                      } else if (isSelected && !opt.isCorrect) {
                        borderClass = 'border-rose-400 bg-rose-50 text-rose-900';
                      } else {
                        borderClass = 'border-slate-200 opacity-50 bg-slate-50';
                      }
                    } else if (isSelected) {
                      borderClass = 'border-blue-500 bg-blue-50/50 shadow-sm';
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={hasSubmitted}
                        onClick={() => {
                          sound.playClick();
                          setSelectedOption(opt.id);
                        }}
                        className={`w-full p-3.5 rounded-2xl border-2 text-left transition-all flex items-start gap-3 cursor-pointer ${borderClass}`}
                      >
                        <div
                          className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {opt.id}
                        </div>
                        <div className="flex-1">
                          <p className="font-extrabold text-sm text-slate-800 leading-snug">
                            {opt.label}
                          </p>
                          {hasSubmitted && (
                            <p className="text-xs mt-1.5 font-bold leading-relaxed text-slate-600">
                              {opt.desc}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Bottom Validation Bar (slides up) */}
                {!hasSubmitted ? (
                  <button
                    disabled={!selectedOption}
                    onClick={handleSubmitAnswer}
                    className={`w-full py-3.5 font-black text-base rounded-2xl border-b-4 transition-all ${
                      selectedOption
                        ? 'bg-[#58CC02] hover:bg-[#4bb302] text-white border-[#3e9302] active:border-b-0 active:translate-y-1 cursor-pointer shadow-md'
                        : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
                    }`}
                  >
                    檢查答案
                  </button>
                ) : (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`p-4 rounded-2xl border-2 flex flex-col gap-3 ${
                      isCorrect
                        ? 'bg-[#D7FFB8]/50 border-[#58CC02] text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-[#58CC02] shrink-0" />
                          <div>
                            <h4 className="font-black text-base text-emerald-800">
                              太精彩了！完全正確 🎉
                            </h4>
                            <p className="text-xs font-bold text-emerald-700">
                              順勢交易的核心就是「遵守進場依據與出場停損點」！
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-8 h-8 text-rose-500 shrink-0" />
                          <div>
                            <h4 className="font-black text-base text-rose-800">
                              哎呀！扣除 1 顆心 ❤️
                            </h4>
                            <p className="text-xs font-bold text-rose-700">
                              標準答案為 B：順勢少量試單，但必須以月線跌破作為嚴格停損！
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 bg-[#58CC02] hover:bg-[#4bb302] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                    >
                      <span>前往決策護照紀錄</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ---------------- CARD 3: DECISION JOURNAL / TICKER PASSPORT ---------------- */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center"
              >
                <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                  <Award className="w-10 h-10 text-[#58CC02]" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                  挑戰完成！解鎖決策護照簽證 🛂
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  專業交易者重視「決策過程與紀律」遠高於單次運氣。將剛才的實戰判斷存入你的日記吧！
                </p>

                {/* Passport Card Preview */}
                <div className="bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-3xl p-4 sm:p-5 text-left relative overflow-hidden shadow-sm">
                  {/* Passport Stamp Seal */}
                  <div className="absolute right-3 top-3 border-2 border-emerald-600 rounded-full px-2.5 py-1 rotate-12 bg-white/80 shadow-xs pointer-events-none">
                    <span className="text-[10px] font-black text-emerald-700 tracking-wider">
                      PASSED · 紀律合格
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-slate-900 text-white font-mono text-xs px-2.5 py-1 rounded-lg font-black">
                      2330 台積電
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2 py-0.5 rounded-full">
                      買進試單
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-700 mb-3">
                    <p>
                      <strong className="text-slate-900">決策邏輯：</strong> 帶量突破 20MA，外資連續 3 天買超。
                    </p>
                    <p>
                      <strong className="text-slate-900">停損守則：</strong> 股價若收盤跌破月線（約 955 元）無條件離場。
                    </p>
                  </div>

                  {/* Personal reflection input */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-500 mb-1">
                      我的交易心得備忘：
                    </label>
                    <input
                      type="text"
                      value={journalNote}
                      onChange={(e) => setJournalNote(e.target.value)}
                      placeholder="寫下你的停損策略或心得..."
                      className="w-full px-3 py-2 bg-white rounded-xl border border-amber-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Action buttons */}
                <div className="space-y-2 pt-2">
                  {!hasLoggedToJournal ? (
                    <button
                      onClick={handleSaveDecision}
                      className="w-full py-3.5 bg-[#58CC02] hover:bg-[#4bb302] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                    >
                      <BookmarkPlus className="w-5 h-5" />
                      <span>將此決策記錄存入【投資決策日記】</span>
                    </button>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-200 text-xs font-black flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>已成功記錄至投資決策日記！</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => {
                        sound.playClick();
                        onClose();
                        onNavigateToJournal();
                      }}
                      className="py-3 px-3 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm rounded-xl border-2 border-slate-200 active:translate-y-0.5 cursor-pointer"
                    >
                      📖 查看決策日記
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onClose();
                      }}
                      className="py-3 px-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm rounded-xl active:translate-y-0.5 cursor-pointer shadow-md"
                    >
                      🗺️ 回到技能樹
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
