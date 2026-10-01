import React from 'react';
import { FastForward, X, Lock, Check } from 'lucide-react';
import { Section } from '../types';
import { sound } from '../utils/audio';

interface SkipGradeModalProps {
  targetSection: Section | null;
  /** 將隨這次跳級一起解鎖、但使用者也許還沒開始的章節 */
  toUnlock: Section[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * 「跳級」確認彈窗：跳過前面章節、直接解鎖目標章節（含中間章節）。
 * 跳級不會刪除任何進度，已解鎖章節隨時可以回來修習。
 */
export const SkipGradeModal: React.FC<SkipGradeModalProps> = ({
  targetSection,
  toUnlock,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !targetSection) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-4 border-violet-100 text-center relative"
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

        <div className="w-16 h-16 mx-auto mb-3 bg-violet-50 rounded-full flex items-center justify-center">
          <FastForward className="w-9 h-9 text-violet-500 fill-violet-200" />
        </div>

        <h3 className="text-xl font-black text-slate-800 mb-1">
          跳級到「{targetSection.code} {targetSection.title}」？
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          尚未通過前一章 BOSS 就直接前進！跳級會立即解鎖目標章節（含中間章節），
          <span className="font-black text-slate-600">不會刪除任何現有進度</span>，
          之後仍可隨時回頭複習。
        </p>

        {/* 將解鎖的章節列表 */}
        {toUnlock.length > 0 && (
          <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 mb-4 space-y-1.5 max-h-40 overflow-y-auto">
            <p className="text-[10px] font-black text-slate-400 tracking-wider mb-1">
              將解鎖以下 {toUnlock.length} 章
            </p>
            {toUnlock.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-left">
                <span className="text-base shrink-0">{s.badge}</span>
                <span className="text-xs font-black text-slate-700">
                  {s.code} {s.title}
                </span>
                <span className="ml-auto text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> → <Check className="w-2.5 h-2.5" />
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-500 text-sm font-black hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            我再想想
          </button>
          <button
            onClick={() => {
              sound.playSuccess();
              onConfirm();
            }}
            className="flex-1 py-3 rounded-2xl bg-violet-500 border-b-4 border-violet-700 text-white text-sm font-black hover:bg-violet-400 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FastForward className="w-4 h-4" />
            確認跳級
          </button>
        </div>
      </div>
    </div>
  );
};
