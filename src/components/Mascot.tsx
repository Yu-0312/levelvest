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
          ? { y: [0, -8, 0, -4, 0], rotate: [0, -3, 3, -1, 0] }
          : emotion === 'oops'
          ? { x: [0, -4, 4, -4, 4, 0] }
          : { y: [0, -3, 0] }
      }
      transition={{
        duration: emotion === 'celebrating' ? 0.6 : 2.5,
        repeat: emotion === 'celebrating' ? Infinity : Infinity,
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
        {/* Cute Bull Horns (Gold / Amber) */}
        <path
          d="M 28 42 C 16 35 12 18 20 8 C 24 16 32 26 38 32 Z"
          fill="#F59E0B"
          stroke="#D97706"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M 92 42 C 104 35 108 18 100 8 C 96 16 88 26 82 32 Z"
          fill="#F59E0B"
          stroke="#D97706"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* Ears */}
        <ellipse cx="22" cy="54" rx="10" ry="6" transform="rotate(-20 22 54)" fill="#3B82F6" />
        <ellipse cx="22" cy="54" rx="6" ry="3.5" transform="rotate(-20 22 54)" fill="#93C5FD" />
        
        <ellipse cx="98" cy="54" rx="10" ry="6" transform="rotate(20 98 54)" fill="#3B82F6" />
        <ellipse cx="98" cy="54" rx="6" ry="3.5" transform="rotate(20 98 54)" fill="#93C5FD" />

        {/* Head / Body (Duolingo Round Curvature - Soft Blue/Teal Bull) */}
        <rect
          x="20"
          y="26"
          width="80"
          height="76"
          rx="38"
          fill="#2563EB"
        />
        {/* Soft highlight on head */}
        <path
          d="M 36 34 C 48 30 72 30 84 34 C 76 28 44 28 36 34 Z"
          fill="#60A5FA"
          opacity="0.6"
        />

        {/* Emerald Green Investor Bandana / Scarf */}
        <path
          d="M 32 82 C 48 94 72 94 88 82 C 84 96 68 102 60 102 C 52 102 36 96 32 82 Z"
          fill="#58CC02"
        />
        {/* Bandana tie knot */}
        <circle cx="60" cy="98" r="6" fill="#46A302" />
        <path d="M 58 102 L 52 114 L 62 108 L 68 114 L 62 102 Z" fill="#58CC02" />

        {/* Snout / Muzzle */}
        <ellipse cx="60" cy="70" rx="24" ry="16" fill="#FEF08A" stroke="#FDE047" strokeWidth="2" />
        {/* Nostrils */}
        <ellipse cx="53" cy="70" rx="3.5" ry="3" fill="#D97706" />
        <ellipse cx="67" cy="70" rx="3.5" ry="3" fill="#D97706" />

        {/* Mouth depending on emotion */}
        {emotion === 'happy' || emotion === 'celebrating' ? (
          <path
            d="M 54 75 Q 60 81 66 75"
            stroke="#92400E"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        ) : emotion === 'thinking' ? (
          <ellipse cx="60" cy="76" rx="4" ry="3" fill="#92400E" />
        ) : (
          <path
            d="M 54 77 Q 60 72 66 77"
            stroke="#92400E"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Eyes */}
        {emotion === 'celebrating' ? (
          // Joyful closed squint eyes
          <>
            <path d="M 40 48 Q 48 40 54 48" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M 66 48 Q 72 40 80 48" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
          </>
        ) : emotion === 'oops' ? (
          // Swirly / sad eyes
          <>
            <circle cx="46" cy="48" r="6" fill="#1E293B" />
            <circle cx="74" cy="48" r="6" fill="#1E293B" />
            <ellipse cx="44" cy="46" rx="2" ry="2" fill="#FFFFFF" />
            <ellipse cx="72" cy="46" rx="2" ry="2" fill="#FFFFFF" />
            {/* Sweat drop */}
            <path d="M 86 38 C 88 43 83 47 80 44 C 79 41 83 37 86 38 Z" fill="#60A5FA" />
          </>
        ) : (
          // Big sparkly cartoon eyes (Duolingo style)
          <>
            <ellipse cx="46" cy="48" rx="8" ry="9" fill="#1E293B" />
            <ellipse cx="74" cy="48" rx="8" ry="9" fill="#1E293B" />
            <circle cx="44" cy="45" r="3.5" fill="#FFFFFF" />
            <circle cx="72" cy="45" r="3.5" fill="#FFFFFF" />
            <circle cx="48" cy="51" r="1.5" fill="#FFFFFF" />
            <circle cx="76" cy="51" r="1.5" fill="#FFFFFF" />
          </>
        )}

        {/* Cheeks Blush */}
        <ellipse cx="34" cy="60" rx="4" ry="2.5" fill="#F87171" opacity="0.6" />
        <ellipse cx="86" cy="60" rx="4" ry="2.5" fill="#F87171" opacity="0.6" />
      </svg>
    </motion.div>
  );
};
