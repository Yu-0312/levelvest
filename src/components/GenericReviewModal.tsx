import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Sparkles, BookOpen, Star } from 'lucide-react';
import { LessonNode } from '../types';
import { sound } from '../utils/audio';

interface GenericReviewModalProps {
  node: LessonNode | null;
  isOpen: boolean;
  onClose: () => void;
  onReward: (xp: number, gems: number) => void;
}

export const GenericReviewModal: React.FC<GenericReviewModalProps> = ({
  node,
  isOpen,
  onClose,
  onReward,
}) => {
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !node) return null;

  // Customized content per node
  const lessonDetails: Record<
    string,
    {
      summary: string;
      takeaway: string;
      question: string;
      choices: string[];
      correctIndex: number;
      explanation: string;
    }
  > = {
    'node-1': {
      summary: '台股傳統以「張」為交易單位，1 張股票 = 1,000 股。若一張台積電要 100 萬，小資族可以透過盤中「零股交易」，以 1 股起跳自由申購，大幅降低門檻！',
      takeaway: '💡 小資心法：定期定額買零股，分散時間與進場成本。',
      question: '若台積電（2330）目前市價為 980 元，買進 10 股零股需要多少交割款（不計手續費）？',
      choices: ['9,800 元', '98,000 元', '980,000 元'],
      correctIndex: 0,
      explanation: '980 元 × 10 股 = 9,800 元。善用零股就能輕鬆參與優質權值股成長。',
    },
    'node-2': {
      summary: '台股採行「T+2 日交割制」。若你在週一 (T 日) 買進股票，扣款帳戶必須在週三 (T+2 日) 上午 10:00 前備妥足額款項。違約交割不僅會被凍結帳戶，更會留下嚴重聯徵信用不良記錄！',
      takeaway: '💡 風控心法：下單前確認交割銀行餘額，絕不心存僥倖！',
      question: '若週四上午 09:30 在台股現股買進 5 萬元股票，款項最晚何時會被銀行扣除？',
      choices: ['當天週四下午 13:30', '下週一上午 10:00', '週五上午 10:00'],
      correctIndex: 1,
      explanation: '遇到週六、日週末非營業日順延：週四(T) -> 週五(T+1) -> 下週一(T+2) 上午 10:00 扣款。',
    },
    'node-3': {
      summary: '台股與美股顏色相反！台股習慣「紅漲綠跌」。紅 K 棒代表「收盤價 > 開盤價」（多頭推升），綠 K 棒代表「收盤價 < 開盤價」（空頭打壓）。上下影線則代表當日最高與最低的試探區間。',
      takeaway: '💡 技術心法：紅 K 伴隨量增，代表買方信心堅定。',
      question: '在台灣股市中，今天開盤價 100 元，盤中震盪後最終收盤在 105 元，會呈現什麼顏色的 K 棒？',
      choices: ['綠色實體 K 棒', '紅色實體 K 棒', '十字星無顏色'],
      correctIndex: 1,
      explanation: '收盤價 (105) 高於開盤價 (100)，代表買方力道勝出，在台股顯示為紅色 K 棒。',
    },
  };

  const currentContent = lessonDetails[node.id] || {
    summary: node.description,
    takeaway: '💡 持續學習投資紀律，複利效果驚人。',
    question: '請問這項投資原則的核心精神是？',
    choices: ['控制風險與停損', '聽信明牌全押', '不設任何止損'],
    correctIndex: 0,
    explanation: '良好的交易紀律永遠以保護本金與控制風險為先。',
  };

  const handleCheck = () => {
    if (selectedAns === null || submitted) return;
    setSubmitted(true);
    if (selectedAns === currentContent.correctIndex) {
      sound.playSuccess();
      onReward(5, 5);
    } else {
      sound.playError();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border-4 border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-black text-base text-slate-800">{node.title}</h3>
              <p className="text-[11px] font-bold text-slate-400">複習與小測驗</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-4 text-xs space-y-2 leading-relaxed text-slate-700">
          <p className="font-medium">{currentContent.summary}</p>
          <p className="font-black text-emerald-800 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
            {currentContent.takeaway}
          </p>
        </div>

        {/* Quick Quiz */}
        <div className="space-y-2.5 mb-4">
          <p className="font-black text-xs text-slate-800 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            快速牛刀小試：{currentContent.question}
          </p>

          <div className="space-y-1.5">
            {currentContent.choices.map((choice, idx) => {
              const isSelected = selectedAns === idx;
              let choiceStyle = 'bg-white border-slate-200 hover:border-slate-300';

              if (submitted) {
                if (idx === currentContent.correctIndex) {
                  choiceStyle = 'bg-[#D7FFB8]/40 border-[#58CC02] text-emerald-950';
                } else if (isSelected) {
                  choiceStyle = 'bg-rose-50 border-rose-300 text-rose-950';
                } else {
                  choiceStyle = 'opacity-50 bg-slate-50 border-slate-200';
                }
              } else if (isSelected) {
                choiceStyle = 'bg-emerald-50 border-emerald-500 shadow-xs';
              }

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => {
                    sound.playClick();
                    setSelectedAns(idx);
                  }}
                  className={`w-full p-2.5 text-left rounded-xl border-2 font-extrabold text-xs transition-all cursor-pointer ${choiceStyle}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        </div>

        {/* Submit or feedback */}
        {!submitted ? (
          <button
            disabled={selectedAns === null}
            onClick={handleCheck}
            className={`w-full py-3 text-xs font-black rounded-xl border-b-4 transition-all ${
              selectedAns !== null
                ? 'bg-[#58CC02] hover:bg-[#4bb302] text-white border-[#3e9302] cursor-pointer shadow-md'
                : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed'
            }`}
          >
            確認答案
          </button>
        ) : (
          <div className="space-y-2">
            <div
              className={`p-3 rounded-xl border text-xs font-bold leading-relaxed ${
                selectedAns === currentContent.correctIndex
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              {currentContent.explanation}
            </div>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl"
            >
              完成複習
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
