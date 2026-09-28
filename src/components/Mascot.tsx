import React from 'react';
import { motion } from 'motion/react';

interface MascotProps {
  emotion?: 'happy' | 'celebrating' | 'thinking' | 'oops';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  emotion = 'happy',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  };

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center select-none ${sizeClasses[size]} ${className}`}
      animate={
        emotion === 'celebrating'
          ? { y: [0, -10, 0, -5, 0], rotate: [0, -4, 4, -2, 0], scale: [1, 1.05, 1, 1.03, 1] }
          : emotion === 'oops'
          ? { x: [0, -5, 5, -5, 5, 0], rotate: [0, -2, 2, -2, 2, 0] }
          : { y: [0, -3, 0] }
      }
      transition={{
        duration: emotion === 'celebrating' ? 0.65 : 2.5,
        repeat: Infinity,
        repeatDelay: emotion === 'celebrating' ? 1.5 : 1,
        ease: 'easeInOut',
      }}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* ── Soft rounded baby horns ── */}
        <path
          d="M 37 34 C 33 28 32 19 38 17 C 43 19 46 28 46 34 Z"
          fill="#FFE8A3"
          stroke="#F0B429"
          strokeWidth="2.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          d="M 83 34 C 87 28 88 19 82 17 C 77 19 74 28 74 34 Z"
          fill="#FFE8A3"
          stroke="#F0B429"
          strokeWidth="2.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Horn shine */}
        <path d="M 37 23 C 38 20 40 19 41 20" stroke="#FFF8DC" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
        <path d="M 83 23 C 82 20 80 19 79 20" stroke="#FFF8DC" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />

        {/* ── Floppy ears ── */}
        <ellipse cx="20" cy="58" rx="14" ry="9" transform="rotate(-28 20 58)" fill="#3B82F6" />
        <ellipse cx="20" cy="58" rx="8" ry="5" transform="rotate(-28 20 58)" fill="#FFB4C8" />
        <ellipse cx="100" cy="58" rx="14" ry="9" transform="rotate(28 100 58)" fill="#3B82F6" />
        <ellipse cx="100" cy="58" rx="8" ry="5" transform="rotate(28 100 58)" fill="#FFB4C8" />

        {/* ── Cream forehead curl ── */}
        <path
          d="M 54 32 C 50 22 58 14 66 18 C 60 22 59 28 60 34"
          fill="#FFF4D6"
          stroke="#F0B429"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Head / body blob (soft egg) ── */}
        <ellipse cx="60" cy="64" rx="41" ry="39" fill="#4C8DFF" />
        {/* Soft top highlight */}
        <ellipse cx="58" cy="38" rx="22" ry="10" fill="#93C5FD" opacity="0.45" />

        {/* ── Soft cow spots ── */}
        <path
          d="M 30 44 C 33 35 45 34 49 43 C 46 51 32 52 30 44 Z"
          fill="#1E40AF"
          opacity="0.35"
        />
        <path
          d="M 80 50 C 86 46 95 51 93 60 C 88 67 77 59 80 50 Z"
          fill="#1E40AF"
          opacity="0.32"
        />
        <path
          d="M 36 90 C 41 85 51 86 53 92 C 48 98 35 97 36 90 Z"
          fill="#1E40AF"
          opacity="0.28"
        />

        {/* ── Green investor scarf collar ── */}
        <path
          d="M 26 94 Q 60 108 94 94 L 94 102 Q 60 116 26 102 Z"
          fill="#58CC02"
        />
        <path
          d="M 28 95 Q 60 105 92 95 L 92 98 Q 60 108 28 98 Z"
          fill="#7BE030"
          opacity="0.4"
        />
        {/* Soft side bow (rounded loops, no sharp leaves) */}
        <ellipse cx="86" cy="100" rx="4.5" ry="4" fill="#46A302" />
        <ellipse cx="93" cy="96" rx="6" ry="4" transform="rotate(-25 93 96)" fill="#6FD618" />
        <ellipse cx="92" cy="104" rx="5.5" ry="3.5" transform="rotate(20 92 104)" fill="#58CC02" />

        {/* ── Cream muzzle ── */}
        <ellipse cx="60" cy="78" rx="21" ry="14" fill="#FFF1B8" />
        <ellipse cx="60" cy="76" rx="18" ry="11" fill="#FFF8D6" />

        {/* ── Pink heart nose ── */}
        <path
          d="M 60 70 C 62.5 66 68 66.5 68.5 71 C 69 75.5 60 81 60 81 C 60 81 51 75.5 51.5 71 C 52 66.5 57.5 66 60 70 Z"
          fill="#FF8FAB"
          stroke="#F06B8E"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* Freckles */}
        <circle cx="46" cy="80" r="1.2" fill="#E8B84A" opacity="0.7" />
        <circle cx="50" cy="84" r="1" fill="#E8B84A" opacity="0.55" />
        <circle cx="74" cy="80" r="1.2" fill="#E8B84A" opacity="0.7" />
        <circle cx="70" cy="84" r="1" fill="#E8B84A" opacity="0.55" />

        {/* ── Mouth by emotion ── */}
        {emotion === 'happy' || emotion === 'celebrating' ? (
          <path
            d="M 54 85 Q 60 91 66 85"
            stroke="#92400E"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        ) : emotion === 'thinking' ? (
          <>
            <ellipse cx="63" cy="87" rx="3.5" ry="2.5" fill="#92400E" />
            {/* Thought swirl cheek */}
            <circle cx="88" cy="72" r="1.5" fill="#93C5FD" opacity="0.8" />
            <circle cx="93" cy="66" r="2.2" fill="#93C5FD" opacity="0.6" />
            <circle cx="99" cy="58" r="3" fill="#93C5FD" opacity="0.4" />
          </>
        ) : (
          <path
            d="M 54 88 Q 60 83 66 88"
            stroke="#92400E"
            strokeWidth="2.2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* ── Eyes ── */}
        {emotion === 'celebrating' ? (
          <>
            <path d="M 38 54 Q 47 44 56 54" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 64 54 Q 73 44 82 54" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            {/* Sparkles */}
            <path d="M 30 40 L 31.5 43 L 34.5 44.5 L 31.5 46 L 30 49 L 28.5 46 L 25.5 44.5 L 28.5 43 Z" fill="#FFD84D" />
            <path d="M 90 38 L 91 40 L 93 41 L 91 42 L 90 44 L 89 42 L 87 41 L 89 40 Z" fill="#FFD84D" />
          </>
        ) : emotion === 'oops' ? (
          <>
            <ellipse cx="47" cy="54" rx="8" ry="8.5" fill="#1E293B" />
            <ellipse cx="73" cy="54" rx="8" ry="8.5" fill="#1E293B" />
            {/* Swirly highlights (dizzy) */}
            <path d="M 43 52 C 45 50 48 50 50 52 C 48 54 45 54 43 52" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
            <path d="M 69 52 C 71 50 74 50 76 52 C 74 54 71 54 69 52" stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
            {/* Sweat drop */}
            <path d="M 92 42 C 95 48 90 53 86 49 C 84 45 89 40 92 42 Z" fill="#7DD3FC" stroke="#38BDF8" strokeWidth="1" />
          </>
        ) : (
          <>
            {/* Big sparkly cartoon eyes */}
            <ellipse cx="47" cy="54" rx="9" ry="10" fill="#1E293B" />
            <ellipse cx="73" cy="54" rx="9" ry="10" fill="#1E293B" />
            <circle cx="44.5" cy="50.5" r="3.8" fill="#FFFFFF" />
            <circle cx="70.5" cy="50.5" r="3.8" fill="#FFFFFF" />
            <circle cx="50" cy="57.5" r="1.6" fill="#FFFFFF" opacity="0.9" />
            <circle cx="76" cy="57.5" r="1.6" fill="#FFFFFF" opacity="0.9" />
            {/* Soft brows */}
            <path d="M 39 42 Q 47 39 55 42" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
            <path d="M 65 42 Q 73 39 81 42" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.45" />
          </>
        )}

        {/* ── Round blush cheeks ── */}
        <ellipse cx="32" cy="68" rx="6" ry="4" fill="#FF9EB5" opacity="0.7" />
        <ellipse cx="88" cy="68" rx="6" ry="4" fill="#FF9EB5" opacity="0.7" />
      </svg>
    </motion.div>
  );
};
