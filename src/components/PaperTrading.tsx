import React, { useEffect, useMemo, useState } from 'react';
import {
  CandlestickChart,
  Wallet,
  TrendingUp,
  TrendingDown,
  FastForward,
  AlertTriangle,
  RotateCcw,
  ClipboardList,
  Lock,
  Info,
} from 'lucide-react';
import { sound } from '../utils/audio';

/* ────────────────────────────────────────────────────────────
   模擬投組（Paper Trading）
   - 虛擬資金 NT$1,000,000，5 檔標的
   - 價格為「以代號字串為種子」的決定論式隨機漫步：
     同一代號、同一天，任何時候重新計算結果都一致（可重現）。
   - 資料存於 localStorage 'levelvest-paper-trading-v1'，
     不影響主存檔 'levelvest-save-v1'。
   ──────────────────────────────────────────────────────────── */

const LS_KEY = 'levelvest-paper-trading-v1';
const INITIAL_CASH = 1_000_000;
const LOT_SIZE = 1000; // 1 張 = 1000 股
const MAX_REASON = 20;

/* ── 標的定義（內建模擬序列，非即時行情） ── */

interface SymbolDef {
  code: string;
  name: string;
  /** 起始價（第 0 日） */
  start: number;
  /** 單日最大波動（近似標準差比例） */
  vol: number;
  /** 每日漂移（drift） */
  drift: number;
}

const SYMBOLS: SymbolDef[] = [
  { code: '2330', name: '台積電', start: 1080, vol: 0.028, drift: 0.0006 },
  { code: '0050', name: '元大台灣50', start: 182, vol: 0.012, drift: 0.0004 },
  { code: '2603', name: '長榮', start: 205, vol: 0.03, drift: -0.0002 },
  { code: '2317', name: '鴻海', start: 168, vol: 0.024, drift: 0.0003 },
  { code: '2412', name: '中華電', start: 128, vol: 0.008, drift: 0.0002 },
];

function getDef(code: string): SymbolDef {
  return SYMBOLS.find((s) => s.code === code) ?? SYMBOLS[0];
}

/* ── 決定論式亂數：FNV-1a hash + mulberry32 ── */

function fnv1a(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 第 day 日的價格（day = 0 為起始價；決定論式、可重現） */
function priceOn(code: string, day: number): number {
  const def = getDef(code);
  let p = def.start;
  for (let i = 1; i <= day; i++) {
    const rnd = mulberry32(fnv1a(`${code}#${i}`));
    // 4 次抽樣取平均 → 近似常態分布，走勢較擬真
    const u = (rnd() + rnd() + rnd() + rnd()) / 4;
    const shock = (u - 0.5) * 2 * def.vol;
    p = p * (1 + def.drift + shock);
    p = Math.max(1, round2(p));
  }
  return p;
}

/** 建立 0..day 的完整價格序列（單次線性掃描，供走勢圖使用） */
function buildSeries(code: string, day: number): number[] {
  const def = getDef(code);
  const out: number[] = [def.start];
  let p = def.start;
  for (let i = 1; i <= day; i++) {
    const rnd = mulberry32(fnv1a(`${code}#${i}`));
    const u = (rnd() + rnd() + rnd() + rnd()) / 4;
    const shock = (u - 0.5) * 2 * def.vol;
    p = Math.max(1, round2(p * (1 + def.drift + shock)));
    out.push(p);
  }
  return out;
}

/* ── 資料型別（專屬本元件，不進共用 types.ts） ── */

export type Emotion = 'FOMO 追高' | '恐慌殺出' | '冷靜計畫';

const EMOTION_OPTIONS: { key: Emotion; label: string; hint: string; cls: string }[] = [
  { key: 'FOMO 追高', label: 'FOMO 追高', hint: '怕錯過行情、急著追價', cls: 'bg-rose-50 border-rose-300 text-rose-600' },
  { key: '恐慌殺出', label: '恐慌殺出', hint: '害怕虧損擴大、急著離場', cls: 'bg-amber-50 border-amber-300 text-amber-600' },
  { key: '冷靜計畫', label: '冷靜計畫', hint: '依計畫執行、進退有據', cls: 'bg-emerald-50 border-emerald-300 text-emerald-600' },
];

function emotionCls(e: Emotion | ''): string {
  if (e === 'FOMO 追高') return 'bg-rose-50 text-rose-600 border-rose-200';
  if (e === '恐慌殺出') return 'bg-amber-50 text-amber-600 border-amber-200';
  if (e === '冷靜計畫') return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  return 'bg-slate-50 text-slate-400 border-slate-200';
}

interface Position {
  shares: number;
  avgCost: number;
  /** 停損價（null = 未設定） */
  stopLoss: number | null;
}

interface TradeRecord {
  id: string;
  day: number;
  time: string;
  side: '買進' | '賣出';
  code: string;
  name: string;
  shares: number;
  price: number;
  amount: number;
  reason: string;
  emotion: Emotion | '';
}

interface PaperState {
  day: number;
  cash: number;
  positions: Record<string, Position>;
  trades: TradeRecord[];
}

interface StopAlert {
  code: string;
  name: string;
  price: number;
  stopLoss: number;
}

function initialState(): PaperState {
  return { day: 0, cash: INITIAL_CASH, positions: {}, trades: [] };
}

/** 讀檔並逐欄校正，資料毀損時回初始狀態，避免白屏 */
function loadPaperState(): PaperState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return initialState();
    const p = JSON.parse(raw) as Partial<PaperState> | null;
    if (!p || typeof p !== 'object') return initialState();
    const positions: Record<string, Position> = {};
    if (p.positions && typeof p.positions === 'object') {
      for (const [code, pos] of Object.entries(p.positions)) {
        if (!pos || typeof pos !== 'object') continue;
        const shares = Number(pos.shares);
        const avgCost = Number(pos.avgCost);
        if (!SYMBOLS.some((s) => s.code === code)) continue;
        if (!Number.isFinite(shares) || shares <= 0 || !Number.isFinite(avgCost) || avgCost <= 0) continue;
        positions[code] = {
          shares: Math.floor(shares),
          avgCost,
          stopLoss:
            typeof pos.stopLoss === 'number' && Number.isFinite(pos.stopLoss) && pos.stopLoss > 0
              ? pos.stopLoss
              : null,
        };
      }
    }
    return {
      day: Number.isFinite(Number(p.day)) && Number(p.day) > 0 ? Math.floor(Number(p.day)) : 0,
      cash: Number.isFinite(Number(p.cash)) ? Number(p.cash) : INITIAL_CASH,
      positions,
      trades: Array.isArray(p.trades) ? p.trades : [],
    };
  } catch {
    return initialState();
  }
}

function persistPaper(state: PaperState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

/* ── 格式化工具 ── */

const money = (n: number) =>
  n.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const priceFmt = (n: number) => n.toFixed(2);
const signed = (n: number) => `${n >= 0 ? '+' : '−'}${money(Math.abs(Math.round(n)))}`;
const pct = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;

/* ── 走勢圖（SVG 自繪） ── */

const CHART_W = 320;
const CHART_H = 168;
const CHART_PAD = 14;

function PriceChart({
  series,
  avgCost,
  stopLoss,
}: {
  series: number[];
  avgCost: number | null;
  stopLoss: number | null;
}) {
  const n = series.length;
  const bounds = [...series];
  if (avgCost !== null) bounds.push(avgCost);
  if (stopLoss !== null) bounds.push(stopLoss);
  const rawMin = Math.min(...bounds);
  const rawMax = Math.max(...bounds);
  const span = rawMax - rawMin || Math.max(rawMax * 0.02, 1);
  const min = rawMin - span * 0.12;
  const max = rawMax + span * 0.12;

  const xAt = (i: number) =>
    n <= 1 ? CHART_W / 2 : CHART_PAD + (i / (n - 1)) * (CHART_W - CHART_PAD * 2);
  const yAt = (v: number) =>
    CHART_H - CHART_PAD - ((v - min) / (max - min)) * (CHART_H - CHART_PAD * 2);

  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`).join(' ');
  const area = `${line} L${xAt(n - 1).toFixed(1)},${CHART_H - CHART_PAD} L${xAt(0).toFixed(1)},${CHART_H - CHART_PAD} Z`;
  const last = series[n - 1];
  const rising = n < 2 || series[n - 1] >= series[0];
  const stroke = rising ? '#0ea5e9' : '#f43f5e';

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-auto select-none"
      role="img"
      aria-label="模擬價格走勢圖"
    >
      <defs>
        <linearGradient id="ptFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* 水平格線 */}
      {[0.25, 0.5, 0.75].map((f) => {
        const y = CHART_PAD + f * (CHART_H - CHART_PAD * 2);
        return <line key={f} x1={CHART_PAD} x2={CHART_W - CHART_PAD} y1={y} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}

      <path d={area} fill="url(#ptFill)" />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* 停損價標記 */}
      {stopLoss !== null && (
        <>
          <line
            x1={CHART_PAD}
            x2={CHART_W - CHART_PAD}
            y1={yAt(stopLoss)}
            y2={yAt(stopLoss)}
            stroke="#ef4444"
            strokeWidth="1.5"
            strokeDasharray="6 4"
          />
          <text x={CHART_PAD + 2} y={yAt(stopLoss) - 4} fontSize="9" fontWeight="700" fill="#ef4444">
            停損 {priceFmt(stopLoss)}
          </text>
        </>
      )}

      {/* 持股成本線 */}
      {avgCost !== null && (
        <>
          <line
            x1={CHART_PAD}
            x2={CHART_W - CHART_PAD}
            y1={yAt(avgCost)}
            y2={yAt(avgCost)}
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x={CHART_PAD + 2} y={yAt(avgCost) - 4} fontSize="9" fontWeight="700" fill="#b45309">
            成本 {priceFmt(avgCost)}
          </text>
        </>
      )}

      {/* 目前價格標記 */}
      <circle cx={xAt(n - 1)} cy={yAt(last)} r="5" fill="#fff" stroke={stroke} strokeWidth="3" />
      <text
        x={Math.min(Math.max(xAt(n - 1), 30), CHART_W - 30)}
        y={Math.max(yAt(last) - 10, 12)}
        fontSize="10"
        fontWeight="800"
        textAnchor="middle"
        fill="#0f172a"
      >
        {priceFmt(last)}
      </text>
    </svg>
  );
}

/* ── 主元件 ── */

interface PaperTradingProps {
  /** 每完成一筆下單回報 App（發放 XP＋推進每日任務）；不傳也可獨立運作 */
  onTrade?: (info: { xp: number }) => void;
}

const TRADE_XP = 10;

export const PaperTrading: React.FC<PaperTradingProps> = ({ onTrade }) => {
  const [state, setState] = useState<PaperState>(() => loadPaperState());
  const [selected, setSelected] = useState<string>(SYMBOLS[0].code);
  const [stopAlerts, setStopAlerts] = useState<StopAlert[]>([]);
  const [resetArmed, setResetArmed] = useState(false);

  // 下單表單
  const [side, setSide] = useState<'買進' | '賣出'>('買進');
  const [orderCode, setOrderCode] = useState<string>(SYMBOLS[0].code);
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState<'張' | '股'>('張');
  const [reason, setReason] = useState('');
  const [emotion, setEmotion] = useState<Emotion | ''>('');
  const [formError, setFormError] = useState('');

  // 停損設定錯誤提示（key → message）
  const [stopErr, setStopErr] = useState<Record<string, string>>({});

  useEffect(() => {
    persistPaper(state);
  }, [state]);

  const seriesByCode = useMemo(() => {
    const map: Record<string, number[]> = {};
    for (const s of SYMBOLS) map[s.code] = buildSeries(s.code, state.day);
    return map;
  }, [state.day]);

  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of SYMBOLS) map[s.code] = seriesByCode[s.code][state.day];
    return map;
  }, [seriesByCode, state.day]);

  const stockValue = useMemo(
    () =>
      Object.entries(state.positions).reduce(
        (sum, [code, pos]) => sum + pos.shares * (prices[code] ?? 0),
        0
      ),
    [state.positions, prices]
  );

  const totalAssets = state.cash + stockValue;
  const totalReturnPct = ((totalAssets - INITIAL_CASH) / INITIAL_CASH) * 100;
  const holdingCount = Object.keys(state.positions).length;
  const tradeCount = state.trades.length;

  const sharesFromInput = (): number => {
    const q = Number(qty);
    if (!Number.isFinite(q) || q <= 0) return 0;
    const shares = unit === '張' ? Math.round(q) * LOT_SIZE : Math.round(q);
    return shares;
  };

  const orderShares = sharesFromInput();
  const orderPrice = prices[orderCode] ?? 0;
  const orderAmount = orderShares * orderPrice;

  /* ── 推進一天：所有標的價格前進一格，並檢查停損 ── */
  const handleAdvance = () => {
    sound.playClick();
    const nextDay = state.day + 1;
    const alerts: StopAlert[] = [];
    const positions = { ...state.positions };
    for (const [code, pos] of Object.entries(positions)) {
      if (pos.stopLoss === null) continue;
      const p = priceOn(code, nextDay);
      if (p <= pos.stopLoss) {
        alerts.push({ code, name: getDef(code).name, price: p, stopLoss: pos.stopLoss });
      }
    }
    setStopAlerts(alerts);
    setResetArmed(false);
    setState((prev) => ({ ...prev, day: nextDay }));
    if (alerts.length > 0) sound.playError();
  };

  /* ── 下單 ── */
  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const def = getDef(orderCode);
    const shares = sharesFromInput();
    const price = prices[orderCode] ?? 0;
    const amount = shares * price;
    const trimmed = reason.trim();

    if (shares <= 0) {
      setFormError('請輸入大於 0 的股數。');
      sound.playError();
      return;
    }
    if (!Number.isInteger(Number(qty))) {
      setFormError(`股數需為整數（1 張 = ${LOT_SIZE} 股），請調整數量。`);
      sound.playError();
      return;
    }
    // 紀律訓練：買進前必須填寫投資理由（20 字內）與情緒標記
    if (side === '買進') {
      if (trimmed.length === 0) {
        setFormError('買進前必須填寫投資理由（20 字內）——先想清楚再下單。');
        sound.playError();
        return;
      }
      if (trimmed.length > MAX_REASON) {
        setFormError(`投資理由請控制在 ${MAX_REASON} 字內。`);
        sound.playError();
        return;
      }
      if (emotion === '') {
        setFormError('買進前必須完成情緒標記（FOMO 追高／恐慌殺出／冷靜計畫）。');
        sound.playError();
        return;
      }
      if (amount > state.cash) {
        setFormError(`現金不足：本筆需 NT$${money(Math.round(amount))}，帳上僅 NT$${money(Math.round(state.cash))}。`);
        sound.playError();
        return;
      }
    } else {
      const held = state.positions[orderCode]?.shares ?? 0;
      if (shares > held) {
        setFormError(`持股不足：目前僅持有 ${money(held)} 股 ${def.name}。`);
        sound.playError();
        return;
      }
      if (trimmed.length > MAX_REASON) {
        setFormError(`投資理由請控制在 ${MAX_REASON} 字內。`);
        sound.playError();
        return;
      }
    }

    const record: TradeRecord = {
      id: `pt-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      day: state.day,
      time: new Date().toLocaleString('zh-TW', { hour12: false }),
      side,
      code: orderCode,
      name: def.name,
      shares,
      price,
      amount,
      reason: trimmed,
      emotion,
    };

    setState((prev) => {
      const positions = { ...prev.positions };
      const existing = positions[orderCode];
      if (side === '買進') {
        const newShares = (existing?.shares ?? 0) + shares;
        const newCost =
          ((existing?.shares ?? 0) * (existing?.avgCost ?? 0) + amount) / newShares;
        positions[orderCode] = {
          shares: newShares,
          avgCost: round2(newCost),
          stopLoss: existing?.stopLoss ?? null,
        };
        return { ...prev, cash: prev.cash - amount, positions, trades: [record, ...prev.trades] };
      }
      const remain = (existing?.shares ?? 0) - shares;
      if (remain <= 0) delete positions[orderCode];
      else positions[orderCode] = { ...existing!, shares: remain };
      return { ...prev, cash: prev.cash + amount, positions, trades: [record, ...prev.trades] };
    });

    // 清空表單（保留標的與方向，方便連續操作）
    setReason('');
    if (side === '買進') setEmotion('');
    setFormError('');
    setStopAlerts([]);
    sound.playSuccess();
    // 串進遊戲經濟：XP＋每日任務（App 端處理；未接線時靜默忽略）
    onTrade?.({ xp: TRADE_XP });
  };

  /* ── 停損價設定 ── */
  const handleStopChange = (code: string, raw: string) => {
    const current = prices[code] ?? 0;
    // 未持有該標的時不建立殘缺持倉（會產生 NaN 損益）
    if (!state.positions[code]) return;
    if (raw === '') {
      setState((prev) => {
        const pos = prev.positions[code];
        if (!pos) return prev;
        return {
          ...prev,
          positions: { ...prev.positions, [code]: { ...pos, stopLoss: null } },
        };
      });
      setStopErr((e) => ({ ...e, [code]: '' }));
      return;
    }
    const v = Number(raw);
    if (!Number.isFinite(v) || v <= 0) {
      setStopErr((e) => ({ ...e, [code]: '停損價須大於 0' }));
      sound.playError();
      return;
    }
    if (v >= current) {
      setStopErr((e) => ({ ...e, [code]: `須低於現價 ${priceFmt(current)}` }));
      sound.playError();
      return;
    }
    setStopErr((e) => ({ ...e, [code]: '' }));
    setState((prev) => {
      const pos = prev.positions[code];
      if (!pos) return prev;
      return {
        ...prev,
        positions: { ...prev.positions, [code]: { ...pos, stopLoss: round2(v) } },
      };
    });
  };

  const handleReset = () => {
    if (!resetArmed) {
      setResetArmed(true);
      sound.playClick();
      return;
    }
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setState(initialState());
    setStopAlerts([]);
    setResetArmed(false);
    setFormError('');
    setStopErr({});
    setSelected(SYMBOLS[0].code);
    sound.playClick();
  };

  const chartDef = getDef(selected);
  const chartSeries = seriesByCode[selected];
  const chartPos = state.positions[selected];
  const chartPrev = state.day > 0 ? chartSeries[state.day - 1] : chartSeries[0];
  const chartLast = chartSeries[state.day];
  const chartChange = ((chartLast - chartPrev) / chartPrev) * 100;

  const selectedPos = state.positions[orderCode];
  const sellHeld = selectedPos?.shares ?? 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-5">
      {/* ── 標頭 + 免責聲明 ── */}
      <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-3xl p-5 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1.5">
          <CandlestickChart className="w-5 h-5 text-sky-200" />
          <span className="text-xs font-black tracking-wider uppercase text-sky-100">
            Paper Trading · 模擬投組
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black mb-1">先練紀律，再投真錢</h2>
        <p className="text-xs sm:text-sm text-sky-100 font-medium leading-relaxed">
          虛擬資金 NT$1,000,000，用內建的決定論式模擬走勢練習下單、停損與情緒管理。
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-2xl border-2 border-amber-300 bg-amber-50 px-3.5 py-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[11px] font-bold text-amber-800 leading-relaxed">
          模擬數據、非即時行情、僅供學習，不構成投資建議。價格由代號字串作為種子的決定論式隨機漫步產生，
          推進天數相同則結果永遠一致。
        </p>
      </div>

      {/* ── 帳戶總覽 ── */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Wallet className="w-4 h-4" />
              <span className="text-[11px] font-black">模擬總資產</span>
            </div>
            <p className="text-2xl font-black text-slate-800 tabular-nums">NT${money(Math.round(totalAssets))}</p>
            <p className={`text-xs font-black mt-0.5 tabular-nums ${totalReturnPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {totalReturnPct >= 0 ? <TrendingUp className="w-3.5 h-3.5 inline -mt-0.5" /> : <TrendingDown className="w-3.5 h-3.5 inline -mt-0.5" />}{' '}
              {pct(totalReturnPct)}（vs 起始資金）
            </p>
          </div>
          <button
            onClick={handleAdvance}
            className="flex items-center gap-1.5 bg-[#58CC02] hover:bg-[#4cb502] text-white font-black text-sm px-4 py-2.5 rounded-2xl border-b-4 border-[#3e9302] active:border-b-0 active:translate-y-1 transition-all cursor-pointer"
          >
            <FastForward className="w-4 h-4" />
            推進一天
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { label: '現金', value: `NT$${money(Math.round(state.cash))}`, cls: 'text-slate-800 bg-slate-50' },
            { label: '股票市值', value: `NT$${money(Math.round(stockValue))}`, cls: 'text-sky-700 bg-sky-50' },
            { label: '交易日 / 筆數', value: `第 ${state.day} 日 · ${tradeCount} 筆`, cls: 'text-indigo-700 bg-indigo-50' },
          ].map((c) => (
            <div key={c.label} className={`rounded-2xl p-2.5 text-center border border-slate-100 ${c.cls}`}>
              <p className="text-[13px] sm:text-sm font-black tabular-nums leading-tight">{c.value}</p>
              <p className="text-[10px] font-bold opacity-70 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 停損警示 ── */}
      {stopAlerts.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-400 bg-rose-50 p-4 shadow-xs rise-in" role="alert">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="font-black text-sm text-rose-700">停損警示：價格已觸及停損價！</h3>
            <button
              onClick={() => {
                sound.playClick();
                setStopAlerts([]);
              }}
              className="ml-auto text-[11px] font-black text-rose-400 hover:text-rose-600 cursor-pointer"
            >
              忽略
            </button>
          </div>
          <ul className="space-y-1">
            {stopAlerts.map((a) => (
              <li key={a.code} className="text-xs font-bold text-rose-700 tabular-nums">
                {a.code} {a.name}：現價 {priceFmt(a.price)} ≤ 停損價 {priceFmt(a.stopLoss)}（-
                {(((a.stopLoss - a.price) / a.price) * 100).toFixed(2)}%）
                —— 請依計畫執行紀律賣出。
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── 走勢圖 ── */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5">
            <CandlestickChart className="w-4 h-4 text-sky-500" />
            模擬走勢圖
          </h3>
          <span className="text-[10px] font-black text-slate-400">第 {state.day} 個模擬交易日</span>
        </div>

        {/* 標的選擇 chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {SYMBOLS.map((s) => {
            const p = prices[s.code];
            const prev = state.day > 0 ? seriesByCode[s.code][state.day - 1] : s.start;
            const chg = ((p - prev) / prev) * 100;
            const held = state.positions[s.code];
            const active = selected === s.code;
            return (
              <button
                key={s.code}
                onClick={() => {
                  sound.playClick();
                  setSelected(s.code);
                  setOrderCode(s.code); // 圖上選的標的與下單表單連動，避免看圖買別檔
                }}
                className={`shrink-0 rounded-2xl border-2 px-2.5 py-1.5 text-left transition-all cursor-pointer ${
                  active
                    ? 'border-sky-400 bg-sky-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-black text-slate-700">{s.name}</span>
                  {held && (
                    <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-1 rounded-full">持股</span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-black text-slate-800 tabular-nums">{priceFmt(p)}</span>
                  <span className={`text-[10px] font-black tabular-nums ${chg >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {pct(chg)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-1">
          <PriceChart
            series={chartSeries}
            avgCost={chartPos ? chartPos.avgCost : null}
            stopLoss={chartPos?.stopLoss ?? null}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mt-1">
          <span>
            {chartDef.code} {chartDef.name} · 目前持{' '}
            {chartPos ? `${money(chartPos.shares)} 股` : '未持股'}
          </span>
          <span className={chartChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
            單日 {pct(chartChange)}
          </span>
        </div>
        <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-1">
          <Info className="w-3 h-3" /> 模擬數據、非即時行情、僅供學習，不構成投資建議。
        </p>
      </div>

      {/* ── 下單（含紀律訓練） ── */}
      <form onSubmit={handleOrder} className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-xs">
        <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 mb-3">
          <Lock className="w-4 h-4 text-indigo-500" />
          下單 · 下單前紀律訓練
        </h3>

        {/* 買賣方向 */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex items-center gap-1 mb-3">
          {(['買進', '賣出'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                sound.playClick();
                setSide(s);
                setFormError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                side === s
                  ? s === '買進'
                    ? 'bg-white text-emerald-600 shadow-md scale-[1.02]'
                    : 'bg-white text-rose-600 shadow-md scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="block">
            <span className="text-[11px] font-black text-slate-500">標的</span>
            <select
              value={orderCode}
              onChange={(e) => {
                setOrderCode(e.target.value);
                setFormError('');
              }}
              className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 focus:border-sky-400 outline-none cursor-pointer"
            >
              {SYMBOLS.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code} {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[11px] font-black text-slate-500">數量（1 張 = 1000 股）</span>
            <div className="mt-1 flex gap-1.5">
              <input
                type="number"
                min={1}
                step={1}
                value={qty}
                onChange={(e) => {
                  setQty(e.target.value);
                  setFormError('');
                }}
                inputMode="numeric"
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 tabular-nums focus:border-sky-400 outline-none"
              />
              <div className="shrink-0 flex rounded-xl border-2 border-slate-200 overflow-hidden">
                {(['張', '股'] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setUnit(u);
                    }}
                    className={`px-2 text-[11px] font-black cursor-pointer transition-colors ${
                      unit === u ? 'bg-sky-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </label>
        </div>

        <div className="mt-2.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600 flex justify-between tabular-nums">
          <span>
            市價 {priceFmt(orderPrice)} × {money(orderShares)} 股
          </span>
          <span className="text-slate-800 font-black">小計 NT${money(Math.round(orderAmount))}</span>
        </div>

        {side === '賣出' && (
          <p className="mt-2 text-[11px] font-bold text-slate-500">
            目前持有 {getDef(orderCode).name}：{money(sellHeld)} 股
            {selectedPos ? `（均價 ${priceFmt(selectedPos.avgCost)}）` : ''}
          </p>
        )}

        {/* 理由 + 情緒（買進必填） */}
        <div className="mt-3 space-y-2.5">
          <label className="block">
            <span className="text-[11px] font-black text-slate-600">
              投資理由{side === '買進' ? <span className="text-rose-500">＊必填</span> : <span className="text-slate-400">（選填）</span>}
              <span className="ml-1 text-slate-400 font-bold">{reason.trim().length}/{MAX_REASON} 字</span>
            </span>
            <input
              type="text"
              value={reason}
              maxLength={MAX_REASON}
              onChange={(e) => {
                setReason(e.target.value);
                setFormError('');
              }}
              placeholder="例：突破月線、量增價穩，順勢小倉試單"
              className="mt-1 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-medium focus:border-sky-400 outline-none"
            />
          </label>

          <div>
            <span className="text-[11px] font-black text-slate-600">
              情緒標記{side === '買進' ? <span className="text-rose-500">＊必填</span> : <span className="text-slate-400">（選填）</span>}
            </span>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              {EMOTION_OPTIONS.map((o) => {
                const active = emotion === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setEmotion(active ? '' : o.key);
                      setFormError('');
                    }}
                    aria-pressed={active}
                    className={`rounded-xl border-2 px-1.5 py-2 text-center transition-all cursor-pointer ${
                      active ? `${o.cls} shadow-sm scale-[1.02]` : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-[11px] font-black leading-tight">{o.label}</span>
                    <span className="block text-[9px] font-bold opacity-70 mt-0.5 leading-tight">{o.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {formError && (
          <p className="mt-2.5 text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {formError}
          </p>
        )}

        <button
          type="submit"
          className={`mt-3 w-full font-black text-sm py-3 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer ${
            side === '買進'
              ? 'bg-[#58CC02] hover:bg-[#4cb502] border-[#3e9302] text-white'
              : 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white'
          }`}
        >
          {side === '買進' ? `依市價買進 ${money(orderShares)} 股` : `依市價賣出 ${money(orderShares)} 股`}
        </button>
        <p className="mt-1.5 text-[10px] font-bold text-slate-400 text-center">
          {side === '買進'
            ? '紀律提醒：沒有理由與情緒標記，就不能下單。'
            : '賣出也會一併記錄你填寫的理由與情緒。'}
        </p>
      </form>

      {/* ── 持倉表 ── */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-xs">
        <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 mb-3">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          目前持倉（{holdingCount} 檔）
        </h3>
        {holdingCount === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-6">
            尚無持倉——先寫好理由，再買進第一檔吧。
          </p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px] min-w-[420px]">
              <thead>
                <tr className="text-slate-400 font-black border-b border-slate-100">
                  <th className="text-left py-1.5">標的</th>
                  <th className="text-right py-1.5">股數</th>
                  <th className="text-right py-1.5">均價 / 現價</th>
                  <th className="text-right py-1.5">市值</th>
                  <th className="text-right py-1.5">未實現損益</th>
                  <th className="text-right py-1.5">停損價</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(state.positions).map(([code, pos]) => {
                  const cur = prices[code] ?? 0;
                  const value = pos.shares * cur;
                  const cost = pos.shares * pos.avgCost;
                  const pl = value - cost;
                  const plPct = (pl / cost) * 100;
                  const triggered = pos.stopLoss !== null && cur <= pos.stopLoss;
                  return (
                    <tr key={code} className="border-b border-slate-50 align-middle">
                      <td className="py-2">
                        <div className="font-black text-slate-800">{getDef(code).name}</div>
                        <div className="text-slate-400 font-bold tabular-nums">{code}</div>
                      </td>
                      <td className="text-right font-bold text-slate-700 tabular-nums">
                        {money(pos.shares)}
                      </td>
                      <td className="text-right font-bold tabular-nums">
                        <div className="text-slate-600">{priceFmt(pos.avgCost)}</div>
                        <div className={cur >= pos.avgCost ? 'text-emerald-600' : 'text-rose-600'}>
                          {priceFmt(cur)}
                        </div>
                      </td>
                      <td className="text-right font-bold text-slate-700 tabular-nums">
                        {money(Math.round(value))}
                      </td>
                      <td className="text-right font-black tabular-nums">
                        <div className={pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{signed(pl)}</div>
                        <div className={pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{pct(plPct)}</div>
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          step="0.05"
                          min={0}
                          defaultValue={pos.stopLoss !== null ? pos.stopLoss : ''}
                          key={`${code}-${pos.stopLoss ?? 'none'}`}
                          placeholder="未設定"
                          onChange={(e) => handleStopChange(code, e.target.value)}
                          className={`w-20 rounded-lg border-2 px-1.5 py-1 text-[11px] font-bold tabular-nums text-right outline-none ${
                            triggered
                              ? 'border-rose-400 bg-rose-50 text-rose-600'
                              : 'border-slate-200 bg-slate-50 text-slate-700 focus:border-sky-400'
                          }`}
                        />
                        {stopErr[code] && (
                          <div className="text-[9px] font-black text-rose-500 mt-0.5">{stopErr[code]}</div>
                        )}
                        {triggered && (
                          <div className="text-[9px] font-black text-rose-600 mt-0.5">已觸及！</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 交易紀錄 ── */}
      <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-xs">
        <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 mb-3">
          <ClipboardList className="w-4 h-4 text-indigo-500" />
          交易紀錄（{tradeCount} 筆）
        </h3>
        {tradeCount === 0 ? (
          <p className="text-xs font-bold text-slate-400 text-center py-6">尚無交易紀錄。</p>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full text-[11px] min-w-[520px]">
              <thead>
                <tr className="text-slate-400 font-black border-b border-slate-100">
                  <th className="text-left py-1.5">時間</th>
                  <th className="text-left py-1.5">方向</th>
                  <th className="text-left py-1.5">標的</th>
                  <th className="text-right py-1.5">股數</th>
                  <th className="text-right py-1.5">價格</th>
                  <th className="text-right py-1.5">金額</th>
                  <th className="text-left py-1.5 pl-2">理由 / 情緒</th>
                </tr>
              </thead>
              <tbody>
                {state.trades.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-500 font-bold tabular-nums whitespace-nowrap">
                      D{t.day} <span className="hidden sm:inline">{t.time.slice(5)}</span>
                      <span className="sm:hidden block text-[9px]">{t.time.slice(5)}</span>
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-black border ${
                          t.side === '買進'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border-rose-200'
                        }`}
                      >
                        {t.side}
                      </span>
                    </td>
                    <td className="py-2 font-bold text-slate-700 whitespace-nowrap">
                      {t.name}
                      <span className="text-slate-400 tabular-nums"> {t.code}</span>
                    </td>
                    <td className="py-2 text-right font-bold text-slate-700 tabular-nums">{money(t.shares)}</td>
                    <td className="py-2 text-right font-bold text-slate-700 tabular-nums">{priceFmt(t.price)}</td>
                    <td className="py-2 text-right font-black text-slate-800 tabular-nums">
                      {money(Math.round(t.amount))}
                    </td>
                    <td className="py-2 pl-2">
                      <div className="text-slate-600 font-bold leading-tight">
                        {t.reason || <span className="text-slate-300">—</span>}
                      </div>
                      <span
                        className={`inline-block mt-0.5 px-1.5 py-px rounded-full text-[9px] font-black border ${emotionCls(
                          t.emotion
                        )}`}
                      >
                        {t.emotion || '未記錄'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 頁尾：重置 ── */}
      <div className="bg-slate-50 rounded-3xl p-4 border-2 border-dashed border-slate-200 text-center">
        <p className="text-[11px] font-bold text-slate-500 leading-relaxed mb-2.5">
          資料僅存於這台裝置的瀏覽器（key：<span className="font-black">levelvest-paper-trading-v1</span>），
          與主存檔互不影響。
        </p>
        <button
          onClick={handleReset}
          onBlur={() => setResetArmed(false)}
          className={`inline-flex items-center gap-1.5 font-black text-xs px-4 py-2.5 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer ${
            resetArmed
              ? 'bg-rose-500 hover:bg-rose-600 border-rose-700 text-white'
              : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {resetArmed ? '再按一次確認重置模擬帳號' : '重置模擬帳號'}
        </button>
      </div>
    </div>
  );
};
