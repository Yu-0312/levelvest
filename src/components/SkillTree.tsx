import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Lock,
  Star,
  BookOpen,
  TrendingUp,
  Shield,
  Target,
  Lightbulb,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Unit, LessonNode } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

interface SkillTreeProps {
  units: Unit[];
  activeNodeId: string;
  onSelectNode: (node: LessonNode) => void;
}

export const SkillTree: React.FC<SkillTreeProps> = ({
  units,
  activeNodeId,
  onSelectNode,
}) => {
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);

  // Winding horizontal offsets (alternating left/right serpentine path)
  const getOffsetClass = (index: number) => {
    const pattern = [
      'translate-x-0',
      '-translate-x-10 sm:-translate-x-14',
      'translate-x-0',
      'translate-x-10 sm:translate-x-14',
    ];
    return pattern[index % pattern.length];
  };

  const getIcon = (type: LessonNode['iconType'], status: LessonNode['status']) => {
    if (status === 'locked') {
      return <Lock className="w-6 h-6 text-slate-400" />;
    }
    if (status === 'completed') {
      return <Check className="w-7 h-7 text-white stroke-[3.5]" />;
    }

    switch (type) {
      case 'book':
        return <BookOpen className="w-7 h-7 text-white" />;
      case 'chart':
        return <TrendingUp className="w-7 h-7 text-white" />;
      case 'shield':
        return <Shield className="w-7 h-7 text-white" />;
      case 'target':
        return <Target className="w-7 h-7 text-white animate-pulse" />;
      case 'bulb':
        return <Lightbulb className="w-7 h-7 text-white" />;
      default:
        return <Play className="w-7 h-7 text-white fill-white" />;
    }
  };

  let globalNodeIndex = 0;

  return (
    <div id="skill-tree-container" className="w-full max-w-md mx-auto pb-24 pt-4 px-4 select-none">
      {/* Unit Sections */}
      {units.map((unit, unitIdx) => {
        const isUnitActive = unit.nodes.some((n) => n.status === 'active');
        const isUnitCompleted = unit.nodes.every((n) => n.status === 'completed');

        return (
          <div key={unit.id} className="mb-10 relative">
            {/* Unit Header Card (Duolingo Style) */}
            <div
              className={`rounded-2xl p-4 sm:p-5 text-white mb-8 shadow-md border-b-4 transition-all ${
                isUnitCompleted
                  ? 'bg-emerald-600 border-emerald-800'
                  : isUnitActive
                  ? 'bg-[#58CC02] border-[#409402]'
                  : 'bg-slate-400 border-slate-600 opacity-90'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{unit.badge}</span>
                    <span className="text-xs font-black tracking-wider uppercase opacity-90">
                      第 {unit.unitNumber} 單元
                    </span>
                    {isUnitCompleted && (
                      <span className="bg-emerald-800 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        已通關 ✅
                      </span>
                    )}
                    {isUnitActive && (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                        進行中 🎯
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">{unit.title}</h3>
                  <p className="text-xs opacity-90 font-medium mt-1">{unit.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Serpentine Nodes in Unit */}
            <div className="flex flex-col items-center gap-7 relative">
              {unit.nodes.map((node) => {
                const currentIndex = globalNodeIndex++;
                const offsetClass = getOffsetClass(currentIndex);
                const isActive = node.status === 'active';
                const isCompleted = node.status === 'completed';
                const isLocked = node.status === 'locked';

                return (
                  <div
                    key={node.id}
                    className={`relative flex flex-col items-center ${offsetClass}`}
                  >
                    {/* Floating Speech Bubble for Active Node */}
                    {isActive && (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.5 }}
                        className="absolute -top-11 z-20 bg-white border-2 border-slate-200 px-3 py-1.5 rounded-xl shadow-md cursor-pointer whitespace-nowrap"
                        onClick={() => {
                          sound.playClick();
                          onSelectNode(node);
                        }}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-800">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>開始挑戰 20MA 生命線！</span>
                        </div>
                        {/* Triangle pointer */}
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[7px] border-t-white" />
                      </motion.div>
                    )}

                    {/* Node Circular Button */}
                    <div className="relative group">
                      {/* Outer pulse ring for active node */}
                      {isActive && (
                        <div className="absolute -inset-2 bg-[#58CC02]/30 rounded-full animate-ping pointer-events-none" />
                      )}

                      <button
                        id={`node-${node.id}`}
                        onClick={() => {
                          if (isLocked) {
                            sound.playError();
                            setLockedTooltip(node.id);
                            setTimeout(() => setLockedTooltip(null), 2500);
                          } else {
                            sound.playClick();
                            onSelectNode(node);
                          }
                        }}
                        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-lg ${
                          isActive
                            ? 'bg-[#58CC02] border-b-6 border-[#3e9302] hover:bg-[#4cb502] active:border-b-0 active:translate-y-2'
                            : isCompleted
                            ? 'bg-amber-400 border-b-6 border-amber-600 hover:bg-amber-300 active:border-b-0 active:translate-y-2'
                            : 'bg-slate-200 border-b-6 border-slate-300 cursor-not-allowed opacity-80'
                        }`}
                      >
                        {getIcon(node.iconType, node.status)}

                        {/* Stars Pill for Completed Nodes */}
                        {isCompleted && (
                          <div className="absolute -bottom-2 bg-amber-500 border border-white text-white px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                            {[...Array(node.maxStars)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${
                                  i < node.stars ? 'fill-white' : 'opacity-40'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>
                    </div>

                    {/* Node Title Label */}
                    <div className="mt-2 text-center max-w-[140px]">
                      <p
                        className={`text-xs font-black leading-tight ${
                          isActive
                            ? 'text-slate-900 font-extrabold'
                            : isCompleted
                            ? 'text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {node.title}
                      </p>
                    </div>

                    {/* Locked notification toast bubble */}
                    {lockedTooltip === node.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -top-12 z-30 bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap"
                      >
                        🔒 請先通過上一關解鎖！
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cheering Mascot beside the Path */}
            {unitIdx === 1 && (
              <div className="hidden sm:flex absolute -right-6 top-48 flex-col items-center pointer-events-none">
                <div className="bg-white border-2 border-slate-200 px-2.5 py-1 rounded-xl text-[11px] font-bold text-slate-700 shadow-sm mb-1">
                  「均線是獲利的好朋友！」
                </div>
                <Mascot emotion="celebrating" size="md" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
