import React from 'react';
import { Heart, Gem, BookOpen, X, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeartRefillModalProps {
  hearts: number;
  maxHearts: number;
  gems: number;
  isOpen: boolean;
  onClose: () => void;
  onRefillWithGems: () => void;
  onReadMungerWisdom: () => void;
}

export const HeartRefillModal: React.FC<HeartRefillModalProps> = ({
  hearts,
  maxHearts,
  gems,
  isOpen,
  onClose,
  onRefillWithGems,
  onReadMungerWisdom,
}) => {
  if (!isOpen) return null;

  const canAffordGems = gems >= 50;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-rose-100 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto mb-3 bg-rose-50 rounded-full flex items-center justify-center">
          <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-1">
          生命值：{hearts} / {maxHearts}
        </h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          答錯投資實戰題目會扣除 1 顆心。心臟耗盡時需要回血才能進行新挑戰。
        </p>

        <div className="space-y-3 mb-4">
          {/* Option 1: Buy full refill with Gems */}
          <button
            onClick={() => {
              if (canAffordGems) {
                onRefillWithGems();
              }
            }}
            disabled={!canAffordGems || hearts >= maxHearts}
            className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
              hearts >= maxHearts
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : canAffordGems
                ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300 text-slate-800 cursor-pointer active:scale-[0.98]'
                : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-800">立即補滿 5 顆心</p>
                <p className="text-[11px] text-slate-500">消耗 50 Gems 恢復全部生命</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-black text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full text-xs border border-sky-200">
              <Gem className="w-3.5 h-3.5 fill-sky-500" />
              <span>50</span>
            </div>
          </button>

          {/* Option 2: Free wisdom refill +1 Heart */}
          <button
            onClick={() => {
              onReadMungerWisdom();
            }}
            disabled={hearts >= maxHearts}
            className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition-all ${
              hearts >= maxHearts
                ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                : 'bg-amber-50 hover:bg-amber-100/70 border-amber-300 text-slate-800 cursor-pointer active:scale-[0.98]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-xl text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-800">讀查理·蒙格心法</p>
                <p className="text-[11px] text-slate-500">閱讀 1 則投資箴言免費 +1 心</p>
              </div>
            </div>
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              免費
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
        >
          稍後再說
        </button>
      </div>
    </div>
  );
};
