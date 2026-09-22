import React from 'react';
import { BookOpen, Sparkles, X, Heart } from 'lucide-react';
import { sound } from '../utils/audio';

interface WisdomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimHeart: () => void;
}

export const WisdomModal: React.FC<WisdomModalProps> = ({
  isOpen,
  onClose,
  onClaimHeart,
}) => {
  if (!isOpen) return null;

  const wisdomQuotes = [
    {
      author: '查理·蒙格 (Charlie Munger)',
      quote: '「如果我知道我會死在哪裡，我就永遠不去那個地方。」',
      explanation: '在投資裡，先學會如何不虧大錢（停損與風控），長期複利自然會照顧好你。',
    },
    {
      author: '華倫·巴菲特 (Warren Buffett)',
      quote: '「投資第一條準則是永遠不要虧損；第二條準則是永遠別忘了第一條。」',
      explanation: '嚴控下檔風險是所有大師的共同默契，紀律就是投資人的護甲。',
    },
    {
      author: '傑西·李佛摩 (Jesse Livermore)',
      quote: '「市場永遠不會錯，錯的往往是我們的成見與執著。」',
      explanation: '當股價跌破月線或支撐時，不要跟盤勢硬拗，承認判斷失誤並執行停損才是成熟投資人。',
    },
  ];

  const randomQuote = wisdomQuotes[Math.floor(Math.random() * wisdomQuotes.length)];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-amber-200 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-9 h-9 text-amber-600" />
        </div>

        <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
          投資大師心法補血站
        </span>

        <div className="my-4 bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-left">
          <p className="text-sm font-black text-slate-800 italic leading-relaxed mb-2">
            {randomQuote.quote}
          </p>
          <p className="text-xs font-bold text-amber-800 text-right mb-2">
            —— {randomQuote.author}
          </p>
          <p className="text-xs text-slate-600 border-t border-amber-200/60 pt-2 leading-relaxed">
            {randomQuote.explanation}
          </p>
        </div>

        <button
          onClick={() => {
            sound.playSuccess();
            onClaimHeart();
            onClose();
          }}
          className="w-full py-3 bg-[#58CC02] hover:bg-[#4bb302] text-white font-black text-sm rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>領悟心法，恢復 1 顆心 ❤️</span>
        </button>
      </div>
    </div>
  );
};
