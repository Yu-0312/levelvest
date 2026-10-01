import React, { useEffect, useState } from 'react';
import { Settings, X, RotateCcw, AlertTriangle, Flame, Gem, Heart } from 'lucide-react';
import { UserStats } from '../types';
import { sound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
  stats: UserStats;
}

/**
 * 設定彈窗：玩家資訊 + 重置學習進度（兩段式確認，避免誤觸）。
 * 重置會清除此瀏覽器的 localStorage 存檔，回到起跑前測驗。
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onReset,
  stats,
}) => {
  const [confirming, setConfirming] = useState(false);

  // 每次開啟都回到未確認狀態；確認狀態 3.5 秒後自動退回
  useEffect(() => {
    if (isOpen) setConfirming(false);
  }, [isOpen]);

  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3500);
    return () => clearTimeout(t);
  }, [confirming]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-slate-100 relative"
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

        <div className="w-16 h-16 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
          <Settings className="w-9 h-9 text-slate-600" />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-4 text-center">設定</h3>

        {/* 玩家資訊 */}
        <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3.5 mb-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-500 font-bold">玩家</span>
            <span className="font-black text-slate-800 text-sm">
              {stats.userName ? `${stats.userName} · ${stats.title}` : stats.title}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <span className="text-sm text-slate-500 font-bold">等級</span>
            <span className="bg-gradient-to-r from-[#58CC02] to-[#8EE000] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              Lv.{stats.level}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-slate-100">
            <span className="text-sm text-slate-500 font-bold">資產</span>
            <span className="flex items-center gap-2 text-xs font-black text-slate-600">
              <span className="flex items-center gap-0.5 text-amber-600">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                {stats.streak}
              </span>
              <span className="flex items-center gap-0.5 text-sky-600">
                <Gem className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
                {stats.gems}
              </span>
              <span className="flex items-center gap-0.5 text-rose-500">
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                {stats.hearts}
              </span>
            </span>
          </div>
        </div>

        {/* 危險區：重置進度 */}
        <div className="border-2 border-rose-200 bg-rose-50 rounded-2xl p-3.5">
          <div className="flex items-start gap-2 mb-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-black text-rose-800">重置學習進度</p>
              <p className="text-[11px] text-rose-600 leading-relaxed mt-0.5">
                清除此瀏覽器的存檔（等級、XP、關卡進度、決策日記），回到起跑前測驗重新開始。
                <span className="font-black">此操作無法復原。</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!confirming) {
                sound.playClick();
                setConfirming(true);
                return;
              }
              sound.playClick();
              onReset();
              onClose();
            }}
            className={`w-full py-3 rounded-2xl text-white text-sm font-black flex items-center justify-center gap-1.5 transition-all active:translate-y-0.5 cursor-pointer border-b-4 ${
              confirming
                ? 'bg-red-600 hover:bg-red-500 border-red-800 animate-pulse'
                : 'bg-rose-500 hover:bg-rose-400 border-rose-700'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {confirming ? '確定重置？再點一次確認！' : '重置學習進度'}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-bold text-center mt-4">
          LevelVest · 進度儲存於此瀏覽器（localStorage）
        </p>
      </div>
    </div>
  );
};
