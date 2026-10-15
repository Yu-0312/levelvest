/**
 * 牛牛（全域吉祥物）的事件匯流排。
 * 任何元件都能 `mascotSay('correct')` 讓角落的牛牛做出反應，不需要層層傳 props。
 */
export type MascotEvent =
  | 'correct' // 答對
  | 'wrong' // 答錯
  | 'lessonDone' // 關卡結算
  | 'bossDone'; // BOSS 通關

type Listener = (e: MascotEvent) => void;
const listeners = new Set<Listener>();

export function mascotSay(e: MascotEvent) {
  listeners.forEach((l) => l(e));
}

export function subscribeMascot(l: Listener): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
