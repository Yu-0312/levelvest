import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Star,
  Layers,
  Flame,
  Gem,
  CalendarCheck2,
  Crosshair,
  BookMarked,
  Award,
  RefreshCw,
  Sparkles,
  Inbox,
} from 'lucide-react';
import { curriculum, findLesson } from '../data/curriculum';
import { sound } from '../utils/audio';
import type { BehavioralBadge, DailyState, TradeDecision, UserStats } from '../types';

/* ════════════════════════════════════════════════════════════
   存檔讀取（唯讀）：只從 'levelvest-save-v1' 讀取，絕不寫入
   歷史快照另存本元件專屬 key 'levelvest-dashboard-v1'
   ════════════════════════════════════════════════════════════ */

const SAVE_KEY = 'levelvest-save-v1';
const DASH_KEY = 'levelvest-dashboard-v1';

/** 讀取用的寬鬆型別：欄位可能缺漏，全部以 optional 兜底 */
interface SaveLike {
  stats?: Partial<UserStats>;
  progress?: Record<string, { stars?: number; completed?: boolean; skipped?: boolean }>;
  missed?: Record<string, number>;
  daily?: DailyState;
  trades?: TradeDecision[];
  badges?: BehavioralBadge[];
}

function readSave(): SaveLike | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as SaveLike;
  } catch {
    return null;
  }
}

/** 每日任務達成率快照（本元件專屬儲存） */
interface DaySnapshot {
  date: string;
  done: number;
  target: number;
}

function readSnapshots(): DaySnapshot[] {
  try {
    const raw = window.localStorage.getItem(DASH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (s): s is DaySnapshot =>
          !!s &&
          typeof s === 'object' &&
          typeof (s as DaySnapshot).date === 'string' &&
          typeof (s as DaySnapshot).done === 'number' &&
          typeof (s as DaySnapshot).target === 'number'
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  } catch {
    return [];
  }
}

/** 同一天只記錄一次；回傳新的快照陣列（不負責寫入） */
function withToday(prev: DaySnapshot[], date: string, done: number, target: number): DaySnapshot[] {
  if (prev.some((s) => s.date === date)) return prev;
  const next = [...prev, { date, done, target }].sort((a, b) => a.date.localeCompare(b.date));
  return next.slice(-60);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/* ════════════════════════════════════════════════════════════
   小型純 CSS / SVG 視覺元件（不引入任何繪圖依赖）
   ════════════════════════════════════════════════════════════ */

function Card({
  title,
  icon,
  accent = 'text-sky-500',
  hint,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accent?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm">
      <header className="flex items-center gap-2 mb-3">
        <span className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center ${accent}`}>
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-black text-sm text-slate-800 leading-tight">{title}</h3>
          {hint && <p className="text-[10px] text-slate-400 font-bold leading-tight">{hint}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

/** SVG 圓環：整體完成率 */
function Donut({ pct, caption }: { pct: number; caption: string }) {
  const size = 118;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const dash = (clamped / 100) * circ;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={caption}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#38BDF8"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-slate-800 leading-none">
          {Math.round(clamped)}
          <span className="text-sm">%</span>
        </span>
        <span className="text-[10px] font-black text-slate-400 mt-0.5">{caption}</span>
      </div>
    </div>
  );
}

/** 橫向長條（百分比） */
function Bar({ pct, color = 'bg-sky-400', track = 'bg-slate-100' }: { pct: number; color?: string; track?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className={`h-2.5 rounded-full overflow-hidden ${track}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
      <Inbox className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
      <p className="text-xs font-bold text-slate-500 leading-relaxed">{text}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   「給永豐的營運視角」：以下皆為示意數據（機構 demo 用）
   ════════════════════════════════════════════════════════════ */

/** 學習 → 開戶轉換漏斗（示意） */
const FUNNEL = [
  { label: '開啟 App／曝光', pct: 100 },
  { label: '完成起跑測驗', pct: 74 },
  { label: '開始第一堂課', pct: 61 },
  { label: '完成首章（達 BOSS）', pct: 38 },
  { label: '點擊模擬開戶 CTA', pct: 12 },
];

/** 留存曲線（示意，D0–D14） */
const RETENTION = [
  { d: 'D0', v: 100 },
  { d: 'D1', v: 63 },
  { d: 'D3', v: 49 },
  { d: 'D7', v: 42 },
  { d: 'D14', v: 36 },
];

const EVENTS = [
  'onboarding_complete：完成起跑測驗（含程度、風險屬性分層）',
  'lesson_start／lesson_complete：關卡開始、完成與星星數（學習成效主指標）',
  'question_miss：題目 key 與答錯次數（弱點雷達、題庫調參）',
  'daily_task_done：每日任務三項達成與連續天數（留存代理指標）',
  'section_unlock：章節解鎖節奏（課程漏斗各層來源）',
  'journal_entry：決策日記新增與多空立場（行為金融參與度）',
  'badge_unlock：徽章解鎖（遊戲化激勵成效）',
  'open_account_cta_click：模擬開戶 CTA 點擊（轉換漏斗末端）',
];

function RetentionChart() {
  const w = 300;
  const h = 132;
  const padX = 22;
  const padY = 14;
  const pts = RETENTION.map((p, i) => {
    const x = padX + (i * (w - padX * 2)) / (RETENTION.length - 1);
    const y = padY + (1 - p.v / 100) * (h - padY * 2 - 16);
    return { ...p, x, y };
  });
  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padX},${h - padY} ${poly} ${w - padX},${h - padY}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="示意留存曲線">
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={padX}
          x2={w - padX}
          y1={padY + t * (h - padY * 2 - 16)}
          y2={padY + t * (h - padY * 2 - 16)}
          stroke="#E2E8F0"
          strokeDasharray="3 4"
          strokeWidth="1"
        />
      ))}
      <polygon points={area} fill="#38BDF8" opacity="0.12" />
      <polyline points={poly} fill="none" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.d}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#0EA5E9" strokeWidth="2.5" />
          <text x={p.x} y={h - 2} textAnchor="middle" fontSize="9" fontWeight="700" fill="#94A3B8">
            {p.d}
          </text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fontWeight="900" fill="#0284C7">
            {p.v}%
          </text>
        </g>
      ))}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════
   主元件
   ════════════════════════════════════════════════════════════ */

/** 決策日記立場分類：買進＝看多、賣出／停損＝看空、空手＝觀望 */
function stanceOf(action: TradeDecision['action']): '多' | '空' | '觀望' {
  if (action === '買進試單') return '多';
  if (action === '空手觀望') return '觀望';
  return '空';
}

const WEEKDAY = ['日', '一', '二', '三', '四', '五', '六'];

export const LearningDashboard: React.FC = () => {
  /** 存檔只在進來時讀一次（唯讀），刷新按鈕可重新讀取 */
  const [reloadKey, setReloadKey] = useState(0);
  const save = useMemo(() => readSave(), [reloadKey]);
  const [snapshots, setSnapshots] = useState<DaySnapshot[]>(() => readSnapshots());

  const stats = save?.stats ?? {};
  const progress = save?.progress ?? {};
  const missed = save?.missed ?? {};
  const daily = save?.daily;
  const trades = Array.isArray(save?.trades) ? save.trades : [];
  const badges = Array.isArray(save?.badges) ? save.badges : [];

  const hasAnyData = useMemo(
    () => Object.keys(progress).length > 0 || trades.length > 0 || Object.keys(missed).length > 0,
    [progress, trades, missed]
  );

  // ── 每日任務達成率：mount 時寫入當日快照（同日不重複寫） ──
  useEffect(() => {
    if (!daily || !Array.isArray(daily.tasks) || daily.tasks.length === 0) return;
    const done = daily.tasks.reduce((s, t) => s + Math.max(0, Math.min(Number(t.done) || 0, t.target)), 0);
    const target = daily.tasks.reduce((s, t) => s + (Number(t.target) || 0), 0);
    const next = withToday(readSnapshots(), todayKey(), done, target);
    if (next.length !== snapshots.length || next[next.length - 1]?.date !== snapshots[snapshots.length - 1]?.date) {
      try {
        window.localStorage.setItem(DASH_KEY, JSON.stringify(next));
      } catch {
        /* 忽略配額錯誤 */
      }
      setSnapshots(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daily]);

  /* ── 章節完成率 ── */
  const sections = useMemo(
    () =>
      curriculum.map((s) => {
        const total = s.lessons.length;
        const done = s.lessons.filter((l) => progress[l.id]?.completed).length;
        return { id: s.id, code: s.code, title: s.title, badge: s.badge, color: s.color, done, total };
      }),
    [progress]
  );
  const totalDone = sections.reduce((sum, s) => sum + s.done, 0);
  const totalLessons = sections.reduce((sum, s) => sum + s.total, 0);
  const overallPct = totalLessons > 0 ? (totalDone / totalLessons) * 100 : 0;
  const sectionsCleared = sections.filter((s) => s.total > 0 && s.done === s.total).length;

  /* ── 星等分布 ── */
  const stars = useMemo(() => {
    const dist = [0, 0, 0, 0];
    for (const entry of Object.values(progress)) {
      if (!entry?.completed) continue;
      const s = Math.round(entry.stars ?? 0);
      // 以「跳關」越過的關卡沒有實際作答（stars = 0），不計入星等
      if (s < 1) continue;
      dist[Math.min(3, s)] += 1;
    }
    return { one: dist[1], two: dist[2], three: dist[3], rated: dist[1] + dist[2] + dist[3] };
  }, [progress]);

  /* ── 每日任務近 7 天 ── */
  const week = useMemo(() => {
    const map = new Map(snapshots.map((s) => [s.date, s]));
    const out: { date: string; label: string; rate: number | null }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      // 以 UTC 日曆日推算，與 todayKey()（toISOString）保持同一套日期基準
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const key = d.toISOString().slice(0, 10);
      const snap = map.get(key);
      out.push({
        date: key,
        label: i === 0 ? '今天' : WEEKDAY[d.getUTCDay()],
        rate: snap && snap.target > 0 ? Math.min(100, (snap.done / snap.target) * 100) : null,
      });
    }
    return out;
  }, [snapshots]);
  const recordedDays = week.filter((w) => w.rate !== null);
  const avgRate =
    recordedDays.length > 0
      ? recordedDays.reduce((s, d) => s + (d.rate ?? 0), 0) / recordedDays.length
      : null;

  /* ── 弱點分析：最常錯的關卡 TOP 5 ── */
  const weak = useMemo(() => {
    const agg = new Map<string, { lessonId: string; misses: number; wrongQs: number; title: string; code: string; section: string; color: string }>();
    for (const [key, count] of Object.entries(missed)) {
      const n = Number(count);
      if (!Number.isFinite(n) || n <= 0) continue;
      const lessonId = key.split('#')[0];
      const found = findLesson(lessonId);
      if (!found) continue;
      const cur = agg.get(lessonId);
      if (cur) {
        cur.misses += n;
        cur.wrongQs += 1;
      } else {
        agg.set(lessonId, {
          lessonId,
          misses: n,
          wrongQs: 1,
          title: found.lesson.title,
          code: found.lesson.code,
          section: found.section.title,
          color: found.section.color,
        });
      }
    }
    return [...agg.values()].sort((a, b) => b.misses - a.misses).slice(0, 5);
  }, [missed]);
  const weakMax = weak.length > 0 ? weak[0].misses : 0;
  const totalMisses = Object.values(missed).reduce((s, v) => s + (Number(v) || 0), 0);

  /* ── 決策日記統計 ── */
  const journal = useMemo(() => {
    const tally = { 多: 0, 空: 0, 觀望: 0 };
    for (const t of trades) tally[stanceOf(t.action)] += 1;
    const total = trades.length;
    return {
      total,
      tally,
      rows: [
        { key: '多' as const, label: '看多（買進試單）', color: 'bg-emerald-400', text: 'text-emerald-600' },
        { key: '空' as const, label: '看空（獲利了結／停損）', color: 'bg-rose-400', text: 'text-rose-500' },
        { key: '觀望' as const, label: '觀望（空手）', color: 'bg-slate-400', text: 'text-slate-500' },
      ].map((r) => ({ ...r, count: tally[r.key], pct: total > 0 ? (tally[r.key] / total) * 100 : 0 })),
    };
  }, [trades]);
  const badgesUnlocked = badges.filter((b) => b.unlocked).length;

  /* ── 等級 / XP ── */
  const level = stats.level ?? 1;
  const xp = stats.xp ?? 0;
  const nextLevelXp = Math.max(1, stats.nextLevelXp ?? 100);
  const xpPct = Math.min(100, (xp / nextLevelXp) * 100);
  const title = stats.title || '投資見習生';

  return (
    <div className="flex-1 max-w-xl mx-auto w-full px-4 py-4 pb-24 space-y-4">
      {/* 頁首 */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-sm flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
          <BarChart3 className="w-6 h-6 text-sky-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-black text-lg text-slate-800 leading-tight">學習成效儀表板</h2>
          <p className="text-[11px] text-slate-500 font-bold leading-snug mt-0.5">
            從闖關、錯題到決策紀律，一次看懂自己的學習軌跡
          </p>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            setReloadKey((k) => k + 1);
          }}
          aria-label="重新讀取存檔"
          className="w-9 h-9 rounded-xl border-2 border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-500 hover:border-sky-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {!hasAnyData && (
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#F0FFF4] border-2 border-emerald-100 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#58CC02]" />
          </div>
          <h3 className="font-black text-base text-slate-800">還沒有學習資料</h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed mt-1.5">
            先回「學習地圖」完成第一堂課、寫第一則決策日記，
            <br />
            這裡就會開始累積你的章節進度、星等與弱點雷達囉！
          </p>
        </div>
      )}

      {/* ── 等級 / XP / 稱號 ── */}
      <Card title="等級與稱號" icon={<Flame className="w-4 h-4" />} accent="text-amber-500" hint="累積 XP 會提升等級並解鎖稱號">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-sm">
              <span className="text-2xl font-black text-white leading-none">{level}</span>
            </div>
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded-full">
              LV
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-sm text-slate-800 truncate">{title}</span>
              <span className="text-[11px] font-black text-slate-400 shrink-0">
                {xp} / {nextLevelXp} XP
              </span>
            </div>
            <div className="mt-1.5">
              <Bar pct={xpPct} color="bg-gradient-to-r from-amber-400 to-amber-500" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              距離下一級還差 {Math.max(0, nextLevelXp - xp)} XP
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-50 text-orange-600">
                <Flame className="w-3 h-3" /> 連續 {stats.streak ?? 0} 天
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
                <Gem className="w-3 h-3" /> {stats.gems ?? 0} 寶石
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── 章節完成率 ── */}
      <Card title="章節完成率" icon={<Layers className="w-4 h-4" />} accent="text-sky-500" hint="每一章 N/M 關完成進度">
        <div className="flex items-center gap-4 mb-4">
          <Donut pct={overallPct} caption="整體進度" />
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <p className="text-[10px] font-black text-slate-400">已完成關卡</p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {totalDone}
                <span className="text-sm text-slate-400"> / {totalLessons}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400">完全通關章節</p>
              <p className="text-xl font-black text-slate-800 leading-tight">
                {sectionsCleared}
                <span className="text-sm text-slate-400"> / {sections.length}</span>
              </p>
            </div>
          </div>
        </div>

        {totalDone === 0 ? (
          <EmptyState text="還沒有完成任何關卡，完成第一堂課後這裡會出現各章進度。" />
        ) : (
          <ul className="space-y-2">
            {sections.map((s) => {
              const pct = s.total > 0 ? (s.done / s.total) * 100 : 0;
              const cleared = s.total > 0 && s.done === s.total;
              return (
                <li key={s.id} className="flex items-center gap-2.5">
                  <span className="text-sm shrink-0 w-5 text-center">{s.badge}</span>
                  <span className="text-[11px] font-black text-slate-500 shrink-0 w-7">{s.code}</span>
                  <span
                    className={`text-[11px] font-bold flex-1 min-w-0 truncate ${
                      cleared ? 'text-slate-800' : 'text-slate-500'
                    }`}
                    title={s.title}
                  >
                    {s.title}
                  </span>
                  <div className="w-16 sm:w-24 shrink-0">
                    <Bar pct={pct} color={cleared ? 'bg-[#58CC02]' : 'bg-sky-400'} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 shrink-0 w-9 text-right">
                    {s.done}/{s.total}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* ── 星等分布 ── */}
      <Card title="星等分布" icon={<Star className="w-4 h-4" />} accent="text-amber-500" hint="通關時拿到的 1–3 星">
        {stars.rated === 0 ? (
          <EmptyState text="尚無星等資料，通關後會依答題表現記錄 1–3 星。" />
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-slate-100">
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(stars.three / stars.rated) * 100}%` }}
                title={`三星 ${stars.three}`}
              />
              <div
                className="h-full bg-sky-400"
                style={{ width: `${(stars.two / stars.rated) * 100}%` }}
                title={`二星 ${stars.two}`}
              />
              <div
                className="h-full bg-slate-300"
                style={{ width: `${(stars.one / stars.rated) * 100}%` }}
                title={`一星 ${stars.one}`}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: '三星', count: stars.three, ring: 'text-amber-500 bg-amber-50' },
                { label: '二星', count: stars.two, ring: 'text-sky-500 bg-sky-50' },
                { label: '一星', count: stars.one, ring: 'text-slate-500 bg-slate-100' },
              ].map((it) => (
                <div key={it.label} className={`rounded-2xl px-2 py-2.5 text-center ${it.ring}`}>
                  <div className="flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-lg font-black leading-none">{it.count}</span>
                  </div>
                  <p className="text-[10px] font-black mt-0.5 opacity-80">{it.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── 每日任務近 7 天 ── */}
      <Card
        title="每日任務近 7 天達成率"
        icon={<CalendarCheck2 className="w-4 h-4" />}
        accent="text-emerald-500"
        hint="每天進入本頁時自動記錄一筆快照"
      >
        {recordedDays.length === 0 ? (
          <EmptyState text="尚無每日任務快照，回到「學習地圖」完成任務後再進來就會開始記錄。" />
        ) : (
          <>
            <div className="flex items-end justify-between gap-1.5 h-28 px-1">
              {week.map((d) => {
                const rate = d.rate;
                const color =
                  rate === null
                    ? 'bg-slate-100 border-2 border-dashed border-slate-300'
                    : rate >= 100
                      ? 'bg-[#58CC02]'
                      : rate >= 50
                        ? 'bg-sky-400'
                        : 'bg-amber-400';
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[9px] font-black text-slate-400">
                      {rate === null ? '—' : `${Math.round(rate)}%`}
                    </span>
                    <div
                      className={`w-full max-w-[26px] rounded-t-md ${color}`}
                      style={{ height: `${Math.max(4, rate ?? 6)}%` }}
                      title={`${d.date}：${rate === null ? '未記錄' : `${Math.round(rate)}%`}`}
                    />
                    <span className="text-[9px] font-black text-slate-400">{d.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t-2 border-slate-100">
              <span className="text-[11px] font-bold text-slate-500">有記錄日平均</span>
              <span className="text-sm font-black text-emerald-600">{Math.round(avgRate ?? 0)}%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-relaxed">
              綠色＝三項全清、藍色＝過半、黃色＝未達一半、虛線＝當日未記錄。
            </p>
          </>
        )}
      </Card>

      {/* ── 弱點分析 ── */}
      <Card
        title="弱點分析 · 最常錯的關卡 TOP 5"
        icon={<Crosshair className="w-4 h-4" />}
        accent="text-rose-500"
        hint={`累計答錯 ${totalMisses} 題次`}
      >
        {weak.length === 0 ? (
          <EmptyState text="目前沒有錯題紀錄，太棒了！答錯的題目會自動收進這裡，優先安排複習。" />
        ) : (
          <ol className="space-y-2.5">
            {weak.map((w, i) => (
              <li key={w.lessonId} className="flex items-center gap-2.5">
                <span
                  className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-black ${
                    i === 0 ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {i + 1}
                </span>
                <span
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: w.color }}
                  aria-hidden
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black text-slate-800 truncate">
                    {w.code} {w.title}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 truncate">
                    {w.section} · 答錯 {w.wrongQs} 題
                  </p>
                </div>
                <div className="w-16 shrink-0">
                  <Bar pct={weakMax > 0 ? (w.misses / weakMax) * 100 : 0} color="bg-rose-400" />
                </div>
                <span className="text-[11px] font-black text-rose-500 shrink-0 w-8 text-right">
                  {w.misses} 次
                </span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* ── 決策日記統計 ── */}
      <Card
        title="決策日記統計"
        icon={<BookMarked className="w-4 h-4" />}
        accent="text-emerald-600"
        hint="多空立場占比與徽章解鎖"
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2.5">
            <p className="text-[10px] font-black text-slate-400">日記筆數</p>
            <p className="text-xl font-black text-slate-800 leading-tight">{journal.total}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 px-3 py-2.5">
            <p className="text-[10px] font-black text-amber-500 inline-flex items-center gap-1">
              <Award className="w-3 h-3" /> 已解鎖徽章
            </p>
            <p className="text-xl font-black text-slate-800 leading-tight">
              {badgesUnlocked}
              <span className="text-sm text-slate-400"> / {badges.length || 8}</span>
            </p>
          </div>
        </div>

        {journal.total === 0 ? (
          <EmptyState text="還沒有決策日記，記錄第一筆買賣決策後就會出現多空占比分析。" />
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden mb-2.5 bg-slate-100">
              {journal.rows.map((r) => (
                <div key={r.key} className={`h-full ${r.color}`} style={{ width: `${r.pct}%` }} title={r.label} />
              ))}
            </div>
            <ul className="space-y-1.5">
              {journal.rows.map((r) => (
                <li key={r.key} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${r.color}`} />
                  <span className="text-[11px] font-bold text-slate-600 flex-1">{r.label}</span>
                  <span className={`text-[11px] font-black ${r.text}`}>
                    {r.count} 筆 · {Math.round(r.pct)}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {badges.length > 0 && (
          <div className="mt-3 pt-3 border-t-2 border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              {badges.map((b) => (
                <span
                  key={b.id}
                  title={`${b.name}（${b.unlocked ? '已解鎖' : '未解鎖'}）`}
                  className={`text-base leading-none px-1.5 py-1 rounded-lg border ${
                    b.unlocked ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200 opacity-40 grayscale'
                  }`}
                >
                  {b.icon}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ── 給永豐的營運視角（示意數據） ── */}
      <section className="rounded-3xl border-2 border-sky-200 bg-gradient-to-b from-sky-50 to-white p-4 sm:p-5 shadow-sm">
        <header className="flex items-start gap-2 mb-1">
          <span className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-sm text-slate-800 leading-tight">給永豐的營運視角</h3>
            <p className="text-[10px] font-bold text-slate-400 leading-tight">
              機構 demo 用 · 產品化後可由埋點產出的營運儀表板
            </p>
          </div>
          <span className="shrink-0 text-[9px] font-black px-2 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            示意數據
          </span>
        </header>
        <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-1.5 mt-2 leading-relaxed">
          ⚠ 以下漏斗與留存數字皆為產品示意（非真實營運成果），實際需以上線後埋點回報為準。
        </p>

        {/* 轉換漏斗 */}
        <h4 className="font-black text-xs text-slate-700 mt-4 mb-2">學習 → 開戶轉換漏斗（示意）</h4>
        <ul className="space-y-2">
          {FUNNEL.map((f, i) => (
            <li key={f.label} className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500 w-28 shrink-0 text-right">{f.label}</span>
              <div className="flex-1 h-5 rounded-lg bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-lg bg-gradient-to-r ${
                    i === FUNNEL.length - 1 ? 'from-emerald-400 to-emerald-500' : 'from-sky-400 to-sky-500'
                  }`}
                  style={{ width: `${f.pct}%` }}
                />
              </div>
              <span className={`text-[10px] font-black shrink-0 w-8 ${i === FUNNEL.length - 1 ? 'text-emerald-600' : 'text-sky-600'}`}>
                {f.pct}%
              </span>
            </li>
          ))}
        </ul>

        {/* 留存曲線 */}
        <h4 className="font-black text-xs text-slate-700 mt-4 mb-1">留存曲線（示意 · D0–D14）</h4>
        <div className="rounded-2xl bg-white border border-sky-100 p-2">
          <RetentionChart />
        </div>

        {/* 建議埋點 */}
        <h4 className="font-black text-xs text-slate-700 mt-4 mb-2">建議埋點清單</h4>
        <ul className="space-y-1.5">
          {EVENTS.map((e) => {
            const [name, desc] = e.split('：');
            return (
              <li key={name} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span>
                  <code className="font-black text-sky-600 bg-sky-50 rounded px-1 py-0.5 text-[10px]">{name}</code>
                  <span className="font-bold text-slate-600 ml-1">：{desc}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-center text-[10px] font-bold text-slate-400 pb-2">
        LevelVest 學習成效儀表板 · 資料僅存於本機瀏覽器
      </p>
    </div>
  );
};

export default LearningDashboard;
