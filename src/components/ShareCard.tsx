import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { sound } from '../utils/audio';
import type { BehavioralBadge, LessonProgress, UserStats } from '../types';

/**
 * 學習證明分享卡：把目前存檔的學習成果繪成一張 1200×630（og:image 尺寸）的
 * PNG 分享圖，可直接上傳社團／社群貼文。
 */

interface ShareCardProps {
  stats: UserStats;
  progress: LessonProgress;
  badges: BehavioralBadge[];
}

/** 分享圖尺寸（Open Graph 建議尺寸，社團／社媒貼文可直接使用） */
const CARD_W = 1200;
const CARD_H = 630;
const FONT_STACK = "'Noto Sans TC', 'Nunito', sans-serif";

/** 主視覺色系（沿用 sky-500 / slate 文字 / 白底卡片） */
const SKY = '#0EA5E9';
const SKY_DARK = '#0369A1';
const SKY_SOFT = '#E0F2FE';
const SKY_LINE = '#BAE6FD';
const SLATE_900 = '#0F172A';
const SLATE_600 = '#475569';
const SLATE_400 = '#94A3B8';
const WHITE = '#FFFFFF';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** 文字過長時截斷加省略號，維持版面整齊 */
function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let out = text;
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}…`;
}

/** 畫一顆膠囊標籤，回傳其寬度（供排版串接） */
function drawPill(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  bg: string,
  fg: string,
  font: string,
  padX: number,
  height: number
): number {
  ctx.font = font;
  const w = ctx.measureText(label).width + padX * 2;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, height, height / 2);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX, y + height / 2);
  return w;
}

interface CardData {
  name: string;
  title: string;
  level: number;
  completed: number;
  stars: number;
  unlockedBadges: number;
  dateLabel: string;
}

function drawShareCard(ctx: CanvasRenderingContext2D, data: CardData) {
  const L = 80; // 內容左界
  const CW = 1040; // 內容寬度

  // ── 背景 ──
  const bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  bg.addColorStop(0, '#F0F9FF');
  bg.addColorStop(1, WHITE);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── 圓角主卡 ──
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = WHITE;
  roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, 40);
  ctx.fill();
  ctx.restore();

  // 卡片內的幾何裝飾（裁切在卡片範圍內）
  ctx.save();
  roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, 40);
  ctx.clip();

  ctx.fillStyle = 'rgba(14, 165, 233, 0.10)';
  ctx.beginPath();
  ctx.arc(1165, 25, 175, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
  ctx.beginPath();
  ctx.arc(1155, 615, 135, 0, Math.PI * 2);
  ctx.fill();

  // 右下的上升柱狀幾何（象徵穩健成長，避開成績方格與頁尾）
  const barBottom = 520;
  const barH = [24, 36, 48, 60];
  barH.forEach((h, i) => {
    ctx.fillStyle = `rgba(14, 165, 233, ${0.25 + i * 0.08})`;
    roundRect(ctx, 1006 + i * 30, barBottom - h, 20, h, 8);
    ctx.fill();
  });

  // 左下角小圓點矩陣
  ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      ctx.beginPath();
      ctx.arc(L + c * 18, 570 + r * 14, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 卡片細邊框
  ctx.strokeStyle = SKY_LINE;
  ctx.lineWidth = 3;
  roundRect(ctx, 24, 24, CARD_W - 48, CARD_H - 48, 40);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  // ── 標語列 ──
  const brandW = drawPill(
    ctx,
    L,
    76,
    'LevelVest',
    SKY,
    WHITE,
    `900 30px ${FONT_STACK}`,
    26,
    54
  );
  ctx.font = `700 28px ${FONT_STACK}`;
  ctx.fillStyle = SLATE_600;
  ctx.fillText('— 投資紀律訓練營', L + brandW + 22, 103);

  // ── 暱稱 ──
  ctx.font = `900 60px ${FONT_STACK}`;
  ctx.fillStyle = SLATE_900;
  ctx.fillText(ellipsize(ctx, data.name, 780), L, 186);

  // ── 稱號 + 等級 ──
  const titlePillW = drawPill(
    ctx,
    L,
    234,
    data.title || '投資見習生',
    '#FEF3C7',
    '#B45309',
    `700 24px ${FONT_STACK}`,
    24,
    46
  );
  drawPill(
    ctx,
    L + titlePillW + 14,
    234,
    `等級 Lv.${data.level}`,
    SKY_SOFT,
    SKY_DARK,
    `900 24px ${FONT_STACK}`,
    24,
    46
  );

  // ── 成績四宮格 ──
  const stats: Array<{ value: string; label: string }> = [
    { value: `${data.completed}`, label: '完成關卡' },
    { value: `${data.stars}`, label: '總星等' },
    { value: `${data.unlockedBadges}`, label: '解鎖徽章' },
    { value: `Lv.${data.level}`, label: '目前等級' },
  ];
  const boxW = (CW - 3 * 20) / 4;
  const boxY = 312;
  const boxH = 136;
  stats.forEach((s, i) => {
    const x = L + i * (boxW + 20);
    ctx.fillStyle = '#F0F9FF';
    ctx.strokeStyle = SKY_LINE;
    ctx.lineWidth = 2;
    roundRect(ctx, x, boxY, boxW, boxH, 24);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.font = `900 54px ${FONT_STACK}`;
    ctx.fillStyle = SKY;
    if (ctx.measureText(s.value).width > boxW - 24) {
      ctx.font = `900 40px ${FONT_STACK}`;
    }
    ctx.fillText(s.value, x + boxW / 2, boxY + 52);

    ctx.font = `700 22px ${FONT_STACK}`;
    ctx.fillStyle = SLATE_600;
    ctx.fillText(s.label, x + boxW / 2, boxY + 104);
    ctx.textAlign = 'left';
  });

  // ── 進度文案（資料不足時給第一步鼓勵） ──
  const hasProgress = data.completed > 0;
  const message = hasProgress
    ? `${data.name} 已完成 ${data.completed} 個關卡、累積 ${data.stars} 顆星，投資紀律正在養成中！`
    : '剛開始的第一步——完成第一關，就能解鎖你的專屬學習證明！';
  ctx.font = `700 26px ${FONT_STACK}`;
  ctx.fillStyle = hasProgress ? SLATE_600 : SKY_DARK;
  ctx.fillText(ellipsize(ctx, message, 900), L, 494);

  // ── 頁尾：生成日期 + 產品標語 ──
  ctx.font = `600 20px ${FONT_STACK}`;
  ctx.fillStyle = SLATE_400;
  ctx.fillText(`生成日期：${data.dateLabel}`, L, 552);
  ctx.textAlign = 'right';
  ctx.fillText('LevelVest — 遊戲化台股投資學習 App', CARD_W - 80, 552);
  ctx.textAlign = 'left';
}

/** 確保 Noto Sans TC 已載入完成，避免 canvas 用系統替代字型繪製中文 */
async function ensureFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`900 60px ${FONT_STACK}`, '學習證明完成關卡'),
      document.fonts.load(`700 26px ${FONT_STACK}`, '投資紀律訓練營'),
    ]);
    await document.fonts.ready;
  } catch {
    /* 字型載入失敗仍繼續，canvas 會退回系統字型 */
  }
}

function toBlobUrl(canvas: HTMLCanvasElement): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('產生圖片失敗'));
        return;
      }
      resolve(URL.createObjectURL(blob));
    }, 'image/png');
  });
}

export const ShareCard: React.FC<ShareCardProps> = ({ stats, progress, badges }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const completed = Object.values(progress).filter((p) => p.completed).length;
  const stars = Object.values(progress).reduce((sum, p) => sum + (p.stars || 0), 0);
  const unlockedBadges = badges.filter((b) => b.unlocked).length;

  const now = new Date();
  const dateLabel = `中華民國 ${now.getFullYear() - 1911} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
  const fileStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  // 元件卸載或重新產生時釋放舊的 Blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleGenerate = useCallback(async () => {
    sound.playClick();
    setBusy(true);
    setError(null);
    try {
      await ensureFontsReady();
      const canvas = document.createElement('canvas');
      canvas.width = CARD_W;
      canvas.height = CARD_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('此瀏覽器不支援 canvas');
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      drawShareCard(ctx, {
        name: stats.userName || '投資學員',
        title: stats.title,
        level: stats.level,
        completed,
        stars,
        unlockedBadges,
        dateLabel,
      });
      const url = await toBlobUrl(canvas);
      canvasRef.current = canvas;
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      sound.playSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : '產生圖片失敗，請再試一次');
    } finally {
      setBusy(false);
    }
  }, [stats.userName, stats.title, stats.level, completed, stars, unlockedBadges, dateLabel]);

  const handleDownload = useCallback(() => {
    sound.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        setError('產生圖片失敗，請再試一次');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `levelvest-certificate-${fileStamp}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }, [fileStamp]);

  return (
    <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-xs space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 shrink-0 bg-sky-100 rounded-2xl flex items-center justify-center">
          <Share2 className="w-6 h-6 text-sky-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-black text-base text-slate-800">產生學習證明</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            產生一張 1200×630 分享圖，直接上傳社團或社群，秀出你的投資紀律進度。
          </p>
        </div>
      </div>

      {/* 縮圖預覽 */}
      {previewUrl ? (
        <figure className="space-y-1.5">
          <img
            src={previewUrl}
            alt="學習證明分享卡預覽"
            className="w-full rounded-2xl border-2 border-sky-200 bg-sky-50"
          />
          <figcaption className="text-[11px] font-bold text-slate-400 text-center">
            預覽 · 1200 × 630 px（含生成日期：{dateLabel}）
          </figcaption>
        </figure>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
          <ImageIcon className="w-6 h-6 mx-auto text-slate-300 mb-1" />
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            尚未產生分享圖。
            <br />
            {completed === 0
              ? '剛開始的第一步——現在就能產生你的第一張學習證明！'
              : '按下按鈕，立即生成你的專屬學習證明。'}
          </p>
        </div>
      )}

      {error && (
        <p className="text-xs font-bold text-rose-500 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={busy}
          className="flex-1 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:opacity-60 text-white font-black text-sm rounded-2xl border-b-4 border-[#0369A1] disabled:border-b-0 disabled:translate-y-1 active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>{busy ? '產生中…' : previewUrl ? '重新產生' : '產生學習證明'}</span>
        </button>
        <button
          onClick={handleDownload}
          disabled={!previewUrl}
          className="flex-1 py-3 bg-[#58CC02] hover:bg-[#4bb302] disabled:opacity-50 disabled:hover:bg-[#58CC02] text-white font-black text-sm rounded-2xl border-b-4 border-[#3e9302] disabled:border-b-0 active:border-b-0 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>下載 PNG</span>
        </button>
      </div>
    </div>
  );
};
