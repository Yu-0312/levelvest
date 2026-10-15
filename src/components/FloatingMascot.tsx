import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Mascot } from './Mascot';
import { subscribeMascot, MascotEvent } from '../utils/mascotBus';
import { TabType } from '../types';

type Emotion = 'happy' | 'celebrating' | 'thinking' | 'oops';

const LS_MIN = 'levelvest-mascot-min';

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

/** 牛牛的台詞：牛市語氣，但只談學習與紀律，不給買賣建議。 */
const LINES = {
  hello: ['我是牛牛！牛市開盤，今天先過一關。', '哞～準備好把財經知識一路拉紅了嗎？'],
  learn: ['每過一關，就是一根紅 K，往上衝！', '地圖上的下一關在等你，慢慢來、穩穩漲。'],
  leaderboard: ['聯賽拚 XP，也別忘了紀律分數。', '幫同學加油，也會累積你的人氣喔。'],
  journal: ['寫下決策理由，是最強的紀律。', '先記錄再行動，牛牛幫你盯著情緒。'],
  badges: ['每個徽章都代表你戰勝了一次人性弱點。', '集滿勳章，牛氣沖天！'],
  lesson: ['先想清楚再作答，牛不怕慢。', '專心，這關一定能紅盤收。'],
  correct: ['漂亮，這根紅 K 收得好！', '答對了，續漲！', '紀律滿分，牛氣沖天！'],
  wrong: ['回檔是為了更好的上漲，看懂解析再來。', '沒關係，停損不停學。', '小跌而已，重整旗鼓。'],
  lowHeart: ['愛心剩不多了，先穩住、別硬衝。', '小心！再錯就要補愛心了。'],
  lessonDone: ['這關收紅盤！', '通關！今天的你比昨天更強。'],
  bossDone: ['BOSS 被你打趴，牛市確認！', '大漲停！整個章節拿下。'],
  idle: ['牛牛在這裡陪你。', '要不要寫一筆決策日記？', '點我可以讓我先休息一下。'],
} as const;

interface Props {
  currentTab: TabType;
  hearts: number;
  isLessonOpen: boolean;
}

/**
 * 固定在畫面角落、跟著整個 App 走的牛牛。
 * 會依：分頁切換、開始闖關、答對／答錯、愛心過低、關卡結算 做出反應。
 * 點牛牛可收合成小圖示（記在 localStorage）。
 */
export const FloatingMascot: React.FC<Props> = ({ currentTab, hearts, isLessonOpen }) => {
  const reduce = useReducedMotion();
  const [minimized, setMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_MIN) === '1';
    } catch {
      return false;
    }
  });
  const [emotion, setEmotion] = useState<Emotion>('happy');
  const [text, setText] = useState<string | null>(null);
  const minRef = useRef(minimized);
  minRef.current = minimized;
  const talkTimer = useRef<number>(0);
  const moodTimer = useRef<number>(0);
  const lastActivity = useRef(Date.now());

  const say = useCallback(
    (line: string | null, mood: Emotion, moodMs = 2400, talkMs = 3200) => {
      lastActivity.current = Date.now();
      setEmotion(mood);
      window.clearTimeout(moodTimer.current);
      moodTimer.current = window.setTimeout(() => setEmotion('happy'), moodMs);
      if (!line || minRef.current) return;
      setText(line);
      window.clearTimeout(talkTimer.current);
      talkTimer.current = window.setTimeout(() => setText(null), talkMs);
    },
    []
  );

  // 開場打招呼
  useEffect(() => {
    const t = window.setTimeout(() => say(pick(LINES.hello), 'happy', 1800), 800);
    return () => window.clearTimeout(t);
  }, [say]);

  // 切換分頁
  const firstTab = useRef(true);
  useEffect(() => {
    if (firstTab.current) {
      firstTab.current = false;
      return;
    }
    say(pick(LINES[currentTab]), 'happy', 1600, 2800);
  }, [currentTab, say]);

  // 開始闖關
  useEffect(() => {
    if (isLessonOpen) say(pick(LINES.lesson), 'thinking', 3000, 2600);
  }, [isLessonOpen, say]);

  // 愛心剩 1 顆以下
  const prevHearts = useRef(hearts);
  useEffect(() => {
    if (hearts < prevHearts.current && hearts <= 1) say(pick(LINES.lowHeart), 'oops', 3200, 3400);
    prevHearts.current = hearts;
  }, [hearts, say]);

  // 全域事件：答對 / 答錯 / 結算
  useEffect(() => {
    return subscribeMascot((e: MascotEvent) => {
      if (e === 'correct') say(pick(LINES.correct), 'celebrating', 1500, 2400);
      else if (e === 'wrong') say(pick(LINES.wrong), 'oops', 1800, 3000);
      else if (e === 'lessonDone') say(pick(LINES.lessonDone), 'celebrating', 2600, 3200);
      else if (e === 'bossDone') say(pick(LINES.bossDone), 'celebrating', 3200, 3800);
    });
  }, [say]);

  // 閒置一陣子，偶爾說一句話
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!minRef.current && Date.now() - lastActivity.current > 30000) {
        say(pick(LINES.idle), 'happy', 1400, 2800);
      }
    }, 10000);
    return () => window.clearInterval(id);
  }, [say]);

  useEffect(
    () => () => {
      window.clearTimeout(talkTimer.current);
      window.clearTimeout(moodTimer.current);
    },
    []
  );

  const toggle = () => {
    const next = !minimized;
    setMinimized(next);
    try {
      localStorage.setItem(LS_MIN, next ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (next) setText(null);
    else say(pick(LINES.hello), 'happy', 1600, 2400);
  };

  return (
    <div
      className={`fixed z-[60] flex gap-1 pointer-events-none ${
        isLessonOpen
          ? /* 手機闖關：停在彈窗上方的空白帶，避免蓋到題目與解析 */
            'left-3 top-1.5 items-start md:top-auto md:bottom-5 md:left-5 md:items-end'
          : 'left-2 bottom-[5.25rem] items-end md:left-5 md:bottom-5'
      }`}
      aria-live="polite"
    >
      <button
        type="button"
        onClick={toggle}
        aria-label={minimized ? '展開牛牛' : '收起牛牛'}
        title={minimized ? '點我叫牛牛出來' : '點我讓牛牛休息'}
        className="pointer-events-auto cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 transition-transform active:scale-95 hover:scale-105"
      >
        <Mascot
          emotion={emotion}
          size={minimized ? 'sm' : 'md'}
          animated={!reduce}
          className={minimized ? 'opacity-90 w-11! h-11!' : 'w-[4.25rem]! h-[4.25rem]! md:w-20! md:h-20!'}
        />
      </button>

      <AnimatePresence>
        {text && !minimized && (
          <motion.div
            key={text}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            role="status"
            className={`${isLessonOpen ? 'mt-5 md:mt-0 md:mb-8' : 'mb-8'} max-w-[11.5rem] md:max-w-[15rem] rounded-2xl rounded-bl-sm bg-white border-2 border-red-200 px-3 py-2 text-xs md:text-[13px] font-black leading-snug text-slate-800 shadow-lg pointer-events-none`}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
