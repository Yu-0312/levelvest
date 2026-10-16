import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarDays,
  CheckCircle2,
  Gem,
  Loader2,
  Newspaper,
  RefreshCw,
  Sparkles,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import type { OnboardingProfile, QuizQuestion } from '../types';
import { Mascot } from './Mascot';
import { sound } from '../utils/audio';

/**
 * 每週時事挑戰：用 Gemini 依使用者風險偏好產生 3–5 題台股／金融時事情境題。
 *
 * - 快照存放在「本功能專屬」key：'levelvest-weekly-news-v1'（不碰主存檔 'levelvest-save-v1'）
 * - 同一 ISO 週內不重出，跨週自動重新生成，另有「手動重新產生」
 * - 無 VITE_GEMINI_API_KEY 或呼叫失敗 → 落地內建示範題組（依 ISO 週數輪替），UI 標示「示範模式」
 */
const STORAGE_KEY = 'levelvest-weekly-news-v1';
const MODEL = 'gemini-2.5-flash';
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;
const EXPLAIN_LIMIT = 80;
const REQUEST_TIMEOUT_MS = 25000;
/** 每題獎勵：答對 1 題 10 XP / 5 寶石，全對再加 20 XP */
const XP_PER_CORRECT = 10;
const GEMS_PER_CORRECT = 5;
const XP_PERFECT_BONUS = 20;

interface WeeklyNewsSnapshot {
  version: 1;
  isoYear: number;
  isoWeek: number;
  /** 產生日期（ISO 8601） */
  generatedAt: string;
  source: 'gemini' | 'demo';
  questions: QuizQuestion[];
  /** 本週是否已發放過獎勵（手動重出題目也不重領） */
  rewardClaimed: boolean;
  /** 最近一次結算成績 */
  lastResult: { correct: number; total: number; answeredAt: string } | null;
  /** 本週錯題紀錄：questionKey → 答錯次數 */
  wrong: Record<string, number>;
}

interface WeeklyNewsChallengeProps {
  /** 使用者風險偏好（選讀主存檔 profile），用來微調 Gemini 出題方向 */
  risk?: OnboardingProfile['risk'] | null;
  /** 結算時由 App 注入獎勵；XP／寶石的入帳由 App 端處理 */
  onReward: (xp: number, gems: number) => void;
}

/* ────────────────────────── ISO 週計算 ────────────────────────── */

function isoWeekOf(d: Date = new Date()): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7; // 週一 = 1 … 週日 = 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum); // 本週四所在日決定 ISO 年
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

function weekLabel(snap: { isoYear: number; isoWeek: number }): string {
  return `${snap.isoYear} 年第 ${String(snap.isoWeek).padStart(2, '0')} 週`;
}

/* ────────────────────────── 存檔（僅本功能專屬 key） ────────────────────────── */

function readSnapshot(): WeeklyNewsSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WeeklyNewsSnapshot> | null;
    if (!parsed || typeof parsed !== 'object') return null;
    if (typeof parsed.isoYear !== 'number' || typeof parsed.isoWeek !== 'number') return null;
    const questions = parseQuestions(parsed.questions);
    if (!questions) return null;
    return {
      version: 1,
      isoYear: parsed.isoYear,
      isoWeek: parsed.isoWeek,
      generatedAt: typeof parsed.generatedAt === 'string' ? parsed.generatedAt : '',
      source: parsed.source === 'gemini' ? 'gemini' : 'demo',
      questions,
      rewardClaimed: parsed.rewardClaimed === true,
      lastResult:
        parsed.lastResult &&
        typeof parsed.lastResult === 'object' &&
        typeof parsed.lastResult.correct === 'number' &&
        typeof parsed.lastResult.total === 'number'
          ? {
              correct: parsed.lastResult.correct,
              total: parsed.lastResult.total,
              answeredAt:
                typeof parsed.lastResult.answeredAt === 'string'
                  ? parsed.lastResult.answeredAt
                  : '',
            }
          : null,
      wrong:
        parsed.wrong && typeof parsed.wrong === 'object'
          ? Object.fromEntries(
              Object.entries(parsed.wrong).filter(
                ([, v]) => typeof v === 'number' && Number.isFinite(v) && v > 0
              )
            )
          : {},
    };
  } catch {
    return null;
  }
}

function writeSnapshot(snap: WeeklyNewsSnapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {
    /* 容量不足時靜默略過，不影響作答 */
  }
}

/* ────────────────────────── 題目 schema 驗證 ────────────────────────── */

/** 去除 ```json 代码围栏或多餘文字，盡量取出真正的 JSON 陣列／物件 */
function looseJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    const withoutFence = trimmed.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
    return withoutFence;
  }
  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  const objStart = trimmed.indexOf('{');
  const objEnd = trimmed.lastIndexOf('}');
  if (arrStart >= 0 && arrEnd > arrStart) return trimmed.slice(arrStart, arrEnd + 1);
  if (objStart >= 0 && objEnd > objStart) return trimmed.slice(objStart, objEnd + 1);
  return trimmed;
}

/** 前端 schema 驗證：不符即回傳 null，由呼叫端改走 fallback */
function parseQuestions(raw: unknown): QuizQuestion[] | null {
  let data: unknown = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(looseJson(data));
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  let list: unknown = data;
  if (!Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    list = Array.isArray(obj.questions) ? obj.questions : Array.isArray(obj.items) ? obj.items : null;
  }
  if (!Array.isArray(list)) return null;
  if (list.length < MIN_QUESTIONS || list.length > MAX_QUESTIONS) return null;

  const out: QuizQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') return null;
    const q = item as Record<string, unknown>;
    const text = typeof q.q === 'string' ? q.q : typeof q.question === 'string' ? q.question : '';
    const choicesRaw = q.choices ?? q.options;
    if (!text.trim() || !Array.isArray(choicesRaw) || choicesRaw.length !== 4) return null;
    const choices: string[] = [];
    for (const c of choicesRaw) {
      if (typeof c !== 'string' || !c.trim()) return null;
      choices.push(c.trim());
    }
    if (new Set(choices).size !== choices.length) return null; // 選項不可重複
    const answerNum =
      typeof q.answer === 'number' ? q.answer : typeof q.answer === 'string' ? Number(q.answer) : NaN;
    if (!Number.isInteger(answerNum) || answerNum < 0 || answerNum > 3) return null;
    const explainRaw = typeof q.explain === 'string' ? q.explain : typeof q.explanation === 'string' ? q.explanation : '';
    if (!explainRaw.trim()) return null;
    const explain = explainRaw.trim();
    out.push({
      q: text.trim(),
      choices,
      answer: answerNum,
      explain:
        explain.length > EXPLAIN_LIMIT ? `${explain.slice(0, EXPLAIN_LIMIT - 1)}…` : explain,
    });
  }
  return out;
}

/* ────────────────────────── 示範題組（fallback） ────────────────────────── */

/** 示範題組 A：除息、漲跌幅、詐騙識讀、集保制度 */
const DEMO_SET_A: QuizQuestion[] = [
  {
    q: '小華持有的台股在除息日每股配發 2 元現金股利，當天開盤參考價會如何調整？之後所謂「填息」是指什麼？',
    choices: [
      '開盤參考價加計 2 元，股價漲回除息前稱為填息',
      '開盤參考價不變，股價漲回除息前稱為填息',
      '開盤參考價扣除 2 元，股價漲回除息前稱為填息',
      '開盤參考價扣除 2 元，股價跌破除息前稱為填息',
    ],
    answer: 2,
    explain:
      '除息會把現金股利從參考價中扣掉，之後股價回到除息前水位，才算真正填息、拿到這筆股利。',
  },
  {
    q: '台股一般上市股票以昨收 45 元為基準（不含新上市前數日的特殊規定），今日收盤價的合理漲跌區間為何？',
    choices: ['43～47 元', '40.5～49.5 元', '36～54 元', '當日沒有漲跌幅限制'],
    answer: 1,
    explain:
      '台股一般上市股票每日收盤價漲跌幅為前一日收盤價的 ±10%，45 元的 ±10% 就是 40.5～49.5 元。',
  },
  {
    q: '你在通訊軟體收到自稱「券商投顧老師」的人，保證加入會員穩賺不賠，還要求把資金匯到個人帳戶。下列哪個做法最正確？',
    choices: [
      '先小額匯款，試試看能不能順利出金',
      '依指示匯款並提供帳密，請對方代為操作',
      '把錢轉入對方提供的「安全帳戶」以求保障',
      '掛斷並封鎖，向券商官方客服或 165 查證',
    ],
    answer: 3,
    explain:
      '保證獲利、要求匯到個人或「安全帳戶」都是典型詐騙訊號；求證只走官方管道，絕不提供帳密。',
  },
  {
    q: '若某證券公司經營不善倒閉，投資人放在集保帳簿中的股票會怎麼樣？',
    choices: [
      '股權仍歸投資人所有，與券商自有資產分離',
      '一併被清算，用來償還券商的債務',
      '自動轉為券商債權人的財產',
      '永久凍結，無法領回',
    ],
    answer: 0,
    explain:
      '股票以投資人名義登記於集保中心，與券商自有財產分開；券商出狀況不影響投資人的持股權利。',
  },
];

/** 示範題組 B：風險分散、加權指數、定期定額、融資風險 */
const DEMO_SET_B: QuizQuestion[] = [
  {
    q: '大學生小庭有 3 萬元閒錢，想全數買進同一檔最近很夯的個股。以風險觀念來看，哪個做法較合理？',
    choices: [
      '全數押進同一檔，報酬才有機會最大化',
      '依自身風險承受度設定單一個股上限，其餘以 ETF 或分散標的配置',
      '先全押，跌破成本價再大量攤平',
      '用融資加碼，把部位放大一倍',
    ],
    answer: 1,
    explain:
      '集中押注單一個股會放大個別風險；設定部位上限並適當分散，才能避免一次套牢影響生活。',
  },
  {
    q: '關於台灣加權股價指數的敘述，下列何者正確？',
    choices: [
      '只計算金融類股的表現',
      '每檔成分股對指數的影響完全相同',
      '每日固定上漲 0.5%',
      '採市值加權，權值大的公司對指數影響較大',
    ],
    answer: 3,
    explain:
      '加權指數按市值加權，大權值股的漲跌對指數點數影響明顯高於小型股，不能只看指數漲跌就判斷自己的持股表現。',
  },
  {
    q: '小志用定期定額投資台股 ETF，遇到市場大跌時，下列敘述何者最合理？',
    choices: [
      '續扣可買到較多單位數，長期投資人通常續扣並定期檢視計畫',
      '應立即全部贖回，等跌深再重新進場',
      '大跌代表應該停止扣款的標準訊號',
      '定期定額保證不虧錢，可以完全不用理會',
    ],
    answer: 0,
    explain:
      '下跌時同樣金額能買進較多單位、拉低平均成本；但定期定額沒有保證獲利，仍要依計畫與風險承受度檢視。',
  },
  {
    q: '使用融資買進台股時，下列何者為真？',
    choices: [
      '融資等同自有資金，不需要擔心維持率',
      '融資產生的虧損由券商全數承擔',
      '維持率不足且未補繳，可能被處分擔保品（斷頭）',
      '融資利率固定為 0%',
    ],
    answer: 2,
    explain:
      '融資是向券商借錢買股，股價下跌使維持率低於規定又沒補錢，券商會處分股票，虧損由投資人吸收。',
  },
];

function demoQuestions(isoWeek: number): QuizQuestion[] {
  return (isoWeek % 2 === 0 ? DEMO_SET_B : DEMO_SET_A).map((q) => ({ ...q }));
}

/* ────────────────────────── Gemini 產生 ────────────────────────── */

const RISK_HINT: Record<NonNullable<OnboardingProfile['risk']>, string> = {
  conservative: '使用者偏好穩健保守：題目多著眼於風險控管、分散配置、詐騙識讀與守紀律的判斷。',
  balanced: '使用者偏好均衡：觀念題與情境題並重，兼顧報酬想像與風險意識。',
  aggressive: '使用者偏好積極成長：可出現較進階的操作情境，但仍須強調風控與紀律，不可鼓吹賭博式押注。',
};

const SYSTEM_INSTRUCTION = [
  '你是台灣證券市場的金融教育出題者，必須使用繁體中文（台灣用語）出題。',
  '你只能出「觀念＋情境」題：禁止引用無法確認的即時新聞細節，不要寫特定日期、指數點位、公司高層人名、個股即時漲跌或未經查證的事件數據。',
  '每一題只能有一個正確答案，選項長度要接近，禁止「以上皆是／以上皆非」。',
  '只回傳 JSON，不要任何多餘文字。',
].join('\n');

function buildPrompt(risk: OnboardingProfile['risk'] | null | undefined, week: string): string {
  const riskLine = risk && RISK_HINT[risk] ? RISK_HINT[risk] : '未提供風險偏好：題目難度與主題均衡即可。';
  return [
    `任務：為「每週時事挑戰」產生 ${MIN_QUESTIONS}～${MAX_QUESTIONS} 題單選情境題，適用週期：${week}。`,
    '主題範圍（混合出題）：台股市場制度與交易規則、金融時事中可驗證的通用觀念、金融識讀與詐騙防範。',
    riskLine,
    '回傳 JSON 格式：{"questions":[{"q":"題幹","choices":["選項1","選項2","選項3","選項4"],"answer":正解索引0到3的整數,"explain":"解析"}]}。',
    `限制：choices 必須剛好 4 個字串；answer 必須是 0–3 的整數且只有一個正解；explain 以繁體中文撰寫且不超過 ${EXPLAIN_LIMIT} 字。`,
    '題目數量剛好 4 題，難度約當高中職金融素養程度，避免時事細節猜測，改以常見情境判斷。',
  ].join('\n');
}

/** 呼叫 Gemini；任何失敗（無金鑰、逾時、格式不符）都回傳 null 由 caller 落地示範題組 */
async function generateWithGemini(
  risk: OnboardingProfile['risk'] | null | undefined,
  week: string
): Promise<QuizQuestion[] | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: buildPrompt(risk, week),
      config: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        systemInstruction: SYSTEM_INSTRUCTION,
        httpOptions: { timeout: REQUEST_TIMEOUT_MS },
      },
    });
    const text = res.text;
    if (!text) return null;
    return parseQuestions(text);
  } catch {
    return null;
  }
}

/* ────────────────────────── 元件 ────────────────────────── */

type Phase = 'quiz' | 'result';

const INITIAL_QUIZ = {
  qIndex: 0,
  selected: null as number | null,
  submitted: false,
  correct: 0,
};

export const WeeklyNewsChallenge: React.FC<WeeklyNewsChallengeProps> = ({ risk, onReward }) => {
  const [snapshot, setSnapshot] = useState<WeeklyNewsSnapshot | null>(null);
  /** 產生中（首次載入或手動重新產生） */
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState('準備本週題目…');
  const [quizOpen, setQuizOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('quiz');
  const [qIndex, setQIndex] = useState(INITIAL_QUIZ.qIndex);
  const [selected, setSelected] = useState<number | null>(INITIAL_QUIZ.selected);
  const [submitted, setSubmitted] = useState(INITIAL_QUIZ.submitted);
  const [correct, setCorrect] = useState(INITIAL_QUIZ.correct);
  /** 本次結算實際發放的獎勵（null = 本週已領過） */
  const [reward, setReward] = useState<{ xp: number; gems: number } | null>(null);
  /** StrictMode 下避免同一次掛載重複呼叫 Gemini */
  const bootedRef = useRef(false);

  const now = isoWeekOf();

  /** 產生一組題目並寫入快照（不動主存檔） */
  const runGenerate = useCallback(
    async (label: string) => {
      setBusyLabel(label);
      setBusy(true);
      try {
        const week = isoWeekOf();
        const weekText = weekLabel({ isoYear: week.year, isoWeek: week.week });
        const geminiQuestions = await generateWithGemini(risk, weekText);
        const questions = geminiQuestions ?? demoQuestions(week.week);
        const prev = readSnapshot();
        const sameWeek = !!prev && prev.isoYear === week.year && prev.isoWeek === week.week;
        const next: WeeklyNewsSnapshot = {
          version: 1,
          isoYear: week.year,
          isoWeek: week.week,
          generatedAt: new Date().toISOString(),
          source: geminiQuestions ? 'gemini' : 'demo',
          questions,
          // 同週內手動重出題：題目換了，但本週獎勵不重領、舊成績作廢
          rewardClaimed: sameWeek && prev ? prev.rewardClaimed : false,
          lastResult: null,
          wrong: {},
        };
        writeSnapshot(next);
        setSnapshot(next);
      } finally {
        setBusy(false);
      }
    },
    [risk]
  );

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const week = isoWeekOf();
    const stored = readSnapshot();
    if (stored && stored.isoYear === week.year && stored.isoWeek === week.week) {
      setSnapshot(stored);
      return;
    }
    // 跨週（或首次使用）→ 自動重新生成
    void runGenerate('產生本週題目…');
  }, [runGenerate]);

  const questions = snapshot?.questions ?? [];
  const total = questions.length;
  const current = questions[qIndex];
  const canStart = !busy && total >= MIN_QUESTIONS;

  const openQuiz = () => {
    if (!canStart) return;
    sound.playClick();
    setPhase('quiz');
    setQIndex(0);
    setSelected(null);
    setSubmitted(false);
    setCorrect(0);
    setReward(null);
    setQuizOpen(true);
  };

  const handleRegenerate = () => {
    if (busy) return;
    sound.playClick();
    void runGenerate('重新產生中…');
  };

  const questionKey = (idx: number) =>
    `wn:${snapshot?.isoYear ?? now.year}-W${String(snapshot?.isoWeek ?? now.week).padStart(2, '0')}#${idx}`;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    sound.playClick();
    setSelected(idx);
  };

  const handleSubmit = () => {
    if (selected === null || submitted || !current || !snapshot) return;
    setSubmitted(true);
    if (selected === current.answer) {
      sound.playSuccess();
      setCorrect((c) => c + 1);
    } else {
      sound.playError();
      const key = questionKey(qIndex);
      const next: WeeklyNewsSnapshot = {
        ...snapshot,
        wrong: { ...snapshot.wrong, [key]: (snapshot.wrong[key] ?? 0) + 1 },
      };
      writeSnapshot(next);
      setSnapshot(next);
    }
  };

  /** 最後一題後的結算：發獎勵（每週限一次）並寫入本週成績 */
  const finish = () => {
    if (!snapshot) return;
    const totalNow = snapshot.questions.length;
    const alreadyClaimed = snapshot.rewardClaimed;
    const xp = correct * XP_PER_CORRECT + (correct === totalNow ? XP_PERFECT_BONUS : 0);
    const gems = correct * GEMS_PER_CORRECT;
    const granted = !alreadyClaimed && (xp > 0 || gems > 0);
    const next: WeeklyNewsSnapshot = {
      ...snapshot,
      rewardClaimed: alreadyClaimed || granted,
      lastResult: { correct, total: totalNow, answeredAt: new Date().toISOString() },
    };
    writeSnapshot(next);
    setSnapshot(next);
    setReward(granted ? { xp, gems } : null);
    if (granted) onReward(xp, gems);
    setPhase('result');
  };

  const handleNext = () => {
    sound.playClick();
    if (qIndex + 1 < total) {
      setQIndex((i) => i + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      finish();
    }
  };

  const closeQuiz = () => {
    sound.playClick();
    setQuizOpen(false);
  };

  const sourceBadge =
    snapshot?.source === 'gemini' ? (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-100 text-sky-600 flex items-center gap-1">
        <Sparkles className="w-3 h-3" />
        Gemini 題組
      </span>
    ) : (
      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
        <Newspaper className="w-3 h-3" />
        示範模式
      </span>
    );

  return (
    <>
      {/* ── 入口卡片（learn 分頁，DailyTasks 下方） ── */}
      <div className="mt-3 bg-white rounded-3xl border-2 border-sky-200 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center shrink-0">
            <Newspaper className="w-6 h-6 text-sky-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-black text-slate-800 text-sm">每週時事挑戰</p>
              <div className="flex items-center gap-1.5">
                {snapshot && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {snapshot.isoYear} W{String(snapshot.isoWeek).padStart(2, '0')}
                  </span>
                )}
                {!busy && sourceBadge}
              </div>
            </div>

            {busy ? (
              <div className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                {busyLabel}
              </div>
            ) : (
              <>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  依你的風險偏好，每週 3–5 題台股金融時事情境題，答對領 XP 與寶石。
                </p>

                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  {snapshot?.lastResult ? (
                    <span className="text-[11px] font-black text-sky-700 bg-sky-50 border border-sky-200 rounded-full px-2 py-0.5">
                      本週成績 {snapshot.lastResult.correct} / {snapshot.lastResult.total}
                    </span>
                  ) : (
                    <span className="text-[11px] font-black text-slate-600 bg-slate-100 rounded-full px-2 py-0.5">
                      本週尚未挑戰
                    </span>
                  )}
                  {snapshot?.rewardClaimed && (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                      獎勵已領取
                    </span>
                  )}
                  {!!snapshot && Object.keys(snapshot.wrong).length > 0 && (
                    <span className="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-full px-2 py-0.5">
                      錯題 {Object.keys(snapshot.wrong).length} 題
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={openQuiz}
                    disabled={!canStart}
                    className={`flex-1 py-2.5 rounded-2xl font-black text-sm border-b-4 transition-all active:border-b-0 active:translate-y-0.5 flex items-center justify-center gap-1.5 ${
                      canStart
                        ? 'bg-sky-500 hover:bg-sky-600 text-white border-sky-700 cursor-pointer shadow-md'
                        : 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Newspaper className="w-4 h-4" />
                    {snapshot?.lastResult ? '再挑戰一次' : '開始挑戰'}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    disabled={!canStart}
                    aria-label="手動重新產生本週題目"
                    title="手動重新產生"
                    className="p-2.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-500 hover:text-sky-600 hover:border-sky-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 答題彈窗 ── */}
      <AnimatePresence>
        {quizOpen && current && total > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-sky-100"
            >
              {/* Header */}
              <div
                className="sticky top-0 z-10 px-5 pt-4 pb-3 border-b-2 border-sky-100 bg-white"
                style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-500 text-white flex items-center gap-1">
                        <Newspaper className="w-3 h-3" />
                        每週時事挑戰
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate">
                        {snapshot ? weekLabel(snapshot) : ''}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-slate-800 truncate">
                      {phase === 'result' ? '本週挑戰完成' : '時事情境題'}
                    </h2>
                  </div>
                  <button
                    onClick={closeQuiz}
                    aria-label="關閉"
                    className="p-2 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {phase === 'quiz' && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-sky-400 to-sky-300"
                        style={{ width: `${((qIndex + (submitted ? 1 : 0)) / total) * 100}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-500">
                      {qIndex + 1}/{total}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* QUIZ */}
                {phase === 'quiz' && (
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-relaxed mb-4">
                      {current.q}
                    </p>

                    <div className="space-y-2.5">
                      {current.choices.map((choice, idx) => {
                        const isCorrect = idx === current.answer;
                        const isSelected = selected === idx;
                        let cls =
                          'border-slate-200 bg-white hover:bg-slate-50 border-b-slate-300 text-slate-700';
                        let chipCls = 'bg-slate-100 border-slate-200 text-slate-500';
                        if (submitted) {
                          if (isCorrect) {
                            cls = 'border-emerald-400 bg-emerald-50 border-b-emerald-500 text-emerald-900';
                            chipCls = 'bg-emerald-400 border-emerald-500 text-white';
                          } else if (isSelected) {
                            cls = 'border-rose-400 bg-rose-50 border-b-rose-500 text-rose-900';
                            chipCls = 'bg-rose-400 border-rose-500 text-white';
                          } else {
                            cls = 'border-slate-100 bg-slate-50 border-b-slate-100 text-slate-400';
                            chipCls = 'bg-slate-100 border-slate-200 text-slate-300';
                          }
                        } else if (isSelected) {
                          cls = 'border-sky-400 bg-sky-50 border-b-sky-500 text-sky-900 shadow-md';
                          chipCls = 'bg-sky-500 border-sky-600 text-white';
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelect(idx)}
                            disabled={submitted}
                            className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 border-b-4 font-bold text-sm transition-all active:translate-y-0.5 active:border-b-2 cursor-pointer disabled:cursor-default ${cls}`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-black shrink-0 transition-colors ${chipCls}`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="flex-1 leading-snug">{choice}</span>
                              {submitted && isCorrect && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                              )}
                              {submitted && isSelected && !isCorrect && (
                                <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* 立即回饋：對錯 + 解析 */}
                    <AnimatePresence>
                      {submitted && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-3.5 rounded-2xl border-2 ${
                            selected === current.answer
                              ? 'border-emerald-200 bg-emerald-50'
                              : 'border-rose-200 bg-rose-50'
                          }`}
                        >
                          <p
                            className={`text-xs font-black mb-1 ${
                              selected === current.answer ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {selected === current.answer ? '答對了！' : '答錯了～看看解析'}
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {current.explain}
                          </p>
                          {selected !== current.answer && (
                            <p className="text-[11px] text-rose-500 font-bold mt-1.5">
                              已收入本週錯題紀錄，之後可複習
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={handleNext}
                      disabled={selected === null}
                      className={`w-full mt-5 py-3.5 font-black text-base rounded-2xl transition-all ${
                        selected === null
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : submitted
                          ? 'bg-sky-500 hover:bg-sky-600 text-white border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 cursor-pointer'
                          : 'bg-sky-500 hover:bg-sky-600 text-white border-b-4 border-sky-700 active:border-b-0 active:translate-y-1 shadow-md cursor-pointer'
                      }`}
                    >
                      {submitted ? (qIndex + 1 < total ? '下一題' : '看結算') : '確認答案'}
                    </button>
                  </div>
                )}

                {/* RESULT */}
                {phase === 'result' && (
                  <div className="text-center">
                    <Mascot
                      emotion={correct >= Math.ceil(total / 2) ? 'celebrating' : 'oops'}
                      size="lg"
                      className="mx-auto mb-3"
                    />
                    <h3 className="text-2xl font-black text-slate-800 mb-1">
                      {correct === total ? '全對，漂亮！' : correct > 0 ? '挑戰完成！' : '再接再厲！'}
                    </h3>
                    <p className="text-slate-500 text-sm mb-4">
                      答對 {correct} / {total} 題 · {weekLabel(snapshot ?? { isoYear: now.year, isoWeek: now.week })}
                    </p>

                    <div className="bg-sky-50 border-2 border-sky-200 rounded-2xl p-4 mb-5">
                      {reward ? (
                        <div className="flex items-center justify-center gap-4">
                          <span className="flex items-center gap-1.5 text-sm font-black text-sky-700">
                            <Zap className="w-4 h-4 text-amber-500 fill-amber-400" />
                            XP +{reward.xp}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm font-black text-sky-700">
                            <Gem className="w-4 h-4 text-sky-500" />
                            寶石 +{reward.gems}
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs font-black text-slate-500">
                          本週獎勵已領取，成績已記錄
                        </p>
                      )}
                      <p className="text-[11px] text-slate-500 mt-2 font-bold">
                        答錯的題目已收進本週錯題紀錄
                      </p>
                    </div>

                    <button
                      onClick={closeQuiz}
                      className="w-full py-3.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-base rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all shadow-md cursor-pointer"
                    >
                      回去學習地圖
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
