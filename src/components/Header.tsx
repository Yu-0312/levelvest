import React, { useState } from 'react';
import { Flame, Gem, Heart, Volume2, VolumeX, ShieldCheck, Sparkles } from 'lucide-react';
import { UserStats } from '../types';
import { sound } from '../utils/audio';

interface HeaderProps {
  stats: UserStats;
  onToggleSound: () => void;
  onOpenHeartRefill: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  onToggleSound,
  onOpenHeartRefill,
}) => {
  const [showStreakModal, setShowStreakModal] = useState(false);

  const xpPercent = Math.min(100, Math.round((stats.xp / stats.nextLevelXp) * 100));

  return (
    <>
      <header
        id="app-header"
        className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b-2 border-slate-200 px-3 py-2.5 sm:px-6 transition-all shadow-sm"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Brand & User Level */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#58CC02] flex items-center">
                Level<span className="text-slate-800">Vest</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1 border border-slate-200">
              <span className="text-xs font-bold text-slate-700">
                {stats.userName ? `${stats.userName} · ` : ''}{stats.title}
              </span>
              <span className="bg-[#58CC02] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                Lv.{stats.level}
              </span>
              {/* XP mini bar */}
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right: Gamification Badges */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Streak Counter Button */}
            <button
              id="streak-button"
              onClick={() => {
                sound.playClick();
                setShowStreakModal(!showStreakModal);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-2xl bg-amber-50 hover:bg-amber-100/80 active:translate-y-0.5 border border-amber-200 text-amber-700 font-extrabold text-xs sm:text-sm transition-transform cursor-pointer"
              title="連續學習紀錄"
            >
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
              <span>{stats.streak}</span>
              <span className="hidden sm:inline font-bold text-xs text-amber-600">天</span>
            </button>

            {/* Gems Counter */}
            <div
              id="gems-display"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs sm:text-sm"
              title="投資寶石"
            >
              <Gem className="w-4 h-4 text-sky-500 fill-sky-500" />
              <span>{stats.gems}</span>
            </div>

            {/* Hearts (HP) Button */}
            <button
              id="hearts-button"
              onClick={() => {
                sound.playClick();
                onOpenHeartRefill();
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-2xl border active:translate-y-0.5 font-extrabold text-xs sm:text-sm transition-transform cursor-pointer ${
                stats.hearts <= 1
                  ? 'bg-red-50 border-red-300 text-red-600 animate-bounce'
                  : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100/80'
              }`}
              title="生命值 (答錯扣除 1 心)"
            >
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>{stats.hearts}</span>
              <span className="text-[11px] text-rose-400 font-bold hidden xs:inline">
                /{stats.maxHearts}
              </span>
            </button>

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => {
                onToggleSound();
              }}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 active:scale-95 transition-transform"
              title={stats.soundEnabled ? '關閉音效' : '開啟音效'}
            >
              {stats.soundEnabled ? (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              ) : (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Sub-bar with Level info */}
        <div className="flex md:hidden items-center justify-between px-1 pt-1.5 mt-1 border-t border-slate-100 text-[11px] font-bold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-700 font-extrabold">{stats.userName ? `${stats.userName} · ` : ''}{stats.title}</span>
            <span className="bg-[#58CC02] text-white px-1.5 py-0.2 rounded-full font-black text-[10px]">
              Lv.{stats.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">XP: {stats.xp}/{stats.nextLevelXp}</span>
            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#58CC02] rounded-full transition-all duration-500"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Streak Info Popup */}
      {showStreakModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowStreakModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-amber-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
              <Flame className="w-9 h-9 text-orange-500 fill-orange-500 animate-bounce" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-1">
              🔥 連續學習 {stats.streak} 天！
            </h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              太棒了！持續累積投資敏銳度。每天完成任一微課程挑戰，就能保持連勝火苗！
            </p>

            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 flex items-center gap-3 text-left mb-5">
              <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-900">連勝保護罩已啟用</p>
                <p className="text-[11px] text-amber-700">即使忙碌一天漏卡，火苗也不會熄滅。</p>
              </div>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowStreakModal(false);
              }}
              className="w-full py-3 bg-[#58CC02] hover:bg-[#4bb302] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer shadow-md"
            >
              繼續衝刺學習
            </button>
          </div>
        </div>
      )}
    </>
  );
};
