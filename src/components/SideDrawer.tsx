import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { sound } from '../utils/audio';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** 右側滑出抽屜：頂部 Header 有明顯入口鈕，Esc / 遮罩 / 關閉鈕皆可收合 */
export const SideDrawer: React.FC<SideDrawerProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩 */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />

          {/* 抽屜本體 */}
          <motion.aside
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 z-50 h-full w-[min(420px,92vw)] bg-slate-50 border-l-4 border-sky-200 shadow-2xl flex flex-col"
          >
            {/* 標題列 */}
            <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-3 bg-white border-b-2 border-slate-200">
              <h2 className="font-black text-slate-800 text-base sm:text-lg flex items-center gap-2">
                {title}
              </h2>
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                aria-label="關閉側邊欄"
                className="shrink-0 p-2 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:translate-y-0.5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 內容捲動區 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {children}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
