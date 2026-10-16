/** 每個大單元的牛牛台詞（依章節 id）。語氣是牛市風格，但只談學習與紀律。 */
export interface UnitMascotLines {
  /** 進行中 */
  active: string;
  /** 全部通關 */
  done: string;
  /** 尚未解鎖 */
  locked: string;
}

export const unitMascotLines: Record<string, UnitMascotLines> = {
  s1: { active: '一關一關來，你行的！', done: '新手村畢業，紅盤收！', locked: '過了 BOSS，我在這等你。' },
  s2: { active: '看圖不迷路，先認趨勢！', done: '圖表難不倒你了！', locked: '先通過上一章的 BOSS～' },
  s3: { active: '公司值多少，一起算！', done: '財報看得懂，穩了！', locked: '先通過上一章的 BOSS～' },
  s4: { active: '下單前，先想好停損。', done: '下單實戰，漂亮！', locked: '先通過上一章的 BOSS～' },
  s5: { active: '活得夠久，才賺得到。', done: '風控堡壘，守住了！', locked: '先通過上一章的 BOSS～' },
  s6: { active: '管好情緒，就贏一半。', done: '心態穩，牛氣足！', locked: '先通過上一章的 BOSS～' },
  s7: { active: '個股之外，世界更大。', done: '商品全認識，棒！', locked: '先通過上一章的 BOSS～' },
  s8: { active: '大環境，決定風向。', done: '總經風向，看得準！', locked: '先通過上一章的 BOSS～' },
  s9: { active: '做自己的研究才踏實。', done: '研究功力，滿分！', locked: '先通過上一章的 BOSS～' },
  s10: { active: '牛氣沖天，你準備好了！', done: '大師試煉，通關！', locked: '先通過上一章的 BOSS～' },
};

export const fallbackUnitLines: UnitMascotLines = {
  active: '一關一關來，你行的！',
  done: '這章收紅盤！',
  locked: '先通過上一章的 BOSS～',
};
