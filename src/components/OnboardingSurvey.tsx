import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Wallet,
  Brain,
  Target,
  Flame,
} from 'lucide-react';
import { Mascot } from './Mascot';
import { OnboardingProfile } from '../types';
import { capitalBandOptions, knowledgeOptions } from '../data/curriculum';
import { sound } from '../utils/audio';

interface OnboardingSurveyProps {
  onComplete: (profile: OnboardingProfile) => void;
}

type Step = 0 | 1 | 2 | 3 | 4 | 5;

const riskOptions = [
  { id: 'conservative' as const, label: '保守穩健', desc: '波動會讓我睡不著，先求保本', emoji: '🛡️' },
  { id: 'balanced' as const, label: '平衡成長', desc: '能接受一定波動換取長期報酬', emoji: '⚖️' },
  { id: 'aggressive' as const, label: '積極衝刺', desc: '可以承受大幅回檔追求成長', emoji: '🚀' },
];

const goalOptions = [
  { id: 'retire' as const, label: '退休準備', desc: '為 20–30 年後的財務自由打底', emoji: '🌴' },
  { id: 'side-income' as const, label: '額外現金流', desc: '希望創造配息或被動收入', emoji: '💰' },
  { id: 'grow' as const, label: '資產成長', desc: '讓存款跑贏通膨、穩健變大', emoji: '📈' },
  { id: 'protect' as const, label: '守住本金', desc: '先學會不賠，再談賺錢', emoji: '🛡️' },
];

export const OnboardingSurvey: React.FC<OnboardingSurveyProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [knowledge, setKnowledge] = useState<OnboardingProfile['knowledge'] | null>(null);
  const [capitalBands, setCapitalBands] = useState<string[]>([]);
  const [risk, setRisk] = useState<OnboardingProfile['risk'] | null>(null);
  const [goal, setGoal] = useState<OnboardingProfile['goal'] | null>(null);

  const canNext = useMemo(() => {
    if (step === 0) return name.trim().length > 0;
    if (step === 1) return knowledge !== null;
    if (step === 2) return capitalBands.length > 0;
    if (step === 3) return risk !== null;
    if (step === 4) return goal !== null;
    return true;
  }, [step, name, knowledge, capitalBands, risk, goal]);

  const toggleBand = (id: string) => {
    sound.playClick();
    setCapitalBands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (!canNext) return;
    sound.playClick();
    if (step < 5) setStep((s) => (s + 1) as Step);
    else {
      sound.playSuccess();
      onComplete({
        name: name.trim() || '投資見習生',
        knowledge: knowledge!,
        capitalBands,
        risk: risk!,
        goal: goal!,
        completedAt: new Date().toISOString(),
      });
    }
  };

  const handleBack = () => {
    sound.playClick();
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  const progress = ((step + 1) / 6) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F9FF] via-white to-[#F8FAFC] flex flex-col">
      {/* Top progress */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b-2 border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-500 tracking-wide">
              LEVELVEST 起跑前測驗
            </span>
            <span className="text-xs font-black text-[#58CC02]">
              {step + 1} / 6
            </span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#58CC02] rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {step === 0 && (
              <div className="text-center">
                <Mascot emotion="happy" size="lg" className="mx-auto mb-3" />
                <div className="bg-white border-2 border-emerald-100 rounded-2xl p-4 text-sm text-slate-700 mb-6 text-left shadow-sm">
                  <p className="font-black text-emerald-800 mb-1">「我是牛牛，你的投資陪練員！」</p>
                  <p className="leading-relaxed">
                    先花一分鐘做個小測驗，我會幫你評估認知程度與可投入資金區間，
                    推薦最適合你的起跑路線。
                  </p>
                </div>
                <label className="block text-left text-sm font-black text-slate-700 mb-2">
                  你希望我怎麼稱呼你？
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：小恩、Alex…"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-[#58CC02] focus:outline-none text-base font-bold text-slate-800 bg-white shadow-sm"
                />
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Mascot emotion="thinking" size="sm" className="shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-[#58CC02]" />
                      你的投資認知程度？
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">如實回答就好，沒有標準答案。</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {knowledgeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClick();
                        setKnowledge(opt.id);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        knowledge === opt.id
                          ? 'border-[#58CC02] bg-[#F0FFF4] shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                        {knowledge === opt.id && (
                          <div className="w-7 h-7 rounded-full bg-[#58CC02] flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Mascot emotion="happy" size="sm" className="shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-sky-500" />
                      預計投入的資金區間？
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">可複選。用「可投資金」計算，不含緊急預備金。</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {capitalBandOptions.map((opt) => {
                    const selected = capitalBands.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => toggleBand(opt.id)}
                        className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all ${
                          selected
                            ? 'border-sky-400 bg-sky-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-black text-slate-800 text-sm">{opt.label}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{opt.hint}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                              selected
                                ? 'bg-sky-500 border-sky-500'
                                : 'border-slate-300'
                            }`}
                          >
                            {selected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Mascot emotion="oops" size="sm" className="shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      你的風險承受度？
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">想像帳戶一天 -5% 時你的感覺。</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {riskOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClick();
                        setRisk(opt.id);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                        risk === opt.id
                          ? 'border-orange-400 bg-orange-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                          <p className="font-black text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                        {risk === opt.id && (
                          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <Mascot emotion="celebrating" size="sm" className="shrink-0 mt-1" />
                  <div>
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                      <Target className="w-5 h-5 text-violet-500" />
                      你最主要的目標？
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">目標不同，配置與學習重心也不同。</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {goalOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        sound.playClick();
                        setGoal(opt.id);
                      }}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        goal === opt.id
                          ? 'border-violet-400 bg-violet-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{opt.emoji}</span>
                        <div className="flex-1">
                          <p className="font-black text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                        {goal === opt.id && (
                          <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center">
                <Mascot emotion="celebrating" size="lg" className="mx-auto mb-3" />
                <h2 className="text-2xl font-black text-slate-800 mb-1">測驗完成！</h2>
                <p className="text-slate-500 mb-5">牛牛幫你準備好起跑裝備了</p>

                <div className="bg-white border-2 border-emerald-200 rounded-3xl p-5 text-left shadow-sm space-y-3">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-slate-500 font-bold">稱呼</span>
                    <span className="font-black text-slate-800">{name || '投資見習生'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-bold">認知等級</span>
                    <span className="font-black text-emerald-700">
                      {knowledgeOptions.find((k) => k.id === knowledge)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-bold">資金區間</span>
                    <span className="font-black text-sky-700 text-right text-sm">
                      {capitalBands
                        .map((b) => capitalBandOptions.find((c) => c.id === b)?.label)
                        .join('、')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-bold">風險偏好</span>
                    <span className="font-black text-orange-600">
                      {riskOptions.find((r) => r.id === risk)?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100">
                    <span className="text-sm text-slate-500 font-bold">主要目標</span>
                    <span className="font-black text-violet-700">
                      {goalOptions.find((g) => g.id === goal)?.label}
                    </span>
                  </div>
                  <div className="mt-2 p-3 bg-[#F0FFF4] rounded-2xl border border-emerald-100">
                    <p className="text-xs font-black text-emerald-800 mb-1">牛牛的建議</p>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {knowledgeOptions.find((k) => k.id === knowledge)?.startHint}
                      {capitalBands.includes('c0') || capitalBands.includes('c1')
                        ? '。小資金就從零股與定期定額開始，重點是建立紀律。'
                        : '。資金已可做配置，請認真完成 S5 風險管理堡壘。'}
                      {risk === 'aggressive'
                        ? ' 衝刺型選手更需要嚴格停損，別讓勇氣變賭注。'
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-5 bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed">
                  免責聲明：LevelVest 為投資教育產品，所有標的與走勢皆為虛構範例，不構成投資建議。
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t-2 border-slate-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 font-black flex items-center gap-1 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> 上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext}
            className={`flex-1 py-3.5 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
              canNext
                ? 'bg-[#58CC02] text-white border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 shadow-md hover:bg-[#4cb502]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {step === 5 ? (
              <>
                <Sparkles className="w-5 h-5" /> 開始學習之旅
              </>
            ) : (
              <>
                下一題 <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
