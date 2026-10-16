import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Send, Trash2 } from 'lucide-react';
import { sound } from '../utils/audio';

/**
 * 由 LessonPlayer 在「答錯」回饋畫面帶入的題目情境。
 * 只在 AI 對話導師內部使用，不進入共用型別。
 */
export interface TutorContext {
  sectionTitle: string;
  lessonTitle: string;
  question: string;
  choices: string[];
  selectedChoice: string;
  correctChoice: string;
  explain: string;
}

type ChatRole = 'user' | 'model';

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  /** true＝離線示範模式的固定回覆（非即時生成） */
  static?: boolean;
}

/** 對話紀錄的存檔形狀（專屬 key，不與主存檔共用） */
interface TutorSession {
  /** 題目指紋；換題時自動開新對話 */
  key: string;
  messages: ChatMessage[];
}

const STORAGE_KEY = 'levelvest-ai-tutor-v1';
const MODEL = 'gemini-2.5-flash';
/** 傳給模型的對話歷史上限（保留最近幾則，避免超出費用） */
const HISTORY_LIMIT = 24;

const hasApiKey = (): boolean => Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim());

function contextKey(c: TutorContext): string {
  return `${c.sectionTitle}|${c.lessonTitle}|${c.question}`;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 讀取對話紀錄；損毀資料一律回空白對話 */
function loadSession(): TutorSession {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { key: '', messages: [] };
    const parsed = JSON.parse(raw) as Partial<TutorSession> | null;
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.messages)) {
      return { key: '', messages: [] };
    }
    const messages = parsed.messages.filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string'
    );
    return { key: typeof parsed.key === 'string' ? parsed.key : '', messages };
  } catch {
    return { key: '', messages: [] };
  }
}

function saveSession(session: TutorSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* 容量不足時忽略 */
  }
}

/** 開場問候（無需打 API） */
function welcomeMessage(offline: boolean): ChatMessage {
  return {
    id: uid(),
    role: 'model',
    text: offline
      ? '目前是「離線示範模式」（未設定 VITE_GEMINI_API_KEY），我只能提供固定解析。想自由追問，請先設定 API 金鑰再重新整理。'
      : '你好！我是你的 AI 家教。這題我已經看過了，哪個觀念想不通儘管問我，我們一步步拆開來看！',
    static: offline,
  };
}

/** System 指令：把題目情境一起交給 Gemini */
function buildSystemInstruction(c: TutorContext): string {
  const choices = c.choices
    .map((text, i) => `${String.fromCharCode(65 + i)}. ${text}`)
    .join('\n');
  return [
    '你是 LevelVest 的 AI 對話導師，陪伴學生學習台股投資基礎觀念。',
    '請遵守以下規則：',
    '1. 一律使用繁體中文，口吻像耐心的家教，溫柔、具體、不責備。',
    '2. 每次回覆不超過 150 字；需要分點時用條列（•），不要寫長篇。',
    '3. 主動鼓勵學生追問，可在結尾拋出一個引導問題。',
    '4. 只解釋觀念與題目邏輯，不提供實際下單建議（不報明牌、不說該買該賣哪檔股票、不預測漲跌）。',
    '5. 學生的答案先肯定再修正。',
    '',
    `【學生所屬章節】${c.sectionTitle}（關卡：${c.lessonTitle}）`,
    `【題目】${c.question}`,
    `【選項】\n${choices}`,
    `【學生選答】${c.selectedChoice}`,
    `【正確答案】${c.correctChoice}`,
    `【課本解析】${c.explain}`,
  ].join('\n');
}

/** 呼叫 Gemini；失敗一律丟錯，由呼叫端降級 */
async function askGemini(
  context: TutorContext,
  history: ChatMessage[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('缺少 VITE_GEMINI_API_KEY');
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const contents = history.slice(-HISTORY_LIMIT).map((m) => ({
    role: m.role === 'model' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.text }],
  }));
  const res = await ai.models.generateContent({
    model: MODEL,
    contents,
    config: { systemInstruction: buildSystemInstruction(context) },
  });
  const text = res.text?.trim();
  if (!text) throw new Error('模型回覆為空');
  return text;
}

/** 離線時的固定解析回覆 */
function staticReply(c: TutorContext, history: ChatMessage[]): string {
  const alreadyStatic = history.some((m) => m.role === 'model' && m.static);
  if (alreadyStatic) {
    return `離線示範模式下我只能回覆固定內容。先自己想想：為什麼正解是「${c.correctChoice}」、你當時排除了什麼？想通再對照解析。`;
  }
  return [
    `（離線示範模式）正解是「${c.correctChoice}」，你選的是「${c.selectedChoice}」。`,
    `重點解析：${c.explain}`,
    '設定 VITE_GEMINI_API_KEY 後即可與我自由對話追問。',
  ].join('\n');
}

interface AITutorProps {
  isOpen: boolean;
  /** 由 LessonPlayer 答錯時傳入；為 null 時不顯示 */
  context: TutorContext | null;
  onClose: () => void;
}

export const AITutor: React.FC<AITutorProps> = ({ isOpen, context, onClose }) => {
  const [session, setSession] = useState<TutorSession>(() => loadSession());
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  /** 曾經呼叫失敗 → 本節課內改用離線示範 */
  const [apiFailed, setApiFailed] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const key = context ? contextKey(context) : '';
  const offline = !hasApiKey() || apiFailed;

  // 換題（或首次開啟）→ 同題沿用紀錄，換題開新對話
  useEffect(() => {
    if (!isOpen || !key) return;
    setSession((prev) =>
      prev.key === key ? prev : { key, messages: [welcomeMessage(!hasApiKey())] }
    );
  }, [isOpen, key]);

  // 對話紀錄持久化（專屬 localStorage key）
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // 新訊息／載入中時自動捲到底
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [session.messages, loading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleClear = () => {
    sound.playClick();
    setSession({ key, messages: [welcomeMessage(offline)] });
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !context) return;
    sound.playClick();
    setInput('');

    const userMsg: ChatMessage = { id: uid(), role: 'user', text };
    const history = [...session.messages, userMsg];
    setSession((s) => ({ ...s, messages: [...s.messages, userMsg] }));
    setLoading(true);

    try {
      const reply = await askGemini(context, history);
      setSession((s) => ({
        ...s,
        messages: [...s.messages, { id: uid(), role: 'model', text: reply }],
      }));
    } catch {
      // 無金鑰或請求失敗 → 標示離線示範模式，回固定解析
      setApiFailed(true);
      setSession((s) => ({
        ...s,
        messages: [
          ...s.messages,
          { id: uid(), role: 'model', text: staticReply(context, history), static: true },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && context && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="AI 對話導師"
          className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-hidden shadow-2xl border-2 border-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b-2 border-slate-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-black text-slate-800 truncate">
                      AI 對話導師
                    </h2>
                    {offline && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                        離線示範模式
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 truncate">
                    {context.lessonTitle} · {context.sectionTitle}
                  </p>
                </div>
                <button
                  onClick={handleClear}
                  aria-label="清除對話"
                  title="清除對話"
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    onClose();
                  }}
                  aria-label="關閉"
                  className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* 離線固定教學文案 */}
              {offline && (
                <div className="mx-4 mt-3 p-3 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50">
                  <p className="text-xs font-black text-amber-800 mb-1">
                    離線示範模式：目前以固定解析回應
                  </p>
                  <p className="text-[11px] text-amber-900/80 leading-relaxed">
                    未設定或無法連線 Gemini API。要啟用 AI 對話：在專案根目錄建立
                    <code className="mx-1 px-1 rounded bg-amber-100 font-bold">
                      .env.local
                    </code>
                    寫入
                    <code className="mx-1 px-1 rounded bg-amber-100 font-bold">
                      VITE_GEMINI_API_KEY=你的金鑰
                    </code>
                    ，重新啟動 dev server 後即可自由追問。
                  </p>
                </div>
              )}

              {/* 題目情境卡 */}
              <div className="mx-4 mt-3 p-3 rounded-2xl border-2 border-slate-200 bg-slate-50">
                <p className="text-[10px] font-black text-slate-400 mb-1">本題情境</p>
                <p className="text-xs font-bold text-slate-700 leading-relaxed">
                  {context.question}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">
                    你的答案：{context.selectedChoice}
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    正解：{context.correctChoice}
                  </span>
                </div>
              </div>

              {/* 訊息列表 */}
              <div ref={listRef} className="px-4 py-3 space-y-2.5 min-h-32">
                {session.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl border-2 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                        m.role === 'user'
                          ? 'bg-sky-500 border-sky-600 text-white rounded-br-md'
                          : m.static
                          ? 'bg-amber-50 border-amber-200 text-slate-700 rounded-bl-md'
                          : 'bg-white border-slate-200 text-slate-700 rounded-bl-md shadow-xs'
                      }`}
                    >
                      {m.role === 'model' && m.static && (
                        <span className="block text-[10px] font-black text-amber-600 mb-1">
                          示範解析
                        </span>
                      )}
                      {m.text}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-2 border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 rounded-full bg-sky-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                      <span className="text-xs font-bold text-slate-400 ml-1">
                        老師思考中…
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 輸入列 */}
            <form
              onSubmit={handleSend}
              className="shrink-0 px-4 py-3 border-t-2 border-slate-100 bg-white flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="問老師任何問題…"
                aria-label="向 AI 老師提問"
                disabled={loading}
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="送出"
                className={`p-3 rounded-2xl border-b-4 active:border-b-0 active:translate-y-1 transition-all cursor-pointer shrink-0 ${
                  loading || !input.trim()
                    ? 'bg-slate-200 border-slate-300 text-slate-400 cursor-not-allowed'
                    : 'bg-sky-500 border-sky-700 text-white hover:bg-sky-600'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
