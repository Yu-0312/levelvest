<div align="center">

# 📈 LevelVest

**投資理財的 Duolingo —— 遊戲化台股與投資心法學習 App**

`React 19` · `TypeScript` · `Vite` · `Tailwind CSS 4`

[![GitHub repo](https://img.shields.io/badge/repo-LevelVest-181717?logo=github)](https://github.com/Yu-0312/levelvest)
[![Built with](https://img.shields.io/badge/built%20in-Google%20AI%20Studio-8E75B2?logo=googleaistudio&logoColor=white)](https://ai.studio/apps/7783595c-84c6-4d57-ab9c-b10325139f56)
[![Curriculum](https://img.shields.io/badge/課程設計-藍圖-3f7d15)](https://yu-0312.github.io/levelvest/curriculum-blueprint.html)

</div>

## ✨ 這是什麼？

LevelVest 是一款專為 **Gen Z 與投資新手**打造的遊戲化學習 App，把台股投資知識變成一關一關的冒險：

- 🌳 **技能樹關卡** — 用 Duolingo 式的地圖循序解鎖「市場新手村」「技術指標與月線」等單元，每關有星星評級與互動測驗
- ❤️ **愛心 / 寶石 / 等級系統** — 答錯扣愛心、過關賺 XP 與寶石，還有寵物吉祥物陪你闖關
- 📓 **投資決策日記** — 記錄每筆模擬操作的「買進試單 / 逢高獲利 / 嚴格停損 / 空手觀望」，搭配情緒標記（克服 FOMO、冷靜理性）與紀律評分
- 🏅 **行為徽章** — 「20MA 月線突破」「處置效應克服」等策略標籤徽章，鼓勵養成正確交易紀律
- 🏆 **班級排行榜** — 週 XP、決策勝率、連續學習天數，同儕加油打氣機制
- 🔊 **音效回饋** — 點擊、成功、失誤、獲得寶石四種音效（Web Audio 合成，可關閉）

教學內容涵蓋：什麼是股票與張/股、盤中零股交易、T+2 交割制度與違約交割風險、紅 K 綠 K、20MA 月線生命線等台股實戰主題。

📖 **完整課程設計藍圖**（10 章節 / 38 單元 / 約 170 課 / 10 種題型 / 遊戲機制對照）→ [線上閱讀](https://yu-0312.github.io/levelvest/curriculum-blueprint.html) · [原始檔](public/curriculum-blueprint.html)

## 🧱 技術架構

| 層 | 技術 |
|---|---|
| 前端框架 | React 19 + TypeScript |
| 建置工具 | Vite 8 |
| 樣式 | Tailwind CSS 4（`@tailwindcss/vite`） |
| 動畫 | Motion、canvas-confetti |
| 圖示 | lucide-react |
| 音效 | Web Audio API（`src/utils/audio.ts`） |

> **目前狀態**：前端原型。所有關卡、排行榜、日記資料來自 `src/data/mockData.ts`；`package.json` 雖含 `@google/genai`，但程式碼尚未實際呼叫 Gemini API。`.env.example` 中的 `GEMINI_API_KEY` 為 AI Studio 部署預留的欄位。

## 🚀 本地執行

**需求**：Node.js 18+

```bash
git clone https://github.com/Yu-0312/levelvest.git
cd levelvest
npm install
npm run dev        # 開發伺服器 → http://localhost:3000
```

其他指令：

```bash
npm run build      # 生產建置 → dist/
npm run preview    # 預覽建置結果
npm run lint       # TypeScript 型別檢查（tsc --noEmit）
```

## ☁️ 回到 AI Studio / 部署

本專案最初在 [Google AI Studio](https://ai.studio/apps/7783595c-84c6-4d57-ab9c-b10325139f56) 建立開發。若要雲端部署，可回到 AI Studio 的 Deploy 功能，或自行將 `dist/` 部署到任何靜態主機（Vercel / Netlify / Cloudflare Pages）。

## 📁 專案結構

```
levelvest/
├── src/
│   ├── components/       # 8 個 UI 元件（技能樹、課程彈窗、排行榜、日記…）
│   ├── data/mockData.ts  # 關卡 / 排行榜 / 徽章初始資料
│   ├── utils/audio.ts    # Web Audio 音效合成
│   ├── types.ts          # TypeScript 型別定義
│   ├── App.tsx           # 主應用（4 個分頁：學習 / 排行榜 / 日記 / 徽章）
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 📄 License

僅供學習與展示用途。
